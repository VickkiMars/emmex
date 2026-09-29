import uvicorn
from app.config import SERVER_HOST, SERVER_PORT, DEBUG

if __name__ == "__main__":
    print(f"🚀 Starting Emmanuel ML Backend on http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"📖 Swagger OpenAPI documentation available at http://localhost:{SERVER_PORT}/docs")
    uvicorn.run("app.main:app", host=SERVER_HOST, port=SERVER_PORT, reload=DEBUG)
