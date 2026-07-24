# MADAR Platform — Proposed Directory Structure

> **Version:** 1.0  
> **Stack:** Next.js 15 + React 19 + TypeScript (App Router)  
> **Architecture:** Modular, Feature-Based, Multi-Actor Platform  
> **Last Updated:** 2025-01-15

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Complete Directory Tree](#2-complete-directory-tree)
3. [Directory Explanations](#3-directory-explanations)
4. [File Naming Conventions](#4-file-naming-conventions)
5. [Import Rules & Barrel Exports](#5-import-rules--barrel-exports)
6. [Route Map](#6-route-map)
7. [Testing Strategy](#7-testing-strategy)
8. [i18n Strategy](#8-i18n-strategy)
9. [Key Configuration Files](#9-key-configuration-files)

---

## 1. Architecture Principles

The MADAR platform follows these core architectural principles:

| Principle | Description |
|-----------|-------------|
| **Feature-Based Colocation** | Each feature owns its components, hooks, types, utils, services, and tests. Features are self-contained modules. |
| **Shared Components (Design System)** | Reusable UI primitives live in `src/components/ui/` and follow a design-system pattern. |
| **Route Groups for Role Portals** | Next.js App Router route groups `(student)`, `(company)`, `(university)`, `(admin)`, `(auth)`, `(public)` isolate role-based layouts and pages. |
| **API Service Layer** | All backend communication is abstracted through domain-organized services in `src/services/` and `src/features/*/services/`. |
| **Full i18n Support** | Bilingual Arabic/English via `next-intl` with per-feature translation namespaces. |
| **Co-located Testing** | Unit tests live alongside the code they test (`__tests__/`); integration/E2E tests live in `tests/`. |
| **Strict Type Safety** | Strict TypeScript configuration with centralized shared types and per-feature type extensions. |

---

## 2. Complete Directory Tree

```
MADAR/
|
+-- .env                                  # Environment variables (git-ignored)
+-- .env.local                            # Local environment overrides (git-ignored)
+-- .env.development                      # Development environment variables
+-- .env.production                       # Production environment variables
+-- .env.test                             # Test environment variables
+-- .eslintrc.json                        # ESLint configuration
+-- .prettierrc                           # Prettier code formatting rules
+-- .gitignore                            # Git ignore rules
+-- jest.config.js                        # Jest test runner configuration
+-- jest.setup.ts                         # Jest setup (testing-library, mocks)
+-- next.config.js                        # Next.js configuration
+-- next.config.ts                        # TypeScript variant of Next.js config
+-- package.json                          # Dependencies and scripts
+-- postcss.config.mjs                    # PostCSS configuration
+-- tailwind.config.ts                    # Tailwind CSS configuration
+-- tsconfig.json                         # TypeScript compiler configuration
+-- components.json                       # shadcn/ui components configuration
|
+-- docker/
|   +-- Dockerfile                        # Production Dockerfile
|   +-- Dockerfile.dev                    # Development Dockerfile
|   +-- docker-compose.yml                # Full stack compose
|   +-- docker-compose.dev.yml            # Development compose
|   +-- docker-compose.test.yml           # Testing compose
|   +-- .dockerignore                     # Docker ignore rules
|   +-- nginx/
|   |   +-- nginx.conf                    # Nginx reverse proxy config
|   |   +-- madar.conf                    # MADAR-specific server block
|   +-- scripts/
|   |   +-- init-db.sh                    # Database initialization script
|   |   +-- healthcheck.sh                # Container health check
|
+-- docs/
|   +-- README.md                         # Project overview
|   +-- ARCHITECTURE.md                   # Architecture decision records (ADRs)
|   +-- API.md                            # API documentation
|   +-- DEPLOYMENT.md                     # Deployment guide
|   +-- DEVELOPMENT.md                    # Developer onboarding
|   +-- TESTING.md                        # Testing guidelines
|   +-- I18N.md                           # Internationalization guide
|   +-- AUTH.md                           # Authentication & authorization
|   +-- CONVENTIONS.md                    # Code conventions
|   +-- CHANGELOG.md                      # Version changelog
|
+-- scripts/
|   +-- generate-component.ts             # CLI: scaffold a component
|   +-- generate-feature.ts               # CLI: scaffold a feature module
|   +-- generate-api-route.ts             # CLI: scaffold an API route
|   +-- db-migrate.sh                     # Database migration runner
|   +-- seed-data.ts                      # Development seed data
|   +-- lint-staged.sh                    # Pre-commit lint script
|   +-- check-translations.ts             # Validate translation completeness
|
+-- public/
|   +-- favicon.ico
|   +-- robots.txt
|   +-- sitemap.xml
|   +-- manifest.json
|   +-- images/
|   |   +-- logo/
|   |   |   +-- madar-logo.svg
|   |   |   +-- madar-logo-dark.svg
|   |   |   +-- madar-icon.svg
|   |   +-- hero/
|   |   |   +-- hero-bg.jpg
|   |   |   +-- hero-illustration.svg
|   |   +-- avatars/
|   |   |   +-- default-avatar.svg
|   |   +-- illustrations/
|   |   |   +-- empty-state.svg
|   |   |   +-- error-state.svg
|   |   |   +-- success-state.svg
|   |   +-- flags/
|   |   |   +-- sa-flag.svg
|   |   |   +-- us-flag.svg
|   +-- fonts/
|   |   +-- NotoSansArabic-Variable.woff2
|   |   +-- Inter-Variable.woff2
|   +-- documents/
|   |   +-- terms-of-service.pdf
|   |   +-- privacy-policy.pdf
|
+-- tests/
|   +-- e2e/
|   |   +-- auth/
|   |   |   +-- login.spec.ts
|   |   |   +-- register.spec.ts
|   |   |   +-- password-reset.spec.ts
|   |   +-- student/
|   |   |   +-- dashboard.spec.ts
|   |   |   +-- profile.spec.ts
|   |   |   +-- applications.spec.ts
|   |   +-- company/
|   |   |   +-- dashboard.spec.ts
|   |   |   +-- job-posting.spec.ts
|   |   +-- university/
|   |   |   +-- dashboard.spec.ts
|   |   +-- admin/
|   |   |   +-- user-management.spec.ts
|   |   |   +-- analytics.spec.ts
|   |   +-- setup/
|   |   |   +-- global-setup.ts
|   |   |   +-- auth.setup.ts
|   |   +-- fixtures/
|   |   |   +-- test-data.json
|   |   +-- utils/
|   |   |   +-- test-helpers.ts
|   |   |   +-- auth-helpers.ts
|   |   +-- playwright.config.ts
|   +-- integration/
|   |   +-- api/
|   |   |   +-- auth-api.test.ts
|   |   |   +-- student-api.test.ts
|   |   |   +-- matching-api.test.ts
|   |   +-- features/
|   |   |   +-- matching-flow.test.ts
|   |   |   +-- application-flow.test.ts
|   +-- mocks/
|   |   +-- handlers.ts                   # MSW request handlers
|   |   +-- server.ts                     # MSW server setup
|   |   +-- data/
|   |   |   +-- students.mock.ts
|   |   |   +-- companies.mock.ts
|   |   |   +-- jobs.mock.ts
|   |   |   +-- universities.mock.ts
|
+-- src/
|   |
|   +-- app/                              # Next.js App Router
|   |   +-- layout.tsx                    # Root layout (i18n providers)
|   |   +-- page.tsx                      # Landing page (redirects by role)
|   |   +-- error.tsx                     # Root error boundary
|   |   +-- loading.tsx                   # Root loading UI
|   |   +-- not-found.tsx                 # Global 404 page
|   |   +-- robots.ts                     # Dynamic robots.txt
|   |   +-- sitemap.ts                    # Dynamic sitemap
|   |   |
|   |   +-- api/                          # Internal API routes
|   |   |   +-- auth/
|   |   |   |   +-- [...nextauth]/
|   |   |   |   |   +-- route.ts          # NextAuth.js handler
|   |   |   |   +-- register/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- verify-email/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- forgot-password/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- reset-password/
|   |   |   |   |   +-- route.ts
|   |   |   +-- students/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   |   |   +-- profile/
|   |   |   |   |   |   +-- route.ts
|   |   |   |   |   +-- applications/
|   |   |   |   |   |   +-- route.ts
|   |   |   +-- companies/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   |   |   +-- jobs/
|   |   |   |   |   |   +-- route.ts
|   |   |   +-- jobs/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- search/
|   |   |   |   |   +-- route.ts
|   |   |   +-- matching/
|   |   |   |   +-- route.ts
|   |   |   |   +-- recommendations/
|   |   |   |   |   +-- route.ts
|   |   |   +-- applications/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   |   |   +-- status/
|   |   |   |   |   |   +-- route.ts
|   |   |   +-- universities/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   +-- admin/
|   |   |   |   +-- users/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- analytics/
|   |   |   |   |   +-- route.ts
|   |   |   |   +-- reports/
|   |   |   |   |   +-- route.ts
|   |   |   +-- notifications/
|   |   |   |   +-- route.ts
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- route.ts
|   |   |   +-- upload/
|   |   |   |   +-- route.ts
|   |   |
|   |   +-- (public)/                     # Public-facing pages
|   |   |   +-- layout.tsx
|   |   |   +-- page.tsx                  # Home / Landing page
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- about/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- loading.tsx
|   |   |   +-- contact/
|   |   |   |   +-- page.tsx
|   |   |   +-- faq/
|   |   |   |   +-- page.tsx
|   |   |   +-- terms/
|   |   |   |   +-- page.tsx
|   |   |   +-- privacy/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (auth)/                       # Authentication pages
|   |   |   +-- layout.tsx                # Auth layout (centered card)
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- login/
|   |   |   |   +-- page.tsx
|   |   |   +-- register/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- layout.tsx            # Multi-step register layout
|   |   |   |   +-- student/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- company/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- university/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- forgot-password/
|   |   |   |   +-- page.tsx
|   |   |   +-- reset-password/
|   |   |   |   +-- page.tsx
|   |   |   +-- verify-email/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (student)/                    # Student portal
|   |   |   +-- layout.tsx                # Student portal layout (sidebar)
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- dashboard/
|   |   |   |   +-- page.tsx
|   |   |   +-- profile/
|   |   |   |   +-- page.tsx
|   |   |   +-- applications/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- jobs/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- internships/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- resume/
|   |   |   |   +-- page.tsx
|   |   |   +-- skills/
|   |   |   |   +-- page.tsx
|   |   |   +-- notifications/
|   |   |   |   +-- page.tsx
|   |   |   +-- settings/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (company)/                    # Company portal
|   |   |   +-- layout.tsx                # Company portal layout
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- dashboard/
|   |   |   |   +-- page.tsx
|   |   |   +-- profile/
|   |   |   |   +-- page.tsx
|   |   |   +-- jobs/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- create/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |   +-- edit/
|   |   |   |   |   |   +-- page.tsx
|   |   |   |   |   +-- applicants/
|   |   |   |   |   |   +-- page.tsx
|   |   |   +-- applicants/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- interns/
|   |   |   |   +-- page.tsx
|   |   |   +-- evaluations/
|   |   |   |   +-- page.tsx
|   |   |   +-- analytics/
|   |   |   |   +-- page.tsx
|   |   |   +-- notifications/
|   |   |   |   +-- page.tsx
|   |   |   +-- settings/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (university)/                 # University portal
|   |   |   +-- layout.tsx                # University portal layout
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- dashboard/
|   |   |   |   +-- page.tsx
|   |   |   +-- students/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- companies/
|   |   |   |   +-- page.tsx
|   |   |   +-- partnerships/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- requests/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- reports/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- generate/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- analytics/
|   |   |   |   +-- page.tsx
|   |   |   +-- coordinators/
|   |   |   |   +-- page.tsx
|   |   |   +-- settings/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (admin)/                      # Admin portal
|   |   |   +-- layout.tsx                # Admin portal layout
|   |   |   +-- loading.tsx
|   |   |   +-- error.tsx
|   |   |   +-- dashboard/
|   |   |   |   +-- page.tsx
|   |   |   +-- users/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- companies/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- [id]/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- pending/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- universities/
|   |   |   |   +-- page.tsx
|   |   |   +-- jobs/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- pending/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- analytics/
|   |   |   |   +-- page.tsx
|   |   |   +-- reports/
|   |   |   |   +-- page.tsx
|   |   |   +-- settings/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- general/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- security/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- matching/
|   |   |   |   |   +-- page.tsx
|   |   |   +-- audit-log/
|   |   |   |   +-- page.tsx
|   |   |   +-- notifications/
|   |   |   |   +-- page.tsx
|   |   |   +-- system-health/
|   |   |   |   +-- page.tsx
|   |   |
|   |   +-- (coordinator)/                # Coordinator portal
|   |       +-- layout.tsx
|   |       +-- loading.tsx
|   |       +-- error.tsx
|   |       +-- dashboard/
|   |       |   +-- page.tsx
|   |       +-- students/
|   |       |   +-- page.tsx
|   |       +-- placements/
|   |       |   +-- page.tsx
|   |       +-- evaluations/
|   |       |   +-- page.tsx
|   |       +-- reports/
|   |           +-- page.tsx
|   |
|   +-- components/                       # React components
|   |   +-- ui/                           # Primitive UI (design system)
|   |   |   +-- button/
|   |   |   |   +-- button.tsx
|   |   |   |   +-- button.test.tsx
|   |   |   |   +-- button.types.ts
|   |   |   |   +-- button.variants.ts
|   |   |   |   +-- index.ts              # Barrel export
|   |   |   +-- card/
|   |   |   |   +-- card.tsx
|   |   |   |   +-- card.test.tsx
|   |   |   |   +-- card.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- input/
|   |   |   |   +-- input.tsx
|   |   |   |   +-- input.test.tsx
|   |   |   |   +-- input.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- select/
|   |   |   |   +-- select.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- modal/
|   |   |   |   +-- modal.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- dialog/
|   |   |   |   +-- dialog.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- dropdown/
|   |   |   |   +-- dropdown.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- table/
|   |   |   |   +-- table.tsx
|   |   |   |   +-- table.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- form/
|   |   |   |   +-- form.tsx
|   |   |   |   +-- form.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- badge/
|   |   |   |   +-- badge.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- avatar/
|   |   |   |   +-- avatar.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- tooltip/
|   |   |   |   +-- tooltip.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- toast/
|   |   |   |   +-- toast.tsx
|   |   |   |   +-- toaster.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- skeleton/
|   |   |   |   +-- skeleton.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- spinner/
|   |   |   |   +-- spinner.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- tabs/
|   |   |   |   +-- tabs.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- accordion/
|   |   |   |   +-- accordion.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- pagination/
|   |   |   |   +-- pagination.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- breadcrumb/
|   |   |   |   +-- breadcrumb.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- stepper/
|   |   |   |   +-- stepper.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- date-picker/
|   |   |   |   +-- date-picker.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- file-upload/
|   |   |   |   +-- file-upload.tsx
|   |   |   |   +-- file-upload.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- search/
|   |   |   |   +-- search.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- filter/
|   |   |   |   +-- filter.tsx
|   |   |   |   +-- filter.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- data-table/
|   |   |   |   +-- data-table.tsx
|   |   |   |   +-- data-table.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- chart-container/
|   |   |   |   +-- chart-container.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- empty-state/
|   |   |   |   +-- empty-state.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- error-state/
|   |   |   |   +-- error-state.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- status-badge/
|   |   |   |   +-- status-badge.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- language-switcher/
|   |   |   |   +-- language-switcher.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- theme-toggle/
|   |   |   |   +-- theme-toggle.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts                  # Master barrel for all UI components
|   |   |
|   |   +-- layout/                       # Layout components
|   |   |   +-- app-shell/
|   |   |   |   +-- app-shell.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- sidebar/
|   |   |   |   +-- sidebar.tsx
|   |   |   |   +-- sidebar.types.ts
|   |   |   |   +-- sidebar-nav.tsx
|   |   |   |   +-- sidebar-toggle.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- navbar/
|   |   |   |   +-- navbar.tsx
|   |   |   |   +-- navbar.types.ts
|   |   |   |   +-- navbar-mobile.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- footer/
|   |   |   |   +-- footer.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- header/
|   |   |   |   +-- header.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- portal-layout/
|   |   |   |   +-- portal-layout.tsx
|   |   |   |   +-- portal-layout.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- breadcrumbs/
|   |   |   |   +-- breadcrumbs.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- command-palette/
|   |   |   |   +-- command-palette.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- notifications-panel/
|   |   |   |   +-- notifications-panel.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts                  # Barrel export
|   |   |
|   |   +-- shared/                       # Shared feature components
|   |   |   +-- user-card/
|   |   |   |   +-- user-card.tsx
|   |   |   |   +-- user-card.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- job-card/
|   |   |   |   +-- job-card.tsx
|   |   |   |   +-- job-card.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- company-card/
|   |   |   |   +-- company-card.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- stats-card/
|   |   |   |   +-- stats-card.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- page-header/
|   |   |   |   +-- page-header.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- section-title/
|   |   |   |   +-- section-title.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- data-export/
|   |   |   |   +-- data-export.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- filters-panel/
|   |   |   |   +-- filters-panel.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts                  # Barrel export
|   |   |
|   |   +-- charts/                       # Data visualization components
|   |       +-- bar-chart/
|   |       |   +-- bar-chart.tsx
|   |       |   +-- index.ts
|   |       +-- line-chart/
|   |       |   +-- line-chart.tsx
|   |       |   +-- index.ts
|   |       +-- pie-chart/
|   |       |   +-- pie-chart.tsx
|   |       |   +-- index.ts
|   |       +-- area-chart/
|   |       |   +-- area-chart.tsx
|   |       |   +-- index.ts
|   |       +-- donut-chart/
|   |       |   +-- donut-chart.tsx
|   |       |   +-- index.ts
|   |       +-- stat-trend/
|   |       |   +-- stat-trend.tsx
|   |       |   +-- index.ts
|   |       +-- chart-card/
|   |       |   +-- chart-card.tsx
|   |       |   +-- index.ts
|   |       +-- index.ts                  # Barrel export
|   |
|   +-- hooks/                            # Global custom React hooks
|   |   +-- use-auth.ts
|   |   +-- use-user.ts
|   |   +-- use-local-storage.ts
|   |   +-- use-media-query.ts
|   |   +-- use-debounce.ts
|   |   +-- use-throttle.ts
|   |   +-- use-pagination.ts
|   |   +-- use-sort.ts
|   |   +-- use-filter.ts
|   |   +-- use-search.ts
|   |   +-- use-fetch.ts
|   |   +-- use-mutation.ts
|   |   +-- use-toast.ts
|   |   +-- use-notifications.ts
|   |   +-- use-permissions.ts
|   |   +-- use-theme.ts
|   |   +-- use-locale.ts
|   |   +-- use-outside-click.ts
|   |   +-- use-form.ts
|   |   +-- use-disclosure.ts
|   |   +-- use-copy-to-clipboard.ts
|   |   +-- use-online-status.ts
|   |   +-- index.ts                      # Barrel export
|   |
|   +-- lib/                              # Utility functions & configurations
|   |   +-- utils/
|   |   |   +-- cn.ts                     # Tailwind class merge (clsx + twMerge)
|   |   |   +-- format-date.ts
|   |   |   +-- format-number.ts
|   |   |   +-- format-currency.ts
|   |   |   +-- validators.ts
|   |   |   +-- sanitizers.ts
|   |   |   +-- crypto.ts                 # Client-side crypto helpers
|   |   |   +-- export-utils.ts           # CSV/Excel/PDF export
|   |   |   +-- file-helpers.ts
|   |   |   +-- url-helpers.ts
|   |   |   +-- search-utils.ts
|   |   |   +-- array-utils.ts
|   |   |   +-- object-utils.ts
|   |   |   +-- string-utils.ts
|   |   |   +-- date-utils.ts
|   |   |   +-- index.ts                  # Barrel export
|   |   +-- prisma.ts                     # Prisma client singleton
|   |   +-- next-auth.config.ts           # NextAuth.js configuration
|   |   +-- api-client.ts                 # Axios/fetch wrapper
|   |   +-- query-client.ts               # TanStack Query client config
|   |   +-- rbac.ts                       # Role-based access control
|   |   +-- logger.ts                     # Client-side logging
|   |   +-- analytics.ts                  # Analytics integration
|   |   +-- config/
|   |   |   +-- site.config.ts            # Site metadata & config
|   |   |   +-- features.config.ts        # Feature flags
|   |   |   +-- roles.config.ts           # Role definitions & permissions
|   |   |   +-- navigation.config.ts      # Navigation items per role
|   |   |   +-- constants.config.ts       # App-wide constants
|   |   |   +-- index.ts
|   |
|   +-- types/                            # Global TypeScript types
|   |   +-- index.ts                      # Master type export
|   |   +-- user.types.ts
|   |   +-- student.types.ts
|   |   +-- company.types.ts
|   |   +-- university.types.ts
|   |   +-- job.types.ts
|   |   +-- application.types.ts
|   |   +-- matching.types.ts
|   |   +-- notification.types.ts
|   |   +-- analytics.types.ts
|   |   +-- api.types.ts
|   |   +-- auth.types.ts
|   |   +-- common.types.ts
|   |   +-- form.types.ts
|   |   +-- table.types.ts
|   |   +-- chart.types.ts
|   |   +-- i18n.types.ts
|   |   +-- rbac.types.ts
|   |
|   +-- constants/                        # Application constants
|   |   +-- index.ts
|   |   +-- api.constants.ts              # API endpoints, status codes
|   |   +-- app.constants.ts              # App-level constants
|   |   +-- routes.constants.ts           # Route paths
|   |   +-- roles.constants.ts            # Role identifiers
|   |   +-- http-status.constants.ts      # HTTP status messages
|   |   +-- validation.constants.ts       # Validation rules
|   |   +-- pagination.constants.ts       # Default pagination values
|   |   +-- matching.constants.ts         # Matching algorithm params
|   |   +-- file.constants.ts             # File upload limits, types
|   |
|   +-- services/                         # Global API service layer
|   |   +-- index.ts
|   |   +-- api/                          # Base API setup
|   |   |   +-- http-client.ts            # HTTP client (axios instance)
|   |   |   +-- interceptors.ts           # Request/response interceptors
|   |   |   +-- error-handler.ts          # Centralized error handling
|   |   |   +-- index.ts
|   |   +-- auth/
|   |   |   +-- auth.service.ts
|   |   |   +-- auth.types.ts
|   |   |   +-- index.ts
|   |   +-- student/
|   |   |   +-- student.service.ts
|   |   |   +-- student.types.ts
|   |   |   +-- index.ts
|   |   +-- company/
|   |   |   +-- company.service.ts
|   |   |   +-- company.types.ts
|   |   |   +-- index.ts
|   |   +-- university/
|   |   |   +-- university.service.ts
|   |   |   +-- university.types.ts
|   |   |   +-- index.ts
|   |   +-- job/
|   |   |   +-- job.service.ts
|   |   |   +-- job.types.ts
|   |   |   +-- index.ts
|   |   +-- application/
|   |   |   +-- application.service.ts
|   |   |   +-- application.types.ts
|   |   |   +-- index.ts
|   |   +-- matching/
|   |   |   +-- matching.service.ts
|   |   |   +-- matching.types.ts
|   |   |   +-- index.ts
|   |   +-- notification/
|   |   |   +-- notification.service.ts
|   |   |   +-- notification.types.ts
|   |   |   +-- index.ts
|   |   +-- upload/
|   |   |   +-- upload.service.ts
|   |   |   +-- index.ts
|   |   +-- analytics/
|   |       +-- analytics.service.ts
|   |       +-- index.ts
|   |
|   +-- contexts/                         # React contexts
|   |   +-- auth-context.tsx
|   |   +-- user-context.tsx
|   |   +-- theme-context.tsx
|   |   +-- notification-context.tsx
|   |   +-- sidebar-context.tsx
|   |   +-- index.ts
|   |
|   +-- providers/                        # Application providers
|   |   +-- root-provider.tsx             # Composes all providers
|   |   +-- auth-provider.tsx
|   |   +-- query-provider.tsx            # TanStack Query provider
|   |   +-- theme-provider.tsx
|   |   +-- i18n-provider.tsx
|   |   +-- notification-provider.tsx
|   |   +-- toast-provider.tsx
|   |   +-- index.ts
|   |
|   +-- middleware/                       # Next.js middleware
|   |   +-- middleware.ts                 # Main middleware entry
|   |   +-- auth.middleware.ts            # Authentication checks
|   |   +-- i18n.middleware.ts            # Locale detection & routing
|   |   +-- rbac.middleware.ts            # Role-based access control
|   |   +-- rate-limit.middleware.ts      # Rate limiting
|   |   +-- security.middleware.ts        # Security headers
|   |   +-- index.ts
|   |
|   +-- i18n/                             # Internationalization
|   |   +-- config.ts                     # next-intl configuration
|   |   +-- request.ts                    # i18n request handler
|   |   +-- routing.ts                    # Locale routing config
|   |   +-- messages/
|   |   |   +-- en.json                   # English translations (root)
|   |   |   +-- ar.json                   # Arabic translations (root)
|   |   |   +-- auth/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- student/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- company/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- university/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- admin/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- matching/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- common/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- errors/
|   |   |   |   +-- en.json
|   |   |   |   +-- ar.json
|   |   |   +-- validation/
|   |   |       +-- en.json
|   |   |       +-- ar.json
|   |   +-- locales.ts                    # Locale constants & helpers
|   |   +-- locale-detector.ts            # Locale detection logic
|   |
|   +-- styles/                           # Global styles
|   |   +-- globals.css                   # Global CSS + Tailwind directives
|   |   +-- fonts.css                     # Font imports & declarations
|   |   +-- arabic.css                    # Arabic-specific overrides
|   |   +-- animations.css                # Custom animations
|   |   +-- utilities.css                 # Custom utility classes
|   |   +-- themes/
|   |   |   +-- light.css                 # Light theme tokens
|   |   |   +-- dark.css                  # Dark theme tokens
|   |
|   +-- features/                         # Feature modules
|   |   |
|   |   +-- auth/
|   |   |   +-- components/
|   |   |   |   +-- login-form/
|   |   |   |   |   +-- login-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- register-form/
|   |   |   |   |   +-- register-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- register-steps/
|   |   |   |   |   +-- personal-info-step.tsx
|   |   |   |   |   +-- account-step.tsx
|   |   |   |   |   +-- verification-step.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- forgot-password-form/
|   |   |   |   |   +-- forgot-password-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- reset-password-form/
|   |   |   |   |   +-- reset-password-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- oauth-buttons/
|   |   |   |   |   +-- oauth-buttons.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- role-selector/
|   |   |   |   |   +-- role-selector.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- auth-guard/
|   |   |   |       +-- auth-guard.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-login.ts
|   |   |   |   +-- use-register.ts
|   |   |   |   +-- use-forgot-password.ts
|   |   |   |   +-- use-reset-password.ts
|   |   |   |   +-- use-oauth.ts
|   |   |   |   +-- use-auth-guard.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- auth.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- auth-helpers.ts
|   |   |   |   +-- token-manager.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- auth-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- auth.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- login.schema.ts
|   |   |   |   +-- register.schema.ts
|   |   |   |   +-- password.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- login-form.test.tsx
|   |   |   |   +-- register-form.test.tsx
|   |   |   |   +-- use-login.test.ts
|   |   |   |   +-- auth-helpers.test.ts
|   |   |   |   +-- login.schema.test.ts
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts                  # Feature barrel export
|   |   |
|   |   +-- student/
|   |   |   +-- components/
|   |   |   |   +-- student-dashboard/
|   |   |   |   |   +-- student-dashboard.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- student-profile-form/
|   |   |   |   |   +-- student-profile-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- resume-builder/
|   |   |   |   |   +-- resume-builder.tsx
|   |   |   |   |   +-- resume-section.tsx
|   |   |   |   |   +-- resume-preview.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- skills-assessment/
|   |   |   |   |   +-- skills-assessment.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- application-list/
|   |   |   |   |   +-- application-list.tsx
|   |   |   |   |   +-- application-item.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- job-search/
|   |   |   |   |   +-- job-search.tsx
|   |   |   |   |   +-- job-filters.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- internship-tracker/
|   |   |   |   |   +-- internship-tracker.tsx
|   |   |   |   |   +-- timeline.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- student-stats/
|   |   |   |       +-- student-stats.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-student-profile.ts
|   |   |   |   +-- use-student-applications.ts
|   |   |   |   +-- use-job-search.ts
|   |   |   |   +-- use-resume-builder.ts
|   |   |   |   +-- use-skills-assessment.ts
|   |   |   |   +-- use-internship-tracker.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- student.types.ts
|   |   |   |   +-- resume.types.ts
|   |   |   |   +-- skills.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- resume-helpers.ts
|   |   |   |   +-- skills-helpers.ts
|   |   |   |   +-- gpa-calculator.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- student-api.ts
|   |   |   |   +-- resume-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- student.constants.ts
|   |   |   |   +-- resume.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- profile.schema.ts
|   |   |   |   +-- resume.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- student-dashboard.test.tsx
|   |   |   |   +-- resume-builder.test.tsx
|   |   |   |   +-- use-student-profile.test.ts
|   |   |   |   +-- gpa-calculator.test.ts
|   |   |   |   +-- profile.schema.test.ts
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- company/
|   |   |   +-- components/
|   |   |   |   +-- company-dashboard/
|   |   |   |   |   +-- company-dashboard.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- job-posting-form/
|   |   |   |   |   +-- job-posting-form.tsx
|   |   |   |   |   +-- job-basic-info.tsx
|   |   |   |   |   +-- job-requirements.tsx
|   |   |   |   |   +-- job-preview.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- applicant-list/
|   |   |   |   |   +-- applicant-list.tsx
|   |   |   |   |   +-- applicant-card.tsx
|   |   |   |   |   +-- applicant-filters.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- applicant-review/
|   |   |   |   |   +-- applicant-review.tsx
|   |   |   |   |   +-- resume-viewer.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- intern-management/
|   |   |   |   |   +-- intern-management.tsx
|   |   |   |   |   +-- intern-card.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- evaluation-form/
|   |   |   |   |   +-- evaluation-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- company-profile-form/
|   |   |   |   |   +-- company-profile-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- company-stats/
|   |   |   |       +-- company-stats.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-company-profile.ts
|   |   |   |   +-- use-job-postings.ts
|   |   |   |   +-- use-applicants.ts
|   |   |   |   +-- use-intern-management.ts
|   |   |   |   +-- use-evaluations.ts
|   |   |   |   +-- use-company-analytics.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- company.types.ts
|   |   |   |   +-- job.types.ts
|   |   |   |   +-- applicant.types.ts
|   |   |   |   +-- evaluation.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- job-helpers.ts
|   |   |   |   +-- applicant-scoring.ts
|   |   |   |   +-- evaluation-helpers.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- company-api.ts
|   |   |   |   +-- job-api.ts
|   |   |   |   +-- applicant-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- company.constants.ts
|   |   |   |   +-- job.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- job-posting.schema.ts
|   |   |   |   +-- evaluation.schema.ts
|   |   |   |   +-- company-profile.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- job-posting-form.test.tsx
|   |   |   |   +-- applicant-list.test.tsx
|   |   |   |   +-- use-job-postings.test.ts
|   |   |   |   +-- applicant-scoring.test.ts
|   |   |   |   +-- job-posting.schema.test.ts
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- university/
|   |   |   +-- components/
|   |   |   |   +-- university-dashboard/
|   |   |   |   |   +-- university-dashboard.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- student-directory/
|   |   |   |   |   +-- student-directory.tsx
|   |   |   |   |   +-- student-table.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- company-directory/
|   |   |   |   |   +-- company-directory.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- partnership-manager/
|   |   |   |   |   +-- partnership-manager.tsx
|   |   |   |   |   +-- partnership-card.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- report-generator/
|   |   |   |   |   +-- report-generator.tsx
|   |   |   |   |   +-- report-preview.tsx
|   |   |   |   |   +-- report-templates.ts
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- coordinator-management/
|   |   |   |   |   +-- coordinator-management.tsx
|   |   |   |   |   +-- coordinator-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- university-stats/
|   |   |   |       +-- university-stats.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-university-profile.ts
|   |   |   |   +-- use-students.ts
|   |   |   |   +-- use-companies.ts
|   |   |   |   +-- use-partnerships.ts
|   |   |   |   +-- use-reports.ts
|   |   |   |   +-- use-coordinators.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- university.types.ts
|   |   |   |   +-- partnership.types.ts
|   |   |   |   +-- report.types.ts
|   |   |   |   +-- coordinator.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- report-helpers.ts
|   |   |   |   +-- partnership-helpers.ts
|   |   |   |   +-- statistics-helpers.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- university-api.ts
|   |   |   |   +-- partnership-api.ts
|   |   |   |   +-- report-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- university.constants.ts
|   |   |   |   +-- report.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- university-profile.schema.ts
|   |   |   |   +-- partnership.schema.ts
|   |   |   |   +-- coordinator.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- university-dashboard.test.tsx
|   |   |   |   +-- report-generator.test.tsx
|   |   |   |   +-- use-university-profile.test.ts
|   |   |   |   +-- statistics-helpers.test.ts
|   |   |   |   +-- report-templates.test.ts
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- admin/
|   |   |   +-- components/
|   |   |   |   +-- admin-dashboard/
|   |   |   |   |   +-- admin-dashboard.tsx
|   |   |   |   |   +-- stat-cards.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- user-management/
|   |   |   |   |   +-- user-management.tsx
|   |   |   |   |   +-- user-table.tsx
|   |   |   |   |   +-- user-filters.tsx
|   |   |   |   |   +-- user-form.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- company-approval/
|   |   |   |   |   +-- company-approval.tsx
|   |   |   |   |   +-- approval-queue.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- system-analytics/
|   |   |   |   |   +-- system-analytics.tsx
|   |   |   |   |   +-- analytics-filters.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- audit-log-viewer/
|   |   |   |   |   +-- audit-log-viewer.tsx
|   |   |   |   |   +-- audit-table.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- system-settings/
|   |   |   |   |   +-- system-settings.tsx
|   |   |   |   |   +-- settings-form.tsx
|   |   |   |   |   +-- matching-params.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- report-viewer/
|   |   |   |       +-- report-viewer.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-user-management.ts
|   |   |   |   +-- use-company-approvals.ts
|   |   |   |   +-- use-system-analytics.ts
|   |   |   |   +-- use-audit-log.ts
|   |   |   |   +-- use-system-settings.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- admin.types.ts
|   |   |   |   +-- audit.types.ts
|   |   |   |   +-- system-settings.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- admin-helpers.ts
|   |   |   |   +-- audit-helpers.ts
|   |   |   |   +-- analytics-helpers.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- admin-api.ts
|   |   |   |   +-- audit-api.ts
|   |   |   |   +-- settings-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- admin.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- user-form.schema.ts
|   |   |   |   +-- settings.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- admin-dashboard.test.tsx
|   |   |   |   +-- user-management.test.tsx
|   |   |   |   +-- use-user-management.test.ts
|   |   |   |   +-- admin-helpers.test.ts
|   |   |   |   +-- user-form.schema.test.ts
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- matching/                     # AI Matching feature
|   |   |   +-- components/
|   |   |   |   +-- matching-dashboard/
|   |   |   |   |   +-- matching-dashboard.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- matching-algorithm-config/
|   |   |   |   |   +-- matching-algorithm-config.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- match-results/
|   |   |   |   |   +-- match-results.tsx
|   |   |   |   |   +-- match-card.tsx
|   |   |   |   |   +-- match-score.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- recommendation-list/
|   |   |   |   |   +-- recommendation-list.tsx
|   |   |   |   |   +-- recommendation-card.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- skill-gap-analyzer/
|   |   |   |       +-- skill-gap-analyzer.tsx
|   |   |   |       +-- skill-gap-chart.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-matching.ts
|   |   |   |   +-- use-recommendations.ts
|   |   |   |   +-- use-skill-gap.ts
|   |   |   |   +-- use-matching-params.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- matching.types.ts
|   |   |   |   +-- recommendation.types.ts
|   |   |   |   +-- algorithm.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- matching-engine.ts
|   |   |   |   +-- scoring-algorithm.ts
|   |   |   |   +-- skill-matcher.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- matching-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- matching.constants.ts
|   |   |   |   +-- algorithm-params.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- matching-params.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- matching-engine.test.ts
|   |   |   |   +-- scoring-algorithm.test.ts
|   |   |   |   +-- skill-matcher.test.ts
|   |   |   |   +-- use-matching.test.ts
|   |   |   |   +-- matching-dashboard.test.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- analytics/                    # Analytics feature
|   |   |   +-- components/
|   |   |   |   +-- analytics-dashboard/
|   |   |   |   |   +-- analytics-dashboard.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- kpi-cards/
|   |   |   |   |   +-- kpi-cards.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- trend-chart/
|   |   |   |   |   +-- trend-chart.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- demographics-chart/
|   |   |   |   |   +-- demographics-chart.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- retention-chart/
|   |   |   |   |   +-- retention-chart.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- export-report/
|   |   |   |   |   +-- export-report.tsx
|   |   |   |   |   +-- index.ts
|   |   |   |   +-- date-range-picker/
|   |   |   |       +-- date-range-picker.tsx
|   |   |   |       +-- index.ts
|   |   |   +-- hooks/
|   |   |   |   +-- use-analytics.ts
|   |   |   |   +-- use-kpis.ts
|   |   |   |   +-- use-trends.ts
|   |   |   |   +-- use-demos.ts
|   |   |   |   +-- use-export.ts
|   |   |   |   +-- index.ts
|   |   |   +-- types/
|   |   |   |   +-- analytics.types.ts
|   |   |   |   +-- kpi.types.ts
|   |   |   |   +-- chart-data.types.ts
|   |   |   |   +-- index.ts
|   |   |   +-- utils/
|   |   |   |   +-- data-aggregators.ts
|   |   |   |   +-- chart-formatters.ts
|   |   |   |   +-- report-builders.ts
|   |   |   |   +-- index.ts
|   |   |   +-- services/
|   |   |   |   +-- analytics-api.ts
|   |   |   |   +-- index.ts
|   |   |   +-- constants/
|   |   |   |   +-- analytics.constants.ts
|   |   |   |   +-- kpis.constants.ts
|   |   |   |   +-- index.ts
|   |   |   +-- schema/
|   |   |   |   +-- analytics-filters.schema.ts
|   |   |   |   +-- index.ts
|   |   |   +-- __tests__/
|   |   |   |   +-- data-aggregators.test.ts
|   |   |   |   +-- chart-formatters.test.ts
|   |   |   |   +-- use-analytics.test.ts
|   |   |   |   +-- analytics-dashboard.test.tsx
|   |   |   |   +-- index.ts
|   |   |   +-- index.ts
|   |   |
|   |   +-- notifications/                # Notification feature
|   |       +-- components/
|   |       |   +-- notification-center/
|   |       |   |   +-- notification-center.tsx
|   |       |   |   +-- index.ts
|   |       |   +-- notification-item/
|   |       |   |   +-- notification-item.tsx
|   |       |   |   +-- index.ts
|   |       |   +-- notification-badge/
|   |       |   |   +-- notification-badge.tsx
|   |       |   |   +-- index.ts
|   |       |   +-- notification-preferences/
|   |       |   |   +-- notification-preferences.tsx
|   |       |   |   +-- index.ts
|   |       |   +-- toast-notification/
|   |       |       +-- toast-notification.tsx
|   |       |       +-- index.ts
|   |       +-- hooks/
|   |       |   +-- use-notifications.ts
|   |       |   +-- use-notification-center.ts
|   |       |   +-- use-push-notifications.ts
|   |       |   +-- use-notification-preferences.ts
|   |       |   +-- index.ts
|   |       +-- types/
|   |       |   +-- notification.types.ts
|   |       |   +-- index.ts
|   |       +-- utils/
|   |       |   +-- notification-helpers.ts
|   |       |   +-- push-manager.ts
|   |       |   +-- index.ts
|   |       +-- services/
|   |       |   +-- notification-api.ts
|   |       |   +-- index.ts
|   |       +-- constants/
|   |       |   +-- notification.constants.ts
|   |       |   +-- index.ts
|   |       +-- schema/
|   |       |   +-- notification-preferences.schema.ts
|   |       |   +-- index.ts
|   |       +-- __tests__/
|   |       |   +-- notification-center.test.tsx
|   |       |   +-- use-notifications.test.ts
|   |       |   +-- notification-helpers.test.ts
|   |       |   +-- index.ts
|   |       +-- index.ts
|   |
|   +-- features/
|       +-- index.ts                      # Master feature barrel export
|
```

---

## 3. Directory Explanations

### 3.1 `src/app/` — Next.js App Router

The `app/` directory is the entry point for all routes in the MADAR platform. It uses **Next.js Route Groups** to organize pages by audience/role:

| Route Group | Purpose | Example URLs |
|---|---|---|
| `(public)` | Unauthenticated landing pages | `/`, `/about`, `/contact`, `/faq` |
| `(auth)` | Authentication flows | `/login`, `/register`, `/forgot-password` |
| `(student)` | Student portal | `/dashboard`, `/profile`, `/jobs`, `/applications` |
| `(company)` | Company portal | `/dashboard`, `/jobs/create`, `/applicants` |
| `(university)` | University portal | `/dashboard`, `/students`, `/reports` |
| `(admin)` | Admin portal | `/dashboard`, `/users`, `/settings` |
| `(coordinator)` | Coordinator portal | `/dashboard`, `/placements`, `/evaluations` |

**Conventions:**
- Each route group has its own `layout.tsx` with role-specific navigation.
- Every leaf route includes `page.tsx`, and optionally `loading.tsx`, `error.tsx`, `not-found.tsx`.
- The `api/` directory contains internal API route handlers (Route Handlers) for non-NextAuth endpoints.
- Route groups use parentheses `(group)` so they don't appear in the URL path.

---

### 3.2 `src/components/` — React Components

Organized into three sub-categories following the design system hierarchy:

#### `ui/` — Primitive UI Components
- **Purpose:** Atomic, reusable UI elements with no business logic.
- **Pattern:** Each component is a folder containing the component, types, variants (if applicable), tests, and a barrel `index.ts`.
- **Source:** Built on top of shadcn/ui, Radix UI primitives, and Tailwind CSS.
- **Naming:** `PascalCase` folders, `kebab-case` files.
- **Key Examples:** `Button`, `Card`, `Input`, `Select`, `Modal`, `Table`, `Form`, `Toast`, `Skeleton`.

#### `layout/` — Layout Components
- **Purpose:** Structural components that define page layouts and navigation.
- **Scope:** Used across multiple route groups.
- **Key Examples:** `AppShell`, `Sidebar`, `Navbar`, `Footer`, `PortalLayout`, `Breadcrumbs`, `CommandPalette`, `NotificationsPanel`.

#### `shared/` — Shared Feature Components
- **Purpose:** Components shared across multiple features but not primitive enough for `ui/`.
- **Scope:** Used by multiple feature modules (e.g., `JobCard` used by Student and Company features).
- **Key Examples:** `UserCard`, `JobCard`, `CompanyCard`, `StatsCard`, `PageHeader`, `DataExport`, `FiltersPanel`.

#### `charts/` — Data Visualization Components
- **Purpose:** Chart and graph components for analytics dashboards.
- **Built on:** Recharts or similar charting library.
- **Key Examples:** `BarChart`, `LineChart`, `PieChart`, `AreaChart`, `DonutChart`, `StatTrend`, `ChartCard`.

---

### 3.3 `src/hooks/` — Custom React Hooks

- **Purpose:** Globally reusable custom hooks.
- **Scope:** Used across multiple features.
- **Organization:** Flat structure with descriptive naming.
- **Pattern:** Each hook is a single `camelCase.ts` file exporting one or more hooks.
- **Key Examples:** `useAuth`, `useDebounce`, `usePagination`, `usePermissions`, `useTheme`, `useLocale`.

---

### 3.4 `src/lib/` — Utilities & Configurations

#### `utils/` — Helper Functions
- **Purpose:** Pure utility functions used throughout the app.
- **Organization:** Grouped by domain (`format-date.ts`, `validators.ts`, `export-utils.ts`).
- **Key Examples:** `cn()` for Tailwind class merging, `formatDate()`, `validators`, `export-utils`.

#### `config/` — Configuration Files
- **Purpose:** Typed configuration objects for features, roles, navigation, and site settings.
- **Key Examples:** `site.config.ts`, `features.config.ts` (feature flags), `roles.config.ts`, `navigation.config.ts`.

#### Root-level Files
- `prisma.ts` — Prisma client singleton with connection pooling.
- `next-auth.config.ts` — NextAuth.js configuration (providers, callbacks, events).
- `api-client.ts` — Configured HTTP client (axios) with interceptors.
- `query-client.ts` — TanStack Query (React Query) client configuration.
- `rbac.ts` — Role-based access control utilities.

---

### 3.5 `src/types/` — TypeScript Type Definitions

- **Purpose:** Global TypeScript types, interfaces, and enums used across the application.
- **Organization:** One file per domain entity.
- **Pattern:** Each file exports types; `index.ts` barrel-exports all.
- **Naming Convention:** `*.types.ts` suffix.
- **Key Files:** `user.types.ts`, `student.types.ts`, `company.types.ts`, `job.types.ts`, `matching.types.ts`, `rbac.types.ts`, `api.types.ts`.

---

### 3.6 `src/constants/` — Application Constants

- **Purpose:** Immutable constants used throughout the app.
- **Organization:** Grouped by domain.
- **Naming Convention:** `SCREAMING_SNAKE_CASE` for values, `*.constants.ts` for files.
- **Key Files:** `api.constants.ts`, `routes.constants.ts`, `roles.constants.ts`, `validation.constants.ts`, `pagination.constants.ts`.

---

### 3.7 `src/services/` — Global API Service Layer

- **Purpose:** Centralized HTTP service layer for backend communication.
- **Organization:** One folder per domain; each contains the service file and local types.
- **Pattern:** Every service function returns typed promises; errors are handled by `error-handler.ts`.
- **Key Structure:**
  ```
  services/
  +-- api/          # HTTP client setup, interceptors, error handling
  +-- auth/         # Authentication API calls
  +-- student/      # Student data API calls
  +-- company/      # Company data API calls
  +-- job/          # Job posting API calls
  +-- application/  # Internship application API calls
  +-- matching/     # AI matching API calls
  +-- notification/ # Notification API calls
  +-- analytics/    # Analytics/reporting API calls
  +-- upload/       # File upload API calls
  ```

---

### 3.8 `src/contexts/` — React Contexts

- **Purpose:** React Context definitions for cross-cutting state.
- **Scope:** Global contexts that don't fit into a single feature.
- **Key Contexts:** `AuthContext`, `UserContext`, `ThemeContext`, `NotificationContext`, `SidebarContext`.
- **Pattern:** Each file exports the Context object and a typed `useXxx()` hook.

---

### 3.9 `src/providers/` — Application Providers

- **Purpose:** Provider component compositions that wrap the application.
- **Key Pattern:** `root-provider.tsx` composes all other providers into a single wrapper.
- **Key Providers:** `AuthProvider`, `QueryProvider`, `ThemeProvider`, `I18nProvider`, `NotificationProvider`, `ToastProvider`.

---

### 3.10 `src/middleware/` — Next.js Middleware

- **Purpose:** Next.js middleware chain for request interception.
- **Key Files:**
  - `middleware.ts` — Main entry, composes all middleware.
  - `auth.middleware.ts` — JWT/session validation.
  - `i18n.middleware.ts` — Locale detection and URL prefixing.
  - `rbac.middleware.ts` — Role-based route protection.
  - `rate-limit.middleware.ts` — Request rate limiting.
  - `security.middleware.ts` — Security headers (CSP, HSTS, etc.).

---

### 3.11 `src/i18n/` — Internationalization

- **Purpose:** `next-intl` configuration and translation files.
- **Structure:**
  ```
  i18n/
  +-- config.ts           # next-intl configuration
  +-- request.ts          # Request-level i18n setup
  +-- routing.ts          # Locale routing (prefix strategy)
  +-- locales.ts          # Locale constants
  +-- locale-detector.ts  # Browser locale detection
  +-- messages/           # Translation JSON files
      +-- en.json         # Root translations (common, navigation, errors)
      +-- ar.json
      +-- auth/
      +-- student/
      +-- company/
      +-- university/
      +-- admin/
      +-- matching/
      +-- common/
      +-- errors/
      +-- validation/
  ```
- **Locale Strategy:** Arabic (`ar`) and English (`en`) with URL prefix (`/ar/...`, `/en/...`).
- **Fallback:** `en` is the default locale.

---

### 3.12 `src/features/` — Feature Modules

The core of the feature-based architecture. Each feature is a **self-contained module** with:

| Subdirectory | Purpose |
|---|---|
| `components/` | Feature-specific React components |
| `hooks/` | Feature-specific custom hooks |
| `types/` | Feature-specific TypeScript types |
| `utils/` | Feature-specific utility functions |
| `services/` | Feature-specific API calls |
| `constants/` | Feature-specific constants |
| `schema/` | Feature-specific validation schemas (Zod/Yup) |
| `__tests__/` | Feature unit tests (co-located) |
| `index.ts` | Barrel export for the feature |

**Current Features:**

| Feature | Description | Actors |
|---|---|---|
| `auth` | Authentication, registration, password reset | All |
| `student` | Student dashboard, profile, resume, applications, job search | Students |
| `company` | Company dashboard, job posting, applicant review, intern management | Companies |
| `university` | University dashboard, student directory, partnerships, reports | Universities |
| `admin` | Admin dashboard, user management, system settings, audit logs | Admins |
| `matching` | AI-powered student-job matching algorithm, recommendations, skill gap analysis | All |
| `analytics` | KPI dashboards, trend analysis, demographic charts, report generation | Universities, Admins |
| `notifications` | Notification center, push notifications, preferences, toast alerts | All |

---

### 3.13 `src/styles/` — Global Styles

- **Purpose:** Global CSS, theme definitions, and Tailwind customizations.
- **Key Files:**
  - `globals.css` — Tailwind directives, global base styles.
  - `fonts.css` — Font face declarations (Inter, Noto Sans Arabic).
  - `arabic.css` — RTL-specific overrides for Arabic layout.
  - `animations.css` — Custom keyframe animations.
  - `utilities.css` — Custom utility classes.
  - `themes/light.css` — Light theme CSS custom properties.
  - `themes/dark.css` — Dark theme CSS custom properties.

---

### 3.14 `tests/` — Integration & E2E Tests

- **Purpose:** High-level tests that span multiple features.
- **Organization:**
  ```
  tests/
  +-- e2e/              # Playwright E2E tests
      +-- auth/
      +-- student/
      +-- company/
      +-- university/
      +-- admin/
      +-- setup/        # Test setup & fixtures
      +-- fixtures/     # Test data
      +-- utils/        # Test helpers
  +-- integration/      # Integration tests
      +-- api/          # API integration tests
      +-- features/     # Multi-feature flow tests
  +-- mocks/            # MSW (Mock Service Worker) setup
      +-- handlers.ts
      +-- server.ts
      +-- data/         # Mock data fixtures
  ```

---

### 3.15 `docs/` — Project Documentation

- **Purpose:** Comprehensive project documentation.
- **Key Files:**
  - `README.md` — Project overview and quick start.
  - `ARCHITECTURE.md` — Architecture Decision Records (ADRs).
  - `API.md` — API endpoint documentation.
  - `DEPLOYMENT.md` — Deployment procedures.
  - `DEVELOPMENT.md` — Developer onboarding guide.
  - `TESTING.md` — Testing strategy and guidelines.
  - `I18N.md` — Internationalization guide.
  - `AUTH.md` — Authentication & authorization flows.
  - `CONVENTIONS.md` — Code style conventions.

---

### 3.16 `docker/` — Docker Configuration

- **Purpose:** Containerization configuration for all environments.
- **Key Files:**
  - `Dockerfile` / `Dockerfile.dev` — Production and development images.
  - `docker-compose.yml` / `docker-compose.dev.yml` — Compose configurations.
  - `nginx/` — Nginx reverse proxy configuration.
  - `scripts/` — Container initialization and health checks.

---

### 3.17 `scripts/` — Utility Scripts

- **Purpose:** Development and build automation scripts.
- **Key Scripts:**
  - `generate-component.ts` — Scaffold a new UI component.
  - `generate-feature.ts` — Scaffold a new feature module.
  - `generate-api-route.ts` — Scaffold a new API route.
  - `db-migrate.sh` — Run database migrations.
  - `seed-data.ts` — Seed development data.
  - `check-translations.ts` — Validate translation completeness across features.

---

## 4. File Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| **Components** | `PascalCase.tsx` | `StudentDashboard.tsx`, `JobCard.tsx` |
| **Component Folders** | `kebab-case/` | `student-dashboard/`, `job-card/` |
| **Hooks** | `use-[hook-name].ts` | `use-auth.ts`, `use-student-profile.ts` |
| **Types/Interfaces** | `PascalCase` in `*.types.ts` | `StudentProfile`, `JobPosting` |
| **Type Files** | `[domain].types.ts` | `student.types.ts`, `job.types.ts` |
| **Utils** | `camelCase.ts` | `format-date.ts`, `validators.ts` |
| **Constants** | `SCREAMING_SNAKE_CASE` values, `[domain].constants.ts` files | `MAX_FILE_SIZE`, `api.constants.ts` |
| **Services** | `[domain].service.ts` or `[domain]-api.ts` | `student.service.ts`, `job-api.ts` |
| **Tests** | `[file].test.ts` or `[file].spec.ts` | `login-form.test.tsx`, `dashboard.spec.ts` |
| **Schemas** | `[domain].schema.ts` | `login.schema.ts`, `register.schema.ts` |
| **Styles** | `kebab-case.css` | `globals.css`, `arabic.css` |
| **Config** | `kebab-case.config.ts` | `next-auth.config.ts`, `site.config.ts` |
| **Pages (App Router)** | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` | `page.tsx`, `layout.tsx` |
| **API Routes** | `route.ts` | `route.ts` |
| **Barrel Exports** | `index.ts` | `index.ts` |

---

## 5. Import Rules & Barrel Exports

### 5.1 Absolute Imports (Preferred)

All imports use the `@/` path alias configured in `tsconfig.json`:

```typescript
// Good - Absolute import
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { StudentProfile } from '@/types/student.types';
import { studentService } from '@/services/student/student.service';

// Good - Feature import via barrel
import { LoginForm } from '@/features/auth';
import { JobPostingForm } from '@/features/company';

// Good - Deep feature import (when needed)
import { useStudentProfile } from '@/features/student/hooks/use-student-profile';
```

### 5.2 Relative Imports (Limited)

Relative imports are only allowed **within the same feature** or **sibling files**:

```typescript
// OK - Relative import within same feature
import { LoginForm } from '../login-form/login-form';
import { authHelpers } from '../utils/auth-helpers';

// OK - Relative import for sibling
import { buttonVariants } from './button.variants';
```

### 5.3 Barrel Export Pattern

Every folder exposes its public API via `index.ts`:

```typescript
// src/components/ui/button/index.ts
export { Button } from './button';
export type { ButtonProps } from './button.types';
export { buttonVariants } from './button.variants';

// src/features/auth/index.ts
export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';
export { useLogin } from './hooks/use-login';
export { useRegister } from './hooks/use-register';
export type { LoginCredentials, RegisterData } from './types/auth.types';

// src/hooks/index.ts
export { useAuth } from './use-auth';
export { useUser } from './use-user';
export { useDebounce } from './use-debounce';
// ...
```

### 5.4 Import Order Convention

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party library imports
import { useQuery, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useTranslations } from 'next-intl';

// 3. Absolute internal imports (@/)
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks';
import { formatDate } from '@/lib/utils';

// 4. Feature imports
import { useStudentProfile } from '@/features/student';
import { studentService } from '@/features/student/services';

// 5. Relative imports (only when necessary)
import { siblingHelper } from './helpers';

// 6. Type imports
import type { StudentProfile } from '@/types';
import type { JobFilters } from './job-filters.types';
```

### 5.5 Forbidden Import Patterns

```typescript
// BAD - Importing from unrelated feature (creates coupling)
import { companyHelper } from '@/features/company/utils/company-helpers';

// BAD - Deep import bypassing barrel
import { Button } from '@/components/ui/button/button';

// BAD - Cross-feature direct component import
import { JobPostingForm } from '@/features/company/components/job-posting-form/job-posting-form';

// GOOD - Use the shared layer or the feature's public API
import { sharedUtil } from '@/components/shared';
import { JobPostingForm } from '@/features/company';
```

---

## 6. Route Map

### 6.1 Public Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/` | `src/app/(public)/page.tsx` | Landing page |
| `/about` | `src/app/(public)/about/page.tsx` | About MADAR |
| `/contact` | `src/app/(public)/contact/page.tsx` | Contact page |
| `/faq` | `src/app/(public)/faq/page.tsx` | FAQ |
| `/terms` | `src/app/(public)/terms/page.tsx` | Terms of Service |
| `/privacy` | `src/app/(public)/privacy/page.tsx` | Privacy Policy |

### 6.2 Authentication Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/login` | `src/app/(auth)/login/page.tsx` | Login page |
| `/register` | `src/app/(auth)/register/page.tsx` | Registration role selection |
| `/register/student` | `src/app/(auth)/register/student/page.tsx` | Student registration |
| `/register/company` | `src/app/(auth)/register/company/page.tsx` | Company registration |
| `/register/university` | `src/app/(auth)/register/university/page.tsx` | University registration |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Password reset request |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Password reset confirmation |
| `/verify-email` | `src/app/(auth)/verify-email/page.tsx` | Email verification |

### 6.3 Student Portal Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/dashboard` | `src/app/(student)/dashboard/page.tsx` | Student dashboard |
| `/profile` | `src/app/(student)/profile/page.tsx` | Student profile |
| `/applications` | `src/app/(student)/applications/page.tsx` | My applications |
| `/applications/[id]` | `src/app/(student)/applications/[id]/page.tsx` | Application detail |
| `/jobs` | `src/app/(student)/jobs/page.tsx` | Job listings |
| `/jobs/[id]` | `src/app/(student)/jobs/[id]/page.tsx` | Job detail |
| `/internships` | `src/app/(student)/internships/page.tsx` | My internships |
| `/internships/[id]` | `src/app/(student)/internships/[id]/page.tsx` | Internship detail |
| `/resume` | `src/app/(student)/resume/page.tsx` | Resume builder |
| `/skills` | `src/app/(student)/skills/page.tsx` | Skills assessment |
| `/notifications` | `src/app/(student)/notifications/page.tsx` | Notifications |
| `/settings` | `src/app/(student)/settings/page.tsx` | Account settings |

### 6.4 Company Portal Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/dashboard` | `src/app/(company)/dashboard/page.tsx` | Company dashboard |
| `/profile` | `src/app/(company)/profile/page.tsx` | Company profile |
| `/jobs` | `src/app/(company)/jobs/page.tsx` | Job postings list |
| `/jobs/create` | `src/app/(company)/jobs/create/page.tsx` | Create job posting |
| `/jobs/[id]` | `src/app/(company)/jobs/[id]/page.tsx` | Job detail/edit |
| `/jobs/[id]/edit` | `src/app/(company)/jobs/[id]/edit/page.tsx` | Edit job posting |
| `/jobs/[id]/applicants` | `src/app/(company)/jobs/[id]/applicants/page.tsx` | Job applicants |
| `/applicants` | `src/app/(company)/applicants/page.tsx` | All applicants |
| `/applicants/[id]` | `src/app/(company)/applicants/[id]/page.tsx` | Applicant detail |
| `/interns` | `src/app/(company)/interns/page.tsx` | Intern management |
| `/evaluations` | `src/app/(company)/evaluations/page.tsx` | Intern evaluations |
| `/analytics` | `src/app/(company)/analytics/page.tsx` | Company analytics |
| `/notifications` | `src/app/(company)/notifications/page.tsx` | Notifications |
| `/settings` | `src/app/(company)/settings/page.tsx` | Company settings |

### 6.5 University Portal Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/dashboard` | `src/app/(university)/dashboard/page.tsx` | University dashboard |
| `/students` | `src/app/(university)/students/page.tsx` | Student directory |
| `/students/[id]` | `src/app/(university)/students/[id]/page.tsx` | Student detail |
| `/companies` | `src/app/(university)/companies/page.tsx` | Company directory |
| `/partnerships` | `src/app/(university)/partnerships/page.tsx` | Partnerships |
| `/partnerships/requests` | `src/app/(university)/partnerships/requests/page.tsx` | Partnership requests |
| `/reports` | `src/app/(university)/reports/page.tsx` | Reports list |
| `/reports/generate` | `src/app/(university)/reports/generate/page.tsx` | Generate report |
| `/analytics` | `src/app/(university)/analytics/page.tsx` | University analytics |
| `/coordinators` | `src/app/(university)/coordinators/page.tsx` | Coordinator management |
| `/settings` | `src/app/(university)/settings/page.tsx` | University settings |

### 6.6 Admin Portal Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/dashboard` | `src/app/(admin)/dashboard/page.tsx` | Admin dashboard |
| `/users` | `src/app/(admin)/users/page.tsx` | User management |
| `/users/[id]` | `src/app/(admin)/users/[id]/page.tsx` | User detail |
| `/companies` | `src/app/(admin)/companies/page.tsx` | Company management |
| `/companies/[id]` | `src/app/(admin)/companies/[id]/page.tsx` | Company detail |
| `/companies/pending` | `src/app/(admin)/companies/pending/page.tsx` | Pending approvals |
| `/universities` | `src/app/(admin)/universities/page.tsx` | University management |
| `/jobs` | `src/app/(admin)/jobs/page.tsx` | Job management |
| `/jobs/pending` | `src/app/(admin)/jobs/pending/page.tsx` | Pending job approvals |
| `/analytics` | `src/app/(admin)/analytics/page.tsx` | System analytics |
| `/reports` | `src/app/(admin)/reports/page.tsx` | System reports |
| `/settings` | `src/app/(admin)/settings/page.tsx` | System settings |
| `/settings/general` | `src/app/(admin)/settings/general/page.tsx` | General settings |
| `/settings/security` | `src/app/(admin)/settings/security/page.tsx` | Security settings |
| `/settings/matching` | `src/app/(admin)/settings/matching/page.tsx` | Matching algorithm params |
| `/audit-log` | `src/app/(admin)/audit-log/page.tsx` | Audit log viewer |
| `/notifications` | `src/app/(admin)/notifications/page.tsx` | System notifications |
| `/system-health` | `src/app/(admin)/system-health/page.tsx` | System health monitor |

### 6.7 Coordinator Portal Routes

| URL | File Path | Description |
|-----|-----------|-------------|
| `/dashboard` | `src/app/(coordinator)/dashboard/page.tsx` | Coordinator dashboard |
| `/students` | `src/app/(coordinator)/students/page.tsx` | Managed students |
| `/placements` | `src/app/(coordinator)/placements/page.tsx` | Placement tracking |
| `/evaluations` | `src/app/(coordinator)/evaluations/page.tsx` | Evaluation management |
| `/reports` | `src/app/(coordinator)/reports/page.tsx` | Coordinator reports |

### 6.8 API Routes

| Endpoint | File Path | Description |
|----------|-----------|-------------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth.js handler |
| `/api/auth/register` | `src/app/api/auth/register/route.ts` | User registration |
| `/api/auth/verify-email` | `src/app/api/auth/verify-email/route.ts` | Email verification |
| `/api/students` | `src/app/api/students/route.ts` | Student CRUD |
| `/api/students/[id]` | `src/app/api/students/[id]/route.ts` | Student by ID |
| `/api/students/[id]/profile` | `src/app/api/students/[id]/profile/route.ts` | Student profile |
| `/api/companies` | `src/app/api/companies/route.ts` | Company CRUD |
| `/api/companies/[id]` | `src/app/api/companies/[id]/route.ts` | Company by ID |
| `/api/jobs` | `src/app/api/jobs/route.ts` | Job CRUD |
| `/api/jobs/[id]` | `src/app/api/jobs/[id]/route.ts` | Job by ID |
| `/api/jobs/search` | `src/app/api/jobs/search/route.ts` | Job search |
| `/api/matching` | `src/app/api/matching/route.ts` | Matching requests |
| `/api/matching/recommendations` | `src/app/api/matching/recommendations/route.ts` | AI recommendations |
| `/api/applications` | `src/app/api/applications/route.ts` | Application CRUD |
| `/api/notifications` | `src/app/api/notifications/route.ts` | Notification CRUD |
| `/api/admin/users` | `src/app/api/admin/users/route.ts` | Admin user management |
| `/api/admin/analytics` | `src/app/api/admin/analytics/route.ts` | Admin analytics |
| `/api/upload` | `src/app/api/upload/route.ts` | File upload |

---

## 7. Testing Strategy

### 7.1 Test Types & Locations

| Test Type | Location | Tool | Description |
|-----------|----------|------|-------------|
| **Unit Tests** | Co-located in `__tests__/` within each feature | Jest + React Testing Library | Tests for components, hooks, utils, schemas |
| **Component Tests** | Co-located in `__tests__/` within each feature | Jest + React Testing Library | Component rendering, interactions, a11y |
| **Integration Tests** | `tests/integration/` | Jest | Multi-feature flow tests, API integration |
| **E2E Tests** | `tests/e2e/` | Playwright | Full user journey tests |
| **Visual Regression** | `tests/e2e/` | Playwright + screenshots | Visual comparison testing |
| **Mocking** | `tests/mocks/` | MSW (Mock Service Worker) | API mocking for tests |

### 7.2 Test File Naming

```
Component tests:     [component-name].test.tsx
Hook tests:          use-[hook-name].test.ts
Utility tests:       [utility-name].test.ts
Schema tests:        [schema-name].test.ts
Service tests:       [service-name].test.ts
E2E tests:           [feature-flow].spec.ts
Integration tests:   [flow-name].test.ts
```

### 7.3 Testing Conventions

```typescript
// Unit test example for a feature component
// src/features/auth/__tests__/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../components/login-form';

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    // ... fill form and submit
  });
});

// Hook test example
// src/features/auth/__tests__/use-login.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogin } from '../hooks/use-login';

describe('useLogin', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles successful login', async () => {
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: 'password' });
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
```

### 7.4 Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Utilities | 90%+ |
| Hooks | 80%+ |
| Components | 75%+ |
| Schemas/Validation | 90%+ |
| API Services | 70%+ |
| E2E Critical Paths | 100% |

---

## 8. i18n Strategy

### 8.1 Architecture

The MADAR platform uses **`next-intl`** for internationalization with the following strategy:

- **Supported Locales:** Arabic (`ar`) and English (`en`)
- **Default Locale:** English (`en`)
- **URL Strategy:** Prefix-based (`/en/dashboard`, `/ar/dashboard`)
- **RTL Support:** Arabic layout automatically switches to RTL

### 8.2 Translation File Organization

```
src/i18n/messages/
+-- en.json               # Root/Shared English translations
+-- ar.json               # Root/Shared Arabic translations
+-- auth/
|   +-- en.json           # Auth feature English translations
|   +-- ar.json           # Auth feature Arabic translations
+-- student/
|   +-- en.json
|   +-- ar.json
+-- company/
|   +-- en.json
|   +-- ar.json
+-- university/
|   +-- en.json
|   +-- ar.json
+-- admin/
|   +-- en.json
|   +-- ar.json
+-- matching/
|   +-- en.json
|   +-- ar.json
+-- common/
|   +-- en.json           # Common UI elements (buttons, labels, etc.)
|   +-- ar.json
+-- errors/
|   +-- en.json           # Error messages
|   +-- ar.json
+-- validation/
    +-- en.json           # Form validation messages
    +-- ar.json
```

### 8.3 Translation Namespacing

Each feature loads only its required translation namespace:

```typescript
// In a student portal page
import { useTranslations } from 'next-intl';

export default function StudentDashboard() {
  // Loads only student and common translations
  const t = useTranslations('student.dashboard');
  const c = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcomeMessage')}</p>
      <Button>{c('actions.viewDetails')}</Button>
    </div>
  );
}
```

### 8.4 Translation File Structure (Example)

```json
// src/i18n/messages/student/en.json
{
  "dashboard": {
    "title": "Student Dashboard",
    "welcomeMessage": "Welcome back, {name}!",
    "stats": {
      "applications": "Applications",
      "interviews": "Interviews",
      "offers": "Offers",
      "completed": "Completed"
    },
    "recentActivity": "Recent Activity",
    "recommendedJobs": "Recommended Jobs"
  },
  "profile": {
    "title": "My Profile",
    "personalInfo": "Personal Information",
    "education": "Education",
    "skills": "Skills",
    "experience": "Experience"
  },
  "resume": {
    "title": "Resume Builder",
    "sections": {
      "personal": "Personal Info",
      "education": "Education",
      "experience": "Work Experience",
      "skills": "Skills",
      "projects": "Projects"
    }
  }
}
```

### 8.5 Locale Detection & Routing

```typescript
// src/i18n/config.ts
export const i18nConfig = {
  locales: ['en', 'ar'] as const,
  defaultLocale: 'en' as const,
  localePrefix: 'always', // Always show /en/ or /ar/ in URL
};

export type Locale = (typeof i18nConfig.locales)[number];
```

### 8.6 RTL (Right-to-Left) Handling

- CSS uses logical properties (`margin-inline-start`, `padding-inline-end`) instead of physical ones (`margin-left`, `padding-right`).
- `dir="rtl"` is set on `<html>` element when Arabic is active.
- `arabic.css` contains Arabic-specific font size and spacing adjustments.
- Icons with directional meaning (arrows, chevrons) are automatically flipped via CSS.
- Number and date formatting uses locale-aware `Intl` APIs.

---

## 9. Key Configuration Files

### 9.1 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/features/*": ["./src/features/*"],
      "@/services/*": ["./src/services/*"],
      "@/constants/*": ["./src/constants/*"],
      "@/i18n/*": ["./src/i18n/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 9.2 `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    domains: ['localhost', 'api.madar.sa'],
    formats: ['image/avif', 'image/webp'],
  },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'cookie', key: 'role', value: 'student' }],
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 9.3 `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        madar: {
          brand: '#005f73',
          accent: '#ee9b00',
          success: '#2a9d8f',
          warning: '#e9c46a',
          error: '#e76f51',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

export default config;
```

### 9.4 `jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/tests/**/*.test.[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/**', // Exclude App Router pages from unit coverage
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
};

module.exports = createJestConfig(customJestConfig);
```

### 9.5 `jest.setup.ts`

```typescript
import '@testing-library/jest-dom';
import { server } from './tests/mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that are declared in tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());
```

### 9.6 `package.json` (Key Scripts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest --watch",
    "test:ci": "jest --ci --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx scripts/seed-data.ts",
    "db:studio": "prisma studio",
    "i18n:extract": "formatjs extract",
    "i18n:compile": "formatjs compile",
    "i18n:check": "tsx scripts/check-translations.ts",
    "generate:component": "tsx scripts/generate-component.ts",
    "generate:feature": "tsx scripts/generate-feature.ts",
    "generate:api": "tsx scripts/generate-api-route.ts",
    "docker:build": "docker-compose -f docker/docker-compose.yml build",
    "docker:dev": "docker-compose -f docker/docker-compose.dev.yml up",
    "docker:test": "docker-compose -f docker/docker-compose.test.yml up --abort-on-container-exit"
  }
}
```

---

## Appendix A: Quick Reference — Adding a New Feature

To add a new feature module (e.g., `messaging`):

```bash
# 1. Run the feature generator
npm run generate:feature messaging

# 2. This creates the following structure:
# src/features/messaging/
# +-- components/
# +-- hooks/
# +-- types/
# +-- utils/
# +-- services/
# +-- constants/
# +-- schema/
# +-- __tests__/
# +-- index.ts

# 3. Add route group (if needed):
# src/app/(student)/messages/
# +-- page.tsx
# +-- layout.tsx (if applicable)

# 4. Add translations:
# src/i18n/messages/messaging/en.json
# src/i18n/messages/messaging/ar.json

# 5. Export from src/features/index.ts
export * from './messaging';

# 6. Add API routes (if needed):
# src/app/api/messages/route.ts
# src/app/api/messages/[id]/route.ts
```

## Appendix B: Quick Reference — Adding a New Component

```bash
# Run the component generator
npm run generate:component data-grid --type=ui

# This creates:
# src/components/ui/data-grid/
# +-- data-grid.tsx
# +-- data-grid.types.ts
# +-- data-grid.test.tsx
# +-- index.ts
```

## Appendix C: Feature Dependency Graph

```
                    +------------+
                    |    auth    |
                    +-----+------+
                          |
          +---------------+---------------+
          |               |               |
    +-----v-----+  +------v------+  +-----v------+
    |  student  |  |   company   |  | university |
    +-----+-----+  +------+------+  +-----+------+
          |               |               |
          +---------------+---------------+
                          |
              +-----------v-----------+
              |      matching       |<-----+ admin (configures)
              |  (AI recommendation) |
              +-----------+-----------+
                          |
              +-----------v-----------+
              |     analytics        |<-----+ admin (views)
              |   (reporting/KPIs)   |
              +-----------------------+
                          |
              +-----------v-----------+
              |    notifications     |<-----+ All actors
              |  (email/push/toast)  |
              +-----------------------+
```

---

*End of Document*
