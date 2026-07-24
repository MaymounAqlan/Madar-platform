"""
MADAR AI Engine - Matching Router

API endpoints for calculating job-student match scores, including
single match calculation and batch processing.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.matcher import JobStudentMatcher
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Shared matcher instance
_matcher: Optional[JobStudentMatcher] = None


def _get_matcher() -> JobStudentMatcher:
    """Get or create the job-student matcher instance."""
    global _matcher
    if _matcher is None:
        _matcher = JobStudentMatcher()
    return _matcher


# ============================================================================
# Request/Response Models
# ============================================================================


class StudentSkill(BaseModel):
    """A student's skill with proficiency level."""

    name: str = Field(..., description="Skill name")
    level: float = Field(
        ..., ge=0.0, le=1.0, description="Proficiency level (0.0-1.0)"
    )


class JobRequiredSkill(BaseModel):
    """A skill required by a job posting."""

    name: str = Field(..., description="Skill name")
    weight: float = Field(
        default=0.1, ge=0.0, le=1.0, description="Importance weight (0.0-1.0)"
    )
    required: bool = True
    requiredLevel: float = Field(default=1.0, ge=0.01, le=1.0)


class MatchCalculateRequest(BaseModel):
    """Request to calculate a match score between a student and a job."""

    studentId: str = Field(..., description="Unique student identifier")
    jobId: str = Field(..., description="Unique job identifier")
    studentSkills: List[StudentSkill] = Field(
        default_factory=list, description="Student's skills with levels"
    )
    studentEmbedding: List[float] = Field(
        default_factory=list, description="Student's 384-dim CV embedding"
    )
    jobRequiredSkills: List[JobRequiredSkill] = Field(
        default_factory=list, description="Job's required skills with weights"
    )
    jobEmbedding: List[float] = Field(
        default_factory=list, description="Job's 384-dim description embedding"
    )
    jobExperienceRequired: int = Field(
        default=0, ge=0, description="Years of experience required"
    )
    studentExperienceYears: int = Field(
        default=0, ge=0, description="Student's years of experience"
    )
    studentProjects: List[str] = Field(
        default_factory=list, description="Student's project descriptions"
    )
    jobProjectsHint: List[str] = Field(
        default_factory=list,
        description="Keywords from job relevant to projects",
    )
    weights: Optional[Dict[str, float]] = None
    thresholds: Optional[Dict[str, float]] = None


class MatchDetailItem(BaseModel):
    """A single skill match detail."""

    skillName: str
    required: bool
    studentLevel: float
    requiredWeight: float
    requiredLevel: float = 1.0
    matchPercentage: float


class SkillsMatchBreakdown(BaseModel):
    """Skills match component of the breakdown."""

    score: float
    weight: float
    details: List[MatchDetailItem]


class ExperienceMatchBreakdown(BaseModel):
    """Experience match component of the breakdown."""

    score: float
    weight: float


class ProjectsMatchBreakdown(BaseModel):
    """Projects match component of the breakdown."""

    score: float
    weight: float


class SemanticMatchBreakdown(BaseModel):
    """Semantic match component of the breakdown."""

    score: float
    weight: float


class MatchBreakdown(BaseModel):
    """Complete match score breakdown."""

    skillsMatch: SkillsMatchBreakdown
    experienceMatch: ExperienceMatchBreakdown
    projectsMatch: ProjectsMatchBreakdown
    semanticMatch: SemanticMatchBreakdown


class MissingSkillItem(BaseModel):
    """A missing skill with importance."""

    name: str
    importance: str
    learningResource: str


class MatchingSkillItem(BaseModel):
    """A matching skill with levels."""

    name: str
    studentLevel: float
    matchPercentage: float
    levelLabel: str


class MatchCalculateResponse(BaseModel):
    """Response containing the complete match score."""

    overallScore: float
    skillsScore: float
    experienceScore: float
    projectsScore: float
    semanticScore: float
    mandatorySkillsPenalty: float
    breakdown: MatchBreakdown
    missingSkills: List[MissingSkillItem]
    matchingSkills: List[MatchingSkillItem]
    recommendation: str
    recommendationLevel: str
    matchReasons: List[str]
    riskFactors: List[str]
    explanation: Dict[str, Any]
    acceptanceProbability: Dict[str, Any]
    modelVersion: str


class BatchMatchItem(BaseModel):
    """A single match request in a batch."""

    studentId: str
    jobId: str
    studentSkills: List[StudentSkill] = []
    studentEmbedding: List[float] = []
    jobRequiredSkills: List[JobRequiredSkill] = []
    jobEmbedding: List[float] = []
    jobExperienceRequired: int = 0
    studentExperienceYears: int = 0
    studentProjects: List[str] = []
    jobProjectsHint: List[str] = []


class BatchMatchRequest(BaseModel):
    """Request to calculate batch match scores."""

    matches: List[BatchMatchItem] = Field(
        ..., min_length=1, max_length=100, description="List of match requests"
    )


