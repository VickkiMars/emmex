import secrets
from fastapi import APIRouter, HTTPException, status
from ..models.schemas import LoginRequest, RegisterRequest, UserResponse
from ..db import get_user_by_email, create_user_in_db, hash_user_password

router = APIRouter(prefix="/api/auth", tags=["Authentication & Zero Trust RBAC"])

def _generate_token() -> str:
    return "zt_" + secrets.token_hex(16)

@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest):
    user = get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No security account registered with this email address."
        )

    provided_hash = hash_user_password(payload.password)
    if user["passwordHash"] != provided_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Authentication failed."
        )

    return UserResponse(
        userID=user["userID"],
        userName=user["userName"],
        email=user["email"],
        role=user["role"],
        sessionToken=_generate_token(),
        isAuthenticated=True
    )

@router.post("/register", response_model=UserResponse)
def register(payload: RegisterRequest):
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    created = create_user_in_db(
        user_name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead."
        )

    return UserResponse(
        userID=created["userID"],
        userName=created["userName"],
        email=created["email"],
        role=created["role"],
        sessionToken=_generate_token(),
        isAuthenticated=True
    )

@router.get("/demo-accounts")
def get_demo_accounts():
    return [
        {
            "role": "Security Officer",
            "name": "Dr. Emmanuel Security Officer",
            "email": "officer@emmanuel.health",
            "password": "Security2026!",
            "description": "Threat hunting, telemetry stream & automated playbooks"
        },
        {
            "role": "Compliance Auditor",
            "name": "Elena Vance (Auditor)",
            "email": "auditor@emmanuel.health",
            "password": "Auditor2026!",
            "description": "Regulatory audit reports, MIA vulnerability metrics"
        },
        {
            "role": "Super Admin",
            "name": "Chief Security Officer",
            "email": "admin@emmanuel.health",
            "password": "AdminMaster2026!",
            "description": "Zero Trust policy governance & full cluster access"
        }
    ]
