"""
MADAR AI Engine - Models Package

Core AI/ML models for embeddings, skill extraction, CV parsing, and matching.
"""

from models.cv_parser import CVParser
from models.embeddings import cosine_similarity, generate_embedding
from models.matcher import JobStudentMatcher
from models.skill_extractor import SkillExtractor

__all__ = [
    "CVParser",
    "SkillExtractor",
    "JobStudentMatcher",
    "generate_embedding",
    "cosine_similarity",
]
