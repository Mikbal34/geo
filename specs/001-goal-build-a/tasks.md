# Tasks: Brand Analysis & Scoring Platform

**Input**: Design documents from `/specs/001-goal-build-a/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 14 project with TypeScript and App Router
- [x] T002 [P] Install core dependencies: `npm install @supabase/supabase-js openai recharts zod`
- [x] T003 [P] Install dev dependencies: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test @vitejs/plugin-react`
- [x] T004 [P] Configure TailwindCSS in `tailwind.config.ts` and `app/globals.css`
- [x] T005 [P] Create `.env.example` with Supabase and OpenAI placeholders
- [x] T006 [P] Configure TypeScript in `tsconfig.json` with strict mode and path aliases
- [x] T007 [P] Configure Vitest in `vitest.config.ts` with jsdom and React plugin
- [x] T008 [P] Configure Playwright in `playwright.config.ts` for E2E tests
- [x] T009 [P] Create `.gitignore` with `.env.local`, `node_modules`, `.next`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [x] T010 Create Supabase migration file `supabase/migrations/001_initial_schema.sql` with brands, prompts, competitors, scores tables
- [x] T011 Create Supabase seed file `supabase/seed.sql` with sample test data

### Type System (Foundation for all stories)

- [x] T012 [P] Create `types/brand.ts` with Brand, CreateBrandInput interfaces
- [x] T013 [P] Create `types/prompt.ts` with Prompt, CreatePromptInput, SuggestPromptsInput interfaces
- [x] T014 [P] Create `types/competitor.ts` with Competitor, CreateCompetitorInput, SuggestCompetitorsInput interfaces
- [x] T015 [P] Create `types/score.ts` with Score, ScoreDimension, ScoreReasoning, CreateScoreInput interfaces
- [x] T016 [P] Create `types/api.ts` with API error types, ApiErrorCode enum, ApiResult utility type

### Supabase Client (Foundation for all data operations)

- [x] T017 Create `lib/supabase/client.ts` with Supabase client initialization using env variables
- [x] T018 Create `lib/supabase/schema.ts` with TypeScript interfaces matching database schema

### Validation Library (Foundation for all API routes)

- [x] T019 [P] Create `lib/validation/domain.ts` with domain format validation regex and isValidDomain() function
- [x] T020 [P] Create `lib/validation/brand.ts` with Zod schema for CreateBrandRequest validation
- [x] T021 [P] Create `lib/validation/scores.ts` with score range validation (0-100) functions

### Error Handling (Foundation for all API routes)

- [x] T022 Create `lib/utils/errors.ts` with AppError class and error formatting utilities

### LLM Infrastructure (Foundation for P1 AI suggestions and P2 analysis)

- [x] T023 Create `lib/llm/client.ts` with OpenAI client initialization
- [x] T024 Create `lib/llm/prompts.ts` with BRAND_SCORING_PROMPT and SUGGEST_PROMPTS templates
- [x] T025 Create `lib/llm/parser.ts` with Zod-based LLM response validation for score parsing
- [x] T026 Create `lib/llm/mock.ts` with getMockAnalysis() and getMockPrompts() for testing

### Root Layout (Foundation for all pages)

- [x] T027 Create `app/layout.tsx` with root HTML structure, metadata, TailwindCSS imports
- [x] T028 Create `app/page.tsx` as landing page with "Create Brand" CTA button

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Brand Setup and Initial Analysis (Priority: P1) 🎯 MVP

**Goal**: Enable marketing professionals to create brand profiles, add/generate prompts, and add/generate competitors. This delivers immediate value by providing a structured brand analysis framework.

**Independent Test**: Create a brand profile with name, domain, region, add at least one prompt (manual or AI-generated), and add at least one competitor (manual or AI-generated). Verify all data persists and displays correctly.

### Database Queries for User Story 1

- [x] T029 [P] [US1] Create `lib/supabase/queries.ts` with createBrand(), getBrandById(), getBrandWithRelations() functions
- [x] T030 [P] [US1] Add createPrompt(), getPromptsByBrandId(), createPromptsБатч() to `lib/supabase/queries.ts`
- [x] T031 [P] [US1] Add createCompetitor(), getCompetitorsByBrandId(), checkDuplicateCompetitor() to `lib/supabase/queries.ts`

### API Routes for Brand Management

- [x] T032 [US1] Create `app/api/brands/route.ts` with POST handler for creating brands (FR-001, FR-002)
- [x] T033 [US1] Add GET handler to `app/api/brands/route.ts` for fetching brand by ID with related data

