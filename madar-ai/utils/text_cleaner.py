"""
MADAR AI Engine - Text Cleaner

Utilities for cleaning and normalizing Arabic and English text
for NLP processing and skill extraction.
"""

import re
import unicodedata
from typing import Optional

from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


# Arabic normalization mappings
ARABIC_NORMALIZATION = {
    # Normalize different forms of alef
    "\u0623": "\u0627",  # أ -> ا
    "\u0625": "\u0627",  # إ -> ا
    "\u0622": "\u0627",  # آ -> ا
    "\u0621": "\u0627",  # ء -> ا
    # Normalize yaa
    "\u0649": "\u064a",  # ى -> ي
    # Normalize taa marbouta
    "\u0629": "\u0647",  # ة -> ه
}

# Arabic diacritics to remove
ARABIC_DIACRITICS = [
    "\u064b",  # FATHATAN
    "\u064c",  # DAMMATAN
    "\u064d",  # KASRATAN
    "\u064e",  # FATHA
    "\u064f",  # DAMMA
    "\u0650",  # KASRA
    "\u0651",  # SHADDA
    "\u0652",  # SUKUN
    "\u0653",  # MADDAH
    "\u0654",  # HAMZA ABOVE
    "\u0655",  # HAMZA BELOW
]


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text by standardizing character forms.

    Args:
        text: Arabic text to normalize.

    Returns:
        str: Normalized Arabic text.
    """
    if not settings.ARABIC_TEXT_PROCESSING:
        return text

    # Normalize Unicode form
    text = unicodedata.normalize("NFKC", text)

    # Apply Arabic character normalization
    for old_char, new_char in ARABIC_NORMALIZATION.items():
        text = text.replace(old_char, new_char)

    # Remove diacritics
    for diacritic in ARABIC_DIACRITICS:
        text = text.replace(diacritic, "")

    # Normalize kashida (tatweel)
    text = text.replace("\u0640", "")

    return text


def normalize_english(text: str) -> str:
    """Normalize English text.

    Args:
        text: English text to normalize.

    Returns:
        str: Normalized English text.
    """
    if not settings.ENGLISH_TEXT_PROCESSING:
        return text

    # Lowercase
    text = text.lower()

    # Expand common contractions
    contractions = {
        "don't": "do not",
        "won't": "will not",
        "can't": "cannot",
        "isn't": "is not",
        "aren't": "are not",
        "wasn't": "was not",
        "weren't": "were not",
        "haven't": "have not",
        "hasn't": "has not",
        "hadn't": "had not",
        "wouldn't": "would not",
        "shouldn't": "should not",
        "couldn't": "could not",
        "let's": "let us",
        "that's": "that is",
        "who's": "who is",
        "what's": "what is",
        "here's": "here is",
        "there's": "there is",
        "where's": "where is",
        "how's": "how is",
        "it's": "it is",
        "he's": "he is",
        "she's": "she is",
        "i'm": "i am",
        "i've": "i have",
        "i'll": "i will",
        "i'd": "i would",
        "you're": "you are",
        "you've": "you have",
        "you'll": "you will",
        "we're": "we are",
        "we've": "we have",
        "they're": "they are",
        "they've": "they have",
        "it'll": "it will",
        "it'd": "it would",
    }

    for contraction, expansion in contractions.items():
        text = text.replace(contraction, expansion)

    return text


def remove_extra_whitespace(text: str) -> str:
    """Remove extra whitespace characters.

    Args:
        text: Input text.

    Returns:
        str: Text with normalized whitespace.
    """
    # Replace multiple spaces with single space
    text = re.sub(r"\s+", " ", text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def remove_special_chars(
    text: str, keep_chars: Optional[str] = None
) -> str:
    """Remove special characters from text.

    Args:
        text: Input text.
        keep_chars: Characters to keep (in addition to alphanumeric and Arabic).

    Returns:
        str: Text with special characters removed.
    """
    # Define allowed character ranges
    allowed = r"\w\s\u0600-\u06FF"

    if keep_chars:
        escaped = re.escape(keep_chars)
        allowed += escaped

    pattern = f"[^{allowed}]"
    text = re.sub(pattern, " ", text)

    return remove_extra_whitespace(text)


def remove_urls(text: str) -> str:
    """Remove URLs from text.

    Args:
        text: Input text.

    Returns:
        str: Text with URLs removed.
    """
    url_pattern = re.compile(
        r"https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?"
    )
    text = url_pattern.sub(" ", text)
    # Also remove www.example.com style
    text = re.sub(r"www\.\S+", " ", text)
    return remove_extra_whitespace(text)


def remove_emails(text: str) -> str:
    """Remove email addresses from text.

    Args:
        text: Input text.

    Returns:
        str: Text with emails removed.
    """
    email_pattern = re.compile(r"\S+@\S+")
    return email_pattern.sub(" ", text)


def remove_phone_numbers(text: str) -> str:
    """Remove phone numbers from text.

    Args:
        text: Input text.

    Returns:
        str: Text with phone numbers removed.
    """
    # Remove common phone number formats
    patterns = [
        r"\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}",
        r"\b\d{3}[-.]\d{3}[-.]\d{4}\b",
    ]
    for pattern in patterns:
        text = re.sub(pattern, " ", text)
    return remove_extra_whitespace(text)


def remove_html_tags(text: str) -> str:
    """Remove HTML tags from text.

    Args:
        text: Input text.

    Returns:
        str: Text with HTML tags removed.
    """
    html_pattern = re.compile(r"<[^>]+>")
    return html_pattern.sub(" ", text)


def clean_text(text: str) -> str:
    """Comprehensive text cleaning for NLP processing.

    Applies all cleaning steps in the optimal order for both
    English and Arabic text.

    Args:
        text: Raw input text.

    Returns:
        str: Cleaned and normalized text.
    """
    if not text:
        return ""

    # Remove HTML tags
    text = remove_html_tags(text)

    # Remove URLs
    text = remove_urls(text)

    # Remove email addresses
    text = remove_emails(text)

    # Remove phone numbers
    text = remove_phone_numbers(text)

    # Normalize Arabic text
    text = normalize_arabic(text)

    # Normalize English text
    text = normalize_english(text)

    # Remove special characters (keep letters, numbers, spaces, basic punctuation)
    text = remove_special_chars(text, keep_chars=".,;:!?()-'")

    # Remove extra whitespace
    text = remove_extra_whitespace(text)

    return text


def clean_for_embedding(text: str) -> str:
    """Clean text specifically for embedding generation.

    Preserves more semantic content than the general cleaner.

    Args:
        text: Raw input text.

    Returns:
        str: Cleaned text suitable for embeddings.
    """
    if not text:
        return ""

    # Remove HTML
    text = remove_html_tags(text)

    # Remove URLs
    text = remove_urls(text)

    # Normalize Arabic
    text = normalize_arabic(text)

    # Normalize whitespace
    text = remove_extra_whitespace(text)

    # Truncate if too long
    max_chars = settings.MAX_SEQUENCE_LENGTH * 4
    if len(text) > max_chars:
        text = text[:max_chars]

    return text


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to a maximum length.

    Args:
        text: Input text.
        max_length: Maximum character length.

    Returns:
        str: Truncated text.
    """
    if len(text) <= max_length:
        return text

    # Try to truncate at a word boundary
    truncated = text[:max_length]
    last_space = truncated.rfind(" ")
    if last_space > max_length * 0.8:
        truncated = truncated[:last_space]

    return truncated.strip() + "..."


