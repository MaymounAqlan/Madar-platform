"""
MADAR AI Engine - Recommendations Router

API endpoints for generating job recommendations for students based on
cosine similarity of embeddings and comprehensive match scoring.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.embeddings import cosine_similarity, cosine_similarity_batch
from models.matcher import JobStudentMatcher
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


def _is_deadline_open(deadline: Optional[datetime]) -> bool:
    if deadline is None:
        return True
    normalized = deadline if deadline.tzinfo else deadline.replace(tzinfo=timezone.utc)
    return normalized >= datetime.now(timezone.utc)

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


class StudentSkillItem(BaseModel):
    """A student's skill with proficiency level."""

    name: str
    level: float = Field(..., ge=0.0, le=1.0)


class JobItem(BaseModel):
    """A job posting with embedding and requirements."""

    jobId: str
    title: str
    company: str = ""
    embedding: List[float]
    requiredSkills: List[Dict[str, Any]] = []
    experienceRequired: int = 0
    location: str = ""
    jobType: str = ""
    status: str = "active"
    deadline: Optional[datetime] = None
    alreadyApplied: bool = False


class JobRecommendationsRequest(BaseModel):
    """Request for job recommendations."""

    studentId: str = Field(..., description="Unique student identifier")
    studentEmbedding: List[float] = Field(
        ..., description="Student's CV embedding vector"
    )
    studentSkills: List[StudentSkillItem] = Field(
        default_factory=list, description="Student's skills"
    )
    studentExperienceYears: int = Field(
        default=0, ge=0, description="Student's years of experience"
    )
    studentProjects: List[str] = Field(
        default_factory=list, description="Student's projects"
    )
    jobs: List[JobItem] = Field(
        ..., min_length=1, max_length=500, description="Available job postings"
    )
    limit: int = Field(
        default=10, ge=1, le=50, description="Maximum recommendations to return"
    )
    minScore: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Minimum match score threshold",
    )


class RecommendedJob(BaseModel):
    """A recommended job with match details."""

    jobId: str
    title: str
    company: str
    location: str
    jobType: str
    matchScore: float
    breakdown: Dict[str, Any]
    matchingSkills: List[str]
    missingSkills: List[str]
    recommendation: str
    semanticSimilarity: float
    rank: int
    matchedSkills: List[str]
    matchReasons: List[str]
    riskFactors: List[str]
    recommendationLevel: str
    generatedAt: str
    modelVersion: str
    acceptanceProbability: Dict[str, Any]
    explanation: Dict[str, Any]
    missingSkillDetails: List[Dict[str, Any]]


class JobRecommendationsResponse(BaseModel):
    """Response containing job recommendations."""

    studentId: str
    recommendations: List[RecommendedJob]
    totalAvailable: int
    totalReturned: int
    averageScore: float


class SimilarStudentsRequest(BaseModel):
    """Request to find similar students based on embeddings."""

    studentEmbedding: List[float] = Field(..., description="Query student embedding")
    candidateEmbeddings: List[Dict[str, Any]] = Field(
        ..., description="Other students with id and embedding"
    )
    limit: int = Field(default=10, ge=1, le=100)


class SimilarStudentResult(BaseModel):
    """A similar student result."""

    studentId: str
    similarity: float


class SimilarStudentsResponse(BaseModel):
    """Response containing similar students."""

    results: List[SimilarStudentResult]


# ============================================================================
# Endpoints
# ============================================================================