### API Routes for Prompts

- [x] T034 [P] [US1] Create `app/api/prompts/route.ts` with POST handler for manual prompt creation (FR-007)
- [x] T035 [P] [US1] Create `app/api/prompts/suggest/route.ts` with POST handler for AI-generated prompts (FR-008)
- [x] T036 [P] [US1] Create `app/api/prompts/[brandId]/route.ts` with GET handler to list all prompts for a brand

### API Routes for Competitors

- [x] T037 [P] [US1] Create `app/api/competitors/route.ts` with POST handler for manual competitor entry (FR-010, FR-011)
- [x] T038 [P] [US1] Create `app/api/competitors/suggest/route.ts` with POST handler for AI-suggested competitors (FR-009)
- [x] T039 [P] [US1] Create `app/api/competitors/[brandId]/route.ts` with GET handler to list competitors

### Brand Form Components

- [x] T040 [P] [US1] Create `components/brand/BrandForm.tsx` with form fields for name, domain, region, client-side validation
- [x] T041 [P] [US1] Create `components/brand/BrandCard.tsx` to display brand summary information

### Prompt Components

- [x] T042 [P] [US1] Create `components/prompts/PromptForm.tsx` with textarea for manual prompt entry
- [x] T043 [P] [US1] Create `components/prompts/PromptList.tsx` to display all prompts with AI/manual badges
- [x] T044 [P] [US1] Create `components/prompts/SuggestPromptsButton.tsx` with loading state for AI generation

### Competitor Components

- [x] T045 [P] [US1] Create `components/competitors/CompetitorForm.tsx` with fields for name, domain, region
- [x] T046 [P] [US1] Create `components/competitors/CompetitorList.tsx` to display competitors with AI/manual badges
- [x] T047 [P] [US1] Create `components/competitors/SuggestCompetitorsButton.tsx` with loading state

### Pages for User Story 1

- [x] T048 [US1] Create `app/brands/new/page.tsx` with BrandForm, handles submission, redirects to prompts (FR-003)
- [x] T049 [US1] Create `app/brands/[brandId]/prompts/page.tsx` with PromptList, PromptForm, SuggestPromptsButton
- [x] T050 [US1] Create `app/brands/[brandId]/competitors/page.tsx` with CompetitorList, CompetitorForm, SuggestCompetitorsButton

### Utilities for User Story 1

- [x] T051 [P] [US1] Create `lib/utils/formatting.ts` with date formatting and text truncation helpers
- [x] T052 [P] [US1] Create `lib/utils/brand-state.ts` with getBrandState() function to determine brand readiness

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create brands, manage prompts/competitors through UI and AI suggestions

---

## Phase 4: User Story 2 - AI-Powered Brand Evaluation (Priority: P2)

**Goal**: Enable AI-powered brand analysis across 5 dimensions with numerical scores and reasoning. Transforms structured data from P1 into actionable intelligence.

**Independent Test**: Pre-seed database with a brand that has prompts and competitors. Trigger analysis from UI. Verify analysis completes within 15 seconds, stores 5 scores (0-100), and displays reasoning for each dimension.

**Dependencies**: Requires User Story 1 (brand, prompts, competitors must exist)

### Database Queries for Scoring

- [x] T053 [P] [US2] Add createScore(), getLatestScore(), getScoreHistory() to `lib/supabase/queries.ts`
- [x] T054 [P] [US2] Add getBrandAnalysisData() to `lib/supabase/queries.ts` to fetch brand+prompts+competitors in single query

### LLM Analysis Logic

- [x] T055 [US2] Create `lib/llm/analysis.ts` with analyzeBrand() function that calls OpenAI API (FR-012, FR-013, FR-014)
- [x] T056 [US2] Add validation in `lib/llm/analysis.ts` to ensure 1+ prompts exist before analysis (FR-023)
- [x] T057 [US2] Add retry logic with exponential backoff (max 3 attempts) in `lib/llm/analysis.ts` (FR-018)
- [x] T058 [US2] Add response validation in `lib/llm/analysis.ts` using Zod parser from T025 (FR-015, FR-016)

### API Routes for Analysis

- [x] T059 [US2] Create `app/api/analysis/route.ts` with POST handler that orchestrates analysis workflow
- [x] T060 [P] [US2] Create `app/api/analysis/mock/route.ts` with GET handler returning static mock analysis (FR-019)
- [x] T061 [P] [US2] Create `app/api/analysis/[brandId]/latest/route.ts` with GET handler for latest score

