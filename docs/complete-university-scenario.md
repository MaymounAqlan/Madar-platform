# Complete University Scenario

## Recovery Point

- Backup: C:\Users\a\Downloads\MADAR_before_complete_university_scenario_20260713_033514.zip
- Size: 7,575,740 bytes (7.22 MB)
- Entries: 694
- Archive was opened and enumerated successfully.

## Implemented Flow

1. University registration accepts the legacy payload plus extended institutional identity fields and creates a pending university.
2. UniversityStatusGuard blocks portal data until the database status is active.
3. Super Admin approval changes the database status; an already-issued token cannot bypass a pending or suspended state.
4. Active universities manage colleges, departments, staff, student affiliations, study plans, courses, academic recommendations, and reports.
5. Student registration selects an active university, college, and department by IDs and creates a scoped affiliation.
6. Verified and graduated affiliations feed official analytics; all statuses remain visible in the university directory.
7. Coordinators are scoped to one college in backend queries.

## Runtime Evidence

- New university university.flow.1783905478@madar.test: pending, Dashboard 403, approved by Super Admin, Dashboard 200.
- Active test university: 3 colleges, 6 departments, 5 affiliations.
- Affiliation states: pending, verified, rejected, suspended, graduated.
- Coordinator structure: one college only.
- Viewer write: 403; disabled staff login: 401.
- Curriculum: one plan and one submitted recommendation returned from MongoDB.

## Test Environment And Accounts

All seeded accounts use the development-only password: MadarTest@2026

| Role or state | Email | Scope |
|---|---|---|
| Super Admin | superadmin.test@madar.test | Admin university approval |
| University active | university.active@madar.test | Full MADAR Development University portal |
| University pending | university.pending@madar.test | Status page only |
| University suspended | university.suspended@madar.test | Suspension status page only |
| Computing coordinator | coordinator.test@madar.test | College of Computing and AI |
| Engineering coordinator | coordinator.engineering.test@madar.test | College of Engineering |
| Business coordinator | coordinator.business.test@madar.test | College of Business |
| Viewer | viewer.test@madar.test | Read-only |
| Data officer | data.officer.test@madar.test | Institutional data reads |
| Quality officer | quality.officer.test@madar.test | Quality and analytics reads |
| Academic development | academic.development.test@madar.test | Curriculum recommendations |
| Disabled staff | disabled.staff.test@madar.test | Login denied |
| Student pending | student.ds.test@madar.test | Pending affiliation |
| Student verified | student.se.test@madar.test | Verified affiliation |
| Student rejected | student.ee.test@madar.test | Rejected affiliation |
| Student suspended | student.me.test@madar.test | Suspended affiliation |
| Student graduated | student.business.test@madar.test | Graduated affiliation |

Run the idempotent seed with ENABLE_TEST_SEED=true and TEST_ACCOUNT_DEFAULT_PASSWORD set, then npm run seed:test-accounts. Remove its records with npm run seed:test-accounts:cleanup under the same development guard. These accounts must be removed before production.

## Status

Passed with limitations documented in university-remaining-gaps.md.
