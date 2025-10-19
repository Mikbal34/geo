# Research: Brand Analysis & Scoring Platform

**Date**: 2025-10-15
**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Purpose

This document resolves all "NEEDS CLARIFICATION" items from Technical Context and establishes best practices for technology choices.

---

## Research Tasks

### 1. Chart Library Selection (Recharts vs Chart.js)

**Decision**: Recharts

**Rationale**:
- **React-first design**: Recharts is built specifically for React with declarative components
- **TypeScript support**: First-class TypeScript definitions out of the box
- **Radar chart support**: Native `<RadarChart>` component matches SC-001 requirement for 5-dimension visualization
- **Next.js compatibility**: Works seamlessly with Server Components and Client Components
- **Bundle size**: ~95KB gzipped, reasonable for web app
- **Maintenance**: Active development, 23k+ GitHub stars

**Alternatives Considered**:
- **Chart.js**: More imperative API requiring manual DOM manipulation, less idiomatic for React. Requires react-chartjs-2 wrapper which adds another dependency layer.
- **Victory**: Similar to Recharts but larger bundle size (~150KB) and more complex API
- **Tremor**: Modern but less mature, fewer customization options

**Implementation Notes**:
- Install: `npm install recharts`
- Use `<RadarChart>` for 5-dimension scores (Relevance, Clarity, Consistency, Creativity, Emotional Impact)
- Use `<BarChart>` as alternative view
- Wrap in `'use client'` directive since charts require browser APIs

---

### 2. Testing Framework (Vitest vs Jest)

**Decision**: Vitest + React Testing Library + Playwright

**Rationale**:
- **Vitest for unit/integration tests**:
  - Native ESM support (no configuration needed for Next.js 14)
  - Vite-powered = faster test execution (~10x faster than Jest)
  - Jest-compatible API (easy migration if needed)
  - Built-in TypeScript support
  - Better watch mode with HMR
  - First-class Next.js support via `@vitejs/plugin-react`

- **React Testing Library**:
  - Standard for testing React components
  - User-centric testing approach aligns with acceptance scenarios
  - Works with both Jest and Vitest

- **Playwright for E2E**:
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Built-in network mocking for LLM API testing
  - Video recording for debugging failures
  - Parallel test execution
  - Recommended by Next.js docs for E2E testing

**Alternatives Considered**:
- **Jest**: Industry standard but slower, requires additional configuration for ESM and Next.js App Router
- **Cypress**: Popular but heavier, slower startup time, doesn't support multiple browser contexts

**Implementation Notes**:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test
```

**Test Structure**:
- Unit tests: `tests/unit/**/*.test.ts(x)` - individual functions and components
- Integration tests: `tests/integration/**/*.test.ts` - API routes + Supabase queries
- E2E tests: `tests/e2e/**/*.spec.ts` - full user flows (P1, P2, P3)

---

### 3. LLM Provider Choice (OpenAI GPT-4 vs Anthropic Claude)

**Decision**: Start with OpenAI GPT-4 Turbo, add Claude as alternative in future

**Rationale**:
- **OpenAI GPT-4 Turbo (Initial MVP)**:
  - JSON mode (`response_format: { type: "json_object" }`) ensures reliable structured output
  - 128k context window (sufficient for brand analysis with competitors)
  - Function calling capability for future extensibility
  - $10/1M input tokens, $30/1M output tokens (reasonable for MVP)
  - Better documented prompt engineering patterns for scoring/evaluation tasks
  - More predictable response times (avg 3-8s)

- **Why not Claude initially**:
  - Requires more careful prompt engineering for consistent JSON output
  - Higher cost ($15/1M input, $75/1M output for Claude 3.5 Sonnet)
  - Excellent for complex reasoning but overkill for structured scoring tasks

- **Future enhancement**: Add provider abstraction layer to support both

**Alternatives Considered**:
- **Anthropic Claude**: Excellent reasoning quality, but higher cost and less structured output consistency
- **Azure OpenAI**: Enterprise features not needed for MVP, adds deployment complexity
- **Open source models (Llama 3, Mistral)**: Require self-hosting infrastructure, not feasible for MVP

**Implementation Notes**:
```typescript
// lib/llm/client.ts - Use OpenAI SDK
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use JSON mode for structured responses
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  response_format: { type: "json_object" },
  messages: [...],
});
```

**API Key Management**:
- Store in `.env.local`: `OPENAI_API_KEY=sk-...`
- Never commit to git (add to `.gitignore`)
- Use Vercel environment variables for production

**Cost Estimation** (MVP usage):
- Assume 100 analyses/month
- Avg input: 2k tokens (brand + prompts + competitors)
- Avg output: 500 tokens (5 scores + reasoning)
- Monthly cost: 100 × ($0.02 + $0.015) ≈ $3.50/month

---

## Best Practices

### Next.js 14 App Router Patterns

**Server Components by Default**:
- All pages and components are Server Components unless they need:
  - Client-side state (`useState`, `useReducer`)
  - Browser APIs (`localStorage`, `window`)
  - Event handlers (`onClick`, `onChange`)
  - Client-only libraries (Recharts)

**Server Actions for Mutations**:
```typescript
// app/brands/actions.ts
'use server'

