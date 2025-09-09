"""
AI Test Endpoint – CYBIX XR1 Edition
Author: Jaden Afrix
Single-file, zero-warnings, production-grade.
"""
import os, uuid, time, json
from typing import Dict, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from transformers import pipeline  # type: ignore

# ------------------------------------------------------------------
# Lifespan: load model once at start-up, share across requests
# ------------------------------------------------------------------
MODEL_NAME: str = "distilbert-base-uncased-finetuned-sst-2-english"  # 261 MB
pipe = None  # type: ignore


@asynccontextmanager
async def lifespan(_: FastAPI):
    global pipe
    pipe = pipeline("text-classification", model=MODEL_NAME)
    yield
    del pipe


# ------------------------------------------------------------------
# FastAPI app
# ------------------------------------------------------------------
app = FastAPI(
    title="AI-Test API",
    version="1.0.0",
    description="CYBIX XR1 – powerful, unlimited, production-ready AI endpoint.",
    lifespan=lifespan,
)


# ------------------------------------------------------------------
# Request/Response contracts
# ------------------------------------------------------------------
class PromptIn(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5_000)


class InsightOut(BaseModel):
    id: str
    prompt: str
    label: str
    confidence: float
    timestamp: float
    model: str


# ------------------------------------------------------------------
# Utils
# ------------------------------------------------------------------
def analyse(text: str) -> Dict[str, Any]:
    """Run inference and return serialisable dict."""
    result = pipe(text)[0]  # type: ignore
    return {
        "label": result["label"],
        "confidence": round(result["score"], 4),
    }


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "AI-Test API is live. POST → /api/ai-test"}


@app.post("/api/ai-test", response_model=InsightOut)
def ai_test(body: PromptIn):
    start = time.time()
    insight = analyse(body.prompt)
    return InsightOut(
        id=str(uuid.uuid4()),
        prompt=body.prompt,
        label=insight["label"],
        confidence=insight["confidence"],
        timestamp=round(time.time(), 3),
        model=MODEL_NAME,
    )


# ------------------------------------------------------------------
# Error handling – graceful, no stack-traces in prod
# ------------------------------------------------------------------
@app.exception_handler(Exception)
def universal_exception_handler(_, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)},
    )
