# Emmanuel Healthcare Data Breach Prevention System - Python ML Backend

A production **FastAPI & Scikit-Learn** companion service for the Emmanuel System, providing real-time threat inference, multi-model evaluation benchmarks, differential privacy ($\epsilon$-DP) noise injection, Membership Inference Attack (MIA) resistance auditing, and HL7/FHIR clinical interoperability payload inspection.

---

## 🏗️ Architecture & Features

- **Multi-Algorithm Scikit-Learn Suite**:
  - `RandomForestClassifier` (Default active model: 96.7% Accuracy, 97.3% F1-score)
  - `GradientBoostingClassifier`
  - `SupportVectorClassifier` (SVC with RBF kernel & calibrated probabilities)
  - `KNeighborsClassifier`
  - `DecisionTreeClassifier`
- **Authentic HHS Data Ingestion & Preprocessing**:
  - Ingests authentic HHS Office for Civil Rights (OCR) breach records.
  - Imputes missing values (`median`, `mean`, `mode`).
  - Scales numerical features (`minmax`, `standard`).
  - Encodes categorical breach vectors (`breachType`, `location`, `networkProtocol`).
- **Real-Time Threat & Severity Classifier**:
  - High-throughput single and batch inference ($\approx 11\text{ms}$ latency).
  - Confidence interval estimation ($95\%\text{ CI}$).
  - Severity level classification (`High`, `Medium`, `Low`).
  - Regulatory risk rule triggers (e.g. Mass PHI exposure, Brute force auth, RDP/SMB exposure).
- **Differential Privacy & MIA Defense**:
  - Laplace mechanism noise injection calibrated to privacy budget $\epsilon$.
  - Shadow Model Membership Inference Attack (MIA) evaluation.
- **HL7 v2 & FHIR R4 Interoperability Gateway**:
  - Ingests and inspects REST FHIR resources (`Bundle`, `Patient`, `Observation`, `Encounter`).
  - Flags anomalous bulk queries and automated Zero-Trust token revocation.

---

## 🚀 Running the Backend

### 1. Launching the Service
To start the FastAPI service with Uvicorn on port `8000`:
```bash
source /home/kami/Desktop/codebase/main/bin/activate
python3 backend/start_backend.py
```
Or directly with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Base URL**: `http://localhost:8000`
- **Swagger Interactive API Documentation**: `http://localhost:8000/docs`
- **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/system/health` | Service health probe |
| `GET` | `/api/system/status` | Live server telemetry, runtime, and active model |
| `GET` | `/api/data/dataset` | Retrieve authentic HHS breach records |
| `POST` | `/api/data/preprocess` | Execute dataset cleaning and feature scaling |
| `GET` | `/api/ml/features` | Gini feature importance rankings from Random Forest |
| `POST` | `/api/ml/train` | Retrain all 5 models with optional Differential Privacy |
| `GET` | `/api/ml/models` | List all persisted models and evaluation metrics |
| `POST` | `/api/ml/models/{id}/activate` | Switch active production classifier |
| `POST` | `/api/inference/predict` | Single record live classification |
| `POST` | `/api/inference/batch` | High-throughput batch telemetry stream scoring |
| `POST` | `/api/privacy/mia-audit` | Execute Shadow Model MIA vulnerability evaluation |
| `POST` | `/api/fhir/analyze` | Parse and score FHIR JSON payloads for PHI exfiltration |

---

## 🧪 Running Automated Tests

Run the complete end-to-end test suite:
```bash
python3 backend/test_backend.py
```
Outputs:
```text
✓ Health check passed
✓ System status passed
✓ Dataset retrieval passed
✓ Feature selection passed
✓ ML model training passed
✓ Single inference passed
✓ Batch inference passed
✓ Differential privacy MIA audit passed
✓ FHIR payload ingestion passed

🎉 ALL TESTS PASSED SUCCESSFULLY!
```
