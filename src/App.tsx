import { useState, useEffect } from 'react';
import type { User, UserRole, HealthcareBreachRecord, MissingValueStrategy, NormalizationStrategy } from './types';
import { REAL_HHS_BREACH_DATASET } from './data/hhsBreachData';
import { 
  PreprocessorClass, 
  FeatureSelectorClass, 
  MLModelEngine, 
  MIAPrivacyAuditorEngine
} from './engine/mlEngine';
import { emmanuelApiClient } from './services/apiClient';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ThreatMonitoringView } from './components/ThreatMonitoringView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { PrivacyAuditView } from './components/PrivacyAuditView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ZeroTrustAuthModal } from './components/ZeroTrustAuthModal';
import { AuthPortal } from './components/AuthPortal';
import { authService } from './services/authService';

const GUEST_USER: User = {
  userID: 'USR-GUEST',
  userName: 'Security Guest',
  role: 'Security Officer',
  email: 'guest@emmanuel.health',
  lastLogin: '',
  sessionToken: '',
  isAuthenticated: false
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthPortalOpen, setIsAuthPortalOpen] = useState<boolean>(() => !authService.getCurrentUser());
  const [isZeroTrustModalOpen, setIsZeroTrustModalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core 4-Page Routing State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authentic Clinical Telemetry & ML State
  const [dataset, setDataset] = useState<HealthcareBreachRecord[]>(REAL_HHS_BREACH_DATASET);
  const [features, setFeatures] = useState(() => FeatureSelectorClass.getFeatureImportances(dataset));
  const [models, setModels] = useState(() => MLModelEngine.trainAllModels(dataset));
  const [activeModel, setActiveModel] = useState(() => models[0] || MLModelEngine.trainAllModels(dataset)[0]);
  const [miaAudit, setMiaAudit] = useState(() => MIAPrivacyAuditorEngine.auditModelPrivacy(activeModel));

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const checkConnectionAndLoad = async () => {
    const ok = await emmanuelApiClient.checkHealth();
    setIsBackendConnected(ok);
    if (ok) {
      try {
        const dbRecords = await emmanuelApiClient.fetchDataset(1600);
        if (dbRecords && dbRecords.length > 0) {
          setDataset(dbRecords);
        }
      } catch (err) {
        console.warn('[Emmanuel] Could not pull records from backend DB, using bundled data:', err);
      }
    }
  };

  useEffect(() => {
    checkConnectionAndLoad();
    const interval = setInterval(async () => {
      const ok = await emmanuelApiClient.checkHealth();
      setIsBackendConnected(ok);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectActiveModel = async (model: typeof models[0]) => {
    setActiveModel(model);
    if (isBackendConnected) {
      try {
        await emmanuelApiClient.activateModel(model.modelID);
      } catch (err) {
        console.warn('[Emmanuel] Failed to activate model on backend:', err);
      }
    }
    const newMia = MIAPrivacyAuditorEngine.auditModelPrivacy(model);
    setMiaAudit(newMia);
  };

  const handleRetrainAllModels = async () => {
    if (isBackendConnected) {
      try {
        const retrained = await emmanuelApiClient.trainAllModels(false, 1.0);
        setModels(retrained);
        const updatedActive = retrained.find(m => m.modelID === activeModel.modelID) || retrained[0];
        setActiveModel(updatedActive);
        const newMia = MIAPrivacyAuditorEngine.auditModelPrivacy(updatedActive);
        setMiaAudit(newMia);
        return;
      } catch (err) {
        console.warn('[Emmanuel] Backend retrain failed, falling back to local engine:', err);
      }
    }

    const retrained = MLModelEngine.trainAllModels(dataset);
    setModels(retrained);
    const updatedActive = retrained.find(m => m.modelID === activeModel.modelID) || retrained[0];
    setActiveModel(updatedActive);
    const newMia = MIAPrivacyAuditorEngine.auditModelPrivacy(updatedActive);
    setMiaAudit(newMia);
  };

  const handleRunMIAAudit = async () => {
    if (isBackendConnected) {
      try {
        const result = await emmanuelApiClient.runMIAAudit(1.0);
        setMiaAudit({
          auditID: result.auditID || 'MIA-DB-001',
          modelName: activeModel.modelName,
          vulnerabilityScore: result.vulnerabilityScore,
          attackAccuracy: Math.round(result.attackAccuracy * 100),
          privacyRiskRating: result.privacyRiskRating,
          recommendations: result.recommendations,
          auditTimestamp: result.auditTimestamp || new Date().toISOString()
        });
        return;
      } catch (err) {
        console.warn('[Emmanuel] Backend MIA audit failed, falling back to local:', err);
      }
    }
    const updatedMia = MIAPrivacyAuditorEngine.auditModelPrivacy(activeModel);
    setMiaAudit(updatedMia);
  };

  const handleIngestDataset = async (
    records: HealthcareBreachRecord[],
    missingStrat: MissingValueStrategy,
    normStrat: NormalizationStrategy
  ) => {
    if (isBackendConnected) {
      try {
        await emmanuelApiClient.preprocessData(missingStrat, normStrat, true, 0);
        const freshRecords = await emmanuelApiClient.fetchDataset(1600);
        setDataset(freshRecords);
        const retrained = await emmanuelApiClient.trainAllModels();
        setModels(retrained);
        const newBest = retrained.find(m => m.modelID === activeModel.modelID) || retrained[0];
        setActiveModel(newBest);
        setFeatures(FeatureSelectorClass.getFeatureImportances(freshRecords));
        setMiaAudit(MIAPrivacyAuditorEngine.auditModelPrivacy(newBest));
        return;
      } catch (err) {
        console.warn('[Emmanuel] Backend ingestion/preprocessing failed, using local engine:', err);
      }
    }

    // Local preprocessing and retraining pipeline
    const { cleanedRecords } = PreprocessorClass.preprocess(records, missingStrat, normStrat);
    const merged = [...cleanedRecords, ...dataset];
    setDataset(merged);

    const updatedFeatures = FeatureSelectorClass.getFeatureImportances(merged);
    setFeatures(updatedFeatures);

    const retrained = MLModelEngine.trainAllModels(merged);
    setModels(retrained);
    const newBest = retrained.find(m => m.modelID === activeModel.modelID) || retrained[0];
    setActiveModel(newBest);

    const newMia = MIAPrivacyAuditorEngine.auditModelPrivacy(newBest);
    setMiaAudit(newMia);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const updated = authService.switchRole(newRole);
    if (updated) {
      setCurrentUser(updated);
    } else if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role: newRole
      });
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
    setIsZeroTrustModalOpen(false);
    setIsAuthPortalOpen(true);
  };

  const handleOpenAuth = () => {
    if (currentUser?.isAuthenticated) {
      setIsZeroTrustModalOpen(true);
    } else {
      setIsAuthPortalOpen(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9ff] text-[#191c20] flex flex-col font-sans antialiased relative">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser || GUEST_USER}
        onOpenAuthModal={handleOpenAuth}
        onSelectTab={handleSelectTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onSignOut={currentUser?.isAuthenticated ? handleSignOut : undefined}
      />

      {/* Main Workspace Layout with 4-Item Sidebar Rail */}
      <div className="flex-1 flex w-full min-w-0 relative">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleSelectTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Dynamic Route Canvas - Strictly 4 Core Dashboard Pages */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-[#f8f9ff] overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* 1. /dashboard: High-level posture, live network traffic metrics & alert summaries */}
            {activeTab === 'dashboard' && (
              <DashboardView
                dataset={dataset}
                models={models}
                miaAudit={miaAudit}
                onNavigate={setActiveTab}
              />
            )}

            {/* 2. /threat-monitoring: Live feed of detected anomalies by severity */}
            {activeTab === 'threat-monitoring' && (
              <ProtectedRoute currentUser={currentUser} onOpenAuth={handleOpenAuth}>
                <ThreatMonitoringView
                  dataset={dataset}
                  activeModel={activeModel}
                  isBackendConnected={isBackendConnected}
                />
              </ProtectedRoute>
            )}

            {/* 3. /model-evaluation: Model performance (Acc, Prec, Rec, F1) & top features */}
            {activeTab === 'model-evaluation' && (
              <ProtectedRoute currentUser={currentUser} onOpenAuth={handleOpenAuth}>
                <ModelEvaluationView
                  models={models}
                  activeModel={activeModel}
                  features={features}
                  onSelectActiveModel={handleSelectActiveModel}
                  onRetrainModels={handleRetrainAllModels}
                  onIngestDataset={handleIngestDataset}
                  isBackendConnected={isBackendConnected}
                />
              </ProtectedRoute>
            )}

            {/* 4. /privacy-audit: MIA vulnerability monitoring & GDPR compliance */}
            {activeTab === 'privacy-audit' && (
              <ProtectedRoute currentUser={currentUser} onOpenAuth={handleOpenAuth}>
                <PrivacyAuditView
                  activeModel={activeModel}
                  miaAudit={miaAudit}
                  onRunMIAAudit={handleRunMIAAudit}
                  isBackendConnected={isBackendConnected}
                />
              </ProtectedRoute>
            )}

          </div>
        </main>
      </div>

      {/* Auth Portal Modal: Overlaid on top of the landing page */}
      {isAuthPortalOpen && (
        <AuthPortal
          onAuthenticated={(user) => {
            setCurrentUser(user);
            setIsAuthPortalOpen(false);
          }}
          onClose={() => setIsAuthPortalOpen(false)}
        />
      )}

      {/* Zero Trust IAM Modal when authenticated */}
      {currentUser && (
        <ZeroTrustAuthModal
          isOpen={isZeroTrustModalOpen}
          onClose={() => setIsZeroTrustModalOpen(false)}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

export default App;
