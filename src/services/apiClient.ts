// Frontend API Client connecting React to the Python FastAPI Scikit-Learn Backend with SQLite Database

import type { 
  HealthcareBreachRecord, 
  FeatureImportance,
  MLModelSummary,
  BreachPrediction,
  ZeroTrustPolicy,
  GlobalThreatVector,
  ModelRegistryCheckpoint
} from '../types';

export type { 
  HealthcareBreachRecord, 
  FeatureImportance,
  MLModelSummary,
  BreachPrediction,
  ZeroTrustPolicy,
  GlobalThreatVector,
  ModelRegistryCheckpoint
};

export interface SystemHealth {
  status: string;
  service: string;
  timestamp: string;
  dataset_records?: number;
  models_loaded?: number;
  [key: string]: any;
}

export const API_BASE_URL = 'http://localhost:8005';

export interface PythonSystemStatus {
  status: 'ONLINE' | 'OFFLINE';
  version: string;
  engine: string;
  pythonVersion: string;
  modelsLoaded: number;
  totalBreachRecords: number;
  serverTime: string;
  activeModel?: string;
}

export interface DatasetCountStats {
  totalRecords: number;
  totalBreaches: number;
  highSeverityCount: number;
  databaseEngine: string;
}

export interface FhirAnalysisResult {
  analysisID: string;
  resourceType: string;
  riskScore: number;
  isAnomalous: boolean;
  potentialThreatVector: string;
  mitigationAction: string;
  fhirComplianceStatus: string;
  extractedFeatures: Record<string, any>;
}

export interface SiemLogItem {
  id: string;
  timestamp: string;
  facility: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'ALERT' | 'WARNING' | 'INFO';
  cefHeader: string;
  extension: string;
  sha256Hash: string;
  prevHash: string;
}

export interface HashChainVerification {
  isValid: boolean;
  totalEntriesChecked: number;
  firstHash?: string;
  lastHash?: string;
  brokenAtId?: string;
  tampered_at?: string;
  details: string;
}

export interface PolicyEvaluation {
  action: 'PERMIT' | 'FLAG' | 'QUARANTINE' | 'BLOCK';
  violatedPolicies: string[];
  reason: string;
}

