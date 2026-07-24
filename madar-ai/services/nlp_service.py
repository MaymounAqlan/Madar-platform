"""
MADAR AI Engine - NLP Service

Core NLP operations including text preprocessing, tokenization,
entity extraction, and text analysis utilities.
"""

import re
from typing import Dict, List, Optional, Tuple

from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


class NLPService:
    """Service for core NLP operations.

    Provides text cleaning, normalization, and analysis utilities
    optimized for both English and Arabic text processing.
    """

    # Common stop words
    ENGLISH_STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
        "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
        "to", "was", "will", "with", "would", "could", "should", "may",
        "might", "shall", "can", "do", "does", "did", "have", "had",
        "having", "been", "being", "am", "is", "are", "i", "you", "we",
        "they", "them", "their", "this", "these", "those", "but", "or",
        "nor", "not", "no", "yes", "so", "if", "than", "too", "very",
        "just", "now", "only", "also", "about", "up", "out", "down",
        "off", "over", "under", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all", "both",
        "each", "few", "more", "most", "other", "some", "such", "what",
        "which", "who", "whom", "my", "our", "your", "his", "her",
    }

    ARABIC_STOP_WORDS = {
        "في", "من", "إلى", "على", "هذا", "هذه", "التي", "الذي", "و",
        "أو", "لم", "لا", "قد", "كان", "يكون", "بعد", "قبل", "كل",
        "أي", "بعض", "许多", "عند", "مع", "غير", "بين", "أيضا",
        "ثم", "هنا", "هناك", "حيث", "كيف", "ما", "منذ", "خلال",
        "أن", "إن", "كما", "لكن", "لذلك", "لأن", "حتى", "إذا",
        "عما", "ليس", "لا", "دون", "فوق", "تحت", "يمين", "يسار",
    }

    def __init__(self):
        """Initialize the NLP service."""
        self.all_stop_words = self.ENGLISH_STOP_WORDS.copy()
        if settings.ARABIC_TEXT_PROCESSING:
            self.all_stop_words.update(self.ARABIC_STOP_WORDS)

    def preprocess(self, text: str) -> str:
        """Preprocess text for NLP operations.

        Performs cleaning, normalization, and stop word removal.

        Args:
            text: Raw input text.

        Returns:
            str: Cleaned and normalized text.
        """
        if not text:
            return ""

        # Lowercase (for English)
        text = text.lower()

        # Remove URLs
        text = re.sub(r"https?://\S+|www\.\S+", " ", text)

        # Remove email addresses
        text = re.sub(r"\S+@\S+", " ", text)

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def tokenize(self, text: str) -> List[str]:
        """Tokenize text into individual words/tokens.

        Args:
            text: Input text.

        Returns:
            List of tokens.
        """
        if not text:
            return []

        # Simple word tokenization
        tokens = re.findall(r"\b\w+\b", text.lower())
        return tokens

    def remove_stop_words(self, tokens: List[str]) -> List[str]:
        """Remove stop words from a token list.

        Args:
            tokens: List of tokens.

        Returns:
            Filtered list without stop words.
        """
        return [
            t for t in tokens if t.lower() not in self.all_stop_words
        ]

    def extract_keywords(self, text: str, top_n: int = 20) -> List[Tuple[str, int]]:
        """Extract top keywords from text by frequency.

        Args:
            text: Input text.
            top_n: Number of top keywords to return.

        Returns:
            List of (keyword, frequency) tuples.
        """
        tokens = self.tokenize(text)
        tokens = self.remove_stop_words(tokens)

        # Filter short tokens
        tokens = [t for t in tokens if len(t) > 2]

        # Count frequencies
        freq = {}
        for token in tokens:
            freq[token] = freq.get(token, 0) + 1

        # Sort by frequency
        sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)

        return sorted_keywords[:top_n]

    def detect_language(self, text: str) -> str:
        """Detect the primary language of the text.

        Args:
            text: Input text.

        Returns:
            str: 'ar' for Arabic, 'en' for English, 'mixed' for both.
        """
        if not text:
            return "unknown"

        arabic_chars = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
        english_chars = sum(1 for c in text if c.isascii() and c.isalpha())

        total_chars = arabic_chars + english_chars
        if total_chars == 0:
            return "unknown"

        arabic_ratio = arabic_chars / total_chars
        english_ratio = english_chars / total_chars

        if arabic_ratio > 0.3 and english_ratio > 0.3:
            return "mixed"
        elif arabic_ratio > 0.5:
            return "ar"
        elif english_ratio > 0.5:
            return "en"
        else:
            return "unknown"

    def extract_named_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract simple named entities using regex patterns.

        This is a lightweight rule-based approach. For production,
        consider using a dedicated NER model.

        Args:
            text: Input text.

        Returns:
            List of entity dicts with 'text' and 'type' keys.
        """
        entities = []

        # Email entities
        email_pattern = re.compile(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        )
        for match in email_pattern.finditer(text):
            entities.append(
                {"text": match.group(), "type": "EMAIL", "start": match.start()}
            )

        # Phone entities
        phone_pattern = re.compile(
            r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
        )
        for match in phone_pattern.finditer(text):
            if len(match.group()) >= 7:
                entities.append(
                    {"text": match.group(), "type": "PHONE", "start": match.start()}
                )

        # URL entities
        url_pattern = re.compile(r"https?://\S+|www\.\S+")
        for match in url_pattern.finditer(text):
            entities.append(
                {"text": match.group(), "type": "URL", "start": match.start()}
            )

        return entities

    def calculate_text_statistics(self, text: str) -> Dict[str, Any]:
        """Calculate various text statistics.

        Args:
            text: Input text.

        Returns:
            Dict with text statistics.
        """
        if not text:
            return {
                "char_count": 0,
                "word_count": 0,
                "sentence_count": 0,
                "avg_word_length": 0,
                "language": "unknown",
            }

        words = self.tokenize(text)
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]

        avg_word_length = (
            sum(len(w) for w in words) / len(words) if words else 0
        )

        return {
            "char_count": len(text),
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_word_length": round(avg_word_length, 2),
            "language": self.detect_language(text),
        }

    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences.

        Args:
            text: Input text.

        Returns:
            List of sentences.
        """
        if not text:
            return []

        # Simple sentence splitting
        sentences = re.split(r"[.!?\n]+", text)
        return [s.strip() for s in sentences if s.strip()]

    def compute_tf_idf(
        self, documents: List[str]
    ) -> Dict[str, Dict[str, float]]:
        """Compute simple TF-IDF scores for a collection of documents.

        Args:
            documents: List of text documents.

        Returns:
            Dict mapping doc index -> {token: tf-idf score}.
        """
        import math

        # Preprocess documents
        processed_docs = []
        for doc in documents:
            tokens = self.tokenize(doc)
            tokens = self.remove_stop_words(tokens)
            tokens = [t for t in tokens if len(t) > 2]
            processed_docs.append(tokens)

        # Calculate IDF
        idf = {}
        n_docs = len(documents)
        all_tokens = set()
        for tokens in processed_docs:
            all_tokens.update(set(tokens))

        for token in all_tokens:
            doc_count = sum(1 for tokens in processed_docs if token in tokens)
            idf[token] = math.log(n_docs / (doc_count + 1)) + 1

        # Calculate TF-IDF for each document
        results = {}
        for i, tokens in enumerate(processed_docs):
            tf = {}
            for token in tokens:
                tf[token] = tf.get(token, 0) + 1

            tf_idf = {}
            for token, count in tf.items():
                tf_idf[token] = round((count / len(tokens)) * idf[token], 4)

            results[str(i)] = tf_idf

        return results


# Singleton instance
_nlp_service: Optional[NLPService] = None


def get_nlp_service() -> NLPService:
    """Get the shared NLP service instance."""
    global _nlp_service
    if _nlp_service is None:
        _nlp_service = NLPService()
    return _nlp_service
