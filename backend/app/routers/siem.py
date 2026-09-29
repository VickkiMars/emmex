import hashlib
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from ..db import get_siem_logs, append_siem_log, get_db_connection

router = APIRouter(prefix="/api/siem", tags=["SIEM & Syslog"])

class SiemLogSchema(BaseModel):
    id: str
    timestamp: str
    facility: str
    severity: str
    cefHeader: str
    extension: str
    sha256Hash: str
    prevHash: str

class SiemLogCreate(BaseModel):
    facility: str = "SECURITY"
    severity: str = "CRITICAL"
    cefHeader: str
    extension: str

class VerificationResult(BaseModel):
    isValid: bool = True
    totalEntriesChecked: int
    firstHash: str
    lastHash: str
    brokenAtId: Optional[str] = None
    details: str

@router.get("/logs", response_model=List[SiemLogSchema])
def list_siem_logs(limit: int = Query(default=50, ge=1, le=500)):
    return get_siem_logs(limit=limit)

@router.post("/logs", response_model=SiemLogSchema)
def create_siem_log(entry: SiemLogCreate):
    log = append_siem_log(entry.dict())
    return SiemLogSchema(**log)

@router.get("/verify")
def verify_hash_chain():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, timestamp, facility, severity, cef_header, extension, sha256_hash, prev_hash FROM siem_audit_logs ORDER BY rowid ASC")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {"isValid": True, "totalEntriesChecked": 0, "details": "No audit records in ledger."}

    expected_prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    for idx, r in enumerate(rows):
        # 1. Check prev_hash link
        if idx > 0 and r["prev_hash"] != expected_prev_hash:
            return {
                "isValid": False,
                "totalEntriesChecked": idx,
                "brokenAtId": r["id"],
                "details": f"Broken prev_hash chain at record {r['id']}. Expected {expected_prev_hash}, found {r['prev_hash']}."
            }

        # 2. Check current sha256_hash calculation
        payload = r["cef_header"] + r["extension"]
        to_hash = f"{r['prev_hash']}{r['timestamp']}{payload}".encode("utf-8")
        computed_hash = hashlib.sha256(to_hash).hexdigest()

        if computed_hash != r["sha256_hash"]:
            return {
                "isValid": False,
                "totalEntriesChecked": idx,
                "brokenAtId": r["id"],
                "details": f"Tampered hash detected at record {r['id']}. Payload does not match SHA-256 digest."
            }

        expected_prev_hash = r["sha256_hash"]

    return {
        "isValid": True,
        "totalEntriesChecked": len(rows),
        "firstHash": rows[0]["sha256_hash"],
        "lastHash": rows[-1]["sha256_hash"],
        "details": f"All {len(rows)} cryptographically chained audit log records verified intact with SHA-256."
    }
