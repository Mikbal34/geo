# Feature Specification: Brand Analysis & Scoring Platform

**Feature Branch**: `001-goal-build-a`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "Goal: Build a web app similar to Brantial AI using Next.js and Supabase. The app analyzes brand data, generates AI prompts, and compares competitors through an LLM-based scoring layer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Brand Setup and Initial Analysis (Priority: P1)

A marketing professional wants to analyze their brand's positioning and communication effectiveness. They create a new brand profile by entering basic brand information, define key evaluation prompts (either manually or AI-suggested), and identify competitors for comparative analysis.

**Why this priority**: This is the foundation of the entire platform. Without the ability to create a brand profile and define analysis parameters, no other functionality can work. It delivers immediate value by allowing users to structure their brand analysis framework.

**Independent Test**: Can be fully tested by creating a brand profile with name, domain, region, adding at least one prompt, and adding at least one competitor. Delivers value by providing a structured framework for brand analysis even before scoring occurs.

**Acceptance Scenarios**:

1. **Given** user is on the brand creation page, **When** they enter brand name "EcoClean", domain "ecoclean.com", and region "Global" and submit, **Then** brand is saved and user is redirected to prompts page
2. **Given** user is on prompts page for their brand, **When** they click "Let AI suggest prompts", **Then** system displays 3-5 AI-generated sample prompts relevant to brand analysis
3. **Given** user is on prompts page, **When** they manually add a custom prompt "What makes our brand unique?", **Then** prompt is saved and appears in their prompt list
4. **Given** user is on competitors page, **When** they add competitor "GreenWash" with domain "greenwash.com" and region "North America", **Then** competitor is saved and linked to their brand
5. **Given** user is on competitors page, **When** they click "Let AI suggest competitors", **Then** system suggests 3-5 relevant competitors based on brand domain and industry

---

### User Story 2 - AI-Powered Brand Evaluation (Priority: P2)

After setting up their brand and competitors, the marketing professional requests an AI-powered analysis. The system evaluates the brand across five dimensions (Relevance, Clarity, Consistency, Creativity, Emotional Impact) and provides numerical scores with detailed reasoning.

**Why this priority**: This is the core value proposition - AI-driven insights. However, it depends on P1 (brand setup) being complete. It transforms the structured data into actionable intelligence.

**Independent Test**: Can be tested independently by triggering analysis on a pre-configured brand with prompts and competitors. Delivers value through concrete, measurable scores and explanations that guide brand strategy decisions.

**Acceptance Scenarios**:

1. **Given** brand has at least one prompt and one competitor defined, **When** user initiates scoring analysis, **Then** system sends brand data, prompts, and competitor info to LLM for evaluation
2. **Given** LLM analysis is complete, **When** results are returned, **Then** system stores five dimension scores (0-100 scale) and reasoning in database
3. **Given** analysis encounters an error, **When** LLM call fails, **Then** user sees meaningful error message and can retry
4. **Given** brand has no prompts defined, **When** user attempts to run analysis, **Then** system displays validation error requesting at least one prompt

---

### User Story 3 - Visual Dashboard and Insights (Priority: P3)

The marketing professional views their brand's evaluation results through visual charts and comparisons. They can see scores displayed as bar charts or radar charts, compare their brand against competitors, and read detailed reasoning for each dimension score.

**Why this priority**: Visualization makes the data actionable and easier to understand, but the raw scores (P2) already provide value. This enhances the user experience and makes insights more accessible to stakeholders.

**Independent Test**: Can be tested by loading pre-existing analysis results and verifying all visualizations render correctly. Delivers value by making complex scoring data immediately understandable through visual representation.

**Acceptance Scenarios**:

1. **Given** brand has completed analysis, **When** user views dashboard, **Then** five dimension scores are displayed as a radar chart showing brand's profile
2. **Given** brand has scores, **When** user views score details, **Then** each dimension shows numerical score and reasoning text explaining the rating
3. **Given** multiple competitors have been analyzed, **When** user views comparison view, **Then** brand scores are shown alongside competitor scores for easy comparison
4. **Given** user hovers over a chart element, **When** tooltip appears, **Then** it shows the exact score value and dimension name

---

### Edge Cases

