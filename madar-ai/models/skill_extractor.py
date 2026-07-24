"""
MADAR AI Engine - Skill Extractor

Extracts technical and soft skills from text using a comprehensive
skill taxonomy with support for both English and Arabic skill names.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

from config import settings
from models.embeddings import generate_embedding
from utils.logger import get_logger
from utils.text_cleaner import clean_text

logger = get_logger(__name__)


@dataclass
class ExtractedSkill:
    """Represents a single extracted skill with metadata."""

    name: str
    category: str
    confidence: float
    language: str = "en"
    source: str = "taxonomy_match"
    proficiency: Optional[str] = None
    proficiency_evidence: Optional[str] = None
    embedding: Optional[List[float]] = field(default=None, repr=False)


# ============================================================================
# SKILL TAXONOMY - Comprehensive skill database with bilingual support
# ============================================================================

TECHNICAL_SKILLS: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["python", "بايثون"],
    "JavaScript": ["javascript", "js", "جافاسكريبت"],
    "TypeScript": ["typescript", "ts", "تايبسكريبت"],
    "Java": ["java", "جافا"],
    "C++": ["c++", "cpp", "سي++"],
    "C#": ["c#", "csharp", "سي#"],
    "Go": ["go", "golang", "غو"],
    "Rust": ["rust", "روست"],
    "Swift": ["swift", "سويفت"],
    "Kotlin": ["kotlin", "كوتلن"],
    "Ruby": ["ruby", "روبي"],
    "PHP": ["php", "بي اتش بي"],
    "R": ["r programming", "r language"],
    "Scala": ["scala", "سكالا"],
    "Lua": ["lua"],
    "Perl": ["perl"],
    "Dart": ["dart", "دارت"],
    "Elixir": ["elixir"],
    "Haskell": ["haskell"],
    "MATLAB": ["matlab"],
    "SQL": ["sql", "إس كيو إل"],
    "Bash": ["bash", "shell scripting"],
    "PowerShell": ["powershell"],

    # Web Frontend
    "React": ["react", "react.js", "رياكت"],
    "Vue.js": ["vue", "vue.js", "فييو"],
    "Angular": ["angular", "أنجولار"],
    "Next.js": ["next.js", "nextjs"],
    "Svelte": ["svelte"],
    "HTML": ["html", "html5", "اتش تي ام ال"],
    "CSS": ["css", "css3", "سي اس اس"],
    "Sass": ["sass", "scss"],
    "Tailwind CSS": ["tailwind", "tailwind css"],
    "Bootstrap": ["bootstrap", "بوتستراب"],
    "Redux": ["redux"],
    "Webpack": ["webpack"],
    "Vite": ["vite"],

    # Web Backend
    "Node.js": ["node.js", "nodejs", "node", "نود"],
    "Express.js": ["express", "express.js"],
    "Django": ["django", "جانجو"],
    "FastAPI": ["fastapi", "fast api"],
    "Flask": ["flask", "فلاسك"],
    "Spring Boot": ["spring boot", "springboot"],
    "Laravel": ["laravel", "لارافيل"],
    "Ruby on Rails": ["rails", "ruby on rails"],
    "ASP.NET": ["asp.net", "aspnet"],
    "GraphQL": ["graphql", "جراف كيو ال"],
    "REST API": ["rest api", "restful", "restful api"],
    "gRPC": ["grpc"],
    "WebSocket": ["websocket", "websockets"],
    "tRPC": ["trpc"],

    # Databases
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql", "ماي سيكوال"],
    "MongoDB": ["mongodb", "mongo", "مونجو"],
    "Redis": ["redis"],
    "SQLite": ["sqlite"],
    "Elasticsearch": ["elasticsearch", "elastic search"],
    "Cassandra": ["cassandra"],
    "DynamoDB": ["dynamodb", "dynamo db"],
    "Firebase": ["firebase"],
    "Supabase": ["supabase"],
    "Prisma": ["prisma"],
    "TypeORM": ["typeorm"],
    "Sequelize": ["sequelize"],
    "Mongoose": ["mongoose"],
    "SQLAlchemy": ["sqlalchemy"],

    # DevOps & Cloud
    "Docker": ["docker", "دوكر"],
    "Kubernetes": ["kubernetes", "k8s", "كوبيرنيتيز"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "مايكروسوفت أزور"],
    "Google Cloud": ["gcp", "google cloud", "google cloud platform"],
    "Terraform": ["terraform"],
    "Ansible": ["ansible"],
    "Jenkins": ["jenkins"],
    "GitHub Actions": ["github actions"],
    "GitLab CI": ["gitlab ci", "gitlab ci/cd"],
    "CircleCI": ["circleci"],
    "Travis CI": ["travis ci"],
    "Prometheus": ["prometheus"],
    "Grafana": ["grafana"],
    "Nginx": ["nginx"],
    "Apache": ["apache"],
    "Cloudflare": ["cloudflare"],
    "Vercel": ["vercel"],
    "Netlify": ["netlify"],
    "Heroku": ["heroku"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration"],

    # Data Science & ML
    "Machine Learning": ["machine learning", "ml", "تعلم الآلة", "تعلم الالة"],
    "Deep Learning": ["deep learning", "التعلم العميق"],
    "TensorFlow": ["tensorflow", "تنسورفلو"],
    "PyTorch": ["pytorch", "torch", "باي تورش"],
    "Keras": ["keras", "كيراس"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "OpenCV": ["opencv", "open cv"],
    "Hugging Face": ["hugging face", "huggingface", "transformers"],
    "NLTK": ["nltk"],
    "spaCy": ["spacy"],
    "LangChain": ["langchain"],
    "OpenAI API": ["openai api", "openai"],
    "Data Analysis": ["data analysis", "تحليل البيانات"],
    "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly"],
    "Computer Vision": ["computer vision", "الرؤية الحاسوبية"],
    "NLP": ["natural language processing", "nlp", "معالجة اللغات الطبيعية"],
    "Reinforcement Learning": ["reinforcement learning", "rl"],
    "MLOps": ["mlops"],
    "Feature Engineering": ["feature engineering"],
    "Model Deployment": ["model deployment"],

    # Mobile Development
    "React Native": ["react native", "رياكت نيتف"],
    "Flutter": ["flutter", "فلاتر"],
    "Android": ["android", "android development", "أندرويد"],
    "iOS": ["ios", "ios development"],
    "Xamarin": ["xamarin"],
    "Ionic": ["ionic"],
    "Expo": ["expo"],

    # Cybersecurity
    "Cybersecurity": ["cybersecurity", "أمن سيبراني", "الأمن السيبراني"],
    "Penetration Testing": ["penetration testing", "pen testing"],
    "OWASP": ["owasp"],
    "Network Security": ["network security"],
    "Cryptography": ["cryptography"],
    "SIEM": ["siem"],
    "Ethical Hacking": ["ethical hacking"],

    # Other Technical
    "Git": ["git", "version control"],
    "GitHub": ["github"],
    "GitLab": ["gitlab"],
    "Bitbucket": ["bitbucket"],
    "Linux": ["linux", "لينكس"],
    "Ubuntu": ["ubuntu"],
    "Windows Server": ["windows server"],
    "Microservices": ["microservices", "micro services", "مايكروسيرفيسز"],
    "Serverless": ["serverless", "lambda"],
    "Event-Driven": ["event-driven", "event driven"],
    "Message Queues": ["message queues", "rabbitmq", "kafka", "apache kafka"],
    "Apache Kafka": ["kafka", "apache kafka"],
    "RabbitMQ": ["rabbitmq"],
    "System Design": ["system design", "تصميم الأنظمة"],
    "Algorithms": ["algorithms", "الخوارزميات"],
    "Data Structures": ["data structures", "هياكل البيانات"],
    "Object-Oriented": ["object-oriented", "oop", "object oriented programming"],
    "Functional Programming": ["functional programming"],
    "Design Patterns": ["design patterns"],
    "API Design": ["api design"],
    "Testing": ["unit testing", "integration testing", "test-driven", "tdd"],
    "Jest": ["jest"],
    "PyTest": ["pytest"],
    "Cypress": ["cypress"],
    "Selenium": ["selenium"],
    "Agile": ["agile", "أجايل"],
    "Scrum": ["scrum", "سكروم"],
    "Jira": ["jira"],
    "Trello": ["trello"],
    "Figma": ["figma"],
    "Adobe XD": ["adobe xd"],
    "UI/UX": ["ui/ux", "user interface", "user experience", "تجربة المستخدم"],
    "Blockchain": ["blockchain", "بلوكتشين"],
    "Smart Contracts": ["smart contracts", "عقود ذكية"],
    "Solidity": ["solidity"],
    "Web3": ["web3"],
    "AR/VR": ["ar/vr", "augmented reality", "virtual reality"],
    "Unity": ["unity", "يونيتي"],
    "Unreal Engine": ["unreal engine"],
    "Game Development": ["game development", "تطوير الألعاب"],
    "IoT": ["iot", "internet of things", "إنترنت الأشياء"],
    "Embedded Systems": ["embedded systems", "الأنظمة المدمجة"],
    "Arduino": ["arduino", "اردوينو"],
    "Raspberry Pi": ["raspberry pi"],
    "3D Modeling": ["3d modeling", "blender"],
    "Video Editing": ["video editing", "premiere pro"],
    "SEO": ["seo", "search engine optimization"],
    "Google Analytics": ["google analytics"],
}

SOFT_SKILLS: Dict[str, List[str]] = {
    "Communication": ["communication", "تواصل", "التواصل"],
    "Teamwork": ["teamwork", "team work", "working in teams", "العمل الجماعي", "العمل ضمن فريق"],
    "Problem Solving": ["problem solving", "solving problems", "حل المشكلات", "حل المشاكل"],
    "Critical Thinking": ["critical thinking", "التفكير النقدي"],
    "Leadership": ["leadership", "leading teams", "القيادة"],
    "Time Management": ["time management", "managing time", "إدارة الوقت"],
    "Adaptability": ["adaptability", "adaptable", "flexibility", "flexible", "المرونة", "التكيف"],
    "Creativity": ["creativity", "creative thinking", "الإبداع"],
    "Attention to Detail": ["attention to detail", "detail oriented", "دقة", "الاهتمام بالتفاصيل"],
    "Self-Learning": ["self-learning", "self learning", "quick learner", "fast learner", "التعلم الذاتي"],
    "Emotional Intelligence": ["emotional intelligence", "eq", "الذكاء العاطفي"],
    "Conflict Resolution": ["conflict resolution", "حل النزاعات"],
    "Decision Making": ["decision making", "اتخاذ القرار"],
    "Analytical Thinking": ["analytical thinking", "analytical skills", "التفكير التحليلي"],
    "Project Management": ["project management", "إدارة المشاريع"],
    "Negotiation": ["negotiation", "negotiating", "التفاوض"],
    "Presentation": ["presentation skills", "public speaking", "العرض التقديمي"],
    "Collaboration": ["collaboration", "collaborative", "التعاون"],
    "Stress Management": ["stress management", "working under pressure", "العمل تحت الضغط"],
    "Initiative": ["initiative", "proactive", "self-motivated", "المبادرة"],
    "Mentoring": ["mentoring", "coaching", "التوجيه", "التدريب"],
    "Customer Service": ["customer service", "خدمة العملاء"],
    "Interpersonal Skills": ["interpersonal skills", "relationship building", "المهارات الشخصية"],
    "Strategic Thinking": ["strategic thinking", "التفكير الاستراتيجي"],
    "Research": ["research skills", "research", "البحث"],
    "Multilingual": ["multilingual", "bilingual", "polyglot", "متعدد اللغات"],
}

CERTIFICATIONS: Dict[str, List[str]] = {
    "AWS Solutions Architect": ["aws solutions architect", "aws saa"],
    "AWS Developer": ["aws developer associate"],
    "CCNA": ["ccna", "cisco certified"],
    "CompTIA Security+": ["comptia security+", "security+"],
    "CISSP": ["cissp"],
    "CEH": ["ceh", "certified ethical hacker"],
    "PMP": ["pmp", "project management professional"],
    "Scrum Master": ["scrum master", "csm", "certified scrum master"],
    "ITIL": ["itil"],
    "Google Cloud Professional": ["google cloud professional"],
    "Azure Fundamentals": ["azure fundamentals", "az-900"],
    "TOEFL": ["toefl"],
    "IELTS": ["ielts"],
    "Cisco Certification": ["cisco"],
    "Oracle Certified": ["oracle certified", "oca", "ocp"],
    "Red Hat Certified": ["red hat certified", "rhce", "rhcsa"],
    "Linux Foundation": ["linux foundation", "cka", "ckad"],
    "Tableau Certification": ["tableau certification", "tableau desktop"],
    "Power BI": ["power bi certified", "powerbi"],
    "Six Sigma": ["six sigma"],
    "ISO 27001": ["iso 27001"],
    "Scrum": ["agile certification", "agile certified"],
}

ARABIC_SKILL_ALIASES: Dict[str, List[str]] = {
    "Python": ["بايثون"],
    "JavaScript": ["جافاسكربت", "جافا سكربت"],
    "TypeScript": ["تايب سكربت"],
    "Node.js": ["نود", "نود جي اس"],
    "React": ["رياكت"],
    "Machine Learning": ["تعلم الآلة", "تعلم الالة"],
    "Deep Learning": ["التعلم العميق"],
    "Data Analysis": ["تحليل البيانات"],
    "Cybersecurity": ["الأمن السيبراني", "امن سيبراني"],
    "Docker": ["دوكر"],
    "Kubernetes": ["كوبرنيتس"],
    "Communication": ["التواصل"],
    "Teamwork": ["العمل الجماعي", "العمل ضمن فريق"],
    "Problem Solving": ["حل المشكلات", "حل المشاكل"],
    "Leadership": ["القيادة"],
    "Time Management": ["إدارة الوقت", "ادارة الوقت"],
    "Critical Thinking": ["التفكير النقدي"],
    "Project Management": ["إدارة المشاريع", "ادارة المشاريع"],
}


def _build_skill_patterns() -> Dict[str, Tuple[str, str, List[str]]]:
    """Build a flat lookup dictionary from skill name to category and aliases.

    Returns:
        Dict mapping normalized skill name -> (display_name, category, aliases)
    """
    patterns: Dict[str, Tuple[str, str, List[str]]] = {}

    for display_name, aliases in TECHNICAL_SKILLS.items():
        key = display_name.lower()
        patterns[key] = (display_name, "technical", aliases)
        for alias in aliases:
            patterns[alias.lower()] = (display_name, "technical", aliases)

    for display_name, aliases in SOFT_SKILLS.items():
        key = display_name.lower()
        patterns[key] = (display_name, "soft", aliases)
        for alias in aliases:
            patterns[alias.lower()] = (display_name, "soft", aliases)

    for display_name, aliases in CERTIFICATIONS.items():
        key = display_name.lower()
        patterns[key] = (display_name, "certification", aliases)
        for alias in aliases:
            patterns[alias.lower()] = (display_name, "certification", aliases)

    for display_name, aliases in ARABIC_SKILL_ALIASES.items():
        existing = patterns.get(display_name.lower())
        category = existing[1] if existing else ("soft" if display_name in SOFT_SKILLS else "technical")
        merged = list(dict.fromkeys([*(existing[2] if existing else []), *aliases]))
        patterns[display_name.lower()] = (display_name, category, merged)
        for alias in merged:
            patterns[alias.lower()] = (display_name, category, merged)

    return patterns


# Build skill patterns once at module load time
_SKILL_PATTERNS = _build_skill_patterns()


class SkillExtractor:
    """Extracts skills from text using keyword matching and confidence scoring.

    Uses a comprehensive bilingual skill taxonomy to identify skills
    in both English and Arabic text.
    """

    def __init__(self):
        """Initialize the skill extractor with compiled regex patterns."""
        self.patterns = _SKILL_PATTERNS
        self.compiled_regexes: Dict[str, re.Pattern] = {}
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Compile regex patterns for efficient skill matching."""
        seen_display_names: Set[str] = set()

        for normalized_key, (display_name, category, aliases) in self.patterns.items():
            if display_name in seen_display_names:
                continue
            seen_display_names.add(display_name)

            # Build regex that matches any alias with word boundaries
            alias_patterns = []
            for alias in aliases:
                escaped = re.escape(alias)
                if re.search(r"[\u0600-\u06ff]", alias):
                    # Arabic conjunctions and prepositions are commonly attached
                    # to the following word (for example: "وحل المشكلات").
                    alias_patterns.append(r"(?<!\w)(?:[وفب])?" + escaped + r"(?!\w)")
                else:
                    alias_patterns.append(r"\b" + escaped + r"\b")
            pattern_str = "(" + "|".join(alias_patterns) + ")"

            try:
                self.compiled_regexes[display_name] = re.compile(
                    pattern_str, re.IGNORECASE
                )
            except re.error:
                logger.warning(
                    "Failed to compile regex for skill",
                    skill=display_name,
                )

    def extract_skills(
        self, text: str, include_embeddings: bool = False
    ) -> List[ExtractedSkill]:
        """Extract skills from the given text.

        Performs keyword matching against the skill taxonomy and
        calculates confidence scores based on match context.

        Args:
            text: Input text (CV content, job description, etc.)
            include_embeddings: Whether to generate embedding vectors for skills.

        Returns:
            List of ExtractedSkill objects with name, category, and confidence.
        """
        if not text or not text.strip():
            return []

        cleaned = clean_text(text)
        extracted: Dict[str, ExtractedSkill] = {}

        for display_name, pattern in self.compiled_regexes.items():
            matches = list(pattern.finditer(cleaned))

            if not matches:
                continue

            # Calculate confidence based on match count and context
            confidence = self._calculate_confidence(
                display_name, matches, cleaned
            )

            if confidence < settings.SKILL_CONFIDENCE_THRESHOLD:
                continue

            # Get category from patterns
            category = self.patterns.get(display_name.lower(), (None, "technical", None))[1]

            # Determine language
            language = self._detect_language(display_name, matches, cleaned)

            skill = ExtractedSkill(
                name=display_name,
                category=category,
                confidence=round(confidence, 2),
                language=language,
                proficiency=self._infer_proficiency(matches, cleaned)[0],
                proficiency_evidence=self._infer_proficiency(matches, cleaned)[1],
            )

            extracted[display_name] = skill

        # Sort by confidence descending
        result = sorted(extracted.values(), key=lambda s: s.confidence, reverse=True)

        # Optionally generate embeddings
        if include_embeddings:
            for skill in result:
                try:
                    skill.embedding = generate_embedding(skill.name)
                except Exception:
                    skill.embedding = None

        return result

    def _infer_proficiency(self, matches: List[re.Match], text: str) -> Tuple[Optional[str], Optional[str]]:
        levels = [("expert", ["expert", "specialist", "خبير", "متخصص"]), ("advanced", ["advanced", "proficient", "متقدم", "متمكن"]), ("intermediate", ["intermediate", "متوسط"]), ("beginner", ["beginner", "basic", "مبتدئ", "أساسي", "اساسي"])]
        for match in matches:
            context = text[max(0, match.start() - 45):min(len(text), match.end() + 45)]
            lowered = context.casefold()
            for level, aliases in levels:
                if any(alias in lowered for alias in aliases):
                    return level, context.strip()
        return None, None

    def extract_skills_by_category(
        self, text: str, category: str
    ) -> List[ExtractedSkill]:
        """Extract skills filtered by category.

        Args:
            text: Input text.
            category: One of 'technical', 'soft', 'certification'.

        Returns:
            Filtered list of ExtractedSkill objects.
        """
        all_skills = self.extract_skills(text)
        return [s for s in all_skills if s.category == category]

    def _calculate_confidence(
        self, skill_name: str, matches: List[re.Match], text: str
    ) -> float:
        """Calculate confidence score for a skill match.

        Factors:
        - Number of occurrences (up to a cap)
        - Proximity to section headers (skills, experience, etc.)
        - Whether it's in a skills section

        Args:
            skill_name: The matched skill name.
            matches: Regex match objects.
            text: Full cleaned text.

        Returns:
            float: Confidence score between 0 and 1.
        """
        base_confidence = 0.5

        # Frequency boost (diminishing returns)
        occurrence_count = len(matches)
        if occurrence_count >= 3:
            base_confidence += 0.20
        elif occurrence_count == 2:
            base_confidence += 0.10
        else:
            base_confidence += 0.05

        # Check if in skills section
        skills_section = self._is_in_skills_section(matches, text)
        if skills_section:
            base_confidence += 0.15

        # Check proximity to experience section
        experience_section = self._is_in_experience_section(matches, text)
        if experience_section:
            base_confidence += 0.10

        # Check if mentioned in project context
        project_section = self._is_in_project_section(matches, text)
        if project_section:
            base_confidence += 0.05

        return min(1.0, base_confidence)

    def _is_in_skills_section(
        self, matches: List[re.Match], text: str
    ) -> bool:
        """Check if matches occur within a skills section."""
        section_headers = [
            r"skills",
            r"technical skills",
            r"core competencies",
            r"technologies",
            r"tech stack",
            r"المهارات",
            r"المهارات التقنية",
            r"المهارات",
            r"المهارات التقنية",
        ]
        return self._check_section_proximity(matches, text, section_headers)

    def _is_in_experience_section(
        self, matches: List[re.Match], text: str
    ) -> bool:
        """Check if matches occur within an experience section."""
        section_headers = [
            r"experience",
            r"work experience",
            r"professional experience",
            r"employment",
            r"الخبرات",
            r"الخبرة العملية",
            r"الخبرات",
            r"الخبرة العملية",
            r"العمل",
        ]
        return self._check_section_proximity(matches, text, section_headers)

    def _is_in_project_section(
        self, matches: List[re.Match], text: str
    ) -> bool:
        """Check if matches occur within a projects section."""
        section_headers = [
            r"projects",
            r"personal projects",
            r"side projects",
            r"المشاريع",
            r"المشاريع",
            r"مشاريع",
        ]
        return self._check_section_proximity(matches, text, section_headers)

    def _check_section_proximity(
        self,
        matches: List[re.Match],
        text: str,
        section_headers: List[str],
    ) -> bool:
        """Check if any match is close to a section header."""
        text_lower = text.lower()
        lines = text_lower.split("\n")

        # Find section header positions
        section_positions = []
        for i, line in enumerate(lines):
            for header in section_headers:
                if re.search(header, line):
                    section_positions.append(i)

        if not section_positions:
            return False

        # Check if any match is within 20 lines of a section header
        for match in matches:
            match_line = text_lower[: match.start()].count("\n")
            for section_line in section_positions:
                if abs(match_line - section_line) <= 20:
                    return True

        return False

    def _detect_language(
        self, skill_name: str, matches: List[re.Match], text: str
    ) -> str:
        """Detect whether the skill was matched in Arabic or English context.

        Args:
            skill_name: The skill display name.
            matches: Regex match objects.
            text: Full text.

        Returns:
            str: 'ar' if Arabic context, 'en' otherwise.
        """
        # Check if the matched text contains Arabic characters
        for match in matches:
            matched_text = text[match.start() : match.end()]
            if any("\u0600" <= c <= "\u06FF" for c in matched_text):
                return "ar"

        # Check surrounding context for Arabic
        for match in matches:
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            context = text[start:end]
            if any("\u0600" <= c <= "\u06FF" for c in context):
                return "ar"

        return "en"

    def get_all_skills(self) -> List[Dict[str, str]]:
        """Get all skills in the taxonomy.

        Returns:
            List of dicts with 'name' and 'category' keys.
        """
        skills = []
        seen = set()

        for display_name, (_, category, _) in self.patterns.items():
            if display_name not in seen:
                seen.add(display_name)
                skills.append({"name": display_name, "category": category})

        return skills

    def suggest_skills(
        self, partial: str, limit: int = 10
    ) -> List[Dict[str, str]]:
        """Suggest skills matching a partial query.

        Args:
            partial: Partial skill name to search for.
            limit: Maximum number of suggestions.

        Returns:
            List of matching skill dicts.
        """
        partial_lower = partial.lower()
        matches = []

        for display_name, (_, category, aliases) in self.patterns.items():
            if partial_lower in display_name.lower():
                matches.append(
                    {
                        "name": display_name,
                        "category": category,
                        "match_type": "name",
                    }
                )
            else:
                for alias in aliases:
                    if partial_lower in alias.lower():
                        matches.append(
                            {
                                "name": display_name,
                                "category": category,
                                "match_type": "alias",
                            }
                        )
                        break

        # Deduplicate
        seen = set()
        unique_matches = []
        for m in matches:
            if m["name"] not in seen:
                seen.add(m["name"])
                unique_matches.append(m)

        return unique_matches[:limit]
