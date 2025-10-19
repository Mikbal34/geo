# Implementation Plan: Brand Analysis & Scoring Platform

**Branch**: `001-goal-build-a` | **Date**: 2025-10-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-goal-build-a/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a web application that enables marketing professionals to analyze their brand's communication effectiveness across five dimensions (Relevance, Clarity, Consistency, Creativity, Emotional Impact). The system collects brand information, uses AI to generate and evaluate analysis prompts, compares against competitors, and delivers scored insights through visual dashboards. Technical approach uses Next.js 14 App Router for the frontend, Supabase for data persistence, and LLM APIs (OpenAI/Claude) for intelligent prompt generation and brand evaluation.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: Next.js 14 (App Router), Supabase JS Client, React 18, TailwindCSS 3.x, NEEDS CLARIFICATION: Chart library (Recharts vs Chart.js)
**Storage**: Supabase (PostgreSQL) with tables: brands, prompts, competitors, scores
**Testing**: NEEDS CLARIFICATION: Testing framework (Vitest vs Jest), React Testing Library, Playwright for E2E
**Target Platform**: Web browsers (Chrome, Firefox, Safari latest versions), deployed on Vercel/Netlify
**Project Type**: Web application (frontend + API routes)
**Performance Goals**:
- Brand profile creation < 5 minutes (SC-001)
- AI prompt suggestions < 3 seconds (SC-002)
- Brand analysis completion < 15 seconds (SC-003)
- Dashboard render < 2 seconds (SC-005)
- 95% analysis success rate (SC-004)
**Constraints**:
- LLM API response time dependency (10s typical)
- Supabase free tier: 500MB database, 2GB bandwidth/month
- Must work without authentication in MVP (add later)
**Scale/Scope**:
- MVP: Single-user analysis (no auth)
- 5 pages: Home/Brand Create, Prompts, Competitors, Analysis, Dashboard
- 4 database tables
- ~20 API routes/server actions
- NEEDS CLARIFICATION: LLM provider choice (OpenAI GPT-4 vs Anthropic Claude vs both)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED (Constitution template not yet ratified - using default best practices)

Since the project constitution is still in template form, we apply standard software engineering gates:

### Gate 1: Testability
- ✅ All 24 functional requirements from spec.md are testable
- ✅ User acceptance scenarios defined in Given-When-Then format
- ✅ Testing framework selection identified as research task

### Gate 2: Simplicity
- ✅ Single web application structure (not microservices)
- ✅ Standard Next.js App Router patterns (no custom framework)
- ✅ Minimal dependencies: Next.js + Supabase + chart library + LLM client

### Gate 3: Data Integrity
- ✅ Clear entity relationships (brand → prompts, brand → competitors, brand → scores)
- ✅ Foreign key constraints through brand_id
- ✅ Validation rules specified (FR-002: domain validation, FR-011: no duplicate competitors)

### Gate 4: User-Centric Design
- ✅ All features map directly to user stories (P1-P3 prioritization)
- ✅ Success criteria are measurable user outcomes
- ✅ Edge cases identified for error handling

### Gate 5: Performance Awareness
- ✅ Specific performance targets defined (3s, 5min, 15s, 2s thresholds)
- ✅ 95% success rate target for reliability
- ✅ Scalability constraints documented (Supabase free tier limits)

**Pending Review**: Re-evaluate after Phase 1 design artifacts are complete

---

## Post-Design Constitution Review

**Status**: ✅ PASSED (All design artifacts complete)

**Artifacts Reviewed**:
- ✅ research.md: Technology decisions documented with rationale
- ✅ data-model.md: 4 entities with clear relationships and validation
- ✅ contracts/: OpenAPI spec + TypeScript types + README
- ✅ quickstart.md: Developer onboarding guide

**Gate Re-evaluation**:

### Gate 1: Testability ✅
- All 24 functional requirements remain testable
- API contracts include example requests/responses for testing
- Mock LLM endpoint defined for testing without API costs (FR-019)
- E2E test structure defined in quickstart.md

### Gate 2: Simplicity ✅
- Single Next.js monorepo (no microservices)
- Standard patterns: App Router, Server Components, API Routes
- 4 database tables with straightforward relationships
- Minimal external dependencies (Recharts, Supabase client, OpenAI SDK)

### Gate 3: Data Integrity ✅
- Foreign key constraints enforced (CASCADE delete)
- Database CHECK constraints for score ranges (0-100)
- UNIQUE constraints prevent duplicates (domain, competitor per brand)
- TypeScript types match database schema
- Validation at API boundary using Zod (recommended in research.md)

### Gate 4: User-Centric Design ✅
- All 3 user stories (P1-P3) map to specific pages and API endpoints
- Error messages are user-friendly (defined in contracts)
- Success criteria remain measurable and user-focused
- Quickstart includes manual testing examples

### Gate 5: Performance Awareness ✅
- Performance targets preserved from spec (3s, 15s, 2s thresholds)
- Database indexes designed for query performance
- LLM call optimization documented (caching, mock mode)
- Cost estimation provided in research.md ($3.50/month for MVP)

