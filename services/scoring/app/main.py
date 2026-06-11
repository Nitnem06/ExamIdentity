# pyrefly: ignore [missing-import]
from fastapi import FastAPI # pyrefly: ignore [missing-import]
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scoring, flags, dispute, explanation
# pyrefly: ignore [missing-import]
import uvicorn

app = FastAPI(
    title="ExamIdentity Scoring Service",
    description="ML-powered behavioral scoring for exam integrity",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoring.router, prefix="/api/scoring", tags=["scoring"])
app.include_router(flags.router, prefix="/api/flags", tags=["flags"])
app.include_router(dispute.router, prefix="/api/dispute", tags=["dispute"])
app.include_router(explanation.router, prefix="/api/explanation", tags=["explanation"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "scoring"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
