import platform
import sys
import datetime
from fastapi import APIRouter
from ..models.schemas import SystemStatusResponse
from ..services.ml_service import ml_service
from ..services.data_service import data_service

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Emmanuel ML Backend", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status():
    if not ml_service.trained_models:
        ml_service.train_all_models()
    model_count = len(ml_service.trained_models)
    records = data_service.get_raw_records()
    
    return SystemStatusResponse(
        status="ONLINE",
        version="1.0.0-PROD",
        engine="Scikit-Learn Python Native Inference Engine",
        pythonVersion=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} ({platform.system()})",
        modelsLoaded=model_count,
        totalBreachRecords=len(records),
        serverTime=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        activeModel=ml_service.active_model_id
    )