### Analysis Components

- [x] T062 [P] [US2] Create `components/analysis/AnalysisButton.tsx` with trigger button and validation state
- [x] T063 [P] [US2] Create `components/analysis/AnalysisStatus.tsx` with loading spinner, progress indicator, error handling

### Analysis Page

- [x] T064 [US2] Create `app/brands/[brandId]/analysis/page.tsx` with AnalysisButton, AnalysisStatus, auto-redirect to dashboard on completion

### Error Handling for LLM Failures

- [x] T065 [US2] Add LLM timeout handling (30s) in `lib/llm/analysis.ts`
- [x] T066 [US2] Add user-friendly error messages for API failures in `components/analysis/AnalysisStatus.tsx`

**Checkpoint**: At this point, User Story 2 should work independently - analysis can be triggered on pre-configured brands and results persist to database

---

## Phase 5: User Story 3 - Visual Dashboard and Insights (Priority: P3)

**Goal**: Display brand evaluation results through visual charts (radar/bar) with detailed reasoning for each dimension. Makes complex scoring data immediately understandable.

**Independent Test**: Pre-seed database with analyzed brand (has scores). Load dashboard. Verify radar chart renders with 5 dimensions, tooltips show exact values, reasoning displays for each dimension, competitor comparison works.

**Dependencies**: Requires User Story 2 (scores must exist)

### Chart Components

- [x] T067 [P] [US3] Create `components/dashboard/ScoreRadarChart.tsx` using Recharts `<RadarChart>` for 5 dimensions (FR-020)
- [x] T068 [P] [US3] Create `components/dashboard/ScoreBarChart.tsx` using Recharts `<BarChart>` as alternative visualization
- [x] T069 [P] [US3] Create `components/dashboard/ScoreDimension.tsx` to display individual score with icon, value, reasoning (FR-022)
- [ ] T070 [P] [US3] Create `components/dashboard/CompetitorComparison.tsx` for side-by-side score comparison (FR-021)

### Dashboard Utilities

- [ ] T071 [P] [US3] Create `lib/utils/chart-data.ts` with transformScoreToRadarData() and transformScoreToBarData() helpers
- [ ] T072 [P] [US3] Add getScoreColor() function to `lib/utils/chart-data.ts` for conditional coloring (red/yellow/green)

### Dashboard Page

- [x] T073 [US3] Create `app/brands/[brandId]/dashboard/page.tsx` fetching latest score server-side
- [x] T074 [US3] Add chart toggle (radar/bar) in `app/brands/[brandId]/dashboard/page.tsx`
- [ ] T075 [US3] Add "View All Scores" history section in `app/brands/[brandId]/dashboard/page.tsx`

### Chart Interactivity

- [x] T076 [P] [US3] Add hover tooltips to ScoreRadarChart showing exact score values
- [ ] T077 [P] [US3] Add click handlers to chart dimensions to expand reasoning in ScoreDimension component

**Checkpoint**: All user stories should now be independently functional - full brand analysis workflow from creation to visualization is complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Navigation & UX

- [x] T078 [P] Create `components/shared/Navigation.tsx` with breadcrumb trail (Home → Brand → Prompts → Competitors → Analysis → Dashboard)
- [x] T079 [P] Create `components/shared/ErrorBoundary.tsx` for React error boundary across all pages
- [x] T080 [P] Create `components/shared/LoadingSpinner.tsx` reusable component

### Data Persistence & State

- [ ] T081 Add revalidatePath() calls to all mutation API routes to update Next.js cache
- [ ] T082 Add optimistic UI updates to brand/prompt/competitor forms
- [ ] T083 Implement proper error handling for network failures across all API calls

### Performance Optimization

- [ ] T084 [P] Add React.memo to chart components in `components/dashboard/` to prevent unnecessary re-renders
- [ ] T085 [P] Optimize Supabase queries with `.select()` field selection instead of `*`
- [x] T086 Add loading skeletons to all pages using Next.js `loading.tsx` pattern

### Error Pages

- [x] T087 [P] Create `app/brands/[brandId]/error.tsx` with user-friendly error UI
- [x] T088 [P] Create `app/brands/[brandId]/not-found.tsx` for missing brands

### Documentation & Developer Experience

