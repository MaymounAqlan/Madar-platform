"""
MADAR AI Engine - FastAPI Application Entry Point

This is the main entry point for the MADAR AI Engine, a microservice
that provides CV parsing, skill extraction, job-student matching,
and recommendation generation powered by NLP and vector similarity search.
"""

import time
import importlib.util
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import curriculum, cv, jobs, market, matching, recommendations, skills
from utils.logger import get_logger
from services.cache_service import close_cache_service

logger = get_logger(__name__)
request_windows = defaultdict(deque)

def cv_runtime_status():
    required_modules = {
        "PyPDF2": "PDF extraction",
        "docx": "DOCX extraction",
        "sentence_transformers": "CV embeddings",
    }
    missing = [
        {"module": module, "capability": capability}
        for module, capability in required_modules.items()
        if importlib.util.find_spec(module) is None
    ]
    return {"ready": not missing, "missing": missing}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events.

    Handles model loading on startup and cleanup on shutdown.
    """
    # Startup
    logger.info(
        "Starting MADAR AI Engine",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        model=settings.EMBEDDING_MODEL,
    )
    logger.info("Embedding model will load on first use")
    runtime = cv_runtime_status()
    if not runtime["ready"]:
        logger.error(
            "CV analysis runtime dependencies are missing",
            missing=runtime["missing"],
        )

    yield

    # Shutdown
    close_cache_service()
    logger.info("Shutting down MADAR AI Engine")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    MADAR AI Engine provides intelligent CV parsing, skill extraction,
    and job-student matching using NLP and vector similarity search.

    ## Features
    - **CV Parsing**: Extract structured data from PDF and DOCX resumes
    - **Skill Extraction**: Identify technical and soft skills from text
    - **Job Matching**: Calculate match scores between students and jobs
    - **Recommendations**: Generate personalized job recommendations
    - **Gap Analysis**: Identify skill gaps and learning opportunities
    """,
    version=settings.APP_VERSION,
    docs_url="/api/ai/docs",
    redoc_url="/api/ai/redoc",
    openapi_url="/api/ai/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


@app.middleware("http")
async def rate_limit_requests(request: Request, call_next):
    """Bound per-client request bursts without introducing another service."""
    if request.url.path == "/api/ai/health":
        return await call_next(request)
    now = time.monotonic()
    client = request.client.host if request.client else "unknown"
    window = request_windows[client]
    cutoff = now - settings.RATE_LIMIT_WINDOW_SECONDS
    while window and window[0] <= cutoff:
        window.popleft()
    if len(window) >= settings.RATE_LIMIT_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "retryAfterSeconds": settings.RATE_LIMIT_WINDOW_SECONDS},
            headers={"Retry-After": str(settings.RATE_LIMIT_WINDOW_SECONDS)},
        )
    window.append(now)
    return await call_next(request)


# Add request timing middleware
@app.middleware("http")
async def add_request_timing(request: Request, call_next):
    """Add request processing time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.debug(
        "Request processed",
        method=request.method,
        path=request.url.path,
        duration_ms=round(process_time * 1000, 2),
    )
    return response


# Add error handling middleware
@app.middleware("http")
async def add_error_handling(request: Request, call_next):
    """Global error handling middleware."""
    try:
        return await call_next(request)
    except Exception as exc:
        logger.error(
            "Unhandled exception",
            error=str(exc),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc) if settings.DEBUG else "An unexpected error occurred",
            },
        )


# Include routers
app.include_router(cv.router, prefix="/api/ai/cv", tags=["CV Parsing"])
app.include_router(matching.router, prefix="/api/ai/matching", tags=["Matching"])
app.include_router(
    recommendations.router, prefix="/api/ai/recommendations", tags=["Recommendations"]
)
app.include_router(skills.router, prefix="/api/ai/skills", tags=["Skills"])
app.include_router(
    curriculum.router, prefix="/api/ai/curriculum", tags=["Curriculum"]
)
app.include_router(jobs.router, prefix="/api/ai/jobs", tags=["Job Analysis"])
app.include_router(market.router, prefix="/api/ai/market", tags=["Market Intelligence"])


@app.get("/api/ai/health", response_model=dict)
async def health_check():
    """Health check endpoint.

    Returns the current health status of the AI Engine including
    model loading status and version information.

    Returns:
        dict: Health status with keys 'status', 'models_loaded', 'version'
    """
    cv_runtime = cv_runtime_status()
    return {
        "status": "healthy" if cv_runtime["ready"] else "degraded",
        "models_loaded": cv_runtime["ready"],
        "cv_parser_ready": cv_runtime["ready"],
        "missing_dependencies": cv_runtime["missing"],
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


@app.get("/api/ai/info")
async def get_info():
    """Get service information and configuration.

    Returns non-sensitive configuration details about the AI Engine.

    Returns:
        dict: Service information including model name, version, and capabilities.
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_dimension": settings.EMBEDDING_DIMENSION,
        "capabilities": [
            "cv_parsing",
            "skill_extraction",
            "job_matching",
            "recommendations",
            "gap_analysis",
            "job_analysis",
            "market_trends",
            "curriculum_analysis",
        ],
        "matching_weights": {
            "skills": settings.MATCH_WEIGHT_SKILLS,
            "experience": settings.MATCH_WEIGHT_EXPERIENCE,
            "projects": settings.MATCH_WEIGHT_PROJECTS,
            "semantic": settings.MATCH_WEIGHT_SEMANTIC,
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        reload=settings.DEBUG,
    )
