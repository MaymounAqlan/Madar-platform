# Curriculum Workflow

## APIs

- GET and POST /api/universities/study-plans
- PATCH /api/universities/study-plans/:id
- POST /api/universities/study-plans/:id/submit
- PATCH /api/universities/study-plans/:id/review
- GET and POST /api/universities/courses
- PATCH and DELETE /api/universities/courses/:id
- POST /api/universities/courses/:id/skills
- GET /api/universities/curriculum/analysis/:departmentId
- GET and POST /api/universities/curriculum/recommendations
- POST /api/universities/curriculum/recommendations/:id/submit
- PATCH /api/universities/curriculum/recommendations/:id/review

Plans are versioned and courses can change only while their plan is draft or changes-requested. Approval of a recommendation linked to a plan creates a new draft version and retains previousVersionId.

The analysis compares structured course skill mappings with stored market-demand records. Missing market data returns an unavailable alignment value, not a fabricated score.

Frontend: /university/curriculum, with plans, courses, analysis, recommendations, loading and empty feedback, and development autofill.