**New Observations**:

**Strengths**:
- Comprehensive API documentation (OpenAPI + TypeScript + examples)
- Clear separation of concerns (lib/ utilities, validation, LLM client)
- Developer-friendly onboarding (quickstart with troubleshooting)
- Type safety enforced at every layer (database → API → frontend)

**No Violations Detected**: All design choices align with standard Next.js best practices

**Recommendation**: ✅ APPROVED to proceed to Phase 2 (Task generation via `/speckit.tasks`)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
app/                                # Next.js 14 App Router
├── page.tsx                        # Landing/home page
├── brands/
│   ├── new/
│   │   └── page.tsx               # Brand creation form (P1)
│   └── [brandId]/
│       ├── prompts/
│       │   └── page.tsx           # Prompts management (P1)
│       ├── competitors/
│       │   └── page.tsx           # Competitors management (P1)
│       ├── analysis/
│       │   └── page.tsx           # Trigger analysis (P2)
│       └── dashboard/
│           └── page.tsx           # Results visualization (P3)
├── api/
│   ├── brands/
│   │   └── route.ts               # POST /api/brands (create)
│   ├── prompts/
│   │   ├── route.ts               # POST /api/prompts (add)
│   │   └── suggest/
│   │       └── route.ts           # POST /api/prompts/suggest (AI-generated)
│   ├── competitors/
│   │   ├── route.ts               # POST /api/competitors (add)
│   │   └── suggest/
│   │       └── route.ts           # POST /api/competitors/suggest (AI-generated)
│   └── analysis/
│       ├── route.ts               # POST /api/analysis (run scoring)
│       └── mock/
│           └── route.ts           # GET /api/analysis/mock (testing)
├── layout.tsx                      # Root layout
└── globals.css                     # TailwindCSS styles

components/
├── brand/
│   ├── BrandForm.tsx              # Brand creation form
│   └── BrandCard.tsx              # Brand display component
├── prompts/
│   ├── PromptList.tsx             # Display prompts
│   ├── PromptForm.tsx             # Add prompt form
│   └── SuggestPromptsButton.tsx   # AI suggestion trigger
├── competitors/
│   ├── CompetitorList.tsx         # Display competitors
│   ├── CompetitorForm.tsx         # Add competitor form
│   └── SuggestCompetitorsButton.tsx
├── analysis/
│   ├── AnalysisButton.tsx         # Trigger analysis
│   └── AnalysisStatus.tsx         # Loading/error states
└── dashboard/
    ├── ScoreRadarChart.tsx        # 5-dimension radar chart
    ├── ScoreBarChart.tsx          # Alternative bar chart
    ├── ScoreDimension.tsx         # Individual score + reasoning
    └── CompetitorComparison.tsx   # Compare against competitors

lib/
├── supabase/
│   ├── client.ts                  # Supabase client setup
│   ├── schema.ts                  # TypeScript types for tables
│   └── queries.ts                 # Database query functions
├── llm/
│   ├── client.ts                  # LLM API client (OpenAI/Claude)
│   ├── prompts.ts                 # LLM prompt templates
│   ├── parser.ts                  # Parse LLM JSON responses
│   └── mock.ts                    # Mock LLM responses
├── validation/
│   ├── brand.ts                   # Brand input validation
│   ├── domain.ts                  # Domain format validation
│   └── scores.ts                  # Score range validation (0-100)
└── utils/
    ├── errors.ts                  # Error handling utilities
    └── formatting.ts              # Data formatting helpers

types/
├── brand.ts                       # Brand entity types
├── prompt.ts                      # Prompt entity types
├── competitor.ts                  # Competitor entity types
├── score.ts                       # Score entity types
└── api.ts                         # API request/response types

tests/
├── e2e/
│   ├── brand-flow.spec.ts         # Complete P1 flow test
│   ├── analysis-flow.spec.ts      # Complete P2 flow test
│   └── dashboard-flow.spec.ts     # Complete P3 flow test
├── integration/
│   ├── api/
│   │   ├── brands.test.ts
│   │   ├── prompts.test.ts
│   │   ├── competitors.test.ts
│   │   └── analysis.test.ts
│   └── supabase/
│       └── queries.test.ts
└── unit/
    ├── components/
    │   └── [component].test.tsx
    ├── lib/
    │   ├── validation.test.ts
    │   └── llm-parser.test.ts
    └── utils/
        └── [utility].test.ts

supabase/
├── migrations/
│   └── 001_initial_schema.sql     # Create tables: brands, prompts, competitors, scores
└── seed.sql                        # Sample data for testing

public/
└── [static assets]
```

**Structure Decision**: Web application structure (Option 2 equivalent) using Next.js 14 App Router conventions. All frontend and backend code lives in the same monorepo, leveraging Next.js API routes and Server Components. This eliminates the need for a separate backend deployment and simplifies the development workflow.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations detected. All design choices follow standard best practices for Next.js applications.
