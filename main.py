import uuid
from fastapi import FastAPI, Request
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import logging

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("j.afrix-ai")

app = FastAPI(
    title="J.AFRIX AI",
    version="1.0.0",
    description="J.AFRIX AI - Advanced, production-ready test-based AI API by Jaden Afrix."
)

# CORS for deployment compatibility (Vercel/Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for security in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load HuggingFace pipelines (for generation and sentiment)
try:
    ai_pipe = pipeline("text-generation", model="gpt2")
    sentiment_pipe = pipeline("sentiment-analysis")
except Exception as e:
    logger.error(f"Error loading AI models: {e}")
    ai_pipe = None
    sentiment_pipe = None

class AITestRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2048, description="User's question or test prompt.")

class AITestResponse(BaseModel):
    id: str
    status: str
    prompt: str
    ai_answer: str
    ai_sentiment: dict
    confidence: float
    author: str = "Jaden Afrix"
    api: str = "J.AFRIX AI"
    version: str = "1.0.0"
    timestamp: str

@app.post("/api/ai-test", response_model=AITestResponse)
async def ai_test_endpoint(body: AITestRequest, request: Request):
    req_id = str(uuid.uuid4())
    logger.info(f"Received request {req_id}: {body.prompt}")

    # 1. Generate AI reply
    if not ai_pipe or not sentiment_pipe:
        return JSONResponse(
            status_code=500,
            content={
                "id": req_id,
                "status": "error",
                "prompt": body.prompt,
                "ai_answer": "",
                "ai_sentiment": {},
                "confidence": 0.00,
                "author": "Jaden Afrix",
                "api": "J.AFRIX AI",
                "version": "1.0.0",
                "timestamp": request.headers.get("date", ""),
                "error": "AI models failed to load."
            }
        )
    try:
        ai_result = ai_pipe(body.prompt, max_length=100, num_return_sequences=1)
        ai_answer = ai_result[0]['generated_text'].strip()
        sentiment_result = sentiment_pipe(ai_answer[:512])[0]
        confidence = round(sentiment_result.get("score", 0.9), 3)
        status = "success"
    except Exception as exc:
        logger.error(f"AI processing error for {req_id}: {exc}")
        ai_answer = ""
        sentiment_result = {}
        confidence = 0.0
        status = "error"

    response = {
        "id": req_id,
        "status": status,
        "prompt": body.prompt,
        "ai_answer": ai_answer,
        "ai_sentiment": sentiment_result,
        "confidence": confidence,
        "author": "Jaden Afrix",
        "api": "J.AFRIX AI",
        "version": "1.0.0",
        "timestamp": request.headers.get("date", ""),
    }
    return response

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "api": "J.AFRIX AI",
        "version": "1.0.0",
        "author": "Jaden Afrix"
    }