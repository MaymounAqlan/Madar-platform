"""
MADAR AI Engine - Cache Service

Provides caching capabilities using Redis for storing and retrieving
computed results like embeddings and match scores.
"""

import hashlib
import json
import pickle
from typing import Any, Optional

from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class CacheService:
    """Redis-based caching service for computed results.

    Caches embeddings, match scores, and other computed data to
    reduce redundant computation and improve response times.
    """

    def __init__(self):
        """Initialize the cache service."""
        self._redis = None
        self._enabled = settings.CACHE_ENABLED
        self._ttl = settings.CACHE_TTL_SECONDS
        self._connected = False

        if self._enabled:
            self._connect()

    def _connect(self) -> None:
        """Establish Redis connection."""
        try:
            import redis

            connection_kwargs = {}
            if settings.REDIS_PASSWORD:
                connection_kwargs["password"] = settings.REDIS_PASSWORD

            self._redis = redis.from_url(
                settings.REDIS_URL,
                decode_responses=False,
                **connection_kwargs,
            )
            self._connected = True
            logger.info("Redis cache connected")
        except ImportError:
            logger.warning(
                "Redis package not installed, caching disabled"
            )
            self._enabled = False
        except Exception as e:
            logger.warning(
                "Redis connection failed, caching disabled", error=str(e)
            )
            self._enabled = False

    def _generate_key(self, prefix: str, data: str) -> str:
        """Generate a cache key from prefix and data.

        Args:
            prefix: Key prefix (e.g., 'embedding', 'match').
            data: Data to hash for the key.

        Returns:
            str: Cache key.
        """
        hash_value = hashlib.sha256(data.encode()).hexdigest()[:16]
        return f"madar:ai:{prefix}:{hash_value}"

    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.

        Args:
            key: Cache key.

        Returns:
            Cached value or None if not found.
        """
        if not self._enabled or not self._connected:
            return None

        try:
            data = self._redis.get(key)
            if data is None:
                return None
            return pickle.loads(data)
        except Exception as e:
            logger.debug("Cache get failed", key=key, error=str(e))
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """Set a value in the cache.

        Args:
            key: Cache key.
            value: Value to cache (must be pickle-serializable).
            ttl: Time-to-live in seconds (uses default if None).

        Returns:
            bool: True if successful, False otherwise.
        """
        if not self._enabled or not self._connected:
            return False

        try:
            serialized = pickle.dumps(value)
            self._redis.setex(key, ttl or self._ttl, serialized)
            return True
        except Exception as e:
            logger.debug("Cache set failed", key=key, error=str(e))
            return False

    def delete(self, key: str) -> bool:
        """Delete a key from the cache.

        Args:
            key: Cache key.

        Returns:
            bool: True if deleted, False otherwise.
        """
        if not self._enabled or not self._connected:
            return False

        try:
            return bool(self._redis.delete(key))
        except Exception as e:
            logger.debug("Cache delete failed", key=key, error=str(e))
            return False

    def close(self) -> None:
        """Close the Redis client without failing application shutdown."""
        if self._redis is not None:
            try:
                self._redis.close()
            except Exception as exc:
                logger.debug("Redis cache close failed", error=str(exc))
        self._connected = False

    def get_embedding(self, text: str) -> Optional[list]:
        """Get cached embedding for text.

        Args:
            text: Input text.

        Returns:
            Cached embedding or None.
        """
        key = self._generate_key("embedding", text)
        return self.get(key)

    def set_embedding(self, text: str, embedding: list) -> bool:
        """Cache an embedding for text.

        Args:
            text: Input text.
            embedding: The embedding vector.

        Returns:
            bool: True if cached successfully.
        """
        key = self._generate_key("embedding", text)
        return self.set(key, embedding, ttl=self._ttl * 24)  # 24x TTL for embeddings

    def get_match_score(
        self, student_id: str, job_id: str
    ) -> Optional[dict]:
        """Get cached match score.

        Args:
            student_id: Student identifier.
            job_id: Job identifier.

        Returns:
            Cached match result or None.
        """
        key = self._generate_key("match", f"{student_id}:{job_id}")
        return self.get(key)

    def set_match_score(
        self, student_id: str, job_id: str, result: dict
    ) -> bool:
        """Cache a match score result.

        Args:
            student_id: Student identifier.
            job_id: Job identifier.
            result: Match result dict.

        Returns:
            bool: True if cached successfully.
        """
        key = self._generate_key("match", f"{student_id}:{job_id}")
        return self.set(key, result)

    def get_skill_extraction(self, text: str) -> Optional[list]:
        """Get cached skill extraction result.

        Args:
            text: Input text.

        Returns:
            Cached skills list or None.
        """
        key = self._generate_key("skills", text)
        return self.get(key)

    def set_skill_extraction(self, text: str, skills: list) -> bool:
        """Cache skill extraction result.

        Args:
            text: Input text.
            skills: Extracted skills list.

        Returns:
            bool: True if cached successfully.
        """
        key = self._generate_key("skills", text)
        return self.set(key, skills)

    def clear(self) -> bool:
        """Clear all MADAR AI cache entries.

        Returns:
            bool: True if successful.
        """
        if not self._enabled or not self._connected:
            return False

        try:
            pattern = "madar:ai:*"
            keys = self._redis.keys(pattern)
            if keys:
                self._redis.delete(*keys)
            return True
        except Exception as e:
            logger.warning("Cache clear failed", error=str(e))
            return False

    def health_check(self) -> dict:
        """Check cache health status.

        Returns:
            Dict with health information.
        """
        if not self._enabled:
            return {"status": "disabled", "connected": False}

        if not self._connected:
            return {"status": "disconnected", "connected": False}

        try:
            self._redis.ping()
            info = self._redis.info("memory")
            return {
                "status": "healthy",
                "connected": True,
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "keys": len(self._redis.keys("madar:ai:*")),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
            }


class MemoryCache:
    """Simple in-memory cache for environments without Redis.

    Provides basic get/set/delete operations with TTL support.
    """

    def __init__(self, default_ttl: int = 3600):
        """Initialize the memory cache.

        Args:
            default_ttl: Default time-to-live in seconds.
        """
        self._store: dict = {}
        self._expiry: dict = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.

        Args:
            key: Cache key.

        Returns:
            Cached value or None.
        """
        import time

        if key in self._expiry and time.time() > self._expiry[key]:
            self.delete(key)
            return None

        return self._store.get(key)

    def set(
        self, key: str, value: Any, ttl: Optional[int] = None
    ) -> bool:
        """Set a value in the cache.

        Args:
            key: Cache key.
            value: Value to cache.
            ttl: Time-to-live in seconds.

        Returns:
            bool: True if successful.
        """
        import time

        self._store[key] = value
        self._expiry[key] = time.time() + (ttl or self._default_ttl)
        return True

    def delete(self, key: str) -> bool:
        """Delete a key from the cache.

        Args:
            key: Cache key.

        Returns:
            bool: True if deleted.
        """
        self._store.pop(key, None)
        self._expiry.pop(key, None)
        return True

    def clear(self) -> bool:
        """Clear all cache entries."""
        self._store.clear()
        self._expiry.clear()
        return True


# Singleton instances
_cache_service: Optional[CacheService] = None
_memory_cache: Optional[MemoryCache] = None


def get_cache_service() -> CacheService:
    """Get the shared cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


def get_memory_cache() -> MemoryCache:
    """Get the shared memory cache instance."""
    global _memory_cache
    if _memory_cache is None:
        _memory_cache = MemoryCache()
    return _memory_cache


def close_cache_service() -> None:
    if _cache_service is not None:
        _cache_service.close()
