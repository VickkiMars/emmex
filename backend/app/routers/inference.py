from typing import List
from fastapi import APIRouter
from ..models.schemas import (
    PredictionRequest,
    BreachPredictionResponse,
    BatchPredictionResponse
)
from ..services.inference_service import inference_service

router = APIRouter(prefix="/api/inference", tags=["Inference"])

@router.post("/predict", response_model=BreachPredictionResponse)
def predict_single_record(req: PredictionRequest):
    return inference_service.predict_single(req)

@router.post("/batch", response_model=BatchPredictionResponse)
def predict_batch_records(records: List[PredictionRequest]):
    return inference_service.predict_batch(records)
