# Yemen University Directory Gap Analysis

## Existing Architecture

- `University`, `College`, and `Department` are existing Mongoose models under `madar-backend/src/universities`.
- Student academic references already live under `Student.academicInfo` as `universityId`, `collegeId`, and `departmentId`, with legacy name fields still in active use.
- Public university, college, and department endpoints already exist under `/api/public`; they currently return all active records without search or pagination.
- Student registration already performs cascading university, college, and department selection, but uses basic `<select>` controls and has no academic-program level.
- Student profile serialization already resolves academic relations, but does not return governorate or an academic program.
- Admin university UI and APIs already handle review, approval, suspension, and reactivation. They do not yet provide reference-directory CRUD/import/merge tools.

## Gaps

1. `University.userId` is required and uniquely indexed, which prevents ownerless reference-directory records.
2. University and college verification, provenance, normalized slug, aliases, and seed/demo metadata are missing.
3. No standalone `AcademicProgram` model exists.
4. Existing public endpoints lack server-side search, filters, pagination, and `/api/reference` compatibility routes.
5. Current development seeds create Saudi and MADAR test universities.
6. MongoDB currently contains 17 universities; most are explicit development records, while at least one manually created record cannot be safely classified by name alone.
7. No dry-run import, legacy-affiliation migration, or dependency-aware cleanup script exists.
8. Frontend registration and profile do not support an academic program and do not expose provenance-backed Yemeni reference data.

## Compatibility Decision

- Extend the existing models and module; do not create a parallel university system.
- Keep legacy fields and `/api/public` routes while adding adapters and `/api/reference` aliases.
- Make `University.userId` optional with a sparse unique index so institutional login profiles remain compatible and ownerless directory records become possible.
- Add `AcademicProgram` inside the existing universities module.
- Only cleanup records proven to be development data by explicit seed markers, known seed IDs/domains, or an exact allowlist. Manual records remain untouched unless reviewed.

## Data Sources

- Ministry of Higher Education and Scientific Research public-university directory: https://www.moheye.net/public-universities/
- Ministry private-university directory: https://www.moheye.net/private-universities/
- Ministry community-college directory: https://www.moheye.net/community-colleges/
- Council for Academic Accreditation and Quality Assurance institution directory: https://caqa.gov.ye/ar

Fields not supported by these sources remain null/empty and use `partially_verified` or `unverified`.
