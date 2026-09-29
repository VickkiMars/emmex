from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..db import get_zero_trust_policies, save_zero_trust_policy, delete_zero_trust_policy

router = APIRouter(prefix="/api/policies", tags=["Zero Trust Policies"])

class PolicySchema(BaseModel):
    policyID: str
    name: str
    protocol: str
    maxFailedLogins: int
    maxTransferMB: float
    mfaRequired: bool = True
    actionIfViolated: str = "BLOCK"
    isEnabled: bool = True

class PolicyEvaluateRequest(BaseModel):
    protocol: str
    failedLogins: int
    transferMB: float
    hasMfa: bool = False

class PolicyEvaluateResponse(BaseModel):
    action: str  # PERMIT, FLAG, QUARANTINE, BLOCK
    violatedPolicies: List[str]
    reason: str

@router.get("", response_model=List[PolicySchema])
def list_policies():
    return get_zero_trust_policies()

@router.post("", response_model=PolicySchema)
def create_or_update_policy(policy: PolicySchema):
    saved = save_zero_trust_policy(policy.dict())
    return PolicySchema(**saved)

@router.delete("/{policy_id}")
def remove_policy(policy_id: str):
    success = delete_zero_trust_policy(policy_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' not found.")
    return {"status": "success", "message": f"Policy '{policy_id}' deleted."}

@router.post("/evaluate", response_model=PolicyEvaluateResponse)
def evaluate_telemetry(req: PolicyEvaluateRequest):
    active_policies = [p for p in get_zero_trust_policies() if p["isEnabled"]]
    violated = []
    highest_action = "PERMIT"

    # Action severity priority
    action_priority = {"BLOCK": 4, "QUARANTINE": 3, "FLAG": 2, "PERMIT": 1}

    for p in active_policies:
        is_protocol_match = (
            p["protocol"].upper() in req.protocol.upper()
            or req.protocol.upper() in p["protocol"].upper()
            or "ALL" in p["protocol"].upper()
        )
        if not is_protocol_match:
            continue

        failed_login_violation = req.failedLogins > p["maxFailedLogins"]
        transfer_violation = req.transferMB > p["maxTransferMB"]
        mfa_violation = p["mfaRequired"] and not req.hasMfa

        if failed_login_violation or transfer_violation or mfa_violation:
            violated.append(p["name"])
            act = p["actionIfViolated"].upper()
            if action_priority.get(act, 1) > action_priority.get(highest_action, 1):
                highest_action = act

    reason = f"Evaluated against {len(active_policies)} active Zero Trust policies."
    if violated:
        reason = f"Violations triggered: {', '.join(violated)}"

    return PolicyEvaluateResponse(
        action=highest_action,
        violatedPolicies=violated,
        reason=reason
    )
