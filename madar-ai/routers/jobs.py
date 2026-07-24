"""Structured job-description analysis endpoint."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.job_analyzer import JobAnalyzer
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)
_analyzer: Optional[JobAnalyzer] = None


class JobAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=20, max_length=50000)


def get_analyzer() -> JobAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = JobAnalyzer()
    return _analyzer


@router.post("/analyze")
async def analyze_job(request: JobAnalysisRequest) -> Dict[str, Any]:
    try:
        return get_analyzer().analyze(request.title, request.description)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Job analysis failed", error=str(exc))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Job analysis is temporarily unavailable") from exc

