// Core Domain Models & Class Interfaces for Emmanuel Healthcare Security System

export type UserRole = 'Super Admin' | 'Security Officer' | 'Compliance Auditor';

export interface User {
  userID: string;
  userName: string;
  role: UserRole;
  email: string;
  lastLogin: string;
  sessionToken?: string;
  isAuthenticated: boolean;
}

export type BreachType = 
  | 'Hacking/IT Incident'
  | 'Unauthorized Access/Disclosure'
  | 'Insider Misuse'
  | 'Theft'
  | 'Loss'
  | 'Improper Disposal';

export type LocationOfBreach = 
  | 'Network Server'
  | 'E-mail'
  | 'Electronic Medical Record'
  | 'Desktop Computer'
  | 'Laptop'
  | 'Paper Records'
  | 'Other Portable Electronic Device';

export type SeverityLevel = 'High' | 'Medium' | 'Low';

export interface HealthcareBreachRecord {
  id: string;
  entityName: string;
  state: string;
  entityType: string;
  individualsAffected: number;
  breachDate: string;
  breachType: BreachType;
  location: LocationOfBreach;
  detectionDelayDays: number;
  networkProtocol: 'HTTPS' | 'SFTP' | 'TCP/IP' | 'RDP' | 'SMB' | 'DICOM' | 'HL7/FHIR';
  packetLengthAvg: number;
  failedLoginAttempts: number;
  unusualDataTransferMB: number;
  isBreach: 0 | 1; // 1 = Breach, 0 = Normal
  severityLevel?: SeverityLevel;
}

export interface Dataset {
  datasetID: string;
  sourceName: string;
  dateCollected: string;
  numberOfRecords: number;
  records: HealthcareBreachRecord[];
  missingValuesCount: number;
  duplicateCount: number;
}

export type MissingValueStrategy = 'mean' | 'median' | 'mode' | 'drop';
export type NormalizationStrategy = 'minmax' | 'standard' | 'none';

export interface PreprocessorState {
  missingValueStrategy: MissingValueStrategy;
  normalizationStrategy: NormalizationStrategy;
  encodeCategorical: boolean;
  cleanedDataset: HealthcareBreachRecord[];
  transformationLog: string[];
}

export interface FeatureImportance {
  featureName: string;
  displayName: string;
  importanceScore: number;
  correlationWithTarget: number;
  isSelected: boolean;
}

export interface FeatureSelectorState {
  selectedFeatures: string[];
  correlationThreshold: number;
  featureRankings: FeatureImportance[];
}

export type MLModelType = 'Random Forest' | 'Gradient Boosting' | 'Support Vector Machine' | 'K-Nearest Neighbors' | 'Decision Tree';

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  rocAuc: number;
  trainingTimeMs: number;
}

export interface MLModelSummary {
  modelID: string;
  modelName: string;
  modelType: MLModelType;
  modelVersion?: string;
  trainingAccuracy: number;
  testingAccuracy: number;
  metrics: EvaluationMetrics;
  hyperparameters: Record<string, any>;
  isTrained: boolean;
  epsilonDP?: number;
}

export interface BreachPrediction {
  predictionID: string;
  inputRecord: Partial<HealthcareBreachRecord>;
  predictedClass: 'Normal Activity' | 'Potential Breach';
  probability: number;
  severityLevel: SeverityLevel;
  dateGenerated: string;
  inferenceTimeMs: number;
  triggeredRules: string[];
}

export interface MIAPrivacyAuditResult {
  auditID: string;
  modelName: string;
  vulnerabilityScore: number; // 0 - 100%
  attackAccuracy: number; // Attack classifier accuracy on training data
  privacyRiskRating: 'High Risk' | 'Moderate Risk' | 'Low Risk (Privacy Preserved)';
  recommendations: string[];
  auditTimestamp: string;
}

export interface SecurityReport {
  reportID: string;
  generatedBy: string;
  dateCreated: string;
  summary: {
    totalRecordsAnalyzed: number;
    totalBreachesDetected: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    topThreatVector: string;
    avgDetectionDelay: number;
    bestModelName: string;
    bestModelF1: number;
    miaPrivacyScore: number;
  };
  recommendations: string[];
}

// Sprint 2 Additions
export interface LivePacketStream {
  packetID: string;
  timestamp: string;
  protocol: 'HTTPS' | 'SFTP' | 'TCP/IP' | 'RDP' | 'SMB' | 'DICOM' | 'HL7/FHIR';
  transferMB: number;
  failedLogins: number;
  threatScore: number;
  status: 'Normal' | 'Breach';
  severity: SeverityLevel;
}

export interface DifferentialPrivacyConfig {
  epsilon: number;
  delta: number;
  noiseType: 'Laplace' | 'Gaussian';
  resultingAccuracy: number;
  resultingMiaRisk: number;
}

export interface ModelRegistryCheckpoint {
  version: string;
  checkpointHash: string;
  createdDate: string;
  modelType: MLModelType;
  accuracy: number;
  f1Score: number;
  miaRiskScore: number;
  epsilon: number;
  isActive: boolean;
  notes: string;
}

// Sprint 3 Additions
export interface ZeroTrustPolicy {
  policyID: string;
  name: string;
  protocol: string;
  maxFailedLogins: number;
  maxTransferMB: number;
  mfaRequired: boolean;
  actionIfViolated: 'BLOCK' | 'QUARANTINE' | 'FLAG';
  isEnabled: boolean;
}

export interface RemediationPlaybook {
  playbookID: string;
  name: string;
  targetVector: string;
  actionType: 'Port Isolation' | 'Token Revocation' | 'HIPAA Breach Letter';
  description: string;
  isTriggered: boolean;
  lastExecutedTimestamp?: string;
}

export interface GlobalThreatVector {
  ipAddress: string;
  country: string;
  threatGroup: string;
  ransomwareFamily: string;
  riskScore: number;
  lastActive: string;
}
