# University Permissions Matrix

| Role | Scope | Read | Write | Denied |
|---|---|---|---|---|
| university | Entire owned university | Dashboard, structure, students, curriculum, reports, staff | Colleges, departments, affiliations, staff, curriculum, profile | Other universities |
| coordinator | Assigned college | Own college structure, students, analytics, curriculum | Own college departments and curriculum | Other colleges, staff, profile, reports |
| university_viewer | University read scope | Dashboard, structure, students, analytics, curriculum | None | All mutations |
| data_officer | University data scope | Dashboard, structure, students, analytics | No affiliation decision by default | Staff, profile, privilege changes |
| quality_officer | University quality scope | Dashboard, structure, students, analytics, curriculum | None by default | Staff, profile, privilege changes |
| academic_development_officer | University curriculum scope | Dashboard, structure, curriculum | Draft recommendations | Staff, profile, approval |

Database status and staff status are re-read for protected requests. Frontend visibility is usability only; backend RBAC and university or college filters are authoritative.
