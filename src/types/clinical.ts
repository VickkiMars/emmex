export type ClinicalRole = 'PCP' | 'SPECIALIST';

export interface ClinicalUser {
  id: string;
  name: string;
  role: ClinicalRole;
  title: string;
  specialty: string;
  avatar: string;
  facility: string;
}

export interface DifferentialDiagnosis {
  id: string;
  conditionName: string;
  icdCode: string;
  rank: number;
  confidenceScore: number; // 0 to 100
  proposedBy: string; // User Name or ID
  proposedRole: ClinicalRole;
  supportingEvidence: string[];
  refutingFactors: string[];
  status: 'SUSPECTED' | 'CONFIRMED' | 'RULED_OUT' | 'PENDING_TESTS';
}

export interface StructuredHypothesis {
  id: string;
  caseId: string;
  specialistId: string;
  specialistName: string;
  specialty: string;
  primaryHypothesis: string;
  icd10Code: string;
  probabilityScore: number; // 0 to 100
  clinicalRationale: string;
  recommendedDiagnostics: string[];
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export interface DiscussionNote {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorRole: ClinicalRole;
  authorTitle: string;
  content: string;
  category: 'GENERAL' | 'OBSERVATION' | 'LAB_RESULT' | 'RECOMMENDATION' | 'URGENT_FLAG';
  timestamp: string;
  attachments?: { name: string; type: string; url: string }[];
}

export interface AdvisorySignOff {
  recordedAt: string;
  primaryPhysicianId: string;
  primaryPhysicianName: string;
  finalDiagnosis: string;
  treatmentPlan: string;
  acknowledgedSpecialistIds: string[];
  specialistFeedbackSummary: string;
  digitalSignatureHash: string;
  status: 'PENDING_ACK' | 'RECORDED_FINAL';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: ClinicalRole;
  useCaseId: 'UC1' | 'UC2' | 'UC3' | 'UC4' | 'UC5' | 'UC6' | 'UC7' | 'UC8';
  useCaseName: string;
  actionDetails: string;
  resourceId?: string;
  ipAddress: string;
  hash: string;
}

export interface ClinicalCase {
  id: string;
  patientId: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientSymptomsSummary: string;
  primaryPhysicianId: string;
  primaryPhysicianName: string;
  assignedSpecialists: { id: string; name: string; specialty: string }[];
  status: 'ACTIVE' | 'PENDING_SPECIALIST_HYPOTHESIS' | 'UNDER_PCP_REVIEW' | 'FINALIZED' | 'ARCHIVED';
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  createdAt: string;
  updatedAt: string;
  vitals: {
    bp: string;
    hr: number;
    temp: string;
    spo2: number;
  };
  clinicalHistory: string;
  differentials: DifferentialDiagnosis[];
  hypotheses: StructuredHypothesis[];
  notes: DiscussionNote[];
  finalSignOff?: AdvisorySignOff;
}
