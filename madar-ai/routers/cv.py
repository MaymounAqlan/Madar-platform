"""
MADAR AI Engine - CV Parsing Router

API endpoints for uploading and parsing CV/resume documents (PDF and DOCX).
Extracts structured information including personal details, skills, experience,
education, and generates embedding vectors for matching.
"""

import os
import re
import hashlib
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from config import settings
from models.cv_parser import CVParser
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Shared parser instance
_cv_parser: Optional[CVParser] = None


def _get_parser() -> CVParser:
    """Get or create the CV parser instance."""
    global _cv_parser
    if _cv_parser is None:
        _cv_parser = CVParser()
    return _cv_parser


# ============================================================================
# Request/Response Models
# ============================================================================


class PersonalInfoResponse(BaseModel):
    """Personal information extracted from a CV."""

    name: str = ""
    professionalTitle: str = ""
    email: str = ""
    phone: str = ""
    whatsapp: str = ""
    location: str = ""
    city: str = ""
    country: str = ""
    address: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    website: str = ""


class SkillResponse(BaseModel):
    """A single extracted skill."""

    name: str
    category: str
    confidence: float


class ExperienceResponse(BaseModel):
    """A single work experience entry."""

    title: str = ""
    company: str = ""
    years: float = 0.0
    duration: str = ""
    description: str = ""
    location: str = ""


class EducationResponse(BaseModel):
    """A single education entry."""

    degree: str = ""
    institution: str = ""
    year: int = 0
    fieldOfStudy: str = ""
    gpa: str = ""


class NamedEntityResponse(BaseModel):
    """A named CV entity such as a course, award, or certification."""

    name: str = ""
    title: str = ""
    description: str = ""
    provider: str = ""
    issuer: str = ""
    date: str = ""
    technologies: List[str] = Field(default_factory=list)
    role: str = ""


class CVParseResponse(BaseModel):
    """Complete CV parsing response."""

    personalInfo: PersonalInfoResponse
    skills: List[SkillResponse]
    softSkills: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    experience: List[ExperienceResponse]
    education: List[EducationResponse]
    projects: List[NamedEntityResponse]
    certifications: List[NamedEntityResponse]
    courses: List[NamedEntityResponse] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    volunteerWork: List[NamedEntityResponse] = Field(default_factory=list)
    awards: List[NamedEntityResponse] = Field(default_factory=list)
    achievements: List[NamedEntityResponse] = Field(default_factory=list)
    publications: List[NamedEntityResponse] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)
    additionalSections: Dict[str, List[str]] = Field(default_factory=dict)
    summary: str
    raw_text: str = ""
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    embedding: Optional[List[float]] = None


class CVParseTextRequest(BaseModel):
    """Request to parse CV from text directly."""

    text: str = Field(
        ..., min_length=10, description="CV text content to parse"
    )


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/parse",
    response_model=CVParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse a CV file (PDF or DOCX)",
    description="""
    Upload a CV/resume file (PDF or DOCX) to extract structured information.

    The endpoint extracts:
    - **Personal Info**: Name, email, phone, location
    - **Skills**: Technical and soft skills with confidence scores
    - **Experience**: Work history with titles, companies, and duration
    - **Education**: Degrees, institutions, and graduation years
    - **Projects**: Key project names and descriptions
    - **Certifications**: Professional certifications
    - **Embedding**: 384-dimensional vector for semantic matching

    Returns a structured JSON representation of the CV.
    """,
)
async def parse_cv_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Parse an uploaded CV file and extract structured data.

    Args:
        file: Uploaded PDF or DOCX file.

    Returns:
        Structured CV data including personal info, skills, experience, etc.

    Raises:
        HTTPException: If file type is unsupported or parsing fails.
    """
    # Validate file type
    filename = os.path.basename((file.filename or "").replace("\\", "/"))
    filename = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    file_ext = filename.lower().split(".")[-1] if "." in filename else ""

    if file_ext not in ["pdf", "docx"]:
        logger.warning(
            "Unsupported file type uploaded",
            file_name=filename,
            extension=file_ext,
        )
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: .{file_ext}. Only PDF and DOCX are supported.",
        )

    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded file", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        )

    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded CV is empty.",
        )

    # Validate file size
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB.",
        )

    expected_mime = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }[file_ext]
    if file.content_type and file.content_type not in {expected_mime, "application/octet-stream"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File MIME type does not match its extension.",
        )
    valid_signature = content.startswith(b"%PDF-") if file_ext == "pdf" else content.startswith(b"PK")
    if not valid_signature:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file is corrupted or does not match its extension.",
        )

    # Parse CV
    try:
        parser = _get_parser()
        parsed = parser.parse(content, filename)

        logger.info(
            "CV parsed successfully",
            file_name=filename,
            skills_count=len(parsed.skills),
            experience_count=len(parsed.experience),
        )

        result = parsed.to_dict()
        result.update({
            "textHash": hashlib.sha256(parsed.raw_text.encode("utf-8")).hexdigest(),
            "embeddingModel": settings.EMBEDDING_MODEL,
            "embeddingModelVersion": settings.EMBEDDING_MODEL_VERSION,
            "embeddingDimension": len(parsed.embedding or []),
        })
        return result

    except ValueError as e:
        logger.warning("CV parsing validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        logger.error("CV parsing failed", file_name=filename, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CV analysis is temporarily unavailable.",
        )


@router.post(
    "/parse-text",
    response_model=CVParseResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse CV from raw text",
    description="""
    Parse CV content provided as raw text.

    Use this endpoint when you already have the CV text extracted
    and want to avoid file upload processing.
    """,
)
async def parse_cv_text(request: CVParseTextRequest) -> Dict[str, Any]:
    """Parse CV text and extract structured data.

    Args:
        request: Contains the CV text content.

    Returns:
        Structured CV data.

    Raises:
        HTTPException: If parsing fails.
    """
    try:
        from models.cv_parser import ParsedCV, PersonalInfo

        # Use the parser's text parsing logic
        parser = _get_parser()
        parsed = parser._parse_text(request.text)
        parsed.raw_text = request.text

        # Generate embedding
        try:
            from models.embeddings import generate_embedding

            parsed.embedding = generate_embedding(request.text[:3000])
        except Exception as e:
            logger.error("Failed to generate CV embedding", error=str(e))

        logger.info(
            "CV text parsed successfully",
            skills_count=len(parsed.skills),
            experience_count=len(parsed.experience),
        )

        return parsed.to_dict()

    except Exception as e:
        logger.error("CV text parsing failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse CV text: {str(e)}",
        )


@router.post(
    "/extract-text",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
    summary="Extract raw text from CV file",
    description="Extract and return the raw text content from a PDF or DOCX file without parsing.",
)
async def extract_cv_text(file: UploadFile = File(...)) -> Dict[str, str]:
    """Extract raw text from an uploaded CV file.

    Args:
        file: Uploaded PDF or DOCX file.

    Returns:
        Dict with 'text' key containing the extracted text.

    Raises:
        HTTPException: If file type is unsupported.
    """
    filename = file.filename or ""
    file_ext = filename.lower().split(".")[-1] if "." in filename else ""

    if file_ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: .{file_ext}. Only PDF and DOCX are supported.",
        )

    try:
        content = await file.read()
        parser = _get_parser()

        if file_ext == "pdf":
            text = parser._extract_text_from_pdf(content)
        else:
            text = parser._extract_text_from_docx(content)

        return {"text": text, "filename": filename}

    except Exception as e:
        logger.error("Text extraction failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}",
        )
