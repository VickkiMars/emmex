import uuid
import json
from typing import Dict, Any, List

from ..models.schemas import FhirResourcePayload, FhirThreatAnalysisResponse, PredictionRequest
from .inference_service import inference_service

class FhirIngestionService:
    def __init__(self):
        pass

    def analyze_fhir_payload(self, payload: FhirResourcePayload) -> FhirThreatAnalysisResponse:
        resource_type = payload.resourceType or "Patient"
        client_ip = payload.clientIP or "10.0.4.15"
        size_kb = payload.payloadSizeKB or 15.0

        # Heuristic inspection of FHIR resource metadata
        raw = payload.rawJson or {}
        text_str = json.dumps(raw) if raw else ""
        
        # Check for bulk export anomalies or mass sensitive identifiers
        has_ssn = "ssn" in text_str.lower() or "social security" in text_str.lower()
        has_mrn = "medical record" in text_str.lower() or "mrn" in text_str.lower()
        has_bundle = resource_type.lower() == "bundle" or "entry" in raw
        entry_count = len(raw.get("entry", [])) if isinstance(raw.get("entry"), list) else 1

        # Synthesize equivalent breach telemetry record
        simulated_transfer_mb = (size_kb * entry_count) / 1024.0
        individuals_est = entry_count if entry_count > 1 else (500 if has_bundle else 1)
        failed_logins = 14 if size_kb > 200 else 1
        
        pred_req = PredictionRequest(
            entityName=f"FHIR Gateway - {resource_type} Resource Endpoint",
            state="CA",
            entityType="Healthcare Provider",
            individualsAffected=individuals_est,
            breachType="Unauthorized Access/Disclosure" if individuals_est > 50 else "Hacking/IT Incident",
            location="Electronic Medical Record",
            networkProtocol="HL7/FHIR",
            packetLengthAvg=min(1500.0, max(400.0, size_kb * 10)),
            failedLoginAttempts=failed_logins,
            unusualDataTransferMB=simulated_transfer_mb
        )

        res = inference_service.predict_single(pred_req)

        is_anomalous = res.isBreach == 1 or simulated_transfer_mb > 50.0 or entry_count > 100
        
        if is_anomalous:
            threat_vector = "Anomalous FHIR Bulk Data Scraping / Unauthorized PHI Exfiltration"
            mitigation = "Trigger automated Zero-Trust OAuth2 token revocation and rate-limit client IP."
            compliance = "NON-COMPLIANT - Potential HIPAA §164.312(b) Audit & Transmission Security Breach"
        else:
            threat_vector = "Standard Clinical FHIR REST Transaction"
            mitigation = "Log to SIEM audit trail; standard transmission allowed."
            compliance = "COMPLIANT - Adheres to HL7 FHIR US Core Security Specifications"

        return FhirThreatAnalysisResponse(
            analysisID=f"FHIR-ANL-{uuid.uuid4().hex[:8].upper()}",
            resourceType=resource_type,
            riskScore=round(res.probability * 100.0, 1),
            isAnomalous=is_anomalous,
            potentialThreatVector=threat_vector,
            mitigationAction=mitigation,
            fhirComplianceStatus=compliance,
            extractedFeatures={
                "clientIP": client_ip,
                "payloadSizeKB": size_kb,
                "entryCount": entry_count,
                "hasSensitiveIdentifiers": has_ssn or has_mrn,
                "predictedSeverity": res.severityLevel,
                "latencyMs": res.inferenceTimeMs
            }
        )


fhir_service = FhirIngestionService()