- What happens when user enters invalid domain format (missing .com, malformed URL)?
- How does system handle LLM API timeout or rate limiting during analysis?
- What if user tries to add duplicate competitors with same domain?
- How does system behave when LLM returns malformed JSON or scores outside 0-100 range?
- What happens if user tries to run analysis with no competitors defined?
- How does system handle concurrent analysis requests for the same brand?
- What if brand name contains special characters or emojis?
- How does system handle very long prompt text (>1000 characters)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a brand profile with name, domain, and region fields
- **FR-002**: System MUST validate domain format before saving brand data
- **FR-003**: System MUST redirect users to prompts page immediately after brand creation
- **FR-004**: System MUST persist all brand data, prompts, competitors, and scores in database
- **FR-005**: System MUST link each prompt to its parent brand via brand_id
- **FR-006**: System MUST link each competitor to its parent brand via brand_id
- **FR-007**: System MUST support manual prompt creation with user-entered text
- **FR-008**: System MUST provide AI-generated sample prompts relevant to brand analysis
- **FR-009**: System MUST allow users to request AI-suggested competitors based on brand information
- **FR-010**: System MUST support manual competitor entry with name, domain, and region
- **FR-011**: System MUST prevent duplicate competitors for the same brand (based on domain)
- **FR-012**: System MUST gather brand data, prompts, and competitors before sending to LLM
- **FR-013**: System MUST format LLM request with structured JSON containing brand_name, domain, region, prompts array, and competitors array
- **FR-014**: System MUST request exactly five dimension scores from LLM: Relevance, Clarity, Consistency, Creativity, Emotional Impact
- **FR-015**: System MUST validate LLM response contains scores between 0-100 for all five dimensions
- **FR-016**: System MUST extract reasoning text for each dimension from LLM response
- **FR-017**: System MUST store scores and reasoning_json in scores table linked to brand_id
- **FR-018**: System MUST handle LLM API failures gracefully with user-friendly error messages
- **FR-019**: System MUST support mock/static LLM responses for testing without API calls
- **FR-020**: System MUST display scores visually using charts (bar chart or radar chart)
- **FR-021**: System MUST show competitor comparison data on dashboard
- **FR-022**: System MUST display reasoning snippets for each dimension score
- **FR-023**: System MUST require at least one prompt before allowing analysis to run
- **FR-024**: System MUST use TypeScript interfaces for all data structures

### Key Entities

- **Brand**: Represents a company/product being analyzed. Attributes: unique identifier, brand name, website domain, geographic region, creation timestamp. Primary entity that all other data relates to.

- **Prompt**: Represents a question or instruction for LLM to evaluate the brand. Attributes: unique identifier, prompt text, link to parent brand, creation timestamp. Multiple prompts can exist per brand.

- **Competitor**: Represents a competing brand for comparative analysis. Attributes: unique identifier, competitor name, website domain, geographic region, link to parent brand. Multiple competitors can exist per brand.

- **Score**: Represents LLM evaluation results for a brand. Attributes: unique identifier, link to parent brand, five numerical scores (Relevance, Clarity, Consistency, Creativity, Emotional Impact) on 0-100 scale, reasoning text in JSON format, analysis timestamp. One score record per brand analysis run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete brand profile (brand + prompts + competitors) in under 5 minutes
- **SC-002**: AI-generated prompt suggestions appear within 3 seconds of user request
- **SC-003**: Brand analysis completes and displays results within 15 seconds of initiation
- **SC-004**: 95% of analysis requests complete successfully without errors
- **SC-005**: Dashboard charts render and display all score data within 2 seconds
- **SC-006**: Users can compare their brand against at least 3 competitors simultaneously
- **SC-007**: All score dimensions display both numerical values and explanatory reasoning
- **SC-008**: System prevents data loss by persisting all user inputs before page transitions
- **SC-009**: First-time users can complete the entire workflow (brand setup → analysis → view results) without external help or documentation

## Assumptions

- Users have basic familiarity with brand marketing concepts (relevance, clarity, consistency, etc.)
- LLM API (OpenAI or Claude) will be available with standard response times under 10 seconds
- Prompts will be primarily in English language
- Users will analyze one brand at a time (no bulk/batch analysis in MVP)
- Chart visualization library will be selected from established options (Recharts, Chart.js)
- User authentication will follow standard session-based or OAuth2 patterns
- Database structure follows normalized relational model with foreign key constraints
- Mock LLM responses will be implemented first, then replaced with real API integration
- Region field accepts free-form text input (not restricted to predefined list)
- Analysis can be re-run multiple times for the same brand (creates new score records)
- Dashboard shows the most recent analysis results by default

## Dependencies

- External LLM API service (OpenAI GPT-4 or Anthropic Claude) must be accessible
- Supabase account and project must be provisioned before development
- Chart visualization library must be installed and compatible with Next.js 14
- TailwindCSS must be configured in Next.js project
