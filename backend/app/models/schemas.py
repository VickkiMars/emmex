from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

BreachType = Literal[
    'Hacking/IT Incident',
    'Unauthorized Access/Disclosure',
    'Insider Misuse',
    'Theft',
    'Loss',
    'Improper Disposal'
]

LocationOfBreach = Literal[
    'Network Server',
    'E-mail',
    'Electronic Medical Record',
    'Desktop Computer',
    'Laptop',
    'Paper Records',
    'Other Portable Electronic Device'
]

NetworkProtocol = Literal['HTTPS', 'SFTP', 'TCP/IP', 'RDP', 'SMB', 'DICOM', 'HL7/FHIR']

SeverityLevel = Literal['High', 'Medium', 'Low']

MLModelType = Literal[
    'Random Forest',
    'Gradient Boosting',
    'Support Vector Machine',
    'K-Nearest Neighbors',
    'Decision Tree'
]

class HealthcareBreachRecord(BaseModel):
    id: str
    entityName: str
    state: str
    entityType: str
    individualsAffected: int
    breachDate: str
    breachType: str
    location: str
    detectionDelayDays: int
    networkProtocol: str
    packetLengthAvg: float
    failedLoginAttempts: int
    unusualDataTransferMB: float
    isBreach: int = Field(default=0, description="1 = Breach, 0 = Normal")
    severityLevel: Optional[SeverityLevel] = None

class PreprocessingRequest(BaseModel):
    missingValueStrategy: Literal['mean', 'median', 'mode', 'drop'] = 'median'
    normalizationStrategy: Literal['minmax', 'standard', 'none'] = 'minmax'
    encodeCategorical: bool = True
    syntheticAugmentationCount: int = 0

class PreprocessingResponse(BaseModel):
    totalRecords: int
    missingValuesImputed: int
    duplicatesRemoved: int
    featuresEncoded: List[str]
    transformationLogs: List[str]
    sampleCleanedRecords: List[HealthcareBreachRecord]

class FeatureImportanceItem(BaseModel):
    featureName: str
    displayName: str
    importanceScore: float
    correlationWithTarget: float
    isSelected: bool = True

class FeatureSelectionResponse(BaseModel):
    selectedFeatures: List[str]
    featureRankings: List[FeatureImportanceItem]
    topPredictor: str

class ConfusionMatrix(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int

class EvaluationMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    confusionMatrix: ConfusionMatrix
    rocAuc: float
    trainingTimeMs: float

class MLModelSummary(BaseModel):
    modelID: str
    modelName: str
    modelType: str
    trainingAccuracy: float
    testingAccuracy: float
    metrics: EvaluationMetrics
    hyperparameters: Dict[str, Any]
    isTrained: bool
    isPersisted: bool = True
    activeStatus: bool = False
    epsilonDP: Optional[float] = None

class TrainingRequest(BaseModel):
    modelTypes: Optional[List[MLModelType]] = None
    testSize: float = 0.20
    randomState: int = 42
    useDifferentialPrivacy: bool = False
    epsilonDP: float = 1.0

class TrainingResponse(BaseModel):
    models: List[MLModelSummary]
    bestModelID: str
    bestModelName: str
    datasetSize: int
    featuresUsed: List[str]

class PredictionRequest(BaseModel):
    entityName: Optional[str] = "Clinical Workstation Node"
    state: Optional[str] = "CA"
    entityType: Optional[str] = "Healthcare Provider"
    individualsAffected: int = 0
    breachType: Optional[str] = "Hacking/IT Incident"
    location: Optional[str] = "Network Server"
    networkProtocol: str = "HTTPS"
    packetLengthAvg: float = 500.0
    failedLoginAttempts: int = 0
    unusualDataTransferMB: float = 0.0
    modelID: Optional[str] = None

class BreachPredictionResponse(BaseModel):
    predictionID: str
    predictedClass: Literal['Normal Activity', 'Potential Breach']
    isBreach: int
    probability: float
    confidenceInterval: List[float]
    severityLevel: SeverityLevel
    inferenceTimeMs: float
    triggeredRules: List[str]
    contributingFactors: Dict[str, float]
    modelUsed: str

class BatchPredictionItem(BaseModel):
    recordID: str
    isBreach: int
    probability: float
    severityLevel: SeverityLevel
    latencyMs: float

class BatchPredictionResponse(BaseModel):
    totalProcessed: int
    breachesDetected: int
    avgLatencyMs: float
    throughputPerSec: float
    predictions: List[BatchPredictionItem]

class MIAPrivacyAuditRequest(BaseModel):
    modelID: Optional[str] = None
    epsilon: float = 1.0
    shadowModelsCount: int = 3

class MIAPrivacyAuditResponse(BaseModel):
    auditID: str
    modelName: str
    epsilon: float
    vulnerabilityScore: float
    attackAccuracy: float
    privacyRiskRating: Literal['High Risk', 'Moderate Risk', 'Low Risk (Privacy Preserved)']
    recommendations: List[str]
    auditTimestamp: str

class FhirResourcePayload(BaseModel):
    resourceType: str
    id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    text: Optional[Dict[str, Any]] = None
    patientId: Optional[str] = None
    accessProtocol: Optional[str] = "HL7/FHIR"
    clientIP: Optional[str] = "192.168.1.105"
    payloadSizeKB: Optional[float] = 12.5
    rawJson: Optional[Dict[str, Any]] = None

class FhirThreatAnalysisResponse(BaseModel):
    analysisID: str
    resourceType: str
    riskScore: float
    isAnomalous: bool
    potentialThreatVector: str
    mitigationAction: str
    fhirComplianceStatus: str
    extractedFeatures: Dict[str, Any]

class SystemStatusResponse(BaseModel):
    status: str
    version: str
    engine: str
    pythonVersion: str
    modelsLoaded: int
    totalBreachRecords: int
    serverTime: str
    activeModel: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Literal['Security Officer', 'Compliance Auditor', 'Super Admin'] = 'Security Officer'

class UserResponse(BaseModel):
    userID: str
    userName: str
    email: str
    role: str
    sessionToken: str
    isAuthenticated: bool = True

