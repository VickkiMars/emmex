from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS, DEBUG
from .routers import system, data, ml, inference, privacy, fhir, policies, siem, threats, auth
from .services.ml_service import ml_service
from .db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database is initialized & seeded, and scikit-learn models are fitted
    print("[Emmanuel Backend] Starting up... Initializing SQLite Database (emmanuel.db).")
    init_db()
    print("[Emmanuel Backend] Initializing Scikit-Learn ML models.")
    ml_service.train_all_models()
    print(f"[Emmanuel Backend] Models initialized: {list(ml_service.model_summaries.keys())}")
    print(f"[Emmanuel Backend] Active deployed model: {ml_service.active_model_id}")
    yield
    print("[Emmanuel Backend] Shutting down.")

app = FastAPI(
    title="Emmanuel Healthcare Breach Prevention ML Backend",
    description="Production Scikit-Learn Python Service for Real-Time Threat Classification, Differential Privacy & FHIR Ingestion",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(system.router)
app.include_router(data.router)
app.include_router(ml.router)
app.include_router(inference.router)
app.include_router(privacy.router)
app.include_router(fhir.router)
app.include_router(policies.router)
app.include_router(siem.router)
app.include_router(threats.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to the Emmanuel Healthcare Data Breach Prevention ML Engine",
        "documentation": "/docs",
        "statusEndpoint": "/api/system/status"
    }

@app.websocket("/ws/threats")
async def websocket_threat_stream(websocket: WebSocket):
    await websocket.accept()
    import asyncio, json, random
    from .services.data_service import data_service
    records = data_service.get_raw_records()
    try:
        while True:
            await asyncio.sleep(3.0)
            if records:
                sample = dict(random.choice(records))
                sample["id"] = f"STRM-{random.randint(10000, 99999)}"
                sample["isBreach"] = 1
                sample["severityLevel"] = random.choice(["High", "Medium", "Low"])
                sample["unusualDataTransferMB"] = round(sample.get("unusualDataTransferMB", 20.0) + random.uniform(10.0, 90.0), 1)
                sample["failedLoginAttempts"] = random.randint(0, 8)
                await websocket.send_text(json.dumps(sample))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

