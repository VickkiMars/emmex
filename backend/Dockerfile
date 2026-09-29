# =============================================================================
# Emmanuel Healthcare Data Breach Prevention - ML & FastAPI Backend Dockerfile
# Multi-arch compatible, hardened non-root container with health probes
# =============================================================================

FROM python:3.12-slim

# Set Python operational environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    EMMANUEL_BACKEND_HOST=0.0.0.0 \
    EMMANUEL_BACKEND_PORT=8005

WORKDIR /app

# Install system dependencies (curl for healthchecks, build-essential for C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user for Zero Trust / HIPAA compliance
RUN groupadd -g 1000 emmanuel && \
    useradd -u 1000 -g emmanuel -m -s /bin/bash emmanuel

# Copy application source tree
COPY . .

# Ensure data and models persistence directories have appropriate permissions
RUN mkdir -p /app/data /app/saved_models && \
    chown -R emmanuel:emmanuel /app

# Switch to unprivileged runtime user
USER emmanuel

# Expose FastAPI microservice port
EXPOSE 8005

# Healthcheck probe against system health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8005/api/system/health || exit 1

# Launch production Uvicorn ASGI server
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
