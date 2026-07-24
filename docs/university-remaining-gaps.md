# University Remaining Gaps

1. University registration supports a validated logo URL; binary logo and accreditation upload was not added.
2. Super Admin approval is complete, but direct Super Admin institution creation plus first-admin invitation was not implemented in this iteration.
3. Curriculum comparison uses real structured market and course mappings. No new FastAPI model was invented; an external AI curriculum endpoint remains a future integration.
4. Report period, college, and department filter DTOs and queues for very large exports remain pending.
5. PDF output is valid but uses the standard PDF font; embedded Arabic-font shaping is not included.
6. Frontend visual and RTL automation was unavailable. Build and HTTP runtime verification passed.
7. pytest is absent from the Python environment, so AI test discovery is blocked although syntax compilation passed.
8. Existing dependency audit reports 41 npm vulnerabilities: 3 low, 21 moderate, 17 high. No forced upgrades were performed.
