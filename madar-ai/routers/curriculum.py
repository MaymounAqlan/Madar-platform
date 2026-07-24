"""Curriculum-to-market analysis endpoints."""

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class CurriculumSkill(BaseModel):
    name: str
    level: float = Field(default=0.0, ge=0, le=1)
    courses: List[Dict[str, Any]] = Field(default_factory=list)


class MarketSkill(BaseModel):
    name: str
    demandScore: float = Field(default=0.0, ge=0, le=100)
    level: float = Field(default=0.7, ge=0, le=1)


class CurriculumAnalysisRequest(BaseModel):
    departmentId: str
    curriculumSkills: List[CurriculumSkill] = Field(default_factory=list)
    marketSkills: List[MarketSkill] = Field(default_factory=list)


@router.post("/analyze")
async def analyze_curriculum(request: CurriculumAnalysisRequest) -> Dict[str, Any]:
    """Compare normalized curriculum coverage with current market demand."""
    curriculum = {item.name.casefold(): item for item in request.curriculumSkills}
    covered: List[Dict[str, Any]] = []
    partial: List[Dict[str, Any]] = []
    missing: List[Dict[str, Any]] = []

    weighted_coverage = 0.0
    total_weight = 0.0
    for market_skill in request.marketSkills:
        weight = max(market_skill.demandScore, 1.0)
        total_weight += weight
        current = curriculum.get(market_skill.name.casefold())
        current_level = current.level if current else 0.0
        required_level = max(market_skill.level, 0.01)
        ratio = min(current_level / required_level, 1.0)
        weighted_coverage += ratio * weight
        item = {
            "name": market_skill.name,
            "demandScore": market_skill.demandScore,
            "coverageLevel": round(current_level * 5, 2),
            "courses": current.courses if current else [],
        }
        if ratio >= 0.8:
            covered.append(item)
        elif ratio > 0:
            partial.append(item)
        else:
            missing.append(item)

    alignment = round((weighted_coverage / total_weight) * 100) if total_weight else None
    emerging = sorted(request.marketSkills, key=lambda item: item.demandScore, reverse=True)
    recommendations = [
        {
            "title": f"Strengthen curriculum coverage for {item['name']}",
            "description": f"Add or update practical content for {item['name']}, with market demand at {item['demandScore']:.0f}/100.",
            "type": "add_course",
            "evidence": [f"Market demand score: {item['demandScore']:.0f}/100", "The skill is missing or insufficiently covered"],
            "marketDemand": item["demandScore"],
            "studentImpact": f"Improves graduate readiness for roles requiring {item['name']}.",
            "priority": "critical" if item["demandScore"] >= 90 else "high" if item["demandScore"] >= 75 else "medium",
        }
        for item in sorted(missing + partial, key=lambda value: value["demandScore"], reverse=True)[:5]
    ]
    return {
        "departmentId": request.departmentId,
        "alignmentPercentage": alignment,
        "coveredSkills": covered,
        "partiallyCoveredSkills": partial,
        "missingSkills": missing,
        "emergingSkills": [
            {"name": item.name, "demandScore": item.demandScore}
            for item in emerging
            if item.demandScore >= 80
        ][:10],
        "actionableRecommendations": recommendations,
        "source": "MADAR AI curriculum-market analysis",
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
    }
