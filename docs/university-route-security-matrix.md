# University Route Security Matrix

| Frontend route | Allowed frontend roles | Backend endpoint | Backend guards | Backend roles | Ownership check | Institution status check | Result |
|---|---|---|---|---|---|---|---|
| `/register` | Public | `POST /api/auth/register` | none | public | none | none | Public registration; university accounts become active immediately |
| `/university/dashboard` | `university`, `coordinator` | `GET /api/universities/dashboard` | `JwtAuthGuard`, `RolesGuard` | `UNIVERSITY`, `ADMIN`, `SUPER_ADMIN` | `findByUserId(userId)` for university context | none | Coordinator can enter frontend route but backend role list does not include coordinator |
| `/university/structure` | `university`, `coordinator` | `GET /api/universities/structure`; create/update endpoints under `/api/universities/*` | `JwtAuthGuard`, `RolesGuard` | Read: `UNIVERSITY`, `ADMIN`, `SUPER_ADMIN`; write mostly `UNIVERSITY` only | Yes, via `universityId` filters | none | Frontend allows coordinator more broadly than backend integrated controller |
| `/university/students` | `university`, `coordinator` | `GET /api/universities/students` | `JwtAuthGuard`, `RolesGuard` | `UNIVERSITY` only | Yes, by `findByUserId` and student filter | none | Coordinator route mismatch: frontend allows; backend rejects |

Additional observations:
- `JwtAuthGuard` verifies JWT and attaches payload to `request.user`.
- `RolesGuard` checks only role from JWT payload.
- `SUPER_ADMIN` bypasses role checks.
- Generic guards do not load the current user from DB to check `status`.
- Generic guards do not load the university profile to check `University.status`.
- `AuthService.login` blocks `banned` and `inactive` users, but not `suspended` or `pending_verification`.
- University registration creates `User.status = active` and `University.status = active`.
- Admin approval endpoints exist under `/api/admin/universities/:id/approve` and `/api/admin/universities/:id/suspend`, but the registration workflow does not require them.