def count_words(text: str) -> int:
    """Count the number of words in text.

    Args:
        text: Input text.

    Returns:
        int: Word count.
    """
    if not text:
        return 0

    # Split on whitespace
    words = text.split()
    return len(words)


def is_arabic_text(text: str) -> bool:
    """Check if text contains Arabic characters.

    Args:
        text: Input text.

    Returns:
        bool: True if text contains Arabic characters.
    """
    return any("\u0600" <= c <= "\u06FF" for c in text)


def is_english_text(text: str) -> bool:
    """Check if text contains English characters.

    Args:
        text: Input text.

    Returns:
        bool: True if text contains English characters.
    """
    return any(c.isascii() and c.isalpha() for c in text)


def detect_mixed_language(text: str) -> str:
    """Detect if text is Arabic, English, or mixed.

    Args:
        text: Input text.

    Returns:
        str: 'ar', 'en', 'mixed', or 'other'.
    """
    has_arabic = is_arabic_text(text)
    has_english = is_english_text(text)

    if has_arabic and has_english:
        return "mixed"
    elif has_arabic:
        return "ar"
    elif has_english:
        return "en"
    else:
        return "other"


def extract_arabic_words(text: str) -> list:
    """Extract Arabic words from mixed text.

    Args:
        text: Input text.

    Returns:
        List of Arabic words.
    """
    arabic_pattern = re.compile(r"[\u0600-\u06FF]+")
    return arabic_pattern.findall(text)


def extract_english_words(text: str) -> list:
    """Extract English words from mixed text.

    Args:
        text: Input text.

    Returns:
        List of English words.
    """
    english_pattern = re.compile(r"[a-zA-Z]+")
    return english_pattern.findall(text)
