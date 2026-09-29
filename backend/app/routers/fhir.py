from fastapi import APIRouter
from ..models.schemas import FhirResourcePayload, FhirThreatAnalysisResponse
from ..services.fhir_ingestion import fhir_service

router = APIRouter(prefix="/api/fhir", tags=["FHIR/HL7"])

@router.post("/analyze", response_model=FhirThreatAnalysisResponse)
def analyze_fhir_resource(payload: FhirResourcePayload):
    return fhir_service.analyze_fhir_payload(payload)
