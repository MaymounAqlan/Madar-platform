"""
MADAR AI Engine - Job-Student Matching Algorithm

Implements a weighted multi-factor matching algorithm that computes
compatibility scores between students and job postings using skill
matching, experience comparison, project relevance, and semantic similarity.
"""

from typing import Any, Dict, List, Optional

from config import settings
from models.embeddings import cosine_similarity
from services.learning_resources import resources_for_skill
from utils.logger import get_logger

logger = get_logger(__name__)


class JobStudentMatcher:
    """Computes match scores between students and job postings.

    Uses a weighted scoring system:
    - Skills Match (60%): Individual skill level comparison
    - Experience Match (20%): Years of experience comparison
    - Projects Match (10%): Project relevance scoring
    - Semantic Match (10%): Cosine similarity of embeddings
    """

    # Skill level thresholds for matching
    LEVEL_EXPERT = settings.SKILL_LEVEL_EXPERT  # 0.80
    LEVEL_ADVANCED = settings.SKILL_LEVEL_ADVANCED  # 0.60
    LEVEL_INTERMEDIATE = settings.SKILL_LEVEL_INTERMEDIATE  # 0.40
    LEVEL_BEGINNER = settings.SKILL_LEVEL_BEGINNER  # 0.20

    # Level names for display
    LEVEL_NAMES = {
        (LEVEL_EXPERT, 1.0): "Expert",
        (LEVEL_ADVANCED, LEVEL_EXPERT): "Advanced",
        (LEVEL_INTERMEDIATE, LEVEL_ADVANCED): "Intermediate",
        (LEVEL_BEGINNER, LEVEL_INTERMEDIATE): "Beginner",
        (0.0, LEVEL_BEGINNER): "Novice",
    }

    # Recommendation thresholds
    THRESHOLD_EXCELLENT = settings.MATCH_THRESHOLD_EXCELLENT  # 85.0
    THRESHOLD_GOOD = settings.MATCH_THRESHOLD_GOOD  # 70.0
    THRESHOLD_FAIR = settings.MATCH_THRESHOLD_FAIR  # 50.0

    def __init__(self):
        """Initialize the matcher with configuration weights."""
        configured = [
            max(0.0, settings.MATCH_WEIGHT_SKILLS),
            max(0.0, settings.MATCH_WEIGHT_EXPERIENCE),
            max(0.0, settings.MATCH_WEIGHT_PROJECTS),
            max(0.0, settings.MATCH_WEIGHT_SEMANTIC),
        ]
        total = sum(configured)
        if total <= 0:
            configured, total = [0.60, 0.20, 0.10, 0.10], 1.0
        self.weight_skills, self.weight_experience, self.weight_projects, self.weight_semantic = [
            value / total for value in configured
        ]

    def calculate_match(
        self,
        student_skills: List[Dict[str, Any]],
        student_embedding: List[float],
        job_required_skills: List[Dict[str, Any]],
        job_embedding: List[float],
        job_experience_required: int = 0,
        student_experience_years: int = 0,
        student_projects: Optional[List[str]] = None,
        job_projects_hint: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Calculate a comprehensive match score between a student and a job.

        Args:
            student_skills: List of student skills with 'name' and 'level' keys.
            student_embedding: The student's CV embedding vector.
            job_required_skills: List of required skills with 'name' and 'weight' keys.
            job_embedding: The job description embedding vector.
            job_experience_required: Years of experience required by the job.
            student_experience_years: Years of experience the student has.
            student_projects: List of student project descriptions.
            job_projects_hint: Keywords from the job relevant to projects.

        Returns:
            Dict containing overall score, breakdown, missing skills,
            matching skills, and recommendation.
        """
        if student_projects is None:
            student_projects = []
        if job_projects_hint is None:
            job_projects_hint = []

        logger.debug(
            "Calculating match",
            student_skills_count=len(student_skills),
            job_skills_count=len(job_required_skills),
        )

        # Calculate individual component scores
        skills_result = self._calculate_skills_match(
            student_skills, job_required_skills
        )
        experience_score = self._calculate_experience_match(
            job_experience_required, student_experience_years
        )
        projects_score = self._calculate_projects_match(
            student_projects, job_required_skills, job_projects_hint
        )
        semantic_score = self._calculate_semantic_match(
            student_embedding, job_embedding
        )

        # Compute weighted overall score
        weighted_score = (
            skills_result["score"] * self.weight_skills
            + experience_score * self.weight_experience
            + projects_score * self.weight_projects
            + semantic_score * self.weight_semantic
        )
        mandatory_penalty = self._mandatory_skills_penalty(job_required_skills, skills_result["details"])
        overall_score = weighted_score - mandatory_penalty

        # Round to one decimal place
        overall_score = round(overall_score, 1)

        # Clamp to [0, 100]
        overall_score = max(0.0, min(100.0, overall_score))

        # Identify missing and matching skills
        missing_skills = self._identify_missing_skills(
            student_skills, job_required_skills
        )
        matching_skills = self._identify_matching_skills(
            student_skills, job_required_skills, skills_result["details"]
        )

        # Generate recommendation
        recommendation = self._generate_recommendation(
            overall_score, missing_skills, skills_result["score"]
        )
        explanation = self._build_explanation(
            overall_score,
            matching_skills,
            missing_skills,
            experience_score,
            projects_score,
            semantic_score,
            mandatory_penalty,
        )
        acceptance = self.calculate_acceptance_probability(
            overall_score,
            student_projects_count=len(student_projects),
        )

        result = {
            "overallScore": overall_score,
            "skillsScore": round(skills_result["score"], 1),
            "experienceScore": round(experience_score, 1),
            "projectsScore": round(projects_score, 1),
            "semanticScore": round(semantic_score, 1),
            "mandatorySkillsPenalty": round(mandatory_penalty, 1),
            "breakdown": {
                "skillsMatch": {
                    "score": round(skills_result["score"], 1),
                    "weight": self.weight_skills,
                    "details": skills_result["details"],
                },
                "experienceMatch": {
                    "score": round(experience_score, 1),
                    "weight": self.weight_experience,
                },
                "projectsMatch": {
                    "score": round(projects_score, 1),
                    "weight": self.weight_projects,
                },
                "semanticMatch": {
                    "score": round(semantic_score, 1),
                    "weight": self.weight_semantic,
                },
            },
            "missingSkills": missing_skills,
            "matchingSkills": matching_skills,
            "recommendation": recommendation,
            "recommendationLevel": self._recommendation_level(overall_score),
            "matchReasons": explanation["strengthFactors"],
            "riskFactors": explanation["weaknessFactors"],
            "explanation": explanation,
            "acceptanceProbability": acceptance,
            "modelVersion": settings.APP_VERSION,
        }

        logger.debug(
            "Match calculation complete",
            overall_score=overall_score,
        )

        return result

    def calculate_batch_matches(
        self,
        match_requests: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Calculate match scores for multiple job-student pairs.

        Args:
            match_requests: List of dicts, each containing student and job data.

        Returns:
            List of match result dicts, each with 'studentId', 'jobId', and 'match' keys.
        """
        results = []

        for request in match_requests:
            student_id = request.get("studentId", "")
            job_id = request.get("jobId", "")

            try:
                match_result = self.calculate_match(
                    student_skills=request.get("studentSkills", []),
                    student_embedding=request.get("studentEmbedding", []),
                    job_required_skills=request.get("jobRequiredSkills", []),
                    job_embedding=request.get("jobEmbedding", []),
                    job_experience_required=request.get(
                        "jobExperienceRequired", 0
                    ),
                    student_experience_years=request.get(
                        "studentExperienceYears", 0
                    ),
                    student_projects=request.get("studentProjects", []),
                    job_projects_hint=request.get("jobProjectsHint", []),
                )

                results.append(
                    {
                        "studentId": student_id,
                        "jobId": job_id,
                        "match": match_result,
                    }
                )
            except Exception as e:
                logger.error(
                    "Batch match calculation failed",
                    student_id=student_id,
                    job_id=job_id,
                    error=str(e),
                )
                results.append(
                    {
                        "studentId": student_id,
                        "jobId": job_id,
                        "match": None,
                        "error": str(e),
                    }
                )

        return results

    def _calculate_skills_match(
        self,
        student_skills: List[Dict[str, Any]],
        job_required_skills: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Calculate the skills match score.

        For each required skill, find the student's skill level and compute
        a match percentage based on skill level thresholds.

        Args:
            student_skills: Student's skills with 'name' and 'level'.
            job_required_skills: Job's required skills with 'name' and 'weight'.

        Returns:
            Dict with 'score' (0-100) and 'details' (list of per-skill matches).
        """
        if not job_required_skills:
            return {"score": 100.0, "details": []}

        # Build student skill lookup (case-insensitive)
        student_skill_map: Dict[str, float] = {}
        for skill in student_skills:
            name = skill.get("name", "").lower().strip()
            level = skill.get("level", 0.0)
            if name:
                student_skill_map[name] = max(
                    student_skill_map.get(name, 0.0), level
                )

        total_weight = 0.0
        weighted_score = 0.0
        details = []

        for req_skill in job_required_skills:
            req_name = req_skill.get("name", "").strip()
            req_weight = max(0.0, float(req_skill.get("weight", 1.0)))
            required_level = max(0.01, min(1.0, float(req_skill.get("requiredLevel", 1.0))))
            req_name_lower = req_name.lower()

            total_weight += req_weight

            student_level = student_skill_map.get(req_name_lower, 0.0)

            # Calculate match percentage based on level
            match_percentage = min(100.0, (student_level / required_level) * 100)

            weighted_score += match_percentage * req_weight

            details.append(
                {
                    "skillName": req_name,
                    "required": bool(req_skill.get("required", True)),
                    "studentLevel": round(student_level, 2),
                    "requiredWeight": req_weight,
                    "requiredLevel": required_level,
                    "matchPercentage": round(match_percentage, 1),
                }
            )

        # Add bonus for extra skills the student has beyond requirements
        extra_skills = set(student_skill_map.keys()) - {
            s.get("name", "").lower().strip() for s in job_required_skills
        }
        extra_skill_bonus = min(len(extra_skills) * 2, 10)  # Cap at 10 points

        if total_weight > 0:
            base_score = weighted_score / total_weight
        else:
            base_score = 0.0

        final_score = min(100.0, base_score + extra_skill_bonus)

        return {"score": final_score, "details": details}

    def _calculate_experience_match(
        self,
        job_experience_required: int,
        student_experience_years: int,
    ) -> float:
        """Calculate the experience match score.

        Compares required vs actual years of experience.

        Args:
            job_experience_required: Years required by the job.
            student_experience_years: Years the student has.

        Returns:
            float: Experience match score (0-100).
        """
        if job_experience_required <= 0:
            # No experience required = full marks
            return 100.0

        if student_experience_years <= 0:
            return 0.0

        ratio = student_experience_years / job_experience_required

        if ratio >= 1.0:
            # Meets or exceeds requirement
            return 100.0
        elif ratio >= 0.75:
            return 85.0
        elif ratio >= 0.5:
            return 70.0
        elif ratio >= 0.25:
            return 50.0
        else:
            return 30.0

    def _calculate_projects_match(
        self,
        student_projects: List[str],
        job_required_skills: List[Dict[str, Any]],
        job_projects_hint: Optional[List[str]] = None,
    ) -> float:
        """Calculate the projects relevance score.

        Analyzes student projects for relevance to job requirements.

        Args:
            student_projects: List of student project descriptions.
            job_required_skills: Required skills for the job.
            job_projects_hint: Keywords relevant to job projects.

        Returns:
            float: Projects match score (0-100).
        """
        if not student_projects:
            return 0.0

        if not job_required_skills:
            return 100.0

        if job_projects_hint is None:
            job_projects_hint = []

        # Build set of relevant keywords from job skills
        skill_keywords = set()
        for skill in job_required_skills:
            skill_name = skill.get("name", "").lower()
            skill_keywords.add(skill_name)
            # Add common variations
            skill_keywords.add(skill_name.replace(" ", ""))
            skill_keywords.add(skill_name.replace(".", ""))
            skill_keywords.add(skill_name.replace(".", " "))

        # Add job project hints
        for hint in job_projects_hint:
            skill_keywords.add(hint.lower())

        # Score each project
        project_scores = []
        for project in student_projects:
            project_lower = project.lower()
            matched_keywords = 0

            for keyword in skill_keywords:
                if keyword and keyword in project_lower:
                    matched_keywords += 1

            if matched_keywords > 0:
                project_scores.append(
                    min(100, matched_keywords * 20 + 40)
                )
            else:
                project_scores.append(30)

        # Average project scores
        if project_scores:
            avg_score = sum(project_scores) / len(project_scores)
        else:
            avg_score = 50.0

        # Bonus for number of projects (up to 5)
        project_count_bonus = min(len(student_projects) * 3, 15)

        return min(100.0, avg_score + project_count_bonus)

    def _calculate_semantic_match(
        self,
        student_embedding: List[float],
        job_embedding: List[float],
    ) -> float:
        """Calculate semantic similarity using cosine similarity of embeddings.

        Args:
            student_embedding: Student's CV embedding vector.
            job_embedding: Job description embedding vector.

        Returns:
            float: Semantic match score (0-100).
        """
        if not student_embedding or not job_embedding:
            return 0.0

        try:
            similarity = cosine_similarity(student_embedding, job_embedding)
            # Convert [-1, 1] or [0, 1] to [0, 100]
            return round(similarity * 100, 1)
        except Exception as e:
            logger.error("Semantic match calculation failed", error=str(e))
            return 50.0

    def _level_to_match_percentage(self, level: float) -> float:
        """Convert a skill level to a match percentage.

        Uses thresholds defined in settings:
        - Expert (0.8-1.0) -> 100%
        - Advanced (0.6-0.79) -> 80%
        - Intermediate (0.4-0.59) -> 60%
        - Beginner (0.2-0.39) -> 40%
        - Novice (0-0.19) -> 20%

        Args:
            level: Skill level between 0 and 1.

        Returns:
            float: Match percentage.
        """
        if level >= self.LEVEL_EXPERT:
            return 100.0
        elif level >= self.LEVEL_ADVANCED:
            return 80.0
        elif level >= self.LEVEL_INTERMEDIATE:
            return 60.0
        elif level >= self.LEVEL_BEGINNER:
            return 40.0
        elif level > 0:
            return 20.0
        else:
            return 0.0

    def _identify_missing_skills(
        self,
        student_skills: List[Dict[str, Any]],
        job_required_skills: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Identify skills required by the job that the student lacks.

        Args:
            student_skills: Student's skills.
            job_required_skills: Job's required skills.

        Returns:
            List of missing skill dicts with name and importance.
        """
        student_skill_names = {
            s.get("name", "").lower().strip() for s in student_skills
        }

        missing = []
        for req_skill in job_required_skills:
            req_name = req_skill.get("name", "").strip()
            req_weight = req_skill.get("weight", 0.5)

            if req_name.lower() not in student_skill_names:
                # Determine importance based on weight
                if req_weight >= 0.3:
                    importance = "high"
                elif req_weight >= 0.15:
                    importance = "medium"
                else:
                    importance = "low"

                missing.append(
                    {
                        "name": req_name,
                        "importance": importance,
                        "learningResource": self._get_learning_resource(
                            req_name
                        ),
                        "learningResources": resources_for_skill(req_name),
                        "required": bool(req_skill.get("required", True)),
                    }
                )

        return missing

    def _identify_matching_skills(
        self,
        student_skills: List[Dict[str, Any]],
        job_required_skills: List[Dict[str, Any]],
        skill_details: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Identify skills that match between student and job.

        Args:
            student_skills: Student's skills.
            job_required_skills: Job's required skills.
            skill_details: Details from skills match calculation.

        Returns:
            List of matching skill dicts.
        """
        matching = []

        for detail in skill_details:
            if detail["matchPercentage"] > 0:
                matching.append(
                    {
                        "name": detail["skillName"],
                        "studentLevel": detail["studentLevel"],
                        "matchPercentage": detail["matchPercentage"],
                        "levelLabel": self._get_level_label(
                            detail["studentLevel"]
                        ),
                    }
                )

        return matching

    def _generate_recommendation(
        self,
        overall_score: float,
        missing_skills: List[Dict[str, Any]],
        skills_score: float,
    ) -> str:
        """Generate a human-readable recommendation based on the match score.

        Args:
            overall_score: The overall match score.
            missing_skills: List of missing skills.
            skills_score: The skills component score.

        Returns:
            str: Recommendation text.
        """
        high_missing = sum(1 for s in missing_skills if s["importance"] == "high")

        if overall_score >= self.THRESHOLD_EXCELLENT:
            if high_missing == 0:
                return "Excellent match - Strong recommendation for immediate interview"
            else:
                return f"Strong match - Recommend interview with focus on {high_missing} key skill gap(s)"
        elif overall_score >= self.THRESHOLD_GOOD:
            if high_missing <= 1:
                return "Good match - Recommend interview with skill gap assessment"
            else:
                return f"Good match - Consider with upskilling plan for {high_missing} missing skills"
        elif overall_score >= self.THRESHOLD_FAIR:
            return "Fair match - Consider for junior role or with training commitment"
        else:
            return "Weak match - Not recommended without significant skill development"

    def _mandatory_skills_penalty(self, required_skills: List[Dict[str, Any]], details: List[Dict[str, Any]]) -> float:
        mandatory = {str(skill.get("name", "")).casefold(): max(0.0, float(skill.get("weight", 1.0))) for skill in required_skills if skill.get("required", True)}
        if not mandatory:
            return 0.0
        missing_weight = sum(mandatory.get(str(item.get("skillName", "")).casefold(), 0.0) for item in details if item.get("required") and item.get("matchPercentage", 0) <= 0)
        total_weight = sum(mandatory.values()) or 1.0
        return min(40.0, (missing_weight / total_weight) * 40.0)

    def _recommendation_level(self, score: float) -> str:
        if score >= self.THRESHOLD_EXCELLENT:
            return "excellent"
        if score >= self.THRESHOLD_GOOD:
            return "good"
        if score >= self.THRESHOLD_FAIR:
            return "fair"
        return "weak"

    def _build_explanation(self, score: float, matching: List[Dict[str, Any]], missing: List[Dict[str, Any]], experience: float, projects: float, semantic: float, penalty: float) -> Dict[str, Any]:
        strengths = [f"Matched {item['name']} at {item['matchPercentage']:.0f}%" for item in matching[:5]]
        if experience >= 80:
            strengths.append("The stated experience meets the job requirement.")
        if projects >= 70:
            strengths.append("Projects contain technologies relevant to the role.")
        weaknesses = [f"Missing required skill: {item['name']}" for item in missing if item.get("required")][:5]
        if experience < 60:
            weaknesses.append("The available experience is below the requested level.")
        if semantic == 0:
            weaknesses.append("Semantic evidence is unavailable because one or both embeddings are missing.")
        actions = [f"Build a verifiable project using {item['name']}." for item in missing[:3]]
        return {"summary": f"Evidence-based match score: {score:.1f}/100.", "strengthFactors": strengths, "weaknessFactors": weaknesses, "missingSkills": [item["name"] for item in missing], "mandatorySkillsPenalty": round(penalty, 1), "improvementActions": actions}

    def _get_level_label(self, level: float) -> str:
        """Get a human-readable label for a skill level.

        Args:
            level: Skill level (0-1).

        Returns:
            str: Level label.
        """
        for (low, high), label in self.LEVEL_NAMES.items():
            if low <= level <= high:
                return label
        return "Novice"

    def calculate_acceptance_probability(
        self,
        match_score: float,
        student_gpa: Optional[float] = None,
        student_certifications_count: int = 0,
        student_projects_count: int = 0,
        student_readiness_score: Optional[float] = None,
        market_competition_level: str = "medium",
        historical_acceptance_rate: Optional[float] = None,
        historical_sample_size: int = 0,
    ) -> Dict[str, Any]:
        """Calculate the acceptance probability for a candidate.

        FR-AI-011: Estimates acceptance probability using historical patterns
        and profile strength indicators.

        Args:
            match_score: Overall match score (0-100).
            student_gpa: Student GPA (0-4 or 0-5).
            student_certifications_count: Number of certifications.
            student_projects_count: Number of projects.
            student_readiness_score: Readiness score (0-100).
            market_competition_level: Competition level (low/medium/high).
            historical_acceptance_rate: Historical rate for similar profiles.

        Returns:
            Dict with score, confidence, and influencing factors.
        """
        factors = []

        # Match score factor (40%)
        match_contribution = min(match_score / 100 * 40, 40)
        factors.append({
            "factor": "Match Score",
            "impact": round(match_contribution, 1),
            "weight": 0.40,
            "detail": f"Match score of {match_score}% contributes {round(match_contribution, 1)} points",
        })

        # GPA factor (15%)
        gpa_contribution = 0
        if student_gpa is not None:
            gpa_normalized = min(student_gpa / 4.0 * 15, 15) if student_gpa <= 5 else min(student_gpa / 5.0 * 15, 15)
            gpa_contribution = gpa_normalized
        factors.append({
            "factor": "GPA",
            "impact": round(gpa_contribution, 1),
            "weight": 0.15,
            "detail": f"GPA {student_gpa} contributes {round(gpa_contribution, 1)} points" if student_gpa else "No GPA data",
        })

        # Certifications factor (10%)
        cert_contribution = min(student_certifications_count * 3, 10)
        factors.append({
            "factor": "Certifications",
            "impact": round(cert_contribution, 1),
            "weight": 0.10,
            "detail": f"{student_certifications_count} certifications contribute {round(cert_contribution, 1)} points",
        })

        # Projects factor (10%)
        proj_contribution = min(student_projects_count * 2, 10)
        factors.append({
            "factor": "Projects",
            "impact": round(proj_contribution, 1),
            "weight": 0.10,
            "detail": f"{student_projects_count} projects contribute {round(proj_contribution, 1)} points",
        })

        # Readiness factor (15%)
        readiness_contribution = 0
        if student_readiness_score is not None:
            readiness_contribution = min(student_readiness_score / 100 * 15, 15)
        factors.append({
            "factor": "Readiness Score",
            "impact": round(readiness_contribution, 1),
            "weight": 0.15,
            "detail": f"Readiness {student_readiness_score}% contributes {round(readiness_contribution, 1)} points" if student_readiness_score else "No readiness data",
        })

        # Competition adjustment (10%)
        competition_multiplier = {"low": 1.2, "medium": 1.0, "high": 0.8}
        comp_contribution = 10 * competition_multiplier.get(market_competition_level, 1.0)
        factors.append({
            "factor": "Market Competition",
            "impact": round(comp_contribution, 1),
            "weight": 0.10,
            "detail": f"{market_competition_level} competition contributes {round(comp_contribution, 1)} points",
        })

        # Calculate total probability
        total_score = sum(f["impact"] for f in factors)
        probability = max(0.0, min(100.0, total_score))

        # Confidence based on data completeness
        data_points = sum(1 for v in [student_gpa, student_readiness_score] if v is not None)
        confidence = 0.5 + (data_points / 4) * 0.5  # 0.5 to 1.0

        # Override with historical rate if available
        method = "heuristic_estimate"
        if historical_acceptance_rate is not None and historical_sample_size >= 100:
            probability = (probability * 0.7) + (historical_acceptance_rate * 100 * 0.3)
            confidence = min(confidence + 0.1, 1.0)
            method = "historical_model"

        return {
            "score": round(probability, 1),
            "method": method,
            "modelVersion": settings.APP_VERSION,
            "historicalSampleSize": historical_sample_size,
            "confidence": round(confidence, 2),
            "factors": factors,
            "interpretation": self._interpret_probability(probability),
        }

    def _interpret_probability(self, probability: float) -> str:
        """Generate human-readable interpretation of acceptance probability."""
        if probability >= 80:
            return "Very high probability - Candidate is strongly likely to be accepted"
        elif probability >= 60:
            return "High probability - Candidate has good chances of acceptance"
        elif probability >= 40:
            return "Moderate probability - Acceptance depends on other candidates"
        elif probability >= 20:
            return "Low probability - Candidate may need stronger profile"
        else:
            return "Very low probability - Significant improvement needed"

    def analyze_curriculum_gaps(
        self,
        curriculum_skills: List[Dict[str, Any]],
        market_required_skills: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Analyze curriculum skills against market requirements.

        FR-AI-008: Compare curriculum skills against market requirements
        to identify curriculum gaps.

        Args:
            curriculum_skills: Skills taught in curriculum [{name, level, hours}].
            market_required_skills: Market-demanded skills [{name, demandScore, avgLevel}].

        Returns:
            Dict with aligned skills, missing skills, outdated skills, and recommendations.
        """
        curriculum_map = {s["name"].lower().strip(): s for s in curriculum_skills}
        market_map = {s["name"].lower().strip(): s for s in market_required_skills}

        aligned = []
        missing = []
        outdated = []

        # Find aligned and missing skills
        for market_skill in market_required_skills:
            skill_name = market_skill["name"]
            skill_lower = skill_name.lower().strip()
            demand_score = market_skill.get("demandScore", 0)

            if skill_lower in curriculum_map:
                curr_level = curriculum_map[skill_lower].get("level", 0)
                market_level = market_skill.get("avgLevel", 0)

                if curr_level >= market_level * 0.8:
                    aligned.append({
                        "name": skill_name,
                        "curriculumLevel": curr_level,
                        "marketLevel": market_level,
                        "demandScore": demand_score,
                        "status": "aligned",
                    })
                else:
                    outdated.append({
                        "name": skill_name,
                        "curriculumLevel": curr_level,
                        "marketLevel": market_level,
                        "demandScore": demand_score,
                        "gap": round(market_level - curr_level, 2),
                        "status": "outdated",
                        "recommendation": f"Update curriculum to reach market level {market_level} (currently {curr_level})",
                    })
            else:
                missing.append({
                    "name": skill_name,
                    "demandScore": demand_score,
                    "marketLevel": market_skill.get("avgLevel", 0),
                    "status": "missing",
                    "recommendation": f"Add new course covering {skill_name} (market demand: {demand_score}%)",
                })

        # Calculate overall alignment score
        total_market_skills = len(market_required_skills)
        aligned_count = len(aligned)
        alignment_score = (aligned_count / total_market_skills * 100) if total_market_skills > 0 else 0

        # Sort by demand score
        missing.sort(key=lambda x: x["demandScore"], reverse=True)
        outdated.sort(key=lambda x: x["demandScore"], reverse=True)

        return {
            "alignmentScore": round(alignment_score, 1),
            "totalMarketSkills": total_market_skills,
            "alignedSkills": aligned,
            "alignedCount": len(aligned),
            "missingSkills": missing,
            "missingCount": len(missing),
            "outdatedSkills": outdated,
            "outdatedCount": len(outdated),
            "topPriorityGaps": missing[:5] + outdated[:5],
            "recommendations": [
                f"Add courses for: {', '.join(s['name'] for s in missing[:3])}" if missing else "No missing skills",
                f"Update courses for: {', '.join(s['name'] for s in outdated[:3])}" if outdated else "No outdated skills",
            ],
        }

    def _get_learning_resource(self, skill_name: str) -> str:
        """Get a learning resource URL for a skill.

        Args:
            skill_name: Name of the skill.

        Returns:
            str: URL to a learning resource.
        """
        resources = resources_for_skill(skill_name)
        return resources[0]["url"] if resources else ""
