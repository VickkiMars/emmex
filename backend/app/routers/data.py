from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from ..models.schemas import HealthcareBreachRecord, PreprocessingRequest, PreprocessingResponse
from ..services.data_service import data_service
from ..db import get_breach_records, insert_breach_record, get_db_connection

router = APIRouter(prefix="/api/data", tags=["Data"])

class SyntheticGenerateRequest(BaseModel):
    count: int = 50

class DatasetCountResponse(BaseModel):
    totalRecords: int
    totalBreaches: int
    highSeverityCount: int
    databaseEngine: str = "SQLite 3 (emmanuel.db)"

@router.get("/dataset", response_model=List[HealthcareBreachRecord])
def get_dataset(
    limit: Optional[int] = Query(default=100, ge=1, le=2000),
    offset: Optional[int] = Query(default=0, ge=0),
    search: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None)
):
    records = get_breach_records(limit=limit, offset=offset, search=search, severity=severity)
    if not records:
        # Fallback to in-memory if DB has not yet yielded records
        raw = data_service.get_raw_records()
        records = raw[offset:offset + limit] if limit else raw
    return [HealthcareBreachRecord(**r) for r in records]

@router.get("/count", response_model=DatasetCountResponse)
def get_dataset_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM breach_records")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM breach_records WHERE is_breach = 1")
    breaches = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM breach_records WHERE severity_level = 'High'")
    high_sev = cursor.fetchone()[0]
    conn.close()

    return DatasetCountResponse(
        totalRecords=total,
        totalBreaches=breaches,
        highSeverityCount=high_sev
    )

@router.post("/synthetic", response_model=List[HealthcareBreachRecord])
def generate_and_save_synthetic(req: SyntheticGenerateRequest):
    new_records = data_service.generate_augmented_records(count=req.count)
    for r in new_records:
        insert_breach_record(r)
    return [HealthcareBreachRecord(**r) for r in new_records]

@router.post("/preprocess", response_model=PreprocessingResponse)
def preprocess_data(req: PreprocessingRequest):
    _, response = data_service.preprocess_dataset(
        missing_strategy=req.missingValueStrategy,
        normalization_strategy=req.normalizationStrategy,
        encode_categorical=req.encodeCategorical,
        augmentation_count=req.syntheticAugmentationCount
    )
    return response
