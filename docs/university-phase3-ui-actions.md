# University Phase 3 UI Actions

## Action Inventory

| Screen | Action | State | Backend/API | Verification |
|---|---|---|---|---|
| Dashboard | Refresh | Active | `GET /api/universities/dashboard` | HTTP 200 with scoped data |
| Dashboard | Period selector | Active | Client view filter over returned trends | Typecheck/build passed |
| Dashboard | Export report | Disabled with explanatory title | Deferred by Phase 3 scope | No unsupported request sent |
| Students | Search | Active | `GET /api/universities/students?search=` | Contract and runtime pagination verified |
| Students | College/department/status/level/GPA filters | Active | Query parameters on Students endpoint | Contract verified |
| Students | Reset filters | Active | Clears local filters and page | Typecheck/build passed |
| Students | Refresh | Active | Refetches the current query | HTTP contract verified |
| Students | Page size and previous/next | Active | Real `page` and `limit` pagination | 10 of 22 records returned at runtime |
| Students | View details | Active | Uses the scoped row returned by API | Dialog compiles and renders safe fields only |
| Students | Export/import/add student | Disabled with explanatory titles | Deferred or handled by registration | No dead request |
| Structure | Refresh | Active | `GET /api/universities/structure` | HTTP 200 with real colleges/departments |
| Structure | Add college | Active | `POST /api/universities/colleges` | Created and cleaned up at runtime |
| Structure | Edit college | Active | `PUT /api/universities/colleges/:id` | Updated at runtime |
| Structure | Archive/restore college | Active | Dedicated archive/restore endpoints | Both states verified at runtime |
| Structure | Add department | Active | `POST /api/universities/colleges/:id/departments` | Created at runtime |
| Structure | Edit department | Active | `PUT /api/universities/departments/:id` | Updated at runtime |
| Structure | Archive department | Active | `DELETE /api/universities/departments/:id` (soft delete) | Verified at runtime |
| Structure | Add plan/add course | Disabled with curriculum-module explanation | Deferred by scope | No unsupported payload sent |
| Dialogs | Save/cancel/close/confirm | Active | Mutation-specific API or local close | Save remains open on server error; submitting state disables repeat action |

## Validation And Feedback

- College and department names are required and trimmed on both frontend and backend.
- Optional text fields have DTO length limits; college establishment year is constrained to 1800-2100.
- Duplicate college and department names/codes are rejected within the authenticated university scope.
- Mutation buttons are disabled while requests are pending.
- Success uses the existing toast system; backend validation messages are shown inside the dialog.
- No action accepts a university ID from the browser.

## Visual Verification

The frontend returned HTTP 200 and the production build succeeded. Authenticated browser automation was unavailable in this environment, so screenshots, pointer interaction, responsive inspection, and browser-console inspection remain a manual verification item. API-backed behavior was executed directly against the running services.
