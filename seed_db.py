import os
import sys
import datetime
import random
from typing import List, Dict, Any

try:
    from pymongo import MongoClient
    from bson.objectid import ObjectId
    import bcrypt
    from faker import Faker
except ImportError:
    print("Please install required packages first:")
    print("pip install pymongo bcrypt faker")
    sys.exit(1)

# Initialize Faker with Arabic locale
fake = Faker('ar_AA')
fake_en = Faker('en_US')

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "YOUR_MONGODB_CONNECTION_STRING_HERE")
DB_NAME = "madar"
DEFAULT_PASSWORD = b"password123"

# ---------------------------------------------------------
# Yemeni Dummy Data
# ---------------------------------------------------------
YEMENI_MALE_NAMES = ["أحمد", "محمد", "علي", "صالح", "عبدالله", "عبدالرحمن", "طارق", "حمزة", "يوسف", "ماجد", "وليد", "قاسم", "خالد", "حسن", "حسين"]
YEMENI_FEMALE_NAMES = ["فاطمة", "مريم", "سارة", "نورة", "أروى", "بلقيس", "خديجة", "عائشة", "هند", "أمل", "ياسمين"]
YEMENI_LAST_NAMES = ["الأحمر", "المخلافي", "الحوثي", "العولقي", "الصايدي", "السقاف", "الشامي", "الآنسي", "الشرجبي", "الزنداني", "العواضي", "الكبسي", "المتوكل"]

def get_yemeni_name():
    is_male = random.choice([True, False])
    first = random.choice(YEMENI_MALE_NAMES) if is_male else random.choice(YEMENI_FEMALE_NAMES)
    last = random.choice(YEMENI_LAST_NAMES)
    return first, last, is_male

YEMENI_UNIVERSITIES = [
    {"nameEn": "Sana'a University", "nameAr": "جامعة صنعاء", "city": "Sana'a"},
    {"nameEn": "Aden University", "nameAr": "جامعة عدن", "city": "Aden"},
    {"nameEn": "Taiz University", "nameAr": "جامعة تعز", "city": "Taiz"},
    {"nameEn": "Hadhramout University", "nameAr": "جامعة حضرموت", "city": "Mukalla"},
]

COLLEGES_AND_DEPARTMENTS = [
    {
        "nameEn": "College of Engineering",
        "nameAr": "كلية الهندسة",
        "departments": [
            {"nameEn": "Computer Engineering", "nameAr": "هندسة حاسوب", "specializations": ["Software Engineering", "AI", "Networks"]},
            {"nameEn": "Civil Engineering", "nameAr": "هندسة مدنية", "specializations": ["Construction", "Transportation"]},
        ]
    },
    {
        "nameEn": "College of Computer Science",
        "nameAr": "كلية علوم الحاسوب",
        "departments": [
            {"nameEn": "Computer Science", "nameAr": "علوم حاسوب", "specializations": ["Algorithms", "Data Science"]},
            {"nameEn": "Information Technology", "nameAr": "تقنية معلومات", "specializations": ["Web Development", "Cybersecurity"]},
        ]
    },
    {
        "nameEn": "College of Business",
        "nameAr": "كلية إدارة الأعمال",
        "departments": [
            {"nameEn": "Accounting", "nameAr": "محاسبة", "specializations": ["Financial Accounting", "Auditing"]},
            {"nameEn": "Marketing", "nameAr": "تسويق", "specializations": ["Digital Marketing", "Public Relations"]},
        ]
    }
]

YEMENI_COMPANIES = [
    {"nameEn": "Yemen Mobile", "nameAr": "يمن موبايل", "industry": "Telecommunications", "city": "Sana'a"},
    {"nameEn": "Sabafon", "nameAr": "سبأفون", "industry": "Telecommunications", "city": "Sana'a"},
    {"nameEn": "Al-Kuraimi Bank", "nameAr": "بنك الكريمي", "industry": "Banking & Finance", "city": "Sana'a"},
]

def generate_password_hash(password: bytes) -> str:
    """Generate bcrypt hash compatible with Node.js."""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password, salt).decode('utf-8')

