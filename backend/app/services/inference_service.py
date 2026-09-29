import time
import uuid
import numpy as np
from typing import Dict, List, Any, Optional

from ..models.schemas import (
    PredictionRequest,
    BreachPredictionResponse,
    BatchPredictionItem,
    BatchPredictionResponse,
    HealthcareBreachRecord,
    SeverityLevel
)
from .ml_service import ml_service, FEATURE_COLUMNS

# Protocol & Category numeric maps for inference vectorization
PROTOCOL_MAP = {'HTTPS': 0, 'SFTP': 1, 'TCP/IP': 2, 'RDP': 3, 'SMB': 4, 'DICOM': 5, 'HL7/FHIR': 6}
BREACH_TYPE_MAP = {
    'Hacking/IT Incident': 0,
    'Unauthorized Access/Disclosure': 1,
    'Insider Misuse': 2,
    'Theft': 3,
    'Loss': 4,
    'Improper Disposal': 5
}
LOCATION_MAP = {
    'Network Server': 0,
    'Electronic Medical Record': 1,
    'E-mail': 2,
    'Desktop Computer': 3,
    'Laptop': 4,
    'Paper Records': 5,
    'Other Portable Electronic Device': 6
}

class InferenceService:
    def __init__(self):
        pass

    def _extract_feature_vector(self, req: PredictionRequest) -> np.ndarray:
        transfer = float(req.unusualDataTransferMB)
        logins = float(req.failedLoginAttempts)
        affected = float(req.individualsAffected)
        pkt_len = float(req.packetLengthAvg)
        
        # Estimate delay based on severity signals
        delay = 14.0 if transfer > 5000 or logins > 20 else 0.0
        
        btype_code = float(BREACH_TYPE_MAP.get(req.breachType or 'Hacking/IT Incident', 0))
        loc_code = float(LOCATION_MAP.get(req.location or 'Network Server', 0))
        proto_code = float(PROTOCOL_MAP.get(req.networkProtocol, 0))

        # Vector matches FEATURE_COLUMNS order:
        # ['unusualDataTransferMB', 'failedLoginAttempts', 'individualsAffected',
        #  'packetLengthAvg', 'detectionDelayDays', 'breachType_code', 'location_code', 'networkProtocol_code']
        return np.array([[transfer, logins, affected, pkt_len, delay, btype_code, loc_code, proto_code]])

    def predict_single(self, req: PredictionRequest) -> BreachPredictionResponse:
        start_time = time.perf_counter()
        clf, model_id = ml_service.get_model(req.modelID)
        
        features = self._extract_feature_vector(req)

        # 1. Model Prediction & Probabilities
        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(features)[0]
            prob_breach = float(probs[1]) if len(probs) > 1 else float(probs[0])
        else:
            pred = clf.predict(features)[0]
            prob_breach = 0.92 if pred == 1 else 0.08

        # 2. Rule-Based Clinical Cyber Risk Trigger Engine
        triggered_rules: List[str] = []
        rule_score = 0.0

        if req.unusualDataTransferMB > 5000:
            rule_score += 0.35
            triggered_rules.append(f"Critical Data Exfiltration Detected ({req.unusualDataTransferMB:,.0f} MB)")
        elif req.unusualDataTransferMB > 500:
            rule_score += 0.15
            triggered_rules.append(f"Elevated Outbound Data Volume ({req.unusualDataTransferMB} MB)")

        if req.failedLoginAttempts > 15:
            rule_score += 0.30
            triggered_rules.append(f"Brute Force Authentication Anomaly ({req.failedLoginAttempts} Failed Logins)")
        elif req.failedLoginAttempts > 5:
            rule_score += 0.15
            triggered_rules.append(f"Unusual Login Failure Rate ({req.failedLoginAttempts} Attempts)")

        if req.individualsAffected > 50000:
            rule_score += 0.25
            triggered_rules.append(f"Mass Patient Record Exposure ({req.individualsAffected:,.0f} Records)")
        elif req.individualsAffected > 1000:
            rule_score += 0.15
            triggered_rules.append(f"Multi-Patient Record Exposure ({req.individualsAffected:,.0f} Records)")

        if req.breachType == 'Hacking/IT Incident':
            rule_score += 0.15
            triggered_rules.append("Identified High-Risk Vector: Cyber Hacking / Ransomware")

        if req.networkProtocol in ['SMB', 'RDP']:
            rule_score += 0.15
            triggered_rules.append(f"High-Risk Administrative Protocol Exposed: {req.networkProtocol}")

        if req.location in ['Network Server', 'Electronic Medical Record']:
            rule_score += 0.10
            triggered_rules.append(f"Critical Healthcare Repository Targeted: {req.location}")

        # Blend ML probability with empirical cybersecurity heuristics
        final_probability = float(np.clip(0.65 * prob_breach + 0.35 * rule_score, 0.02, 0.99))
        is_breach = 1 if final_probability >= 0.40 else 0
        predicted_class = "Potential Breach" if is_breach == 1 else "Normal Activity"

        # Severity categorization
        if final_probability >= 0.75 or req.unusualDataTransferMB > 10000 or req.failedLoginAttempts > 30:
            severity: SeverityLevel = "High"
        elif final_probability >= 0.40:
            severity = "Medium"
        else:
            severity = "Low"

        # Confidence interval estimation (95% CI standard error approximation)
        ci_half_width = 1.96 * np.sqrt((final_probability * (1 - final_probability)) / 100.0)
        ci_low = float(np.clip(final_probability - ci_half_width, 0.0, 1.0))
        ci_high = float(np.clip(final_probability + ci_half_width, 0.0, 1.0))

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        contributing = {
            "Data Transfer Volume": round(min(1.0, req.unusualDataTransferMB / 10000.0), 3),
            "Failed Login Anomaly": round(min(1.0, req.failedLoginAttempts / 50.0), 3),
            "Patient Records Exposed": round(min(1.0, req.individualsAffected / 100000.0), 3),
            "Protocol Risk Factor": 0.85 if req.networkProtocol in ['SMB', 'RDP'] else 0.20
        }

        return BreachPredictionResponse(
            predictionID=f"PRED-{uuid.uuid4().hex[:8].upper()}",
            predictedClass=predicted_class,
            isBreach=is_breach,
            probability=round(final_probability, 3),
            confidenceInterval=[round(ci_low, 3), round(ci_high, 3)],
            severityLevel=severity,
            inferenceTimeMs=elapsed_ms,
            triggeredRules=triggered_rules if triggered_rules else ["Traffic matches baseline clinical activity pattern."],
            contributingFactors=contributing,
            modelUsed=model_id or "Random Forest"
        )

    def predict_batch(self, records: List[PredictionRequest]) -> BatchPredictionResponse:
        start_time = time.perf_counter()
        results: List[BatchPredictionItem] = []
        breaches_count = 0

        for rec in records:
            res = self.predict_single(rec)
            if res.isBreach == 1:
                breaches_count += 1
            results.append(BatchPredictionItem(
                recordID=f"REC-{uuid.uuid4().hex[:6].upper()}",
                isBreach=res.isBreach,
                probability=res.probability,
                severityLevel=res.severityLevel,
                latencyMs=res.inferenceTimeMs
            ))

        total_time_sec = max(0.0001, time.perf_counter() - start_time)
        throughput = round(len(records) / total_time_sec, 1)
        avg_lat = round(sum(r.latencyMs for r in results) / max(1, len(results)), 2)

        return BatchPredictionResponse(
            totalProcessed=len(records),
            breachesDetected=breaches_count,
            avgLatencyMs=avg_lat,
            throughputPerSec=throughput,
            predictions=results
        )


inference_service = InferenceService()
