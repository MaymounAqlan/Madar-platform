"""
MADAR AI Engine - Configuration Settings

All configuration is loaded from environment variables with sensible defaults
for local development.
"""

import os
from functools import lru_cache
from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    APP_NAME: str = "MADAR AI Engine"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # Model Settings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_MODEL_VERSION: str = "1"
    EMBEDDING_DIMENSION: int = 384
    MAX_SEQUENCE_LENGTH: int = 512

    # Matching Algorithm Weights (must sum to 1.0)
    MATCH_WEIGHT_SKILLS: float = 0.60
    MATCH_WEIGHT_EXPERIENCE: float = 0.20
    MATCH_WEIGHT_PROJECTS: float = 0.10
    MATCH_WEIGHT_SEMANTIC: float = 0.10

    # Matching Thresholds
    MATCH_THRESHOLD_EXCELLENT: float = 85.0
    MATCH_THRESHOLD_GOOD: float = 70.0
    MATCH_THRESHOLD_FAIR: float = 50.0

    # Skill Level Thresholds
    SKILL_LEVEL_EXPERT: float = 0.80
    SKILL_LEVEL_ADVANCED: float = 0.60
    SKILL_LEVEL_INTERMEDIATE: float = 0.40
    SKILL_LEVEL_BEGINNER: float = 0.20

    # Cache Settings (Redis)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    CACHE_TTL_SECONDS: int = 3600
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "True").lower() in ("true", "1", "yes")
    AI_REQUEST_TIMEOUT_SECONDS: int = 30
    AI_MAX_RETRIES: int = 3
    AI_JOB_TIMEOUT_SECONDS: int = 120
    AI_QUEUE_NAME: str = "ai-matching"
    RATE_LIMIT_REQUESTS: int = 300
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Vector Store Settings
    VECTOR_INDEX_TYPE: str = "flat"  # Options: flat, ivf, hnsw
    VECTOR_NLIST: int = 100  # For IVF index
    VECTOR_NPROBE: int = 10  # For IVF index
    VECTOR_TOP_K: int = 50

    # CV Parsing Settings
    MAX_FILE_SIZE_MB: int = 10
    SUPPORTED_FILE_TYPES: List[str] = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    SUPPORTED_EXTENSIONS: List[str] = [".pdf", ".docx"]

    # NLP Settings
    ARABIC_TEXT_PROCESSING: bool = True
    ENGLISH_TEXT_PROCESSING: bool = True
    SKILL_CONFIDENCE_THRESHOLD: float = 0.30

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # External API Keys (if needed)
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> bool:
        if isinstance(value, str):
            return value.lower() in {"1", "true", "yes", "on", "debug"}
        return bool(value)

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance.

    Uses lru_cache to avoid reloading settings on every call.
    """
    return Settings()


# Convenience exports
settings = get_settings()
