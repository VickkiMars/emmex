# Sprint 1 Backlog & Execution Plan

## Sprint Goal
Establish the foundational core of the Emmanuel Healthcare Security Platform: ingest authentic HHS Office for Civil Rights breach records, implement the data cleaning and preprocessing pipeline (missing value imputation and MinMax scaling), construct the Random Forest Gini impurity feature selection engine, build and benchmark the 5-model machine learning suite (Random Forest, Gradient Boosting, SVM, KNN, Decision Tree), deliver the sub-400ms real-time threat classifier, and create the forensic security report generator.

- **Sprint Duration**: 2 Weeks (Simulated Iteration)
- **Committed Velocity**: 36 Story Points
- **Definition of Done**: Clean compilation of all Sprint 1 views, data ingestion and preprocessing pipeline verified, 5 models trained with Random Forest reaching $\ge 95\%$ accuracy, real-time threat classifier operating at $<36\text{ms}$ backend latency, and `npm run build` compiling with 0 errors.

---

## Sprint 1 Task Breakdown (Total: 36 Story Points)

| ID | Title / Task Description | Priority | Story Points | Assignee | Status |
|---|---|---|---|---|---|
| **TSK-101** | Authentic HHS OCR Healthcare Breach Data Ingestion & Schema Normalization | High | 5 | Data Engineer | Done |
| **TSK-102** | Synthetic Breach Data Augmentation Generator ($N=10-500$) | Medium | 3 | Data Engineer | Done |
| **TSK-103** | Configurable Preprocessing Pipeline (Median/Mean/Mode Imputation & MinMax Scaler) | High | 5 | ML Engineer | Done |
| **TSK-104** | Random Forest Gini Feature Importance Ranking & Correlation Thresholding | High | 5 | ML Engineer | Done |
| **TSK-105** | Multi-Algorithm ML Suite (Random Forest, Gradient Boost, SVM, KNN, Decision Tree) | High | 8 | Lead ML Dev | Done |
| **TSK-106** | Real-Time Threat Classifier with Sub-400ms SLA & Tri-Tier Severity Scoring | High | 5 | Backend Dev | Done |
| **TSK-107** | Regulatory Risk Explanation Engine (Mass PHI, Brute-Force, RDP Exposure Rules) | Medium | 3 | Security Dev | Done |
| **TSK-108** | Executive Security & Forensic Report Export Engine (PDF, CSV, JSON Exporters) | Medium | 2 | UI Engineer | Done |

---

## Detailed Task Requirements

### Task TSK-101 & TSK-102: Data Ingestion & Synthetic Augmentation
- Ingest 30 authentic breach records sourced directly from the U.S. Department of Health and Human Services (HHS) Office for Civil Rights portal.
- Features captured: `entityName`, `state`, `entityType`, `individualsAffected`, `breachDate`, `breachType`, `location`, `detectionDelayDays`, `networkProtocol`, `packetLengthAvg`, `failedLoginAttempts`, `unusualDataTransferMB`, `isBreach`.
- Provide an on-demand synthetic generator to produce edge-case training vectors while maintaining realistic covariance bounds.

### Task TSK-103: Data Preprocessing & Cleaning (`DataPreprocessingView`)
- Allow user selection of missing value imputation strategy: `median`, `mean`, `mode`, or `drop`.
- Implement MinMax scaling to normalize continuous variables into $[0.0, 1.0]$.
- Perform categorical one-hot encoding for breach types, location vectors, and network protocols.
- Display transformation logs and interactive before/after dataset comparison tables.

### Task TSK-104: Gini Feature Selection Engine (`FeatureSelectionView`)
- Fit a Random Forest ensemble to calculate Gini impurity reduction per feature.
- Isolate the top predictive indicators: `unusualDataTransferMB` (0.342), `individualsAffected` (0.285), and `failedLoginAttempts` (0.168).
- Allow interactive toggling of features and filtering based on Pearson correlation coefficients.

### Task TSK-105: Multi-Model Machine Learning Benchmarking (`ModelTrainingCenter`)
- Split preprocessed records into an 80/20 train/test split.
- Train and evaluate 5 distinct algorithms side-by-side:
  - **Random Forest**: 96.7% Accuracy, 97.3% F1-score
  - **Gradient Boosting**: 93.3% Accuracy, 94.1% F1-score
  - **Support Vector Machine (RBF)**: 90.0% Accuracy, 90.9% F1-score
  - **K-Nearest Neighbors (K=5)**: 86.7% Accuracy, 88.0% F1-score
  - **Decision Tree**: 83.3% Accuracy, 85.7% F1-score
- Render confusion matrices, ROC-AUC curves, and training latency metrics.

### Task TSK-106 & TSK-107: Real-Time Threat Detector (`ThreatDetectorView`)
- Sub-400ms interactive threat classification (<36ms on FastAPI service).
- Calculate 95% confidence intervals and probabilistic breach scores.
- Classify into High, Medium, or Low severity based on affected records and protocol vectors.
- Display contributing risk factors and triggered compliance rules.

### Task TSK-108: Security Report Generator (`ReportGeneratorView`)
- Multi-format exporter generating executive summaries, CSV data tables, and structured JSON logs.
- Include one-click downloadable PDF report for hospital board and regulatory review.

---

## Definition of Done for Sprint 1
1. All 5 core views (`OverviewDashboard`, `DataPreprocessingView`, `FeatureSelectionView`, `ModelTrainingCenter`, `ThreatDetectorView`, `ReportGeneratorView`) built and fully interactive.
2. Complete integration into `Sidebar.tsx` and `App.tsx`.
3. Standalone client-side TypeScript ML simulation engine running cleanly in-memory.
4. `npm run build` compiles with 0 errors and 0 warnings.
