# Sprint 2 Backlog & Plan

## Sprint Goal
Expand the Emmanuel Healthcare Security Platform with **Live Network Traffic Stream Simulation**, **Automated Threat Anomaly Floods**, **Model Persistence & Versioning Registry**, and an interactive **Differential Privacy ($\epsilon$-Noise) Mitigation Sandbox** to reduce Membership Inference Attack (MIA) privacy vulnerability while maintaining >94% classification accuracy.

- **Sprint Duration**: 2 Weeks (Simulated Iteration)
- **Committed Velocity**: 34 Story Points
- **Definition of Done**: All Sprint 2 features integrated into the live React application, real-time live stream operating cleanly, model versioning active, differential privacy slider interactive, and `npm run build` compiling with 0 errors.

---

## Sprint 2 Task Breakdown

### 1. Live Network Traffic Stream Simulator (13 SP)
- [x] **TSK-201**: Implement real-time packet stream generator (DICOM, FHIR, SMB, RDP, HTTPS traffic streams).
- [x] **TSK-202**: Add automated attack injection buttons ("Simulate Ransomware Outbreak", "Simulate Brute-Force Auth Flood", "Simulate Insider Mass Exfiltration").
- [x] **TSK-203**: Display live streaming line charts showing real-time threat confidence & packet volume spikes.

### 2. Model Persistence, Versioning & Registry (8 SP)
- [x] **TSK-204**: Implement model checkpoint persistence and version history tracking (v1.0, v1.1, v2.0).
- [x] **TSK-205**: Create Model Registry UI allowing security officers to switch active production model versions, view hyperparameters, and compare historical metrics.

### 3. Differential Privacy ($\epsilon$-Noise) Mitigation Sandbox (13 SP)
- [x] **TSK-206**: Implement Laplace / Gaussian noise injection engine for tree splits ($\epsilon = 0.1, 0.5, 1.0, 5.0$).
- [x] **TSK-207**: Build interactive Differential Privacy sandbox UI showing live trade-off between MIA Vulnerability Risk (%) and Model Classification Accuracy (%).
- [x] **TSK-208**: Citing Johansson & Janryd (2024) and Dwork (2006) for mathematical differential privacy validation.
