import pytest
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["modelsLoaded"] >= 5
    assert data["totalBreachRecords"] >= 30

def test_get_dataset():
    response = client.get("/api/data/dataset?limit=10")
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 10
    assert "entityName" in records[0]

def test_feature_importances():
    response = client.get("/api/ml/features")
    assert response.status_code == 200
    data = response.json()
    assert len(data["featureRankings"]) > 0
    assert "topPredictor" in data

def test_train_models():
    response = client.post("/api/ml/train", json={
        "testSize": 0.2,
        "randomState": 42,
        "useDifferentialPrivacy": False
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) == 5
    rf_model = next(m for m in data["models"] if m["modelType"] == "Random Forest")
    assert rf_model["metrics"]["accuracy"] > 80.0

def test_single_inference():
    payload = {
        "entityName": "Test Regional Hospital",
        "state": "CA",
        "individualsAffected": 50000,
        "breachType": "Hacking/IT Incident",
        "location": "Network Server",
        "networkProtocol": "SMB",
        "packetLengthAvg": 1420.0,
        "failedLoginAttempts": 45,
        "unusualDataTransferMB": 82000.0
    }
    response = client.post("/api/inference/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predictedClass"] == "Potential Breach"
    assert data["severityLevel"] == "High"
    assert data["probability"] > 0.70

def test_batch_inference():
    records = [
        {
            "entityName": f"Telemetry Node {i}",
            "networkProtocol": "HTTPS",
            "failedLoginAttempts": i * 5,
            "unusualDataTransferMB": float(i * 1000)
        }
        for i in range(5)
    ]
    response = client.post("/api/inference/batch", json=records)
    assert response.status_code == 200
    data = response.json()
    assert data["totalProcessed"] == 5

def test_mia_privacy_audit():
    response = client.post("/api/privacy/mia-audit", json={"epsilon": 0.5})
    assert response.status_code == 200
    data = response.json()
    assert "vulnerabilityScore" in data
    assert data["privacyRiskRating"] in ["Low Risk (Privacy Preserved)", "Moderate Risk", "High Risk"]

def test_fhir_ingestion():
    fhir_payload = {
        "resourceType": "Patient",
        "id": "pat-example-001",
        "clientIP": "10.0.8.22",
        "payloadSizeKB": 850.0,
        "rawJson": {
            "resourceType": "Bundle",
            "entry": [{"id": f"rec-{i}"} for i in range(150)]
        }
    }
    response = client.post("/api/fhir/analyze", json=fhir_payload)
    assert response.status_code == 200
    data = response.json()
    assert "riskScore" in data
    assert data["isAnomalous"] is True

if __name__ == "__main__":
    print("Running Emmanuel Backend End-to-End Test Suite...")
    with TestClient(app) as client:
        response = client.get("/api/system/health")
        assert response.status_code == 200
        print("✓ Health check passed")

        response = client.get("/api/system/status")
        assert response.status_code == 200
        assert response.json()["modelsLoaded"] >= 5
        print("✓ System status passed")

        response = client.get("/api/data/dataset?limit=10")
        assert response.status_code == 200
        assert len(response.json()) == 10
        print("✓ Dataset retrieval passed")

        response = client.get("/api/ml/features")
        assert response.status_code == 200
        assert len(response.json()["featureRankings"]) > 0
        print("✓ Feature selection passed")

        response = client.post("/api/ml/train", json={"testSize": 0.2, "randomState": 42})
        assert response.status_code == 200
        assert len(response.json()["models"]) == 5
        print("✓ ML model training passed")

        payload = {
            "entityName": "Test Regional Hospital",
            "state": "CA",
            "individualsAffected": 50000,
            "breachType": "Hacking/IT Incident",
            "location": "Network Server",
            "networkProtocol": "SMB",
            "packetLengthAvg": 1420.0,
            "failedLoginAttempts": 45,
            "unusualDataTransferMB": 82000.0
        }
        response = client.post("/api/inference/predict", json=payload)
        assert response.status_code == 200
        assert response.json()["predictedClass"] == "Potential Breach"
        print("✓ Single inference passed")

        records = [
            {"entityName": f"Node {i}", "networkProtocol": "HTTPS", "failedLoginAttempts": i * 5, "unusualDataTransferMB": float(i * 1000)}
            for i in range(5)
        ]
        response = client.post("/api/inference/batch", json=records)
        assert response.status_code == 200
        print("✓ Batch inference passed")

        response = client.post("/api/privacy/mia-audit", json={"epsilon": 0.5})
        assert response.status_code == 200
        print("✓ Differential privacy MIA audit passed")

        fhir_payload = {
            "resourceType": "Patient",
            "id": "pat-example-001",
            "clientIP": "10.0.8.22",
            "payloadSizeKB": 850.0,
            "rawJson": {"resourceType": "Bundle", "entry": [{"id": f"rec-{i}"} for i in range(150)]}
        }
        response = client.post("/api/fhir/analyze", json=fhir_payload)
        assert response.status_code == 200
        assert response.json()["isAnomalous"] is True
        print("✓ FHIR payload ingestion passed")

        # Database Policies Test
        res = client.get("/api/policies")
        assert res.status_code == 200
        assert len(res.json()) >= 3
        print("✓ Zero Trust DB policies passed")

        # Zero Trust Rule Evaluation Test
        eval_payload = {"protocol": "SMB", "failedLogins": 15, "transferMB": 12000.0, "hasMfa": False}
        res = client.post("/api/policies/evaluate", json=eval_payload)
        assert res.status_code == 200
        assert res.json()["action"] in ["BLOCK", "QUARANTINE"]
        print("✓ Zero Trust rule evaluation passed")

        # SIEM Hash Chained Log & Verification Test
        log_payload = {"facility": "AUTH", "severity": "CRITICAL", "cefHeader": "CEF:0|Emmanuel|Test|1.0|TEST|Test Event|8", "extension": "src=10.0.0.1"}
        res = client.post("/api/siem/logs", json=log_payload)
        assert res.status_code == 200
        assert len(res.json()["sha256Hash"]) == 64
        print("✓ SIEM SHA-256 chained log insertion passed")

        res = client.get("/api/siem/verify")
        assert res.status_code == 200
        assert res.json()["isValid"] is True
        print("✓ SIEM cryptographic chain verification passed")

        # Threat Intel Test
        res = client.get("/api/threat-intel")
        assert res.status_code == 200
        assert len(res.json()) >= 4
        print("✓ Threat intelligence retrieval passed")

        # Model Registry Checkpoints Test
        res = client.get("/api/ml/registry")
        assert res.status_code == 200
        assert len(res.json()) >= 4
        print("✓ Model registry checkpoints passed")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

