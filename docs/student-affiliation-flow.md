# Student Affiliation Flow

## Selection

- GET /api/public/universities
- GET /api/public/universities/:id/colleges
- GET /api/public/colleges/:id/departments

Only active institutions and active academic units are selectable. Registration validates the complete ID relationship and the unique student number.

## Stored Record

studentaffiliations stores student, university, college, department, number, academic level, enrollment and expected graduation years, verification method, status, decisions, and proof URL.

## Review APIs

- GET /api/universities/students/:studentId
- PATCH /api/universities/students/:studentId/verify-affiliation
- PATCH /api/universities/students/:studentId/reject-affiliation
- PATCH /api/universities/students/:studentId/suspend-affiliation
- PATCH /api/universities/students/:studentId/mark-graduated

Every lookup is derived from the authenticated institution. No university ID from the browser controls ownership. Reads do not mutate affiliations.
