# Sprint Backlog: Focused 4-Page Architecture Refactor

**Identifier:** EMMANUEL-SPRINT-03  
**Goal:** Surgically refactor the Emmanuel web application to retain exclusively the 4 core dashboard pages and 4 key components specified in the system design contract, removing all surplus views and sidebar items while preserving full end-to-end functionality.  
**Philosophy:** Quality over quantity; working software over bloat; real HHS clinical telemetry over dummy data.

---

## 1. Scope Definition & Boundary

### In-Scope Core Dashboard Pages (Strictly 4)
| Route / Identifier | Page Component | Associated ML Module | Core Functional Scope |
|---|---|---|---|
| `/dashboard` | `DashboardView.tsx` | Prediction and Classification | High-level security posture overview, live network traffic metrics, and recent alert summaries. |
| `/threat-monitoring` | `ThreatMonitoringView.tsx` | Prediction and Classification | Live feed of detected anomalies, explicitly categorized by severity (High, Medium, Low). Hosts `<AlertStream />` and `<ThreatDetailsModal />`. |
| `/model-evaluation` | `ModelEvaluationView.tsx` | Model Training, Evaluation, and Feature Selection | Visual representation of model performance (Accuracy, Precision, Recall, F1 Score), top selected features, and `<DataIngestionPanel />`. |
| `/privacy-audit` | `PrivacyAuditView.tsx` | Legal and Ethical Considerations | Membership Inference Attack (MIA) vulnerability monitoring, shadow attack metrics, and GDPR compliance validation. |

### In-Scope Key Components
1. **`<AlertStream />`**: WebSocket-driven feed displaying incoming anomalies with real-time severity badges, pause/resume, and triage controls.
2. **`<ThreatDetailsModal />`**: Forensic modal overlay detailing trigger features (network protocol, packet length, affected individuals, location, delay).
3. **`<ProtectedRoute />`**: Zero Trust / IAM routing wrapper gating views and administrative operations by role clearance.
4. **`<DataIngestionPanel />`**: Form-based secondary dataset ingestion allowing CSV/JSON file upload or direct text input for preprocessing and on-demand model retraining.

### Out of Scope & Scheduled for Removal
All 17 non-specified views removed from application routing and sidebar:
- `DataPreprocessingView.tsx`
- `FeatureSelectionView.tsx`
- `ModelTrainingCenter.tsx`
- `ThreatDetectorView.tsx`
- `LiveTrafficStreamView.tsx`
- `DifferentialPrivacySandboxView.tsx`
- `ModelRegistryView.tsx`
- `ZeroTrustPolicyView.tsx`
- `RemediationPlaybookView.tsx`
- `GlobalThreatMapView.tsx`
- `SiemSyslogView.tsx`
- `RegulatoryComplianceView.tsx`
- `AttackSimulationSuiteView.tsx`
- `PerformanceLoadTestView.tsx`
- `UserAcceptanceTestView.tsx`
- `ProductionReleaseView.tsx`
- `FhirIngestionView.tsx`
- `PythonBackendConsoleView.tsx`
- `ReportGeneratorView.tsx`

---

## 2. Engineering Tasks Sequence

| Task ID | Task Description | Acceptance Criteria |
|---|---|---|
| **TSK-301** | Create `<ProtectedRoute />` wrapper | Enforces active session and Zero Trust IAM clearance; redirects/gates unauthorized users. |
| **TSK-302** | Create `<ThreatDetailsModal />` | Displays complete trigger feature breakdown for any selected breach event. |
| **TSK-303** | Create `<AlertStream />` | Connects to WebSocket or simulated real-time stream; displays categorized High/Medium/Low alerts. |
| **TSK-304** | Create `<DataIngestionPanel />` | Allows file upload and JSON/CSV ingestion, validating fields and triggering retraining. |
| **TSK-305** | Build `DashboardView.tsx` (`/dashboard`) | High-level posture, live traffic chart, and recent alert summaries using authentic HHS data. |
| **TSK-306** | Build `ThreatMonitoringView.tsx` (`/threat-monitoring`) | Live feed with filter by severity and inspection via `<ThreatDetailsModal />`. |
| **TSK-307** | Build `ModelEvaluationView.tsx` (`/model-evaluation`) | Accuracy, Precision, Recall, F1 Score charts, top feature ranking, and `<DataIngestionPanel />`. |
| **TSK-308** | Refine `PrivacyAuditView.tsx` (`/privacy-audit`) | MIA vulnerability testing and GDPR compliance verification. |
| **TSK-309** | Update `Sidebar.tsx` | Exactly 4 navigation links matching the 4 routes. Zero surplus links. |
| **TSK-310** | Wire `App.tsx` & clean up obsolete components | Route switching among the 4 views, delete obsolete views, verify `npm run build`. |
