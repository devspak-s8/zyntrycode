"""FastAPI application assembly for Zyntry Code."""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from metrics import metrics
from routers import (artifacts, completion, executions, health, ingest,
                     metrics as metrics_router, models, semantic, stream, tasks,
                     verification, webhooks, workers, workspaces)
from security import security_middleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zyntry-code")


def _allowed_origins() -> list[str]:
    import os
    raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip() and o.strip() != "*"]


app = FastAPI(
    title="Zyntry Code",
    description="Adaptive AI Engineering Agent — backend orchestration service",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Workspace-Token", "X-Runner-Token", "X-Runner-Id", "X-Webhook-Signature", "X-Webhook-Timestamp"],
    expose_headers=[],
)


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    response = await security_middleware(request, call_next)
    metrics.incr("http_requests_total")
    metrics.incr(f"http_requests_{request.method.lower()}")
    return response


app.include_router(health.router)
app.include_router(metrics_router.router)
app.include_router(models.router)
app.include_router(completion.router)
app.include_router(tasks.router)
app.include_router(stream.router)
app.include_router(ingest.router)
app.include_router(executions.router)
app.include_router(verification.router)
app.include_router(artifacts.router)
app.include_router(workspaces.router)
app.include_router(workers.router)
app.include_router(semantic.router)
app.include_router(webhooks.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    metrics.incr("http_errors_total")
    return JSONResponse(status_code=500, content={"error": "internal_error", "detail": "unexpected server error"})