- [x] T089 [P] Create `README.md` at repository root with quickstart instructions
- [x] T090 [P] Update `.env.example` with inline comments explaining each variable
- [ ] T091 [P] Create `CONTRIBUTING.md` with development workflow guidelines

### Testing Infrastructure (Optional - only if E2E tests are desired)

- [ ] T092 [P] Create `tests/e2e/brand-flow.spec.ts` testing complete P1 user story flow
- [ ] T093 [P] Create `tests/e2e/analysis-flow.spec.ts` testing P2 analysis workflow
- [ ] T094 [P] Create `tests/e2e/dashboard-flow.spec.ts` testing P3 visualization

### Production Readiness

- [ ] T095 Add rate limiting to LLM API calls to prevent quota exhaustion
- [ ] T096 Add telemetry/logging for LLM API usage and costs
- [x] T097 Validate environment variables at startup in `lib/config.ts`
- [x] T098 Add Vercel deployment configuration in `vercel.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1 if team capacity allows, but logically builds on US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1/US2 but logically builds on US2
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: ✅ Independent - No dependencies on other stories
- **User Story 2 (P2)**: ⚠️ Logical dependency on US1 (needs brands/prompts/competitors to exist) but can be tested with seeded data
- **User Story 3 (P3)**: ⚠️ Logical dependency on US2 (needs scores to exist) but can be tested with seeded data

### Within Each User Story

- Database queries before API routes
- API routes before components
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T002-T009 can all run in parallel (different config files)

**Phase 2 (Foundational)**:
- T012-T016 (all type definitions) can run in parallel
- T019-T021 (all validation modules) can run in parallel
- T023-T026 (all LLM infrastructure) can run in parallel

**Phase 3 (User Story 1)**:
- T029-T031 (all query functions) can run in parallel
- T034-T036 (prompts API routes) in parallel with T037-T039 (competitors API routes)
- T040-T041 (brand components) in parallel with T042-T044 (prompt components) and T045-T047 (competitor components)
- T051-T052 (utilities) can run in parallel

**Phase 4 (User Story 2)**:
- T053-T054 (score queries) can run in parallel
- T060-T061 (mock and latest endpoints) can run in parallel
- T062-T063 (analysis components) can run in parallel

**Phase 5 (User Story 3)**:
- T067-T070 (all chart components) can run in parallel
- T071-T072 (chart utilities) can run in parallel
- T076-T077 (chart interactivity) can run in parallel

**Phase 6 (Polish)**:
- T078-T080 (shared components) can run in parallel
- T084-T085 (performance optimizations) can run in parallel
- T087-T088 (error pages) can run in parallel
- T089-T091 (documentation) can run in parallel
- T092-T094 (E2E tests) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all type definitions together (Phase 2):
Task T012: Create types/brand.ts
Task T013: Create types/prompt.ts
Task T014: Create types/competitor.ts
Task T015: Create types/score.ts

# Launch all query functions together (Phase 3):
Task T029: Create lib/supabase/queries.ts with brand functions
Task T030: Add prompt functions to lib/supabase/queries.ts
Task T031: Add competitor functions to lib/supabase/queries.ts

# Launch all prompt components together:
Task T042: Create components/prompts/PromptForm.tsx
Task T043: Create components/prompts/PromptList.tsx
Task T044: Create components/prompts/SuggestPromptsButton.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. **Complete Phase 1**: Setup (T001-T009) - 1-2 hours
2. **Complete Phase 2**: Foundational (T010-T028) - 4-6 hours
   - ⚠️ CRITICAL CHECKPOINT: Database migrations run successfully, all type definitions compile
3. **Complete Phase 3**: User Story 1 (T029-T052) - 8-12 hours
4. **STOP and VALIDATE**:
   - Test brand creation flow end-to-end
   - Test AI prompt suggestions
   - Test AI competitor suggestions
   - Verify all data persists correctly
5. **Deploy/demo if ready** - You now have a working brand setup tool!

**Total MVP effort**: ~15-20 hours for solo developer

### Incremental Delivery

1. **Foundation** (Phases 1-2): Setup + Foundational → Database ready, types defined, LLM configured
2. **MVP** (Phase 3): Add User Story 1 → Test independently → **Deploy/Demo** (Brand setup tool!)
3. **Core Value** (Phase 4): Add User Story 2 → Test independently → **Deploy/Demo** (AI analysis working!)
4. **Polish** (Phase 5): Add User Story 3 → Test independently → **Deploy/Demo** (Full visualization!)
5. **Production** (Phase 6): Polish & optimization → **Production release**

Each phase adds value without breaking previous functionality.

### Parallel Team Strategy

With 3 developers:

1. **Week 1**: Team completes Setup + Foundational together (Phases 1-2)
2. **Week 2** (once Foundational is done):
   - **Developer A**: User Story 1 (T029-T052) - Brand/Prompts/Competitors
   - **Developer B**: User Story 2 (T053-T066) - AI Analysis (can seed test data)
   - **Developer C**: User Story 3 (T067-T077) - Dashboard (can seed test data)
3. **Week 3**: Integration testing, bug fixes, Phase 6 polish tasks

---

## Task Summary

**Total Tasks**: 98 tasks

### Tasks by Phase:
- **Phase 1 (Setup)**: 9 tasks (T001-T009)
- **Phase 2 (Foundational)**: 18 tasks (T010-T028) ⚠️ BLOCKING
- **Phase 3 (User Story 1)**: 24 tasks (T029-T052) 🎯 MVP
- **Phase 4 (User Story 2)**: 14 tasks (T053-T066)
- **Phase 5 (User Story 3)**: 11 tasks (T067-T077)
- **Phase 6 (Polish)**: 22 tasks (T078-T098)

### Tasks by User Story:
- **US1 (Brand Setup)**: 24 tasks - Complete brand/prompt/competitor management
- **US2 (Analysis)**: 14 tasks - AI-powered scoring
- **US3 (Dashboard)**: 11 tasks - Visual insights

### Parallel Opportunities:
- **Phase 1**: 8 parallelizable tasks (T002-T009)
- **Phase 2**: 11 parallelizable tasks (T012-T016, T019-T021, T023-T026)
- **Phase 3**: 19 parallelizable tasks (marked with [P][US1])
- **Phase 4**: 6 parallelizable tasks (marked with [P][US2])
- **Phase 5**: 8 parallelizable tasks (marked with [P][US3])
- **Phase 6**: 14 parallelizable tasks (marked with [P])

**Total parallelizable**: 66 tasks (67%)

### Independent Test Criteria:

**User Story 1**:
- ✅ Can create brand through UI
- ✅ Can add manual prompts
- ✅ Can generate AI prompts (5 suggestions appear within 3s)
- ✅ Can add manual competitors
- ✅ Can generate AI competitors
- ✅ All data persists and displays correctly
- ✅ Domain validation works (rejects invalid domains)
- ✅ Duplicate competitor prevention works

**User Story 2**:
- ✅ Can trigger analysis on brand with prompts
- ✅ Analysis completes within 15 seconds
- ✅ Five scores (0-100) are stored correctly
- ✅ Reasoning text exists for each dimension
- ✅ Error handling works for LLM failures
- ✅ Validation prevents analysis without prompts

**User Story 3**:
- ✅ Dashboard loads with latest scores
- ✅ Radar chart displays all 5 dimensions correctly
- ✅ Bar chart alternative view works
- ✅ Tooltips show exact score values
- ✅ Reasoning displays for each dimension
- ✅ Competitor comparison displays correctly

### Suggested MVP Scope:

**Minimum Viable Product** = User Story 1 only (Phases 1-3)
- Total tasks: 51 tasks (Setup + Foundational + US1)
- Estimated effort: 15-20 hours solo developer
- Delivers: Complete brand setup tool with AI assistance
- Value: Structured brand analysis framework

**Recommended MVP** = User Stories 1 + 2 (Phases 1-4)
- Total tasks: 65 tasks
- Estimated effort: 25-35 hours solo developer
- Delivers: Full AI analysis capability
- Value: Core product functionality with actionable insights

**Full Feature** = All User Stories (Phases 1-5)
- Total tasks: 76 tasks
- Estimated effort: 35-45 hours solo developer
- Delivers: Complete platform with visualization
- Value: Professional-grade brand analysis tool

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths use Next.js 14 App Router conventions
- TypeScript strict mode enabled - all types must be properly defined
- Tests are **NOT** included in this task list (no TDD requirement in spec)
- LLM mock mode available for development without API costs (FR-019)

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description`
✅ All tasks include exact file paths
✅ Sequential task IDs (T001-T098)
✅ All user story tasks labeled with [US1], [US2], or [US3]
✅ Parallelizable tasks marked with [P]
✅ Setup and Foundational phases have no story labels
✅ Each phase has clear goals and checkpoints
