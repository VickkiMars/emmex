# API & Interface Contract Specification

**System:** Emmanuel Healthcare Data Breach Prevention System  
**Service:** Machine Learning Companion Microservice (FastAPI) & Presentation Client (React SPA)  
**Contract Version:** v1.0.0  
**Base URL:** `http://localhost:8005` (configurable via `EMMANUEL_BACKEND_PORT`)  
**Interactive Docs:** `http://localhost:8005/docs` (OpenAPI / Swagger UI)  
**ReDoc:** `http://localhost:8005/redoc`

---

## 1. General Conventions & Protocol Headers

- **Data Interchange**: All payloads are transmitted as `application/json; charset=utf-8`.
- **CORS Policy**: Configured to accept origins `http://localhost:5173`, `http://localhost:5174`, `http://localhost:5175`, `http://127.0.0.1:5174`.
- **Authentication**: Bearer Token or API Key in `Authorization: Bearer <sessionToken>` for sensitive IAM operations.
- **Error Format**: All non-2xx responses return standard RFC 7807 problem details:
  ```json
  {
    "detail": "Descriptive error message or validation failure breakdown."
  }
  ```

---

## 2. API Endpoints Catalog

### 2.1 System & Telemetry Endpoints

#### `GET /api/system/health`
- **Description**: Lightweight health probe for load balancers and container readiness checks.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-25T16:00:00Z"
  }
  ```

#### `GET /api/system/status`
- **Description**: Returns live runtime metrics, loaded model count, active classifier, and engine stats.
- **Response `200 OK`**:
  ```json
  {
    "status": "online",
    "version": "1.0.0",
    "engine": "Scikit-Learn + FastAPI",
    "pythonVersion": "3.10.12",
    "modelsLoaded": 5,
    "totalBreachRecords": 30,
    "serverTime": "2026-09-25T16:00:00Z",
    "activeModel": "Random Forest"
  }
  ```

---

### 2.2 Data Ingestion & Preprocessing Endpoints

#### `GET /api/data/dataset`
- **Description**: Retrieves authentic HHS OCR healthcare breach records.
- **Query Parameters**:
  - `limit` (int, optional, default: 50)
  - `offset` (int, optional, default: 0)
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "HHS-2023-001",
      "entityName": "Metropolitan Health System",
      "state": "CA",
      "entityType": "Healthcare Provider",
      "individualsAffected": 14200,
      "breachDate": "2023-04-12",
      "breachType": "Hacking/IT Incident",
      "location": "Network Server",
      "detectionDelayDays": 18,
      "networkProtocol": "HTTPS",
      "packetLengthAvg": 1420.5,
      "failedLoginAttempts": 12,
      "unusualDataTransferMB": 850.4,
      "isBreach": 1,
      "severityLevel": "High"
    }
  ]
  ```

#### `POST /api/data/preprocess`
- **Description**: Executes missing value imputation and MinMax feature normalization.
- **Request Body**:
  ```json
  {
    "missingValueStrategy": "median",
    "normalizationStrategy": "minmax",
    "encodeCategorical": true,
    "syntheticAugmentationCount": 0
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "totalRecords": 30,
    "missingValuesImputed": 4,
    "duplicatesRemoved": 0,
    "featuresEncoded": ["breachType", "location", "networkProtocol"],
    "transformationLogs": [
      "Applied median imputation across missing numeric fields",
      "MinMax scaling applied to [individualsAffected, detectionDelayDays, packetLengthAvg, failedLoginAttempts, unusualDataTransferMB]"
    ],
    "sampleCleanedRecords": [...]
  }
  ```

---

### 2.3 Feature Selection & Machine Learning Endpoints

#### `GET /api/ml/features`
- **Description**: Retrieves Random Forest Gini impurity feature importance rankings and correlation scores.
- **Response `200 OK`**:
  ```json
  {
    "selectedFeatures": [
      "unusualDataTransferMB",
      "individualsAffected",
      "failedLoginAttempts",
      "detectionDelayDays",
      "packetLengthAvg"
    ],
    "featureRankings": [
      {
        "featureName": "unusualDataTransferMB",
        "displayName": "Unusual Data Transfer (MB)",
        "importanceScore": 0.342,
        "correlationWithTarget": 0.685,
        "isSelected": true
      },
      {
        "featureName": "individualsAffected",
        "displayName": "Individuals Affected",
        "importanceScore": 0.285,
        "correlationWithTarget": 0.592,
        "isSelected": true
      },
      {
        "featureName": "failedLoginAttempts",
        "displayName": "Failed Login Attempts",
        "importanceScore": 0.168,
        "correlationWithTarget": 0.514,
        "isSelected": true
      }
    ],
    "topPredictor": "unusualDataTransferMB"
  }
  ```

#### `POST /api/ml/train`
- **Description**: Trains and evaluates all 5 ML models with optional Differential Privacy noise injection.
- **Request Body**:
  ```json
  {
    "modelTypes": [
      "Random Forest",
      "Gradient Boosting",
      "Support Vector Machine",
      "K-Nearest Neighbors",
      "Decision Tree"
    ],
    "testSize": 0.20,
    "randomState": 42,
    "useDifferentialPrivacy": false,
    "epsilonDP": 1.0
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "models": [
      {
        "modelID": "rf-prod-001",
        "modelName": "Random Forest Classifier",
        "modelType": "Random Forest",
        "trainingAccuracy": 0.985,
        "testingAccuracy": 0.967,
        "metrics": {
          "accuracy": 0.967,
          "precision": 0.962,
          "recall": 0.985,
          "f1Score": 0.973,
          "confusionMatrix": { "tp": 15, "fp": 0, "tn": 14, "fn": 1 },
          "rocAuc": 0.991,
          "trainingTimeMs": 142.5
        },
        "hyperparameters": { "n_estimators": 100, "max_depth": null, "random_state": 42 },
        "isTrained": true,
        "isPersisted": true,
        "activeStatus": true,
        "epsilonDP": null
      }
    ],
    "bestModelID": "rf-prod-001",
    "bestModelName": "Random Forest Classifier",
    "datasetSize": 30,
    "featuresUsed": ["unusualDataTransferMB", "individualsAffected", "failedLoginAttempts"]
  }
  ```

