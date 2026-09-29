from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from ..models.schemas import (
    FeatureSelectionResponse,
    TrainingRequest,
    TrainingResponse,
    MLModelSummary
)
from ..services.ml_service import ml_service
from ..services.data_service import data_service
from ..services.onnx_exporter import onnx_exporter

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.get("/features", response_model=FeatureSelectionResponse)
def get_feature_importances():
    return ml_service.get_feature_importances()

@router.post("/train", response_model=TrainingResponse)
def train_models(req: TrainingRequest):
    summaries = ml_service.train_all_models(
        test_size=req.testSize,
        random_state=req.randomState,
        use_dp=req.useDifferentialPrivacy,
        epsilon_dp=req.epsilonDP
    )
    
    best_model = max(summaries, key=lambda s: s.metrics.f1Score)
    records = data_service.get_raw_records()

    return TrainingResponse(
        models=summaries,
        bestModelID=best_model.modelID,
        bestModelName=best_model.modelName,
        datasetSize=len(records),
        featuresUsed=[f.featureName for f in ml_service.last_feature_importances]
    )

@router.get("/models", response_model=List[MLModelSummary])
def list_models():
    if not ml_service.model_summaries:
        ml_service.train_all_models()
    return list(ml_service.model_summaries.values())

@router.post("/models/{model_id}/activate")
def activate_model(model_id: str):
    success = ml_service.set_active_model(model_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Model ID '{model_id}' not found.")
    return {"status": "success", "activeModelID": model_id}

@router.get("/export/onnx/{model_id}")
def export_model_onnx(model_id: str):
    try:
        clean_name = f"model_{model_id.lower().replace('-', '_')}.onnx"
        result = onnx_exporter.export_model_to_onnx(model_id, clean_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download/onnx/{model_id}")
def download_onnx_file(model_id: str):
    clean_name = f"model_{model_id.lower().replace('-', '_')}.onnx"
    file_path = Path("backend/saved_models") / clean_name
    if not file_path.exists():
        # Try generating
        try:
            onnx_exporter.export_model_to_onnx(model_id, clean_name)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"ONNX model generation failed: {e}")
    return FileResponse(
        path=str(file_path),
        filename=clean_name,
        media_type="application/octet-stream"
    )

@router.get("/registry")
def list_registry_checkpoints():
    from ..db import get_model_registry_checkpoints
    return get_model_registry_checkpoints()

@router.post("/registry/{version}/activate")
def activate_registry_checkpoint(version: str):
    from ..db import set_active_model_checkpoint
    success = set_active_model_checkpoint(version)
    if not success:
        raise HTTPException(status_code=404, detail=f"Checkpoint version '{version}' not found.")
    return {"status": "success", "message": f"Checkpoint '{version}' activated in database."}

