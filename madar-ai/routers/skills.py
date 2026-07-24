"""
MADAR AI Engine - Skills Router

API endpoints for skill extraction, gap analysis, and skill taxonomy queries.
"""

from typing import Any, Dict, List, Optional
import hashlib

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.embeddings import generate_embedding
from models.skill_extractor import SkillExtractor
from services.learning_resources import resources_for_skill
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Shared skill extractor instance
_skill_extractor: Optional[SkillExtractor] = None


def _get_extractor() -> SkillExtractor:
    """Get or create the skill extractor instance."""
    global _skill_extractor
    if _skill_extractor is None:
        _skill_extractor = SkillExtractor()
    return _skill_extractor


# ============================================================================
# Request/Response Models
# ============================================================================


class SkillExtractRequest(BaseModel):
    """Request to extract skills from text."""

    text: str = Field(
        ..., min_length=5, description="Text to extract skills from"
    )
    include_embeddings: bool = Field(
        default=False, description="Whether to include embedding vectors"
    )
    category_filter: Optional[str] = Field(
        default=None,
        description="Filter by category: 'technical', 'soft', or 'certification'",
    )


class SkillItem(BaseModel):
    """A single extracted skill."""

    name: str
    category: str
    confidence: float
    source: str = "taxonomy_match"
    proficiency: Optional[str] = None
    proficiencyEvidence: Optional[str] = None
    embedding: Optional[List[float]] = None


class SkillExtractResponse(BaseModel):
    """Response containing extracted skills."""

    skills: List[SkillItem]
    total_count: int


class SkillGapAnalysisRequest(BaseModel):
    """Request for skill gap analysis."""

    studentSkills: List[Dict[str, Any]] = Field(
        ..., description="Student's current skills with name and level"
    )
    marketSkills: List[Dict[str, Any]] = Field(
        ..., description="Market-demanded skills for the target role"
    )
    targetRole: str = Field(
        ..., description="The target job role for gap analysis"
    )
    includeRecommendations: bool = Field(
        default=True, description="Include learning recommendations"
    )


class SkillGapItem(BaseModel):
    """A single skill gap entry."""

    skill: str
    importance: str  # high, medium, low
    studentLevel: float
    marketLevel: float
    gap: float
    recommendation: str
    learningResource: str
    skillName: str
    gapSeverity: str
    suggestion: str
    priority: str
    jobsRequiring: int = 0
    currentLevel: float
    requiredLevel: float
    learningResources: List[Dict[str, Any]] = Field(default_factory=list)


class SkillGapAnalysisResponse(BaseModel):
    """Response containing skill gap analysis."""

    targetRole: str
    overallReadiness: float
    totalGaps: int
    criticalGaps: int
    gapAnalysis: List[SkillGapItem]
    strengths: List[str]


class SkillSuggestRequest(BaseModel):
    """Request for skill suggestions."""

    query: str = Field(..., min_length=1, description="Partial skill name")
    limit: int = Field(default=10, ge=1, le=50)


class SkillSuggestResponse(BaseModel):
    """Response containing skill suggestions."""

    suggestions: List[Dict[str, str]]


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/extract",
    response_model=SkillExtractResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract skills from text",
    description="""
    Extract skills from job descriptions, CV text, or any other text content.

    Uses a comprehensive bilingual skill taxonomy to identify technical skills,
    soft skills, and certifications in both English and Arabic text.

    Returns each skill with its category and confidence score.
    """,
)
async def extract_skills(request: SkillExtractRequest) -> Dict[str, Any]:
    """Extract skills from provided text.

    Args:
        request: Contains text and optional parameters.

    Returns:
        Dict with extracted skills list and count.
    """
    try:
        extractor = _get_extractor()

        if request.category_filter:
            raw_skills = extractor.extract_skills_by_category(
                request.text, request.category_filter
            )
        else:
            raw_skills = extractor.extract_skills(
                request.text, include_embeddings=request.include_embeddings
            )

        skills = [
            {
                "name": s.name,
                "category": s.category,
                "confidence": s.confidence,
                "source": s.source,
                "proficiency": s.proficiency,
                "proficiencyEvidence": s.proficiency_evidence,
                **({"embedding": s.embedding} if s.embedding else {}),
            }
            for s in raw_skills
        ]

        logger.info(
            "Skills extracted",
            count=len(skills),
            category_filter=request.category_filter,
        )

        return {"skills": skills, "total_count": len(skills)}

    except Exception as e:
        logger.error("Skill extraction failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill extraction failed: {str(e)}",
        )