@router.post(
    "/jobs",
    response_model=JobRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get top job recommendations for a student",
    description="""
    Generate personalized job recommendations for a student by computing
    match scores against all provided job postings.

    Jobs are ranked by overall match score and filtered by the minimum
    score threshold. Returns detailed breakdowns for each recommendation.
    """,
)
async def get_job_recommendations(
    request: JobRecommendationsRequest,
) -> Dict[str, Any]:
    """Get top job recommendations for a student.

    Args:
        request: Contains student profile and available jobs.

    Returns:
        Ranked list of job recommendations with match details.

    Raises:
        HTTPException: If processing fails.
    """
    try:
        matcher = _get_matcher()

        student_skills = [
            {"name": s.name, "level": s.level} for s in request.studentSkills
        ]

        # Process each job
        scored_jobs = []
        eligible_jobs = [
            job for job in request.jobs
            if job.status == "active"
            and not job.alreadyApplied
            and _is_deadline_open(job.deadline)
        ]
        for job in eligible_jobs:
            try:
                job_skills = [
                    {"name": s.get("name", ""), "weight": s.get("weight", 0.1)}
                    for s in job.requiredSkills
                ]

                # Calculate semantic similarity
                semantic_sim = 0.0
                if request.studentEmbedding and job.embedding:
                    semantic_sim = cosine_similarity(
                        request.studentEmbedding, job.embedding
                    )

                # Calculate full match
                match_result = matcher.calculate_match(
                    student_skills=student_skills,
                    student_embedding=request.studentEmbedding,
                    job_required_skills=job_skills,
                    job_embedding=job.embedding,
                    job_experience_required=job.experienceRequired,
                    student_experience_years=request.studentExperienceYears,
                    student_projects=request.studentProjects,
                )

                if match_result["overallScore"] >= request.minScore:
                    scored_jobs.append(
                        {
                            "job": job,
                            "match": match_result,
                            "semantic_similarity": round(semantic_sim * 100, 1),
                        }
                    )
            except Exception as e:
                logger.warning(
                    "Failed to score job",
                    job_id=job.jobId,
                    error=str(e),
                )
                continue

        # Sort by overall score descending
        scored_jobs.sort(key=lambda x: x["match"]["overallScore"], reverse=True)

        # Take top N
        top_jobs = scored_jobs[: request.limit]

        # Format response
        recommendations = []
        for rank, item in enumerate(top_jobs, start=1):
            job = item["job"]
            match = item["match"]

            matching_skill_names = [
                s["name"] for s in match.get("matchingSkills", [])
            ]
            missing_skill_names = [
                s["name"] for s in match.get("missingSkills", [])
            ]

            recommendations.append(
                {
                    "jobId": job.jobId,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "jobType": job.jobType,
                    "matchScore": match["overallScore"],
                    "breakdown": match["breakdown"],
                    "matchingSkills": matching_skill_names,
                    "missingSkills": missing_skill_names,
                    "recommendation": match["recommendation"],
                    "semanticSimilarity": item["semantic_similarity"],
                    "rank": rank,
                    "matchedSkills": matching_skill_names,
                    "matchReasons": match.get("matchReasons", []),
                    "riskFactors": match.get("riskFactors", []),
                    "recommendationLevel": match.get("recommendationLevel", "weak"),
                    "generatedAt": datetime.now(timezone.utc).isoformat(),
                    "modelVersion": match.get("modelVersion", "unknown"),
                    "acceptanceProbability": match.get("acceptanceProbability", {}),
                    "explanation": match.get("explanation", {}),
                    "missingSkillDetails": match.get("missingSkills", []),
                }
            )

        avg_score = (
            sum(r["matchScore"] for r in recommendations) / len(recommendations)
            if recommendations
            else 0.0
        )

        logger.info(
            "Job recommendations generated",
            student_id=request.studentId,
            total_jobs=len(eligible_jobs),
            recommendations=len(recommendations),
            average_score=round(avg_score, 1),
        )

        return {
            "studentId": request.studentId,
            "recommendations": recommendations,
            "totalAvailable": len(scored_jobs),
            "totalReturned": len(recommendations),
            "averageScore": round(avg_score, 1),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Job recommendations failed",
            student_id=request.studentId,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}",
        )


@router.post(
    "/similar-students",
    response_model=SimilarStudentsResponse,
    status_code=status.HTTP_200_OK,
    summary="Find similar students",
    description="Find students with similar profiles based on embedding cosine similarity.",
)
async def find_similar_students(
    request: SimilarStudentsRequest,
) -> Dict[str, Any]:
    """Find similar students based on embedding similarity.

    Args:
        request: Contains query embedding and candidate embeddings.

    Returns:
        List of similar students ranked by similarity.
    """
    try:
        candidate_ids = [c["studentId"] for c in request.candidateEmbeddings]
        candidate_vectors = [
            c["embedding"] for c in request.candidateEmbeddings
        ]

        similarities = cosine_similarity_batch(
            request.studentEmbedding, candidate_vectors
        )

        # Pair IDs with similarities and sort
        results = [
            {"studentId": sid, "similarity": round(sim * 100, 1)}
            for sid, sim in zip(candidate_ids, similarities)
        ]
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return {"results": results[: request.limit]}

    except Exception as e:
        logger.error("Similar students search failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similar students search failed: {str(e)}",
        )


@router.post(
    "/semantic-search",
    status_code=status.HTTP_200_OK,
    summary="Semantic search over jobs",
    description="""
    Find jobs semantically similar to a query text using vector similarity.

    This is useful for "find jobs like this description" functionality.
    """,
)
async def semantic_job_search(request: Dict[str, Any]) -> Dict[str, Any]:
    """Search for jobs semantically similar to a query.

    Args:
        request: Contains query text and job embeddings.

    Returns:
        Ranked list of semantically similar jobs.
    """
    try:
        from models.embeddings import generate_embedding

        query_text = request.get("query", "")
        jobs = request.get("jobs", [])
        limit = request.get("limit", 10)

        if not query_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'query' field is required",
            )

        if not jobs:
            return {"results": [], "total": 0}

        # Generate query embedding
        query_embedding = generate_embedding(query_text)

        # Compute similarities
        job_ids = [j["jobId"] for j in jobs]
        job_embeddings = [j["embedding"] for j in jobs]

        similarities = cosine_similarity_batch(query_embedding, job_embeddings)

        results = [
            {
                "jobId": jid,
                "similarity": round(sim * 100, 1),
                **{k: v for k, v in job.items() if k != "embedding"},
            }
            for jid, sim, job in zip(job_ids, similarities, jobs)
        ]

        results.sort(key=lambda x: x["similarity"], reverse=True)

        return {"results": results[:limit], "total": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Semantic search failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic search failed: {str(e)}",
        )