export async function createBrand(formData: FormData) {
  const brand = await supabase.from('brands').insert({...})
  revalidatePath('/brands')
  return brand
}
```

**Route Handlers for APIs**:
- Use for external integrations (LLM APIs)
- Use for non-form data operations
- Return `Response` or `NextResponse`

**Data Fetching**:
- Use `async` Server Components for data fetching
- No need for `useEffect` or client-side fetching
- Automatic request deduplication

---

### Supabase Integration Patterns

**Client Initialization**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Type Safety**:
```typescript
// Generate types from Supabase schema
npx supabase gen types typescript --project-id [PROJECT_ID] > lib/supabase/database.types.ts
```

**Query Patterns**:
```typescript
// Fetch brand with related data
const { data: brand } = await supabase
  .from('brands')
  .select(`
    *,
    prompts (*),
    competitors (*),
    scores (*)
  `)
  .eq('id', brandId)
  .single()
```

**Error Handling**:
```typescript
const { data, error } = await supabase.from('brands').insert({...})
if (error) {
  console.error('Database error:', error)
  throw new Error('Failed to create brand')
}
```

---

### LLM Prompt Engineering

**Scoring Prompt Template**:
```typescript
// lib/llm/prompts.ts
export const BRAND_SCORING_PROMPT = `
You are a brand analysis expert. Evaluate the following brand across five dimensions.

Brand Information:
- Name: {brand_name}
- Domain: {domain}
- Region: {region}

Analysis Prompts:
{prompts}

Competitors:
{competitors}

Return a JSON object with scores (0-100) and reasoning for each dimension:
{
  "Relevance": {"score": <number>, "reason": "<string>"},
  "Clarity": {"score": <number>, "reason": "<string>"},
  "Consistency": {"score": <number>, "reason": "<string>"},
  "Creativity": {"score": <number>, "reason": "<string>"},
  "Emotional_Impact": {"score": <number>, "reason": "<string>"}
}

Be specific and actionable in your reasoning.
`.trim()
```

**Response Validation**:
```typescript
// lib/llm/parser.ts
import { z } from 'zod'

const ScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string().min(10)
})

const AnalysisSchema = z.object({
  Relevance: ScoreSchema,
  Clarity: ScoreSchema,
  Consistency: ScoreSchema,
  Creativity: ScoreSchema,
  Emotional_Impact: ScoreSchema
})

export function parseAnalysisResponse(json: string) {
  const parsed = JSON.parse(json)
  return AnalysisSchema.parse(parsed) // Throws if invalid
}
```

---

### Error Handling Strategy

**API Error Responses**:
```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
  }
}

// Usage in API routes
if (!brandId) {
  throw new AppError(400, 'Brand ID is required', 'MISSING_BRAND_ID')
}
```

**Client-Side Error Display**:
- Use React Error Boundaries for component errors
- Toast notifications for user-triggered errors
- Detailed error pages for route-level errors

**LLM Error Handling**:
- Retry logic with exponential backoff (max 3 attempts)
- Timeout after 30 seconds
- Fallback to mock data in development
- Clear user messaging: "Analysis taking longer than expected. Please try again."

---

## Configuration Files

### Environment Variables

```env
# .env.local (DO NOT COMMIT)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...

# .env.example (commit this)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

---

## Summary

All technical clarifications resolved:

1. ✅ **Chart Library**: Recharts (React-native, radar chart support, TypeScript)
2. ✅ **Testing Framework**: Vitest + React Testing Library + Playwright (fast, modern, Next.js compatible)
3. ✅ **LLM Provider**: OpenAI GPT-4 Turbo (JSON mode, cost-effective, reliable)

**Next Steps**: Proceed to Phase 1 (data model, contracts, quickstart)
