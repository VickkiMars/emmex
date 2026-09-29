from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from ..db import get_threat_intel_vectors, get_db_connection

router = APIRouter(prefix="/api/threat-intel", tags=["Threat Intelligence"])

class ThreatVectorSchema(BaseModel):
    ipAddress: str
    country: str
    threatGroup: str
    ransomwareFamily: str
    riskScore: int
    lastActive: str

@router.get("", response_model=List[ThreatVectorSchema])
def list_threat_intel():
    return get_threat_intel_vectors()

@router.post("", response_model=ThreatVectorSchema)
def add_threat_vector(item: ThreatVectorSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO threat_intel_vectors (
        ip_address, country, threat_group, ransomware_family, risk_score, last_active
    ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        item.ipAddress,
        item.country,
        item.threatGroup,
        item.ransomwareFamily,
        item.riskScore,
        item.lastActive
    ))
    conn.commit()
    conn.close()
    return item
