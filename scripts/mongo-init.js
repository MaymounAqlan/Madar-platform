// MADAR Platform - MongoDB Initialization Script
// Runs automatically on first container startup

db = db.getSiblingDB('madar');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('students');
db.createCollection('companies');
db.createCollection('universities');
db.createCollection('jobs');
db.createCollection('applications');
db.createCollection('skills');
db.createCollection('matchresults');
db.createCollection('skillgaps');
db.createCollection('recommendations');
db.createCollection('notifications');
db.createCollection('auditlogs');
db.createCollection('marketdatas');
db.createCollection('sessions');
db.createCollection('roles');
db.createCollection('permissions');
db.createCollection('colleges');
db.createCollection('departments');
db.createCollection('studyplans');
db.createCollection('courses');
db.createCollection('trainingcourses');
db.createCollection('messages');
db.createCollection('aianalytics');
db.createCollection('analyticssnapshots');
db.createCollection('aiembeddings');

// Create indexes for common queries
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.students.createIndex({ user: 1 });
db.students.createIndex({ university: 1 });
db.students.createIndex({ college: 1 });
db.companies.createIndex({ user: 1 });
db.jobs.createIndex({ company: 1 });
db.jobs.createIndex({ status: 1 });
db.applications.createIndex({ student: 1 });
db.applications.createIndex({ job: 1 });
db.skills.createIndex({ name: 1 }, { unique: true });
db.matchresults.createIndex({ student: 1, job: 1 }, { unique: true });

print('MADAR database initialized successfully');