@router.post(
    "/gap-analysis",
    response_model=SkillGapAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze skill gaps",
    description="""
    Compare a student's current skills against market requirements for a target role.

    Identifies:
    - Missing skills ranked by importance
    - Current skill levels vs. market expectations
    - Personalized learning recommendations
    - Overall readiness score
    """,
)
async def skill_gap_analysis(
    request: SkillGapAnalysisRequest,
) -> Dict[str, Any]:
    """Analyze skill gaps between student skills and market requirements.

    Args:
        request: Contains student skills, market skills, and target role.

    Returns:
        Detailed gap analysis with recommendations.
    """
    try:
        # Build student skill lookup
        student_skill_map = {}
        for skill in request.studentSkills:
            name = skill.get("name", "").lower().strip()
            level = skill.get("level", 0.0)
            if name:
                student_skill_map[name] = max(
                    student_skill_map.get(name, 0.0), level
                )

        gap_analysis = []
        strengths = []
        total_gap_score = 0.0
        critical_gaps = 0

        for market_skill in request.marketSkills:
            skill_name = market_skill.get("name", "")
            market_level = market_skill.get("level", 0.5)
            importance = market_skill.get("importance", "medium")
            if importance == "significant":
                importance = "important"
            jobs_requiring = max(0, int(market_skill.get("jobsCount", market_skill.get("jobCount", 0)) or 0))

            student_level = student_skill_map.get(skill_name.lower(), 0.0)
            gap = max(0, market_level - student_level)

            if gap > 0.3 and importance == "high":
                critical_gaps += 1

            if gap > 0.1:
                total_gap_score += gap

                learning_resource = _get_learning_resource(skill_name)
                learning_resources = resources_for_skill(skill_name)

                if gap >= 0.5:
                    recommendation = f"Priority: Learn {skill_name} fundamentals"
                elif gap >= 0.3:
                    recommendation = f"Recommended: Improve {skill_name} proficiency"
                elif gap >= 0.1:
                    recommendation = f"Consider: Practice {skill_name} to reach market level"
                else:
                    recommendation = f"Optional: Minor improvement in {skill_name}"

                gap_analysis.append(
                    {
                        "skill": skill_name,
                        "importance": importance,
                        "studentLevel": round(student_level, 2),
                        "marketLevel": round(market_level, 2),
                        "gap": round(gap, 2),
                        "recommendation": recommendation,
                        "learningResource": learning_resource,
                        "skillName": skill_name,
                        "gapSeverity": "critical" if gap >= 0.5 else "important" if gap >= 0.3 else "moderate",
                        "suggestion": recommendation,
                        "priority": "critical" if importance == "high" and gap >= 0.5 else "important" if gap >= 0.3 else "medium",
                        "jobsRequiring": jobs_requiring,
                        "currentLevel": round(student_level, 2),
                        "requiredLevel": round(market_level, 2),
                        "learningResources": learning_resources,
                    }
                )
            else:
                strengths.append(skill_name)

        # Sort gaps by importance and gap size
        importance_order = {"high": 0, "medium": 1, "low": 2}
        gap_analysis.sort(
            key=lambda x: (importance_order.get(x["importance"], 3), -x["gap"])
        )

        # Calculate overall readiness (inverse of average gap)
        if request.marketSkills:
            avg_gap = total_gap_score / len(request.marketSkills)
            readiness = max(0, min(100, round((1 - avg_gap) * 100, 1)))
        else:
            readiness = 100.0

        logger.info(
            "Skill gap analysis completed",
            target_role=request.targetRole,
            total_gaps=len(gap_analysis),
            critical_gaps=critical_gaps,
            readiness=readiness,
        )

        return {
            "targetRole": request.targetRole,
            "overallReadiness": readiness,
            "totalGaps": len(gap_analysis),
            "criticalGaps": critical_gaps,
            "gapAnalysis": gap_analysis,
            "strengths": strengths,
        }

    except Exception as e:
        logger.error("Skill gap analysis failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap analysis failed: {str(e)}",
        )


@router.post(
    "/suggest",
    response_model=SkillSuggestResponse,
    status_code=status.HTTP_200_OK,
    summary="Suggest skills based on partial input",
    description="Get skill suggestions based on a partial skill name query.",
)
async def suggest_skills(request: SkillSuggestRequest) -> Dict[str, Any]:
    """Suggest skills matching a partial query.

    Args:
        request: Contains partial skill name and limit.

    Returns:
        List of matching skill suggestions.
    """
    try:
        extractor = _get_extractor()
        suggestions = extractor.suggest_skills(request.query, request.limit)

        return {"suggestions": suggestions}

    except Exception as e:
        logger.error("Skill suggestion failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill suggestion failed: {str(e)}",
        )


@router.get(
    "/taxonomy",
    status_code=status.HTTP_200_OK,
    summary="Get the full skill taxonomy",
    description="Retrieve the complete list of skills in the taxonomy with categories.",
)
async def get_taxonomy(
    category: Optional[str] = None,
) -> Dict[str, Any]:
    """Get the skill taxonomy.

    Args:
        category: Optional filter by category.

    Returns:
        List of skills in the taxonomy.
    """
    try:
        extractor = _get_extractor()
        skills = extractor.get_all_skills()

        if category:
            skills = [s for s in skills if s["category"] == category]

        # Group by category
        grouped = {}
        for skill in skills:
            cat = skill["category"]
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(skill["name"])

        return {
            "total_count": len(skills),
            "categories": list(grouped.keys()),
            "skills_by_category": grouped,
        }

    except Exception as e:
        logger.error("Failed to get taxonomy", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get taxonomy: {str(e)}",
        )


@router.post(
    "/embed",
    status_code=status.HTTP_200_OK,
    summary="Generate embedding for skill text",
    description="Generate a 384-dimensional embedding vector for a skill or text.",
)
async def generate_skill_embedding(request: Dict[str, str]) -> Dict[str, Any]:
    """Generate embedding for a skill text.

    Args:
        request: Dict with 'text' key.

    Returns:
        Dict with embedding vector.
    """
    text = request.get("text", "")
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'text' field is required",
        )

    try:
        embedding = generate_embedding(text)
        from config import settings
        return {"textHash": hashlib.sha256(text.strip().encode("utf-8")).hexdigest(), "embedding": embedding, "dimension": len(embedding), "model": settings.EMBEDDING_MODEL, "modelVersion": settings.EMBEDDING_MODEL_VERSION}
    except Exception as e:
        logger.error("Embedding generation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding generation failed: {str(e)}",
        )


def _get_learning_resource(skill_name: str) -> str:
    """Get a learning resource URL for a skill.

    Args:
        skill_name: Name of the skill.

    Returns:
        str: URL to a learning resource.
    """
    resources = resources_for_skill(skill_name)
    return resources[0]["url"] if resources else ""
