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

    print("Clearing old data (DANGER: Removing all previous data as requested)...")
    users_coll.delete_many({})
    univs_coll.delete_many({})
    colleges_coll.delete_many({})
    depts_coll.delete_many({})
    coords_coll.delete_many({})
    comps_coll.delete_many({})
    students_coll.delete_many({})
    # also remove match results just in case
    db['matchresults'].delete_many({})
    db['jobs'].delete_many({})

    print("Inserting Universities, Colleges, Departments, and Supervisors...")
    
    for u in YEMENI_UNIVERSITIES:
        # 1. Create Main University Admin User
        email = f"admin@{u['nameEn'].lower().replace(' ', '').replace('-', '').replace('\'', '')}.edu.ye"
        user_doc = {
            "firstName": fake_en.first_name(),
            "firstNameAr": fake.first_name(),
            "lastName": fake_en.last_name(),
            "lastNameAr": fake.last_name(),
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
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        univ_id = univs_coll.insert_one(univ_doc).inserted_id
        
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": univ_id}})
        print(f"  ✅ University: {u['nameEn']} | Admin Email: {email}")

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
                "dean": fake_en.name(),
                "isActive": True,
                "createdAt": datetime.datetime.now(datetime.timezone.utc),
                "updatedAt": datetime.datetime.now(datetime.timezone.utc)
            }
            col_id = colleges_coll.insert_one(col_doc).inserted_id
            
            # Create a Supervisor/Coordinator User for this College
            coord_email = f"coord_{str(col_id)[-8:]}@{u['nameEn'].lower().replace(' ', '').replace('\'', '')}.edu.ye"
            coord_user = {
                "firstName": fake_en.first_name(),
                "lastName": fake_en.last_name(),
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
                    "head": fake_en.name(),
                    "specializations": dept['specializations'],
                    "isActive": True,
                    "createdAt": datetime.datetime.now(datetime.timezone.utc),
                    "updatedAt": datetime.datetime.now(datetime.timezone.utc)
                }
                depts_coll.insert_one(dept_doc)

    print("Inserting Companies...")
    for c in YEMENI_COMPANIES:
        email = f"hr@{c['nameEn'].lower().replace(' ', '').replace('-', '')}.com"
        user_doc = {
            "firstName": fake_en.first_name(),
            "lastName": fake_en.last_name(),
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
                "industry": c['industry'],
                "verified": True,
                "verificationStatus": "verified"
            },
            "status": "active",
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc)
        }
        comp_id = comps_coll.insert_one(comp_doc).inserted_id
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": comp_id}})
        print(f"  ✅ Company: {c['nameEn']} | HR Email: {email}")

    print("Inserting Students...")
    skill_pool = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "Data Analysis"]
    for i in range(15):
        email = fake_en.email()
        user_doc = {
            "firstName": fake_en.first_name(),
            "lastName": fake_en.last_name(),
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
        
        student_doc = {
            "userId": user_id,
            "personalInfo": {
                "firstName": user_doc["firstName"],
                "lastName": user_doc["lastName"],
            },
            "academicInfo": {
                "universityName": "Sana'a University",
                "collegeName": "College of Computer Science",
                "departmentName": "Software Engineering",
            },
            "skills": [{"name": s, "proficiency": "intermediate"} for s in random.sample(skill_pool, 4)],
            "privacySettings": {"allowCompanySearch": True},
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc),
        }
        student_id = students_coll.insert_one(student_doc).inserted_id
        users_coll.update_one({"_id": user_id}, {"$set": {"profileId": student_id}})

    print("\n" + "="*60)
    print("Done! Database successfully populated.")
    print("Default password for all users is: password123")
    print("="*60)

if __name__ == "__main__":
    if MONGO_URI == "YOUR_MONGODB_CONNECTION_STRING_HERE":
        print("ERROR: Please set your MONGO_URI at the top of the file or export it as an environment variable.")
        sys.exit(1)
    
    seed_database(MONGO_URI)