class EmmanuelApiClient {
  private isConnected: boolean = false;
  public lastStatus: PythonSystemStatus | null = null;

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${API_BASE_URL}/api/system/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isConnected = res.ok;
      return res.ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  async getStatus(): Promise<PythonSystemStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/system/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PythonSystemStatus = await res.json();
      this.lastStatus = data;
      this.isConnected = true;
      return data;
    } catch {
      this.isConnected = false;
      return null;
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  // --- DATA & DATASET ---

  async fetchDataset(limit: number = 200, offset: number = 0, search?: string, severity?: string): Promise<HealthcareBreachRecord[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.append('search', search);
    if (severity && severity !== 'ALL') params.append('severity', severity);

    const res = await fetch(`${API_BASE_URL}/api/data/dataset?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch breach records from backend');
    return await res.json();
  }

  async fetchDatasetCount(): Promise<DatasetCountStats> {
    const res = await fetch(`${API_BASE_URL}/api/data/count`);
    if (!res.ok) throw new Error('Failed to fetch dataset count');
    return await res.json();
  }

  async searchBreaches(params?: { page?: number; limit?: number; search?: string; severity?: string }): Promise<{ records: HealthcareBreachRecord[]; totalRecords: number }> {
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;
    const [records, count] = await Promise.all([
      this.fetchDataset(limit, offset, params?.search, params?.severity),
      this.fetchDatasetCount()
    ]);
    return { records, totalRecords: count.totalRecords };
  }

  async fetchModels(): Promise<ModelRegistryCheckpoint[]> {
    return this.fetchRegistryCheckpoints();
  }

  async generateSyntheticRecords(count: number = 50): Promise<HealthcareBreachRecord[]> {
    const res = await fetch(`${API_BASE_URL}/api/data/synthetic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    if (!res.ok) throw new Error('Failed to generate synthetic records');
    return await res.json();
  }

  async preprocessData(missingStrat: string, normStrat: string, encodeCat: boolean = true, augmentCount: number = 0) {
    const res = await fetch(`${API_BASE_URL}/api/data/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missingValueStrategy: missingStrat,
        normalizationStrategy: normStrat,
        encodeCategorical: encodeCat,
        syntheticAugmentationCount: augmentCount
      })
    });
    if (!res.ok) throw new Error('Failed to execute preprocessing on backend');
    return await res.json();
  }

  // --- MACHINE LEARNING ---

  async fetchFeatureImportances(): Promise<FeatureImportance[]> {
    const res = await fetch(`${API_BASE_URL}/api/ml/features`);
    if (!res.ok) throw new Error('Failed to fetch feature importances');
    const data = await res.json();
    return data.featureRankings;
  }

  async trainAllModels(useDP: boolean = false, epsilon: number = 1.0): Promise<MLModelSummary[]> {
    const res = await fetch(`${API_BASE_URL}/api/ml/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testSize: 0.20,
        randomState: 42,
        useDifferentialPrivacy: useDP,
        epsilonDP: epsilon
      })
    });
    if (!res.ok) throw new Error('Failed to train models in Python');
    const data = await res.json();
    return data.models;
  }

  async activateModel(modelID: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/ml/models/${modelID}/activate`, {
      method: 'POST'
    });
    return res.ok;
  }

  async fetchRegistryCheckpoints(): Promise<ModelRegistryCheckpoint[]> {
    const res = await fetch(`${API_BASE_URL}/api/ml/registry`);
    if (!res.ok) throw new Error('Failed to fetch model registry checkpoints');
    return await res.json();
  }

  async activateRegistryCheckpoint(version: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/ml/registry/${version}/activate`, {
      method: 'POST'
    });
    return res.ok;
  }

  // --- THREAT INFERENCE ---

  async predictRecord(record: Partial<HealthcareBreachRecord>, modelID?: string): Promise<BreachPrediction> {
    const res = await fetch(`${API_BASE_URL}/api/inference/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityName: record.entityName || 'Clinical Telemetry Endpoint',
        state: record.state || 'CA',
        entityType: record.entityType || 'Healthcare Provider',
        individualsAffected: record.individualsAffected || 0,
        breachType: record.breachType || 'Hacking/IT Incident',
        location: record.location || 'Network Server',
        networkProtocol: record.networkProtocol || 'HTTPS',
        packetLengthAvg: record.packetLengthAvg || 500,
        failedLoginAttempts: record.failedLoginAttempts || 0,
        unusualDataTransferMB: record.unusualDataTransferMB || 0,
        modelID: modelID
      })
    });
    if (!res.ok) throw new Error('Inference request failed');
    const data = await res.json();
    return {
      predictionID: data.predictionID,
      inputRecord: record,
      predictedClass: data.predictedClass,
      probability: data.probability,
      severityLevel: data.severityLevel,
      dateGenerated: new Date().toISOString(),
      inferenceTimeMs: data.inferenceTimeMs,
      triggeredRules: data.triggeredRules
    };
  }

  // --- DIFFERENTIAL PRIVACY ---

  async runMIAAudit(epsilon: number = 1.0) {
    const res = await fetch(`${API_BASE_URL}/api/privacy/mia-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epsilon })
    });
    if (!res.ok) throw new Error('MIA Audit request failed');
    return await res.json();
  }

  // --- ZERO TRUST POLICIES ---

  async fetchPolicies(): Promise<ZeroTrustPolicy[]> {
    const res = await fetch(`${API_BASE_URL}/api/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return await res.json();
  }

  async savePolicy(policy: ZeroTrustPolicy): Promise<ZeroTrustPolicy> {
    const res = await fetch(`${API_BASE_URL}/api/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
    if (!res.ok) throw new Error('Failed to save policy');
    return await res.json();
  }

  async deletePolicy(policyID: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/policies/${policyID}`, {
      method: 'DELETE'
    });
    return res.ok;
  }

  async evaluatePolicy(protocol: string, failedLogins: number, transferMB: number, hasMfa: boolean = false): Promise<PolicyEvaluation> {
    const res = await fetch(`${API_BASE_URL}/api/policies/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocol, failedLogins, transferMB, hasMfa })
    });
    if (!res.ok) throw new Error('Failed to evaluate telemetry against policies');
    return await res.json();
  }

  // --- SIEM & SYSLOG ---

  async fetchSiemLogs(limit: number = 50): Promise<SiemLogItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/siem/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch SIEM logs');
    return await res.json();
  }

  async createSiemLog(entry: { facility: string; severity: string; cefHeader: string; extension: string }): Promise<SiemLogItem> {
    const res = await fetch(`${API_BASE_URL}/api/siem/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to create SIEM log entry');
    return await res.json();
  }

  async verifySiemHashChain(): Promise<HashChainVerification> {
    const res = await fetch(`${API_BASE_URL}/api/siem/verify`);
    if (!res.ok) throw new Error('Failed to verify hash chain');
    return await res.json();
  }

  // --- THREAT INTELLIGENCE ---

  async fetchThreatIntel(): Promise<GlobalThreatVector[]> {
    const res = await fetch(`${API_BASE_URL}/api/threat-intel`);
    if (!res.ok) throw new Error('Failed to fetch threat intelligence');
    return await res.json();
  }

  async addThreatVector(item: GlobalThreatVector): Promise<GlobalThreatVector> {
    const res = await fetch(`${API_BASE_URL}/api/threat-intel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to save threat vector');
    return await res.json();
  }

  // --- FHIR ---

  async analyzeFhirPayload(payload: {
    resourceType: string;
    clientIP?: string;
    payloadSizeKB?: number;
    rawJson?: any;
  }): Promise<FhirAnalysisResult> {
    const res = await fetch(`${API_BASE_URL}/api/fhir/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('FHIR Analysis failed');
    return await res.json();
  }
}

export const emmanuelApiClient = new EmmanuelApiClient();
