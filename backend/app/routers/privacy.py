from fastapi import APIRouter
from ..models.schemas import MIAPrivacyAuditRequest, MIAPrivacyAuditResponse
from ..services.privacy_service import privacy_service

router = APIRouter(prefix="/api/privacy", tags=["Privacy"])

@router.post("/mia-audit", response_model=MIAPrivacyAuditResponse)
def run_mia_audit(req: MIAPrivacyAuditRequest):
    return privacy_service.perform_mia_audit(req)