class BatchMatchResult(BaseModel):
    """A single result in a batch match response."""

    studentId: str
    jobId: str
    match: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BatchMatchResponse(BaseModel):
    """Response containing batch match results."""

    results: List[BatchMatchResult]
    total_processed: int
    successful: int
    failed: int


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/calculate",
    response_model=MatchCalculateResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate match score between student and job",
    description="""
    Calculate a comprehensive match score between a student profile and a job posting.

    The scoring algorithm uses four weighted components:
    - **Skills Match (60%)**: Compares student skill levels against job requirements
    - **Experience Match (20%)**: Compares years of experience
    - **Projects Match (10%)**: Evaluates project relevance to job requirements
    - **Semantic Match (10%)**: Cosine similarity of embedding vectors

    Returns a detailed breakdown with missing skills and recommendations.
    """,
)
async def calculate_match(request: MatchCalculateRequest) -> Dict[str, Any]:
    """Calculate match score between a student and a job."""
    try:
        matcher = JobStudentMatcher()
        if request.weights:
            def norm_w(val):
                return val / 100.0 if val > 1.0 else val
            matcher.weight_skills = norm_w(request.weights.get("skills", matcher.weight_skills * 100))
            matcher.weight_experience = norm_w(request.weights.get("experience", matcher.weight_experience * 100))
            matcher.weight_projects = norm_w(request.weights.get("projects", matcher.weight_projects * 100))
            matcher.weight_semantic = norm_w(request.weights.get("interests", request.weights.get("semantic", matcher.weight_semantic * 100)))
            
            # Re-normalize if sum != 1.0
            tot = matcher.weight_skills + matcher.weight_experience + matcher.weight_projects + matcher.weight_semantic
            if tot > 0 and abs(tot - 1.0) > 0.01:
                matcher.weight_skills /= tot
                matcher.weight_experience /= tot
                matcher.weight_projects /= tot
                matcher.weight_semantic /= tot

        if request.thresholds:
            matcher.THRESHOLD_EXCELLENT = request.thresholds.get("excellent", matcher.THRESHOLD_EXCELLENT)
            matcher.THRESHOLD_GOOD = request.thresholds.get("good", matcher.THRESHOLD_GOOD)
            matcher.THRESHOLD_FAIR = request.thresholds.get("fair", matcher.THRESHOLD_FAIR)

        # Convert Pydantic models to dicts for the matcher
        student_skills = [
            {"name": s.name, "level": s.level} for s in request.studentSkills
        ]
        job_skills = [
            {"name": s.name, "weight": s.weight, "required": s.required, "requiredLevel": s.requiredLevel}
            for s in request.jobRequiredSkills
        ]

        result = matcher.calculate_match(
            student_skills=student_skills,
            student_embedding=request.studentEmbedding,
            job_required_skills=job_skills,
            job_embedding=request.jobEmbedding,
            job_experience_required=request.jobExperienceRequired,
            student_experience_years=request.studentExperienceYears,
            student_projects=request.studentProjects,
            job_projects_hint=request.jobProjectsHint,
        )

        logger.info(
            "Match calculated",
            student_id=request.studentId,
            job_id=request.jobId,
            overall_score=result["overallScore"],
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Match calculation failed",
            student_id=request.studentId,
            job_id=request.jobId,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Match calculation failed: {str(e)}",
        )


@router.post(
    "/batch",
    response_model=BatchMatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate batch match scores",
    description="""
    Calculate match scores for multiple job-student pairs in a single request.

    Supports up to 100 pairs per request. Returns results in the same order
    as the input, with individual error handling for each pair.
    """,
)
async def batch_calculate_matches(
    request: BatchMatchRequest,
) -> Dict[str, Any]:
    """Calculate match scores for multiple pairs.

    Args:
        request: Contains list of match requests.

    Returns:
        List of match results with success/failure counts.
    """
    try:
        matcher = _get_matcher()

        # Convert to format expected by matcher
        match_requests = []
        for item in request.matches:
            match_requests.append(
                {
                    "studentId": item.studentId,
                    "jobId": item.jobId,
                    "studentSkills": [
                        {"name": s.name, "level": s.level}
                        for s in item.studentSkills
                    ],
                    "studentEmbedding": item.studentEmbedding,
                    "jobRequiredSkills": [
                        {"name": s.name, "weight": s.weight, "required": s.required, "requiredLevel": s.requiredLevel}
                        for s in item.jobRequiredSkills
                    ],
                    "jobEmbedding": item.jobEmbedding,
                    "jobExperienceRequired": item.jobExperienceRequired,
                    "studentExperienceYears": item.studentExperienceYears,
                    "studentProjects": item.studentProjects,
                    "jobProjectsHint": item.jobProjectsHint,
                }
            )

        results = matcher.calculate_batch_matches(match_requests)

        successful = sum(1 for r in results if r.get("match") is not None)
        failed = len(results) - successful

        logger.info(
            "Batch matches calculated",
            total=len(results),
            successful=successful,
            failed=failed,
        )

        return {
            "results": results,
            "total_processed": len(results),
            "successful": successful,
            "failed": failed,
        }

    except Exception as e:
        logger.error("Batch match calculation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch match calculation failed: {str(e)}",
        )


@router.get(
    "/weights",
    status_code=status.HTTP_200_OK,
    summary="Get matching algorithm weights",
    description="Retrieve the current matching algorithm weights and thresholds.",
)
async def get_weights() -> Dict[str, Any]:
    """Get the matching algorithm configuration.

    Returns:
        Dict with weights and thresholds.
    """
    from config import settings

    return {
        "weights": {
            "skills": settings.MATCH_WEIGHT_SKILLS,
            "experience": settings.MATCH_WEIGHT_EXPERIENCE,
            "projects": settings.MATCH_WEIGHT_PROJECTS,
            "semantic": settings.MATCH_WEIGHT_SEMANTIC,
        },
        "thresholds": {
            "excellent": settings.MATCH_THRESHOLD_EXCELLENT,
            "good": settings.MATCH_THRESHOLD_GOOD,
            "fair": settings.MATCH_THRESHOLD_FAIR,
        },
        "skill_levels": {
            "expert": settings.SKILL_LEVEL_EXPERT,
            "advanced": settings.SKILL_LEVEL_ADVANCED,
            "intermediate": settings.SKILL_LEVEL_INTERMEDIATE,
            "beginner": settings.SKILL_LEVEL_BEGINNER,
        },
    }