def seed_database(uri: str):
    print(f"Connecting to MongoDB...")
    client = MongoClient(uri)
    db = client[DB_NAME]
    
    print("Generating default password hash for 'password123'...")
    default_hash = generate_password_hash(DEFAULT_PASSWORD)
    
    # Collections
    users_coll = db['users']
    univs_coll = db['universities']
    colleges_coll = db['colleges']
    depts_coll = db['departments']
    coords_coll = db['collegecoordinators']
    comps_coll = db['companies']
    students_coll = db['students']
    jobs_coll = db['jobs']
    apps_coll = db['applications']
    skills_coll = db['skills']
    academic_progs_coll = db['academicprograms']
    courses_coll = db['courses']
    study_plans_coll = db['studyplans']

    collections = [
        users_coll, univs_coll, colleges_coll, depts_coll, coords_coll, comps_coll, students_coll,
        jobs_coll, apps_coll, skills_coll, academic_progs_coll, courses_coll, study_plans_coll,
        db['matchresults'], db['roles'], db['permissions']
    ]

    print("Clearing old data (DANGER: Removing all previous data as requested)...")
    for c in collections:
        c.delete_many({})

    # Generate global skills
    print("Inserting Skills...")
    skill_names = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "Data Analysis", "Project Management", "Accounting", "Marketing"]
    skill_docs = []
    for s in skill_names:
        doc = {
            "name": s,
            "category": "Technical",
            "type": "hard_skill",
            "status": "active",
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        skill_id = skills_coll.insert_one(doc).inserted_id
        skill_docs.append({"_id": skill_id, "name": s})

    print("Inserting Universities, Colleges, Departments, and Supervisors...")
    department_ids = []
    for u in YEMENI_UNIVERSITIES:
        # 1. Create Main University Admin User
        admin_first_ar, admin_last_ar, _ = get_yemeni_name()
        email = f"admin@{u['nameEn'].lower().replace(' ', '').replace('-', '').replace('\'', '')}.edu.ye"
        user_doc = {
            "firstName": fake_en.first_name(),
            "firstNameAr": admin_first_ar,
            "lastName": fake_en.last_name(),
            "lastNameAr": admin_last_ar,
            "email": email,
            "password": default_hash,
            "userType": "university",
            "status": "active",
            "isVerified": True,
            "isEmailVerified": True,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        user_id = users_coll.insert_one(user_doc).inserted_id

        # 2. Create University Profile
        univ_doc = {
            "userId": user_id,
            "name": u['nameEn'],
            "nameAr": u['nameAr'],
            "nameEn": u['nameEn'],
            "description": f"{u['nameEn']} is a leading educational institution in Yemen.",
            "descriptionAr": f"{u['nameAr']} هي مؤسسة تعليمية رائدة في اليمن.",
            "institutionType": "public",
            "location": {
                "country": "Yemen",
                "city": u['city'],
                "address": fake.address()
            },
            "contactInfo": {
                "email": f"info@{u['nameEn'].lower().replace(' ', '').replace('\'', '')}.edu.ye",
                "phone": fake.phone_number(),
                "website": f"www.{u['nameEn'].lower().replace(' ', '').replace('\'', '')}.edu.ye"
            },
            "status": "active",
            "isActive": True,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        univ_id = univs_coll.insert_one(univ_doc).inserted_id
        
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": univ_id}})
        print(f"  ✅ University: {u['nameAr']} | Admin: {email}")

        # 3. Create Colleges and Departments
        for col in COLLEGES_AND_DEPARTMENTS:
            col_doc = {
                "universityId": univ_id,
                "name": col['nameEn'],
                "nameAr": col['nameAr'],
                "nameEn": col['nameEn'],
                "institutionType": "university_college",
                "code": f"COL-{random.randint(1000, 9999)}",
                "established": random.randint(1970, 2010),
                "dean": get_yemeni_name()[0] + " " + get_yemeni_name()[1],
                "isActive": True,
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            }
            col_id = colleges_coll.insert_one(col_doc).inserted_id
            
            # Create a Supervisor/Coordinator User for this College
            coord_first_ar, coord_last_ar, _ = get_yemeni_name()
            coord_email = f"coord_{str(col_id)[-8:]}@{u['nameEn'].lower().replace(' ', '').replace('\'', '')}.edu.ye"
            coord_user = {
                "firstName": fake_en.first_name(),
                "firstNameAr": coord_first_ar,
                "lastName": fake_en.last_name(),
                "lastNameAr": coord_last_ar,
                "email": coord_email,
                "password": default_hash,
                "userType": "university",
                "status": "active",
                "isVerified": True,
                "isEmailVerified": True,
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            }
            coord_user_id = users_coll.insert_one(coord_user).inserted_id
            
            coord_profile = {
                "userId": coord_user_id,
                "universityId": univ_id,
                "collegeId": col_id,
                "role": "coordinator",
                "jobTitle": "College Coordinator",
                "permissions": ["manage_students", "view_analytics", "manage_curriculum"],
                "status": "active",
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            }
            coords_coll.insert_one(coord_profile)
            users_coll.update_one({"_id": coord_user_id}, {"$set": {"profileId": coord_user_id}}) # Just so it's not null

            # Create Departments
            for dept in col['departments']:
                dept_doc = {
                    "universityId": univ_id,
                    "collegeId": col_id,
                    "name": dept['nameEn'],
                    "nameAr": dept['nameAr'],
                    "nameEn": dept['nameEn'],
                    "code": f"DEP-{random.randint(1000, 9999)}",
                    "head": get_yemeni_name()[0] + " " + get_yemeni_name()[1],
                    "specializations": dept['specializations'],
                    "isActive": True,
                    "createdAt": datetime.datetime.now(datetime.timezone.utc),
                    "updatedAt": datetime.datetime.now(datetime.timezone.utc)
                }
                dept_id = depts_coll.insert_one(dept_doc).inserted_id
                department_ids.append({
                    "univId": univ_id, "univName": u['nameEn'],
                    "colId": col_id, "colName": col['nameEn'],
                    "deptId": dept_id, "deptName": dept['nameEn']
                })
                
                # Mock Academic Program & Course for each department
                prog_id = academic_progs_coll.insert_one({
                    "universityId": univ_id,
                    "collegeId": col_id,
                    "departmentId": dept_id,
                    "nameEn": f"BSc {dept['nameEn']}",
                    "nameAr": f"بكالوريوس {dept['nameAr']}",
                    "slug": f"bsc-{dept['nameEn'].lower().replace(' ', '-')}-{random.randint(100, 999)}",
                    "degreeType": "bachelor",
                    "status": "active",
                    "isActive": True,
                    "createdAt": datetime.datetime.now(datetime.timezone.utc),
                    "updatedAt": datetime.datetime.now(datetime.timezone.utc)
                }).inserted_id
                
                course_id = courses_coll.insert_one({
                    "universityId": univ_id,
                    "collegeId": col_id,
                    "departmentId": dept_id,
                    "code": f"CRS-{random.randint(100, 999)}",
                    "name": f"Intro to {dept['nameEn']}",
                    "nameAr": f"مقدمة في {dept['nameAr']}",
                    "credits": 3,
                    "level": 1,
                    "status": "active",
                    "createdAt": datetime.datetime.now(datetime.timezone.utc),
                    "updatedAt": datetime.datetime.now(datetime.timezone.utc)
                }).inserted_id

    print("Inserting Companies & Jobs...")
    company_ids = []
    job_ids = []
    for c in YEMENI_COMPANIES:
        hr_first_ar, hr_last_ar, _ = get_yemeni_name()
        email = f"hr@{c['nameEn'].lower().replace(' ', '').replace('-', '')}.com"
        user_doc = {
            "firstName": fake_en.first_name(),
            "firstNameAr": hr_first_ar,
            "lastName": fake_en.last_name(),
            "lastNameAr": hr_last_ar,
            "email": email,
            "password": default_hash,
            "userType": "company",
            "status": "active",
            "isVerified": True,
            "isEmailVerified": True,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        user_id = users_coll.insert_one(user_doc).inserted_id

        comp_doc = {
            "userId": user_id,
            "profile": {
                "name": c['nameEn'],
                "legalName": c['nameAr'],
                "industry": c['industry'],
                "verified": True,
                "verificationStatus": "verified"
            },
            "status": "active",
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        comp_id = comps_coll.insert_one(comp_doc).inserted_id
        company_ids.append(comp_id)
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": comp_id}})
        print(f"  ✅ Company: {c['nameAr']} | HR Email: {email}")

        # Create 2 dummy jobs per company
        for _ in range(2):
            job_title = f"{random.choice(['Senior', 'Junior', 'Lead'])} {random.choice(['Developer', 'Engineer', 'Analyst', 'Manager'])}"
            job_doc = {
                "companyId": comp_id,
                "postedBy": user_id,
                "title": job_title,
                "summary": "We are looking for a talented professional.",
                "description": "Full description of the job...",
                "type": "full_time",
                "level": "mid",
                "category": c['industry'],
                "requirements": {
                    "experience": {"minYears": 2, "maxYears": 5, "level": "mid"},
                    "education": {"minimumLevel": "bachelor"},
                    "requiredSkills": [
                        {"skillId": random.choice(skill_docs)["_id"], "name": random.choice(skill_docs)["name"], "level": "intermediate", "weight": 1.0}
                        for _ in range(3)
                    ]
                },
                "location": {"city": c['city'], "country": "Yemen", "type": "hybrid", "isRelocatable": False},
                "status": "active",
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            }
            j_id = jobs_coll.insert_one(job_doc).inserted_id
            job_ids.append(j_id)

    print("Inserting Students & Applications...")
    student_ids = []
    for i in range(25):
        first_ar, last_ar, is_male = get_yemeni_name()
        email = f"student{i}@example.com"
        user_doc = {
            "firstName": fake_en.first_name_male() if is_male else fake_en.first_name_female(),
            "lastName": fake_en.last_name(),
            "firstNameAr": first_ar,
            "lastNameAr": last_ar,
            "email": email,
            "password": default_hash,
            "userType": "student",
            "status": "active",
            "isVerified": True,
            "isEmailVerified": True,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        user_id = users_coll.insert_one(user_doc).inserted_id
        
        # Assign to random department
        dept = random.choice(department_ids)
        
        student_doc = {
            "userId": user_id,
            "personalInfo": {
                "firstName": user_doc["firstName"],
                "lastName": user_doc["lastName"],
                "firstNameAr": first_ar,
                "lastNameAr": last_ar,
            },
            "academicInfo": {
                "universityName": dept["univName"],
                "collegeName": dept["colName"],
                "departmentName": dept["deptName"],
            },
            "skills": [{"name": s["name"], "proficiency": "intermediate"} for s in random.sample(skill_docs, 4)],
            "privacySettings": {"allowCompanySearch": True},
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc),
        }
        student_id = students_coll.insert_one(student_doc).inserted_id
        student_ids.append({"studentId": student_id, "userId": user_id})
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": student_id}})

        # Create 1-2 random applications for each student
        for j_id in random.sample(job_ids, random.randint(1, 2)):
            job = jobs_coll.find_one({"_id": j_id})
            apps_coll.insert_one({
                "studentId": student_id,
                "jobId": j_id,
                "companyId": job["companyId"],
                "status": random.choice(["applied", "screening", "shortlisted", "rejected"]),
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            })

    print("\n" + "="*60)
    print("Done! Database successfully populated with comprehensive Yemeni dummy data.")
    print("Default password for all users is: password123")
    print("="*60)

if __name__ == "__main__":
    if MONGO_URI == "YOUR_MONGODB_CONNECTION_STRING_HERE":
        print("ERROR: Please set your MONGO_URI at the top of the file or export it as an environment variable.")
        sys.exit(1)
    
    seed_database(MONGO_URI)
