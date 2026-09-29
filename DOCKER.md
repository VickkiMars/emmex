# Emmanuel Dockerization & Container Architecture Guide

Comprehensive documentation for containerizing, deploying, and managing the **Emmanuel Healthcare Cybersecurity Dashboard & Machine Learning Backend**.

---

## 1. Architecture Overview

The containerized stack consists of two isolated, interoperable microservices linked via an internal Docker bridge network (`emmanuel-network`):

```
                       +-----------------------------------+
                       |        Client Web Browser         |
                       +-----------------+-----------------+
                                         |
                                HTTP Port 5174 / 80
                                         v
               +---------------------------------------------------+
               |  emmanuel-frontend (Container: Nginx Alpine)         |
               |                                                   |
               |  - Serves static React 18 SPA bundle              |
               |  - Reverse Proxies /api/* -> backend:8005/api/*   |
               |  - Proxies WebSockets /ws/* -> backend:8005/ws/*  |
               |  - Enforces Zero Trust Security Headers           |
               +-------------------------+-------------------------+
                                         |
                            Internal Network: emmanuel-network
                                         |
                                         v
               +---------------------------------------------------+
               |  emmanuel-backend (Container: Python 3.12 Slim)      |
               |                                                   |
               |  - FastAPI ASGI Service (Uvicorn)                 |
               |  - Scikit-Learn Classifiers (RF, SVM, LR, etc.)   |
               |  - ONNX Inference Engine Runtime                  |
               |  - SQLite Database (/app/data/emmanuel.db)           |
               |  - Runs as unprivileged 'emmanuel' non-root user     |
               +-------------------------+-------------------------+
                                         |
                      Persistent Host Volume Mounts:
                      - ./backend/data        -> /app/data
                      - ./backend/saved_models -> /app/saved_models
```

---

## 2. Docker Files Matrix

| File | Purpose |
| :--- | :--- |
| [`Dockerfile`](file:///home/kami/Desktop/codebase/emmanuel/Dockerfile) | Multi-stage build for the React frontend (Node 20 builder -> Nginx Alpine runner with curl healthcheck). |
| [`nginx.conf`](file:///home/kami/Desktop/codebase/emmanuel/nginx.conf) | Nginx reverse proxy configuration supporting SPA routing, `/api/` proxying, `/ws/` WebSocket proxying, security headers, and asset caching. |
| [`.dockerignore`](file:///home/kami/Desktop/codebase/emmanuel/.dockerignore) | Excludes node_modules, build outputs, and documentation from the frontend Docker context. |
| [`backend/Dockerfile`](file:///home/kami/Desktop/codebase/emmanuel/backend/Dockerfile) | Hardened Python 3.12 container running as non-root user `emmanuel` with active healthcheck probes on `/api/system/health`. |
| [`backend/.dockerignore`](file:///home/kami/Desktop/codebase/emmanuel/backend/.dockerignore) | Excludes python caches, test runs, virtual environments, and local sqlite databases. |
| [`backend/requirements.txt`](file:///home/kami/Desktop/codebase/emmanuel/backend/requirements.txt) | Complete pinned dependencies including FastAPI, Uvicorn, Scikit-Learn, ONNX, and WebSockets. |
| [`docker-compose.yml`](file:///home/kami/Desktop/codebase/emmanuel/docker-compose.yml) | Production multi-container composition with volume persistence, health checks, and log rotations. |
| [`docker-compose.dev.yml`](file:///home/kami/Desktop/codebase/emmanuel/docker-compose.dev.yml) | Development composition with live hot-reloading (Vite HMR & Uvicorn auto-reload). |
| [`.env.example`](file:///home/kami/Desktop/codebase/emmanuel/.env.example) | Environment variable template for configuring ports, hostnames, and security parameters. |

---

## 3. Quickstart: Production Deployment

### Step 1: Clone and Configure Environment
```bash
cp .env.example .env
```

### Step 2: Build and Launch Containers
```bash
docker-compose up -d --build
```
*(Or `docker compose up -d --build` on newer Docker CLI installations)*

### Step 3: Verify Status and Healthchecks
```bash
docker-compose ps
```

Expected output:
```text
    Name                  Command                  State                 Ports
-----------------------------------------------------------------------------------------
emmanuel-backend    python -m uvicorn app.ma ...   Up (healthy)   0.0.0.0:8005->8005/tcp
emmanuel-frontend   nginx -g daemon off;           Up (healthy)   0.0.0.0:5174->80/tcp
```

### Step 4: Access the System
- **Web Dashboard**: [http://localhost:5174](http://localhost:5174)
- **FastAPI OpenAPI Swagger**: [http://localhost:8005/docs](http://localhost:8005/docs)
- **Backend Health Check**: [http://localhost:8005/api/system/health](http://localhost:8005/api/system/health)
- **Threat Anomaly WebSocket**: `ws://localhost:8005/ws/threats`

---

## 4. Development Workflow with Live Hot-Reload

When developing new features, use the dedicated development compose file:

```bash
docker-compose -f docker-compose.dev.yml up
```

- **Frontend (Vite HMR)**: Automatically recompiles on edits to `src/` at [http://localhost:5173](http://localhost:5173).
- **Backend (FastAPI)**: Uvicorn automatically reloads on edits to `backend/app/` at [http://localhost:8005](http://localhost:8005).

---

## 5. Security & Zero Trust Architecture

1. **Non-Root Execution**:
   - `emmanuel-backend` creates and runs under UID 1000 (`emmanuel`), preventing host privilege escalation.
2. **Hardened Nginx Reverse Proxy**:
   - Security headers enforced on all responses: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
3. **Automated Healthchecks**:
   - Both services define automated healthcheck probes. The frontend container automatically waits until the backend microservice passes its initial health check before starting.
4. **Data Isolation & Persistence**:
   - Database records and trained scikit-learn/ONNX models reside in volume mounts (`./backend/data` and `./backend/saved_models`), ensuring data survives container restarts and upgrades.
