"""
MADAR AI Engine - Text Embedding Generation

Provides text embedding generation using sentence-transformers and
cosine similarity computation for vector-based matching.
"""

import re
from typing import List, Optional

import numpy as np
from sentence_transformers import SentenceTransformer

from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Global model instance (initialized once)
_model: Optional[SentenceTransformer] = None


def initialize_model() -> None:
    """Initialize the sentence transformer model.

    This function loads the embedding model into memory. It should be
    called once during application startup.

    Raises:
        RuntimeError: If the model fails to load.
    """
    global _model
    if _model is not None:
        return

    try:
        logger.info(
            "Loading embedding model",
            model=settings.EMBEDDING_MODEL,
        )
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info(
            "Embedding model loaded successfully",
            model=settings.EMBEDDING_MODEL,
            dimension=settings.EMBEDDING_DIMENSION,
        )
    except Exception as e:
        logger.error("Failed to load embedding model", error=str(e))
        raise RuntimeError(f"Failed to load embedding model: {e}")


def get_model() -> SentenceTransformer:
    """Get the initialized embedding model.

    Returns:
        SentenceTransformer: The loaded embedding model.

    Raises:
        RuntimeError: If the model has not been initialized.
    """
    if _model is None:
        initialize_model()
    return _model


def generate_embedding(text: str) -> List[float]:
    """Generate a dense vector embedding for the given text.

    Uses the configured sentence-transformer model to produce a
    384-dimensional embedding vector.

    Args:
        text: Input text to encode.

    Returns:
        List[float]: The embedding vector as a list of floats.

    Raises:
        ValueError: If the input text is empty.
        RuntimeError: If the model is not loaded.
    """
    if not text or not text.strip():
        raise ValueError("Input text cannot be empty")

    # Clean and truncate text
    cleaned_text = _preprocess_text(text)
    cache_key_text = f"{settings.EMBEDDING_MODEL}:{settings.EMBEDDING_MODEL_VERSION}:{cleaned_text}"
    try:
        from services.cache_service import get_cache_service
        cached = get_cache_service().get_embedding(cache_key_text)
        if cached and len(cached) == settings.EMBEDDING_DIMENSION:
            return cached
    except Exception:
        cached = None

    model = get_model()

    try:
        embedding = model.encode(
            cleaned_text,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        vector = embedding.tolist()
        if len(vector) != settings.EMBEDDING_DIMENSION:
            raise RuntimeError(f"Embedding dimension mismatch: expected {settings.EMBEDDING_DIMENSION}, got {len(vector)}")
        try:
            get_cache_service().set_embedding(cache_key_text, vector)
        except Exception:
            pass
        return vector
    except Exception as e:
        logger.error("Embedding generation failed", error=str(e))
        raise RuntimeError(f"Failed to generate embedding: {e}")


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a batch of texts efficiently.

    Args:
        texts: List of input texts to encode.

    Returns:
        List[List[float]]: List of embedding vectors.

    Raises:
        ValueError: If the input list is empty.
    """
    if not texts:
        raise ValueError("Input list cannot be empty")

    model = get_model()

    # Clean and filter texts
    cleaned_texts = [_preprocess_text(t) for t in texts if t and t.strip()]

    if not cleaned_texts:
        raise ValueError("No valid texts after preprocessing")

    try:
        embeddings = model.encode(
            cleaned_texts,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True,
            batch_size=32,
        )
        return embeddings.tolist()
    except Exception as e:
        logger.error("Batch embedding generation failed", error=str(e))
        raise RuntimeError(f"Failed to generate batch embeddings: {e}")


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors.

    Cosine similarity measures the cosine of the angle between two vectors,
    providing a value between -1 and 1. For normalized embeddings, this
    ranges from 0 to 1.

    Args:
        a: First vector as a list of floats.
        b: Second vector as a list of floats.

    Returns:
        float: Cosine similarity score between 0 and 1.

    Raises:
        ValueError: If vectors have different dimensions or are empty.
    """
    if not a or not b:
        raise ValueError("Vectors cannot be empty")

    if len(a) != len(b):
        raise ValueError(
            f"Vectors must have the same dimension: {len(a)} vs {len(b)}"
        )

    a_np = np.array(a, dtype=np.float32)
    b_np = np.array(b, dtype=np.float32)

    norm_a = np.linalg.norm(a_np)
    norm_b = np.linalg.norm(b_np)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = float(np.dot(a_np, b_np) / (norm_a * norm_b))

    # Clamp to [0, 1] range for normalized embeddings
    return max(0.0, min(1.0, similarity))


def cosine_similarity_batch(
    query_vector: List[float], candidate_vectors: List[List[float]]
) -> List[float]:
    """Compute cosine similarity between a query vector and multiple candidates.

    Uses numpy broadcasting for efficient batch computation.

    Args:
        query_vector: The query embedding vector.
        candidate_vectors: List of candidate embedding vectors.

    Returns:
        List[float]: Similarity scores for each candidate.
    """
    if not candidate_vectors:
        return []

    query_np = np.array(query_vector, dtype=np.float32)
    candidates_np = np.array(candidate_vectors, dtype=np.float32)

    query_norm = np.linalg.norm(query_np)
    candidates_norm = np.linalg.norm(candidates_np, axis=1)

    if query_norm == 0:
        return [0.0] * len(candidate_vectors)

    # Handle zero-norm candidates
    valid_mask = candidates_norm > 0
    similarities = np.zeros(len(candidate_vectors), dtype=np.float32)

    if np.any(valid_mask):
        dot_products = np.dot(candidates_np[valid_mask], query_np)
        similarities[valid_mask] = dot_products / (
            candidates_norm[valid_mask] * query_norm
        )

    return np.clip(similarities, 0.0, 1.0).tolist()


def _preprocess_text(text: str) -> str:
    """Preprocess text before embedding generation.

    Removes extra whitespace, special characters, and truncates
    to maximum sequence length.

    Args:
        text: Raw input text.

    Returns:
        str: Cleaned and preprocessed text.
    """
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove special characters that don't add semantic value
    text = re.sub(r"[^\w\s\u0600-\u06FF.,;:!?()-]", " ", text)

    # Truncate to approximate token limit (rough heuristic: 4 chars per token)
    max_chars = settings.MAX_SEQUENCE_LENGTH * 4
    if len(text) > max_chars:
        text = text[:max_chars]

    return text.strip()
