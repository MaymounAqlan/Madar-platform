"""Structured job-description analysis built on the existing skill extractor."""

import hashlib
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from config import settings
from models.embeddings import generate_embedding
from models.skill_extractor import SkillExtractor
from utils.text_cleaner import clean_text


class JobAnalyzer:
    def __init__(self) -> None:
        self.skill_extractor = SkillExtractor()

    def analyze(self, title: str, description: str) -> Dict[str, Any]:
        text = f"{title}\n{description}".strip()
        if not description.strip():
            raise ValueError("Job description cannot be empty")
        skills = self.skill_extractor.extract_skills(text)
        required = self._section(description, ["required", "requirements", "must have", "\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a", "\u0645\u0637\u0644\u0648\u0628"])
        preferred = self._section(description, ["preferred", "nice to have", "\u064a\u0641\u0636\u0644", "\u0645\u064a\u0632\u0629 \u0625\u0636\u0627\u0641\u064a\u0629"])
        required_names = {item.name for item in self.skill_extractor.extract_skills(required)}
        preferred_names = {item.name for item in self.skill_extractor.extract_skills(preferred)}
        structured = []
        for skill in skills:
            mandatory = skill.name in required_names or skill.name not in preferred_names
            structured.append({
                "name": skill.name,
                "category": skill.category,
                "confidence": skill.confidence,
                "importance": "high" if skill.name in required_names else "important" if skill.name in preferred_names else "medium",
                "mandatory": mandatory,
                "source": "job_description",
            })
        embedding = generate_embedding(text)
        return {
            "title": title.strip(),
            "requiredSkills": [item for item in structured if item["mandatory"]],
            "preferredSkills": [item for item in structured if not item["mandatory"]],
            "minimumExperienceYears": self._minimum_experience(description),
            "educationLevel": self._education(description),
            "domains": self._domains(title, description, [item["name"] for item in structured]),
            "toolsAndTechnologies": [item["name"] for item in structured if item["category"] == "technical"],
            "keywords": [item["name"] for item in structured],
            "responsibilities": self._responsibilities(description),
            "embedding": embedding,
            "embeddingDimension": len(embedding),
            "embeddingModel": settings.EMBEDDING_MODEL,
            "modelVersion": settings.EMBEDDING_MODEL_VERSION,
            "contentHash": hashlib.sha256(clean_text(text).encode("utf-8")).hexdigest(),
            "analyzedAt": datetime.now(timezone.utc).isoformat(),
        }

    def _minimum_experience(self, text: str) -> int:
        number_words = {
            "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
            "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
            "سنتان": "2 سنوات", "سنتين": "2 سنوات", "ثلاث": "3", "ثلاثة": "3",
            "أربع": "4", "اربعة": "4", "خمس": "5", "ست": "6", "سبع": "7",
            "ثمان": "8", "تسع": "9", "عشر": "10",
        }
        normalized = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
        for word, value in number_words.items():
            normalized = re.sub(rf"(?<!\w){re.escape(word)}(?!\w)", value, normalized, flags=re.IGNORECASE)
        values = []
        for pattern in [
            r"(\d+)\s*(?:\+\s*)?(?:years?|yrs?)\s+(?:of\s+)?experience",
            r"(?:experience\s+(?:of\s+)?)?(\d+)\s*(?:\+\s*)?(?:years?|yrs?)",
            r"(?:خبرة|الخبرة).*?(\d+)\s*(?:سنوات|سنة)",
            r"(\d+)\s*(?:سنوات|سنة).*?(?:خبرة|الخبرة)",
        ]:
            values.extend(int(value) for value in re.findall(pattern, normalized, re.IGNORECASE))
        return min(values) if values else 0

    def _education(self, text: str) -> str | None:
        lowered = text.casefold()
        levels = [("phd", ["phd", "doctorate", "\u062f\u0643\u062a\u0648\u0631\u0627\u0647"]), ("master", ["master", "\u0645\u0627\u062c\u0633\u062a\u064a\u0631"]), ("bachelor", ["bachelor", "\u0628\u0643\u0627\u0644\u0648\u0631\u064a\u0648\u0633"]), ("diploma", ["diploma", "\u062f\u0628\u0644\u0648\u0645"])]
        return next((level for level, aliases in levels if any(alias in lowered for alias in aliases)), None)

    def _responsibilities(self, text: str) -> List[str]:
        action = re.compile(r"^(develop|design|build|manage|lead|implement|analyze|maintain|create|support)", re.IGNORECASE)
        lines = [re.sub(r"^[\s\-\u2022*\d.)]+", "", line).strip() for line in text.splitlines()]
        return [line for line in lines if 10 <= len(line) <= 300 and action.search(line)][:20]

    def _domains(self, title: str, description: str, skills: List[str]) -> List[str]:
        text = f"{title} {description} {' '.join(skills)}".casefold()
        catalog = {"software_engineering": ["software", "frontend", "backend", "react", "node.js"], "data_ai": ["data scientist", "machine learning", "deep learning", "ai engineer"], "cybersecurity": ["cybersecurity", "security", "siem"], "cloud_devops": ["cloud", "devops", "docker", "kubernetes", "aws", "azure"], "business": ["business analyst", "finance", "marketing", "project management"]}
        return [domain for domain, terms in catalog.items() if any(term in text for term in terms)]

    def _section(self, text: str, headers: List[str]) -> str:
        lines, selected, active = text.splitlines(), [], False
        for line in lines:
            normalized = line.casefold().strip(" :")
            if any(header in normalized for header in headers):
                active = True
                continue
            if active and len(normalized) < 50 and normalized.endswith(":"):
                break
            if active:
                selected.append(line)
        return "\n".join(selected)
