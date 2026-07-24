"""
MADAR AI Engine - Vector Store Service

Provides vector similarity search capabilities for efficient
retrieval of similar embeddings using cosine similarity.
"""

import asyncio
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from config import settings
from models.embeddings import cosine_similarity, cosine_similarity_batch
from utils.logger import get_logger

logger = get_logger(__name__)


class VectorStore:
    """In-memory vector store for similarity search.

    Stores embedding vectors with associated metadata and provides
    efficient similarity search using cosine similarity.

    For production with large datasets, consider migrating to
    dedicated vector databases like FAISS, Milvus, or Pinecone.
    """

    def __init__(self):
        """Initialize the vector store."""
        self._vectors: Dict[str, List[float]] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def add(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a vector to the store.

        Args:
            id: Unique identifier for the vector.
            vector: The embedding vector.
            metadata: Optional metadata associated with the vector.
        """
        async with self._lock:
            self._vectors[id] = vector
            self._metadata[id] = metadata or {}

    async def add_batch(
        self,
        items: List[Dict[str, Any]],
    ) -> None:
        """Add multiple vectors to the store.

        Args:
            items: List of dicts with 'id', 'vector', and optional 'metadata'.
        """
        async with self._lock:
            for item in items:
                self._vectors[item["id"]] = item["vector"]
                self._metadata[item["id"]] = item.get("metadata", {})

    async def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        filter_fn: Optional[callable] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors using cosine similarity.

        Args:
            query_vector: The query embedding vector.
            top_k: Number of top results to return.
            filter_fn: Optional filter function for metadata.

        Returns:
            List of results with 'id', 'similarity', and 'metadata'.
        """
        async with self._lock:
            if not self._vectors:
                return []

            ids = list(self._vectors.keys())
            vectors = [self._vectors[id] for id in ids]

        # Compute similarities
        similarities = cosine_similarity_batch(query_vector, vectors)

        # Build results
        results = []
        for id, sim in zip(ids, similarities):
            metadata = self._metadata.get(id, {})

            if filter_fn and not filter_fn(metadata):
                continue

            results.append(
                {
                    "id": id,
                    "similarity": round(sim, 4),
                    "metadata": metadata,
                }
            )

        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return results[:top_k]

    async def search_by_id(
        self,
        id: str,
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for vectors similar to a stored vector by ID.

        Args:
            id: ID of the reference vector.
            top_k: Number of top results to return.

        Returns:
            List of similar vectors, excluding the query itself.
        """
        query_vector = self._vectors.get(id)
        if query_vector is None:
            return []

        results = await self.search(query_vector, top_k=top_k + 1)
        # Exclude the query vector itself
        return [r for r in results if r["id"] != id][:top_k]

    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector and its metadata by ID.

        Args:
            id: Vector identifier.

        Returns:
            Dict with 'vector' and 'metadata', or None if not found.
        """
        async with self._lock:
            vector = self._vectors.get(id)
            metadata = self._metadata.get(id)

        if vector is None:
            return None

        return {"vector": vector, "metadata": metadata or {}}

    async def delete(self, id: str) -> bool:
        """Delete a vector from the store.

        Args:
            id: Vector identifier.

        Returns:
            bool: True if deleted, False if not found.
        """
        async with self._lock:
            if id in self._vectors:
                del self._vectors[id]
                del self._metadata[id]
                return True
            return False

    async def clear(self) -> None:
        """Clear all vectors from the store."""
        async with self._lock:
            self._vectors.clear()
            self._metadata.clear()

    def count(self) -> int:
        """Get the number of vectors in the store.

        Returns:
            int: Vector count.
        """
        return len(self._vectors)

    def get_stats(self) -> Dict[str, Any]:
        """Get store statistics.

        Returns:
            Dict with store statistics.
        """
        if not self._vectors:
            return {
                "count": 0,
                "avg_dimension": 0,
                "dimension": settings.EMBEDDING_DIMENSION,
            }

        dimensions = [len(v) for v in self._vectors.values()]
        return {
            "count": len(self._vectors),
            "avg_dimension": sum(dimensions) // len(dimensions),
            "dimension": dimensions[0] if dimensions else 0,
        }


class VectorIndex:
    """Advanced vector index using numpy for efficient batch operations.

    Optimized for larger-scale similarity search with pre-computed
    normalized vectors for faster dot-product computation.
    """

    def __init__(self, dimension: int = 384):
        """Initialize the vector index.

        Args:
            dimension: Expected vector dimension.
        """
        self.dimension = dimension
        self._ids: List[str] = []
        self._vectors: Optional[np.ndarray] = None
        self._normalized: Optional[np.ndarray] = None
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._dirty: bool = True

    def add(
        self,
        id: str,
        vector: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a vector to the index.

        Args:
            id: Unique identifier.
            vector: Embedding vector.
            metadata: Optional metadata.
        """
        self._ids.append(id)
        self._metadata[id] = metadata or {}

        vector_np = np.array(vector, dtype=np.float32).reshape(1, -1)

        if self._vectors is None:
            self._vectors = vector_np
        else:
            self._vectors = np.vstack([self._vectors, vector_np])

        self._dirty = True

    def add_batch(
        self,
        items: List[Dict[str, Any]],
    ) -> None:
        """Add multiple vectors to the index.

        Args:
            items: List of dicts with 'id', 'vector', and optional 'metadata'.
        """
        if not items:
            return

        new_ids = [item["id"] for item in items]
        new_vectors = np.array(
            [item["vector"] for item in items], dtype=np.float32
        )

        self._ids.extend(new_ids)
        for item in items:
            self._metadata[item["id"]] = item.get("metadata", {})

        if self._vectors is None:
            self._vectors = new_vectors
        else:
            self._vectors = np.vstack([self._vectors, new_vectors])

        self._dirty = True

    def _ensure_normalized(self) -> None:
        """Ensure normalized vectors are up to date."""
        if not self._dirty or self._vectors is None:
            return

        norms = np.linalg.norm(self._vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Avoid division by zero
        self._normalized = self._vectors / norms
        self._dirty = False

    def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        min_similarity: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors.

        Uses pre-normalized vectors for efficient dot-product computation.

        Args:
            query_vector: Query embedding.
            top_k: Number of results.
            min_similarity: Minimum similarity threshold.

        Returns:
            List of results with 'id', 'similarity', 'metadata'.
        """
        if self._vectors is None or len(self._ids) == 0:
            return []

        self._ensure_normalized()

        # Normalize query
        query_np = np.array(query_vector, dtype=np.float32)
        query_norm = np.linalg.norm(query_np)
        if query_norm == 0:
            return []
        query_normalized = query_np / query_norm

        # Compute similarities via dot product
        similarities = np.dot(self._normalized, query_normalized)

        # Filter and get top-k
        valid_mask = similarities >= min_similarity
        valid_indices = np.where(valid_mask)[0]

        if len(valid_indices) == 0:
            return []

        # Sort by similarity
        sorted_indices = valid_indices[np.argsort(similarities[valid_indices])][
            ::-1
        ]

        results = []
        for idx in sorted_indices[:top_k]:
            idx = int(idx)
            id = self._ids[idx]
            results.append(
                {
                    "id": id,
                    "similarity": round(float(similarities[idx]), 4),
                    "metadata": self._metadata.get(id, {}),
                }
            )

        return results

    def batch_search(
        self,
        query_vectors: List[List[float]],
        top_k: int = 10,
    ) -> List[List[Dict[str, Any]]]:
        """Search for multiple query vectors at once.

        Args:
            query_vectors: List of query embedding vectors.
            top_k: Number of results per query.

        Returns:
            List of result lists, one per query.
        """
        return [self.search(qv, top_k=top_k) for qv in query_vectors]

    def clear(self) -> None:
        """Clear all vectors from the index."""
        self._ids = []
        self._vectors = None
        self._normalized = None
        self._metadata = {}
        self._dirty = True

    def count(self) -> int:
        """Get the number of indexed vectors."""
        return len(self._ids)


# Singleton instances
_vector_store: Optional[VectorStore] = None
_vector_index: Optional[VectorIndex] = None


def get_vector_store() -> VectorStore:
    """Get the shared vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


def get_vector_index() -> VectorIndex:
    """Get the shared vector index instance."""
    global _vector_index
    if _vector_index is None:
        _vector_index = VectorIndex(dimension=settings.EMBEDDING_DIMENSION)
    return _vector_index
