"""Trusted external learning resources for skill-gap recommendations."""

from typing import Any, Dict, List

RESOURCE_CATALOG: Dict[str, List[Dict[str, Any]]] = {
    "javascript": [{"title": "JavaScript Guide", "type": "official_documentation", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "provider": "MDN", "level": "beginner", "language": "en", "isFree": True}],
    "typescript": [{"title": "TypeScript Handbook", "type": "official_documentation", "url": "https://www.typescriptlang.org/docs/handbook/intro.html", "provider": "Microsoft", "level": "beginner", "language": "en", "isFree": True}],
    "react": [
        {"title": "React Learn", "type": "official_documentation", "url": "https://react.dev/learn", "provider": "React", "level": "beginner", "language": "en", "isFree": True},
        {"title": "Meta Front-End Developer Professional Certificate", "type": "professional_certificate", "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer", "provider": "Coursera / Meta", "level": "beginner", "language": "en", "isFree": False},
    ],
    "node.js": [{"title": "Introduction to Node.js", "type": "official_documentation", "url": "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", "provider": "OpenJS Foundation", "level": "beginner", "language": "en", "isFree": True}],
    "python": [
        {"title": "The Python Tutorial", "type": "official_documentation", "url": "https://docs.python.org/3/tutorial/", "provider": "Python Software Foundation", "level": "beginner", "language": "en", "isFree": True},
        {"title": "CS50's Introduction to Computer Science", "type": "online_course", "url": "https://www.edx.org/certificates/computer-science-certificates", "provider": "edX / HarvardX", "level": "beginner", "language": "en", "isFree": True},
    ],
    "docker": [{"title": "Docker Get Started", "type": "official_documentation", "url": "https://docs.docker.com/get-started/", "provider": "Docker", "level": "beginner", "language": "en", "isFree": True}],
    "kubernetes": [{"title": "Kubernetes Basics", "type": "official_documentation", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "provider": "CNCF", "level": "intermediate", "language": "en", "isFree": True}],
    "aws": [{"title": "AWS Skill Builder", "type": "learning_platform", "url": "https://skillbuilder.aws/", "provider": "Amazon Web Services", "level": "mixed", "language": "en", "isFree": None}],
    "azure": [{"title": "Microsoft Learn for Azure", "type": "learning_platform", "url": "https://learn.microsoft.com/en-us/training/azure/", "provider": "Microsoft", "level": "mixed", "language": "en", "isFree": True}],
    "git": [{"title": "Pro Git", "type": "book", "url": "https://git-scm.com/book/en/v2", "provider": "Git SCM", "level": "mixed", "language": "en", "isFree": True}],
    "sql": [
        {"title": "PostgreSQL Tutorial", "type": "official_documentation", "url": "https://www.postgresql.org/docs/current/tutorial.html", "provider": "PostgreSQL", "level": "beginner", "language": "en", "isFree": True},
        {"title": "Google Data Analytics Professional Certificate", "type": "professional_certificate", "url": "https://www.coursera.org/professional-certificates/google-data-analytics", "provider": "Coursera / Google", "level": "beginner", "language": "en", "isFree": False},
    ],
    "mongodb": [{"title": "MongoDB Developer Learning Path", "type": "learning_platform", "url": "https://learn.mongodb.com/", "provider": "MongoDB", "level": "mixed", "language": "en", "isFree": True}],
    "agile": [{"title": "The Scrum Guide", "type": "official_documentation", "url": "https://scrumguides.org/scrum-guide.html", "provider": "Scrum Guides", "level": "beginner", "language": "en", "isFree": True}],
    "cad": [{"title": "Autodesk On-Demand Learning", "type": "learning_platform", "url": "https://www.autodesk.com/learn/ondemand/", "provider": "Autodesk", "level": "mixed", "language": "en", "isFree": True}],
    "ci/cd": [{"title": "CI/CD with GitHub Actions", "type": "official_documentation", "url": "https://docs.github.com/en/actions/about-github-actions/understanding-github-actions", "provider": "GitHub", "level": "intermediate", "language": "en", "isFree": True}],
    "communication": [{"title": "Communication Skills", "type": "online_course", "url": "https://www.open.edu/openlearn/education-development/education/communication-and-working-relationships-sport-and-fitness/content-section-0", "provider": "OpenLearn", "level": "beginner", "language": "en", "isFree": True}],
    "dashboards": [
        {"title": "Power BI Learning", "type": "official_documentation", "url": "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", "provider": "Microsoft", "level": "mixed", "language": "en", "isFree": True},
        {"title": "Google Data Analytics Professional Certificate", "type": "professional_certificate", "url": "https://www.coursera.org/professional-certificates/google-data-analytics", "provider": "Coursera / Google", "level": "beginner", "language": "en", "isFree": False},
    ],
    "deep learning": [{"title": "TensorFlow Deep Learning Tutorials", "type": "official_documentation", "url": "https://www.tensorflow.org/tutorials", "provider": "TensorFlow", "level": "intermediate", "language": "en", "isFree": True}],
    "express.js": [{"title": "Express Getting Started", "type": "official_documentation", "url": "https://expressjs.com/en/starter/installing.html", "provider": "OpenJS Foundation", "level": "beginner", "language": "en", "isFree": True}],
    "github actions": [{"title": "GitHub Actions Documentation", "type": "official_documentation", "url": "https://docs.github.com/en/actions", "provider": "GitHub", "level": "mixed", "language": "en", "isFree": True}],
    "java": [{"title": "Learn Java", "type": "official_documentation", "url": "https://dev.java/learn/", "provider": "Oracle", "level": "beginner", "language": "en", "isFree": True}],
    "jenkins": [{"title": "Jenkins Tutorials", "type": "official_documentation", "url": "https://www.jenkins.io/doc/tutorials/", "provider": "Jenkins", "level": "intermediate", "language": "en", "isFree": True}],
    "kafka": [{"title": "Apache Kafka Introduction", "type": "official_documentation", "url": "https://kafka.apache.org/intro", "provider": "Apache Software Foundation", "level": "intermediate", "language": "en", "isFree": True}],
    "linux": [{"title": "Introduction to Linux", "type": "online_course", "url": "https://training.linuxfoundation.org/training/introduction-to-linux/", "provider": "Linux Foundation", "level": "beginner", "language": "en", "isFree": True}],
    "machine learning": [
        {"title": "Scikit-learn Tutorials", "type": "official_documentation", "url": "https://scikit-learn.org/stable/tutorial/index.html", "provider": "Scikit-learn", "level": "intermediate", "language": "en", "isFree": True},
        {"title": "IBM AI Engineering Professional Certificate", "type": "professional_certificate", "url": "https://www.coursera.org/professional-certificates/ai-engineer", "provider": "Coursera / IBM", "level": "intermediate", "language": "en", "isFree": False},
    ],
    "software engineering": [{"title": "Become a Software Developer", "type": "learning_path", "url": "https://www.linkedin.com/learning/paths/become-a-software-developer", "provider": "LinkedIn Learning", "level": "beginner", "language": "en", "isFree": False}],
    "data science": [{"title": "Become a Data Scientist", "type": "learning_path", "url": "https://www.linkedin.com/learning/paths/become-a-data-scientist", "provider": "LinkedIn Learning", "level": "mixed", "language": "en", "isFree": False}],
    "maintenance": [{"title": "Maintenance Management Resources", "type": "official_resource", "url": "https://www.ibm.com/think/topics/maintenance-management", "provider": "IBM", "level": "intermediate", "language": "en", "isFree": True}],
    "manufacturing": [{"title": "Manufacturing Extension Partnership Resources", "type": "official_resource", "url": "https://www.nist.gov/mep", "provider": "NIST", "level": "mixed", "language": "en", "isFree": True}],
    "matlab": [{"title": "MATLAB Onramp", "type": "online_course", "url": "https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted", "provider": "MathWorks", "level": "beginner", "language": "en", "isFree": True}],
    "microservices": [{"title": "Microservices Architecture Guide", "type": "official_documentation", "url": "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices", "provider": "Microsoft", "level": "advanced", "language": "en", "isFree": True}],
    "nestjs": [{"title": "NestJS Documentation", "type": "official_documentation", "url": "https://docs.nestjs.com/", "provider": "NestJS", "level": "intermediate", "language": "en", "isFree": True}],
    "nlp": [{"title": "Hugging Face NLP Course", "type": "online_course", "url": "https://huggingface.co/learn/nlp-course/chapter1/1", "provider": "Hugging Face", "level": "intermediate", "language": "en", "isFree": True}],
    "process engineering": [{"title": "Process Engineering Resources", "type": "official_resource", "url": "https://www.aiche.org/resources", "provider": "AIChE", "level": "mixed", "language": "en", "isFree": True}],
    "project management": [{"title": "Project Management Basics", "type": "official_resource", "url": "https://www.pmi.org/about/learn-about-pmi/what-is-project-management", "provider": "Project Management Institute", "level": "beginner", "language": "en", "isFree": True}],
    "quality control": [{"title": "Quality Resources", "type": "official_resource", "url": "https://asq.org/quality-resources", "provider": "ASQ", "level": "mixed", "language": "en", "isFree": True}],
    "requirements analysis": [{"title": "Requirements Engineering Syllabus", "type": "certification_resource", "url": "https://www.ireb.org/en/cpre/foundation/", "provider": "IREB", "level": "intermediate", "language": "en", "isFree": True}],
    "rest api": [{"title": "Using the Fetch API", "type": "official_documentation", "url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", "provider": "MDN", "level": "beginner", "language": "en", "isFree": True}],
    "safety": [{"title": "Safety and Health Topics", "type": "official_resource", "url": "https://www.osha.gov/safety-management", "provider": "OSHA", "level": "mixed", "language": "en", "isFree": True}],
    "spring boot": [{"title": "Spring Boot Guides", "type": "official_documentation", "url": "https://spring.io/guides/gs/spring-boot", "provider": "Spring", "level": "intermediate", "language": "en", "isFree": True}],
    "tensorflow": [{"title": "TensorFlow Tutorials", "type": "official_documentation", "url": "https://www.tensorflow.org/tutorials", "provider": "TensorFlow", "level": "intermediate", "language": "en", "isFree": True}],
    "terraform": [{"title": "Terraform Tutorials", "type": "official_documentation", "url": "https://developer.hashicorp.com/terraform/tutorials", "provider": "HashiCorp", "level": "intermediate", "language": "en", "isFree": True}],
}


def resources_for_skill(skill_name: str) -> List[Dict[str, Any]]:
    """Return verified catalog entries only; never fabricate a URL."""
    normalized = skill_name.casefold().strip()
    exact = RESOURCE_CATALOG.get(normalized)
    if exact:
        return [_enrich_resource(skill_name, item) for item in exact]
    for key, resources in RESOURCE_CATALOG.items():
        if key in normalized or normalized in key:
            return [_enrich_resource(skill_name, item) for item in resources]
    return []


def _enrich_resource(skill_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        **item,
        "skillName": skill_name,
        "reason": f"Official resource selected to address the {skill_name} skill gap.",
        "priority": "high",
    }