#### `POST /api/ml/models/{id}/activate`
- **Description**: Hot-swaps the active production inference classifier.
- **Path Parameters**: `id` (string, e.g., `rf-prod-001`)
- **Response `200 OK`**:
  ```json
  {
    "status": "success",
    "message": "Model rf-prod-001 activated successfully",
    "activeModel": "Random Forest Classifier"
  }
  ```

---

### 2.4 Threat Inference & Telemetry Scoring Endpoints

#### `POST /api/inference/predict`
- **Description**: Sub-36ms real-time classification of an individual security event.
- **Request Body**:
  ```json
  {
    "entityName": "Cardiology PACS Server",
    "state": "NY",
    "entityType": "Healthcare Provider",
    "individualsAffected": 650,
    "breachType": "Hacking/IT Incident",
    "location": "Network Server",
    "networkProtocol": "DICOM",
    "packetLengthAvg": 1450.0,
    "failedLoginAttempts": 8,
    "unusualDataTransferMB": 820.5
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "predictionID": "PRED-2026-9812",
    "predictedClass": "Potential Breach",
    "isBreach": 1,
    "probability": 0.942,
    "confidenceInterval": [0.891, 0.978],
    "severityLevel": "High",
    "inferenceTimeMs": 11.4,
    "triggeredRules": [
      "Mass PHI Exposure (Individuals Affected > 500)",
      "High Volume Data Exfiltration on Clinical Protocol (DICOM > 500MB)",
      "Anomalous Failed Authentication Rate (Attempts >= 5)"
    ],
    "contributingFactors": {
      "unusualDataTransferMB": 0.45,
      "failedLoginAttempts": 0.30,
      "individualsAffected": 0.25
    },
    "modelUsed": "Random Forest Classifier (v1.0)"
  }
  ```

#### `POST /api/inference/batch`
- **Description**: High-throughput telemetry batch scoring.
- **Request Body**: Array of `PredictionRequest` objects.
- **Response `200 OK`**:
  ```json
  {
    "totalProcessed": 100,
    "breachesDetected": 14,
    "avgLatencyMs": 0.85,
    "throughputPerSec": 1176.4,
    "predictions": [...]
  }
  ```

---

### 2.5 Differential Privacy & Membership Inference Attack (MIA) Endpoints

#### `POST /api/privacy/mia-audit`
- **Description**: Executes shadow model Membership Inference Attack auditing to quantify training data memorization.
- **Request Body**:
  ```json
  {
    "modelID": "rf-prod-001",
    "epsilon": 0.5,
    "shadowModelsCount": 3
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "auditID": "MIA-AUDIT-2026-04",
    "modelName": "Random Forest Classifier",
    "epsilon": 0.5,
    "vulnerabilityScore": 44.5,
    "attackAccuracy": 0.445,
    "privacyRiskRating": "Low Risk (Privacy Preserved)",
    "recommendations": [
      "Differential Privacy Laplace noise active at epsilon = 0.5.",
      "Membership Inference attack accuracy is below the 50% random-guess threshold.",
      "Complies with Dwork (2006) and Johansson & Janryd (2024) privacy standards."
    ],
    "auditTimestamp": "2026-09-25T16:00:00Z"
  }
  ```

---

### 2.6 HL7 / FHIR Clinical Interoperability Endpoints

#### `POST /api/fhir/analyze`
- **Description**: Ingests and inspects clinical HL7 FHIR R4 JSON payloads to detect anomalous bulk data extraction.
- **Request Body**:
  ```json
  {
    "resourceType": "Bundle",
    "id": "bundle-export-cardio-99",
    "patientId": "PAT-98442",
    "accessProtocol": "HL7/FHIR",
    "clientIP": "10.240.12.85",
    "payloadSizeKB": 84.5,
    "rawJson": { ... }
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "analysisID": "FHIR-SEC-2026-77",
    "resourceType": "Bundle",
    "riskScore": 0.88,
    "isAnomalous": true,
    "potentialThreatVector": "Automated FHIR Bulk Clinical Record Harvesting",
    "mitigationAction": "Enforce Zero Trust MFA and restrict FHIR Export token ceiling",
    "fhirComplianceStatus": "Valid FHIR R4 Structure, Non-Compliant Extraction Pattern",
    "extractedFeatures": {
      "patientCount": 145,
      "resourceDensity": "High",
      "originSubnet": "Internal Clinical LAN"
    }
  }
  ```

---

## 3. Client Failover & Disconnected Mode Contract

When the Python companion backend is offline or unreachable:
1. The React client MUST NOT throw unhandled exceptions or block the UI.
2. The client transitions to **In-Memory Heuristic Mode**, utilizing client-side TypeScript evaluators (`src/engine/`) to simulate predictions, telemetry streams, and differential privacy curves.
3. The UI header and Python Console display a clear badge: `Offline - In-Memory Simulation Active`.
4. Reconnection is polled automatically every 10 seconds.
