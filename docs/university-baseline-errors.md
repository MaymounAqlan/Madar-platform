# University Baseline Errors

## Compilation / Type / Build
| Area | Evidence | Impact | Recommended future phase |
|---|---|---|---|
| Frontend lint | `npm run lint` exit code 1, 293 problems | Quality gate fails | Phase 3 or dedicated lint cleanup |
| Frontend typecheck | `npx tsc --noEmit` exit code 0 | No TS compile errors in baseline | none |
| Frontend build | `npm run build` exit code 0 | Build passes | none |
| Backend typecheck | `npx tsc --noEmit` exit code 0 | Backend typecheck passes | none |
| Backend build | `npm run build` exit code 0 | Backend build passes | none |
| AI syntax | Scoped `compileall` exit code 0 | AI source syntax passes | none |

## Test Discovery
| Area | Evidence | Impact | Recommended future phase |
|---|---|---|---|
| Frontend tests | No `test` script in `app/package.json` | No frontend automated tests | Phase 3+ |
| Backend unit tests | Jest root is `src`; tests under `madar-backend/test`; no tests found | Existing backend tests are not executed | Phase 3 test config |
| Backend e2e tests | No files matching `.e2e-spec.ts` | E2E baseline unavailable | Phase 3 test config |
| AI tests | `.venv` pytest collected 0 items | No AI test coverage | Phase 3+ |

## University-Specific API Contract Issues
| File | Function/Class | Evidence | Impact | Recommended future phase |
|---|---|---|---|---|
| `app/src/types/api.types.ts` | `PaginatedResponse` | Expects `items` and `pagination` | Does not match university students endpoint | Phase 3 contract alignment |
| `madar-backend/src/universities/universities.service.ts` | `getStudents` | Returns `{ students,total,page,limit,totalPages }` | UI charts/filter collections missing | Phase 3 |
| `app/src/pages/university/UniversityStudents.tsx` | students page | Reads `colleges`, distributions, timeline | Missing data becomes empty UI | Phase 3 |
| `app/src/pages/university/UniversityDashboard.tsx` | dashboard page | Reads `colleges`, `trends`, `topEmployers`, `recentPlacements` | Backend returns `collegePerformance` and `kpis.topEmployers` | Phase 3 |
| `madar-backend/src/universities/universities.service.ts` | `getStructure` | `courses` is `Promise.resolve([])` | Curriculum/course data is not real | Phase 3+ |
| `madar-backend/src/universities/universities.service.ts` | `getCourseMarketComparison` | Reads `(dept as any).courses` | Department schema does not confirm courses | Phase 3+ |
| `madar-backend/src/universities/universities.service.ts` | `generateReport` | Excel maps to CSV; PDF maps to JSON content | Report export requirement is partial | Phase 3+ |
| `app/src/pages/university/UniversityStructure.tsx` | `handleSaveStructure({ type: 'addPlan' })` | Backend expects body with `colleges` | Button/action contract risk | Phase 3 |
| `app/src/pages/university/UniversityDashboard.tsx` | title/fallbacks | Hardcoded King Saud text | Static data risk | Phase 3+ |
| `app/src/data/university.ts` | static data file | Contains "University Mock Data" | Potential stale/mock source | Later cleanup, not Phase 2 |

## Security / Data Integrity
| Issue | Evidence | Impact | Recommended future phase |
|---|---|---|---|
| Coordinator frontend/backend mismatch | Frontend allows coordinator; integrated backend university endpoints mostly do not | Runtime 403 for coordinators | Phase 3 |
| No institution status guard | Guards check JWT role only | Pending/suspended university may access if token valid and profile exists | Phase 3 |
| Registration bypasses approval | Auth creates `University.status = active` | Admin approval flow is not authoritative | Phase 3 |
| Login does not block suspended/pending_verification | Login blocks only banned/inactive | Suspended user status may still log in | Phase 3 |
| Student linking writes during read | `linkStudentsToAcademicStructure` called by dashboard/structure/students/analytics | Data mutations occur in GET-like flows | Phase 3+ |
| Student affiliation by name | `buildStudentFilter` matches university names and IDs | Typo/name collision risk | Phase 3+ |

## Dependency / Environment
| Area | Evidence | Impact | Recommended future phase |
|---|---|---|---|
| Frontend audit | 12 vulnerabilities | Security maintenance risk | Dependency audit phase |
| Backend audit | 40 vulnerabilities and deprecated packages | Security maintenance risk | Dependency audit phase |
| Backend lint script | Uses `--fix` | Cannot be used safely in read-only baseline | Change script in future, not Phase 2 |
| AI global pytest | Global Python lacks pytest | Use `.venv` for AI testing | Environment docs |
