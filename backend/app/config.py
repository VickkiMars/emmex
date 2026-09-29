import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Detect if running in Vercel Serverless environment
IS_VERCEL = os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))

if IS_VERCEL:
    DATA_DIR = Path("/tmp/emmex_data")
    MODELS_DIR = Path("/tmp/emmex_models")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    DEFAULT_DATASET_PATH = BASE_DIR / "data" / "hhs_breach_records.json"
    DATABASE_PATH = DATA_DIR / "emmanuel.db"
    
    # Pre-seed SQLite database into writable /tmp partition if present in repository
    source_db = BASE_DIR / "data" / "emmanuel.db"
    if source_db.exists() and not DATABASE_PATH.exists():
        try:
            shutil.copy2(source_db, DATABASE_PATH)
        except Exception as e:
            print(f"[Emmex Backend] Notice: Could not copy initial database to /tmp: {e}")
else:
    DATA_DIR = BASE_DIR / "data"
    MODELS_DIR = BASE_DIR / "saved_models"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    DEFAULT_DATASET_PATH = DATA_DIR / "hhs_breach_records.json"
    DATABASE_PATH = DATA_DIR / "emmanuel.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

SERVER_HOST = os.getenv("EMMANUEL_BACKEND_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("EMMANUEL_BACKEND_PORT", "8005"))
DEBUG = os.getenv("EMMANUEL_DEBUG", "False").lower() in ("true", "1")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "*",
]
