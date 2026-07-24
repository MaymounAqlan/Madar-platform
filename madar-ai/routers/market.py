"""Market trends calculated from dated job records supplied by NestJS."""

from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class MarketJob(BaseModel):
    jobId: str
    title: str = ""
    status: str = "active"
    jobType: str = ""
    domain: str = ""
    experienceLevel: str = ""
    createdAt: datetime
    skills: List[str] = Field(default_factory=list)


class MarketTrendRequest(BaseModel):
    jobs: List[MarketJob] = Field(default_factory=list, max_length=10000)
    periodStart: datetime
    periodEnd: datetime


@router.post("/trends")
async def analyze_market(request: MarketTrendRequest) -> Dict[str, Any]:
    jobs = [job for job in request.jobs if request.periodStart <= job.createdAt <= request.periodEnd and job.status in {"active", "closed", "expired"}]
    sample_size = len(jobs)
    base = {"sampleSize": sample_size, "period": {"start": request.periodStart.isoformat(), "end": request.periodEnd.isoformat()}, "generatedAt": datetime.now(timezone.utc).isoformat()}
    if sample_size < 3:
        return {**base, "status": "insufficient_data", "message": "At least three dated job postings are required to calculate trends.", "topSkills": [], "risingSkills": [], "decliningSkills": [], "domains": [], "jobTypes": [], "experienceLevels": [], "topTitles": [], "skillPairs": []}

    ordered = sorted(jobs, key=lambda job: job.createdAt)
    midpoint = max(1, len(ordered) // 2)
    earlier, later = ordered[:midpoint], ordered[midpoint:]
    all_skills = Counter(skill.strip() for job in jobs for skill in job.skills if skill.strip())
    earlier_skills = Counter(skill.strip() for job in earlier for skill in job.skills if skill.strip())
    later_skills = Counter(skill.strip() for job in later for skill in job.skills if skill.strip())
    deltas = {skill: later_skills[skill] - earlier_skills[skill] for skill in set(earlier_skills) | set(later_skills)}
    pairs: Counter = Counter()
    for job in jobs:
        unique = sorted(set(skill.strip() for skill in job.skills if skill.strip()))
        for index, first in enumerate(unique):
            for second in unique[index + 1:]:
                pairs[(first, second)] += 1

    return {
        **base,
        "status": "complete",
        "topSkills": [{"name": name, "count": count, "share": round(count / sample_size * 100, 1)} for name, count in all_skills.most_common(20)],
        "risingSkills": [{"name": name, "change": change} for name, change in sorted(deltas.items(), key=lambda item: item[1], reverse=True) if change > 0][:20],
        "decliningSkills": [{"name": name, "change": change} for name, change in sorted(deltas.items(), key=lambda item: item[1]) if change < 0][:20],
        "domains": [{"name": name or "uncategorized", "count": count} for name, count in Counter(job.domain for job in jobs).most_common()],
        "jobTypes": [{"name": name or "unspecified", "count": count} for name, count in Counter(job.jobType for job in jobs).most_common()],
        "experienceLevels": [{"name": name or "unspecified", "count": count} for name, count in Counter(job.experienceLevel for job in jobs).most_common()],
        "topTitles": [{"name": name, "count": count} for name, count in Counter(job.title for job in jobs if job.title).most_common(20)],
        "skillPairs": [{"skills": list(pair), "count": count} for pair, count in pairs.most_common(20)],
    }
