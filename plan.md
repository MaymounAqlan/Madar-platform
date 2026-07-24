# MADAR Platform — Execution Plan

## Stage 0: Analysis & Foundation (Current)
- Analyze SRS + Database Design documents
- Confirm understanding of all functional/non-functional requirements
- Create tailwind.config.js with Wise Design System tokens
- Propose modular directory structure
- **Gate**: Await user approval before proceeding

## Stage 1: Project Bootstrap & Design System
- Initialize Next.js 15 + React 19 + TypeScript project (App Router)
- Configure Tailwind CSS with full Wise Design System tokens
- Set up RTL/i18n infrastructure (next-intl for Arabic/English)
- Configure fonts (Wise Sans, Inter)
- Install framer-motion, shadcn/ui, testing libraries
- Implement core layout shells (Auth, Dashboard, Public)
- Write Jest configuration + initial test setup
- **Output**: Running project scaffold with design system live

## Stage 2: Shared Component Library
- Build WiseButton, WiseCard, WiseInput, WiseSelect, WiseBadge
- Build layout primitives (Sidebar, TopNav, PageHeader, Breadcrumbs)
- Build data display components (DataTable, StatCard, ChartContainer)
- Build feedback components (WiseToast, WiseModal, WiseSkeleton)
- RTL testing for all components
- **Output**: Fully tested, RTL-ready shared component library

## Stage 3: Authentication & Authorization
- Public pages: Landing, Login, Register (Student/Company/University)
- Email verification, Password reset flows
- JWT token management (access 15min / refresh 7d)
- RBAC guards and middleware
- Protected route wrappers
- **Output**: Complete auth system with RBAC

## Stage 4: Student Portal
- Student Dashboard (recommendations, match scores, quick actions)
- Profile management (personal, academic, professional)
- CV Upload with drag-and-drop
- Job Opportunities (AI-ranked recommendations, search, filters)
- Job Detail + Match Analysis view
- Application workflow + tracking
- Skill Insights (gap analysis, market trends, learning resources)
- Settings (account, notifications, privacy)
- **Output**: Complete Student Portal (/student/*)

## Stage 5: Company Portal
- Company Dashboard (active jobs, applicants, metrics)
- Job posting (create, edit, manage, close)
- AI-powered job description analysis
- Candidate discovery (search, filter, sort by match score)
- Application review & decision workflow
- Recruitment analytics dashboard
- Settings (profile, team, notifications)
- **Output**: Complete Company Portal (/company/*)

## Stage 6: University Portal
- University Dashboard (employment KPIs, college performance)
- Academic structure management (colleges, departments)
- Study plan + course catalog with skill mapping
- Student directory + employment tracking
- Skill gap analysis + curriculum alignment
- Analytics + cross-university comparison
- Coordinator management + permissions
- **Output**: Complete University Portal (/university/*)

## Stage 7: Admin Portal
- System health dashboard
- User management (CRUD, roles, permissions)
- Monitoring (service health, logs, audit trail)
- AI management (models, thresholds, analytics)
- Platform settings, security policies
- **Output**: Complete Admin Portal (/admin/*)

## Stage 8: AI Integration Layer (Frontend)
- Match score visualization components
- Acceptance probability displays
- Skill gap visualizations
- Recommendation cards with AI reasoning
- Loading states for AI analysis pipeline
- **Output**: AI-enhanced UI components

## Stage 9: Testing & Quality Assurance
- Unit tests (Jest) for all modules — target ≥80% coverage
- Responsive testing (Mobile <768px, Tablet 768-1023px, Desktop ≥1024px)
- Accessibility audit (WCAG 2.1 AA)
- RTL layout validation
- Visual regression testing
- **Output**: Comprehensive test suite + QA report

## Stage 10: Deployment Preparation
- Docker + Docker Compose configuration
- Environment configuration management
- Build optimization
- Final Task Completion Report
- **Output**: Production-ready deployment package

## Design System Specs (from prompt)
| Token | Value | Usage |
|-------|-------|-------|
| Primary (Wise Green) | #9fe870 | CTAs, primary actions, accents |
| Background | #e8ebe6 | Page backgrounds |
| Text Primary | #0e0f0c | Headlines, primary text |
| Border Radius (cards/buttons) | 24px (rounded-xl) | All cards, buttons |
| Heading Font | Wise Sans, weight 900 | Page titles, section headers |
| Body Font | Inter, weight 600 | Body text, UI labels |
| Aesthetic | Scandinavian fintech | Minimalist, generous whitespace |
| Animation | framer-motion | Subtle, professional interactions |
