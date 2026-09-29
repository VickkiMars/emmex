"""
Vercel FastAPI entrypoint for Emmex Healthcare Security ML Backend.
Exposes the FastAPI `app` instance at the root of the backend service.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=True)
