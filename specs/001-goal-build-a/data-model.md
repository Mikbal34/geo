# Data Model: Brand Analysis & Scoring Platform

**Date**: 2025-10-15
**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

## Overview

This document defines the data entities, relationships, validation rules, and state transitions for the brand analysis platform. The model is designed for PostgreSQL (via Supabase) with relational integrity enforced through foreign keys.

---

## Entity Definitions

### 1. Brand

**Purpose**: Represents a company or product being analyzed

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `brand_name` | VARCHAR(255) | NOT NULL | Brand/company name |
| `domain` | VARCHAR(255) | NOT NULL, UNIQUE | Website domain (e.g., "ecoclean.com") |
| `region` | VARCHAR(100) | NOT NULL | Geographic region (e.g., "Global", "North America") |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Validation Rules** (from FR-001, FR-002):
- `brand_name`: 1-255 characters, non-empty
- `domain`: Must match pattern `^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$`
  - Examples: ✅ "example.com", "sub.example.co.uk" ❌ "-bad.com", "no-tld"
- `region`: 1-100 characters, free-form text
- `domain` must be unique across all brands

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `domain`
- INDEX on `created_at` (for sorting recent brands)

**TypeScript Interface**:
```typescript
// types/brand.ts
export interface Brand {
  id: string
  brand_name: string
  domain: string
  region: string
  created_at: string
  updated_at: string
}

export interface CreateBrandInput {
  brand_name: string
  domain: string
  region: string
}
```

---

### 2. Prompt

**Purpose**: Represents an analysis question or instruction for LLM evaluation

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `brand_id` | UUID | NOT NULL, FOREIGN KEY → brands(id) ON DELETE CASCADE | Parent brand |
| `prompt_text` | TEXT | NOT NULL | The prompt content |
| `is_ai_generated` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether prompt was AI-suggested |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules** (from FR-007, FR-008):
- `prompt_text`: 10-2000 characters (minimum for meaningful prompt, maximum to prevent token overflow)
- `brand_id`: Must reference existing brand
- At least one prompt required before analysis (validated at application level, FR-023)

**Relationships**:
- Many-to-one with Brand (one brand has many prompts)
- CASCADE delete: When brand is deleted, all its prompts are deleted

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY INDEX on `brand_id`
- INDEX on `(brand_id, created_at)` (for fetching brand's prompts chronologically)

**TypeScript Interface**:
```typescript
// types/prompt.ts
export interface Prompt {
  id: string
  brand_id: string
  prompt_text: string
  is_ai_generated: boolean
  created_at: string
}

export interface CreatePromptInput {
  brand_id: string
  prompt_text: string
  is_ai_generated?: boolean
}

export interface SuggestPromptsInput {
  brand_id: string
  count?: number // Default: 5
}
```

---

### 3. Competitor

**Purpose**: Represents a competing brand for comparative analysis

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `brand_id` | UUID | NOT NULL, FOREIGN KEY → brands(id) ON DELETE CASCADE | Parent brand |
| `competitor_name` | VARCHAR(255) | NOT NULL | Competitor brand name |
| `competitor_domain` | VARCHAR(255) | NOT NULL | Competitor website domain |
| `region` | VARCHAR(100) | NOT NULL | Competitor's geographic region |
| `is_ai_generated` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether competitor was AI-suggested |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Validation Rules** (from FR-010, FR-011):
- `competitor_name`: 1-255 characters
- `competitor_domain`: Same validation as Brand.domain
- `region`: 1-100 characters
- UNIQUE constraint on `(brand_id, competitor_domain)` - prevents duplicate competitors per brand

**Relationships**:
- Many-to-one with Brand (one brand has many competitors)
- CASCADE delete: When brand is deleted, all its competitors are deleted

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY INDEX on `brand_id`
- UNIQUE INDEX on `(brand_id, competitor_domain)` (enforces FR-011)
- INDEX on `(brand_id, created_at)`

**TypeScript Interface**:
```typescript
// types/competitor.ts
export interface Competitor {
  id: string
  brand_id: string
  competitor_name: string
  competitor_domain: string
  region: string
  is_ai_generated: boolean
  created_at: string
}

export interface CreateCompetitorInput {
  brand_id: string
  competitor_name: string
  competitor_domain: string
  region: string
  is_ai_generated?: boolean
}

export interface SuggestCompetitorsInput {
  brand_id: string
  count?: number // Default: 5
}
```

---

### 4. Score

**Purpose**: Represents LLM evaluation results for a brand analysis

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `brand_id` | UUID | NOT NULL, FOREIGN KEY → brands(id) ON DELETE CASCADE | Parent brand |
| `relevance` | INTEGER | NOT NULL, CHECK (relevance >= 0 AND relevance <= 100) | Relevance score (0-100) |
| `clarity` | INTEGER | NOT NULL, CHECK (clarity >= 0 AND clarity <= 100) | Clarity score (0-100) |
| `consistency` | INTEGER | NOT NULL, CHECK (consistency >= 0 AND consistency <= 100) | Consistency score (0-100) |
| `creativity` | INTEGER | NOT NULL, CHECK (creativity >= 0 AND creativity <= 100) | Creativity score (0-100) |
| `emotional_impact` | INTEGER | NOT NULL, CHECK (emotional_impact >= 0 AND emotional_impact <= 100) | Emotional Impact score (0-100) |
| `reasoning_json` | JSONB | NOT NULL | Detailed reasoning for each score |
| `model_used` | VARCHAR(100) | NOT NULL | LLM model identifier (e.g., "gpt-4-turbo-preview") |
| `analysis_duration_ms` | INTEGER | NULL | Time taken for analysis in milliseconds |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Analysis timestamp |

**Validation Rules** (from FR-014, FR-015, FR-016, FR-017):
- All score fields: Integer 0-100 (enforced by CHECK constraint)
- `reasoning_json`: Must be valid JSON object with structure:
  ```json
  {
    "Relevance": {"score": 82, "reason": "..."},
    "Clarity": {"score": 76, "reason": "..."},
    "Consistency": {"score": 71, "reason": "..."},
    "Creativity": {"score": 85, "reason": "..."},
    "Emotional_Impact": {"score": 88, "reason": "..."}
  }
  ```
- Each reason: Minimum 10 characters
- `model_used`: Required for audit trail

**Relationships**:
- Many-to-one with Brand (one brand can have multiple analyses over time)
- CASCADE delete: When brand is deleted, all its scores are deleted
- Latest score is typically shown (ORDER BY created_at DESC LIMIT 1)

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY INDEX on `brand_id`
- INDEX on `(brand_id, created_at DESC)` (for fetching latest analysis)

**TypeScript Interface**:
```typescript
// types/score.ts
export interface ScoreDimension {
  score: number // 0-100
  reason: string // Min 10 chars
}

export interface ScoreReasoning {
  Relevance: ScoreDimension
  Clarity: ScoreDimension
  Consistency: ScoreDimension
  Creativity: ScoreDimension
  Emotional_Impact: ScoreDimension
}

export interface Score {
  id: string
  brand_id: string
  relevance: number
  clarity: number
  consistency: number
  creativity: number
  emotional_impact: number
  reasoning_json: ScoreReasoning
  model_used: string
  analysis_duration_ms: number | null
  created_at: string
}

export interface CreateScoreInput {
  brand_id: string
  relevance: number
  clarity: number
  consistency: number
  creativity: number
  emotional_impact: number
  reasoning_json: ScoreReasoning
  model_used: string
  analysis_duration_ms?: number
}
```

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│      Brand          │
│─────────────────────│
│ id (PK)             │
│ brand_name          │
│ domain (UNIQUE)     │
│ region              │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ├─────────────────────────────────┐
         │                                 │
         │                                 │
         ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐
│      Prompt         │         │    Competitor       │
│─────────────────────│         │─────────────────────│
│ id (PK)             │         │ id (PK)             │
│ brand_id (FK)       │         │ brand_id (FK)       │
│ prompt_text         │         │ competitor_name     │
│ is_ai_generated     │         │ competitor_domain   │
│ created_at          │         │ region              │
└─────────────────────┘         │ is_ai_generated     │
                                │ created_at          │
                                └─────────────────────┘
         │ 1:N                  UNIQUE(brand_id, competitor_domain)
         │
         ▼
┌─────────────────────┐
│       Score         │
│─────────────────────│
│ id (PK)             │
│ brand_id (FK)       │
│ relevance           │
│ clarity             │
│ consistency         │
│ creativity          │
│ emotional_impact    │
│ reasoning_json      │
│ model_used          │
│ analysis_duration_ms│
│ created_at          │
└─────────────────────┘
```

**Key Relationships**:
- All child entities CASCADE delete when parent Brand is deleted
- Brand → Prompts: One-to-Many
- Brand → Competitors: One-to-Many (with unique domain constraint)
- Brand → Scores: One-to-Many (historical analyses)

---

## State Transitions

### Brand Analysis Workflow State Machine

```
[1. Brand Created]
     │
     ├─→ Add Prompts (manual/AI)
     │   ├─→ Has 0 prompts: INCOMPLETE (cannot analyze)
     │   └─→ Has ≥1 prompt: CAN_ANALYZE
     │
     ├─→ Add Competitors (optional)
     │   └─→ Has ≥0 competitors: OK (not required but recommended)
     │
     ▼
[2. Ready for Analysis]
     │
     ├─→ Trigger Analysis
     │   ├─→ ANALYZING (in progress)
     │   ├─→ ANALYSIS_FAILED (error)
     │   └─→ ANALYSIS_COMPLETE (success)
     │
     ▼
[3. Has Scores]
     │
     ├─→ View Dashboard
     └─→ Can re-run analysis (creates new Score record)
```

**States** (application-level, not stored in DB):

1. **INCOMPLETE**: Brand exists but has no prompts (FR-023 violation)
   - Actions: Add prompts, delete brand
   - Cannot: Run analysis

2. **READY**: Brand has ≥1 prompt
   - Actions: Add more prompts, add competitors, run analysis
   - Can: Run analysis

3. **ANALYZING**: Analysis in progress
   - Actions: Wait, cancel (future feature)
   - Cannot: Modify brand/prompts/competitors during analysis

4. **ANALYZED**: Has at least one Score record
   - Actions: View dashboard, re-run analysis, add/edit prompts/competitors
   - Can: Everything

**State Determination** (computed from database):
```typescript
// lib/utils/brand-state.ts
export type BrandState = 'INCOMPLETE' | 'READY' | 'ANALYZING' | 'ANALYZED'

export function getBrandState(
  promptCount: number,
  scoreCount: number,
  hasActiveAnalysis: boolean
): BrandState {
  if (hasActiveAnalysis) return 'ANALYZING'
  if (scoreCount > 0) return 'ANALYZED'
  if (promptCount === 0) return 'INCOMPLETE'
  return 'READY'
}
```

---

## Validation Rules Summary

| Entity | Field | Rule | Error Message |
|--------|-------|------|---------------|
| Brand | brand_name | 1-255 chars, non-empty | "Brand name is required (1-255 characters)" |
| Brand | domain | Valid domain pattern | "Invalid domain format (e.g., example.com)" |
| Brand | domain | Unique | "A brand with this domain already exists" |
| Brand | region | 1-100 chars | "Region is required (1-100 characters)" |
| Prompt | prompt_text | 10-2000 chars | "Prompt must be 10-2000 characters" |
| Prompt | brand_id | Must exist | "Brand not found" |
| Competitor | competitor_name | 1-255 chars | "Competitor name is required" |
| Competitor | competitor_domain | Valid domain | "Invalid competitor domain format" |
| Competitor | (brand_id, domain) | Unique per brand | "This competitor already exists for this brand" |
| Score | relevance/clarity/etc | 0-100 integer | "Score must be between 0 and 100" |
| Score | reasoning_json | Valid JSON with required structure | "Invalid reasoning format" |

---

## Database Schema (SQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT domain_format CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$')
);

CREATE INDEX idx_brands_created_at ON brands(created_at DESC);

-- Prompts table
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT prompt_text_length CHECK (LENGTH(prompt_text) BETWEEN 10 AND 2000)
);

CREATE INDEX idx_prompts_brand_id ON prompts(brand_id, created_at DESC);

-- Competitors table
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_domain VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT competitor_domain_format CHECK (competitor_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$'),
    CONSTRAINT unique_competitor_per_brand UNIQUE (brand_id, competitor_domain)
);

CREATE INDEX idx_competitors_brand_id ON competitors(brand_id, created_at DESC);

-- Scores table
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    relevance INTEGER NOT NULL CHECK (relevance >= 0 AND relevance <= 100),
    clarity INTEGER NOT NULL CHECK (clarity >= 0 AND clarity <= 100),
    consistency INTEGER NOT NULL CHECK (consistency >= 0 AND consistency <= 100),
    creativity INTEGER NOT NULL CHECK (creativity >= 0 AND creativity <= 100),
    emotional_impact INTEGER NOT NULL CHECK (emotional_impact >= 0 AND emotional_impact <= 100),
    reasoning_json JSONB NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    analysis_duration_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_brand_id ON scores(brand_id, created_at DESC);

-- Update trigger for brands.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Query Examples

### Common Queries

```typescript
// 1. Get brand with all related data
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

// 2. Get latest score for a brand
const { data: latestScore } = await supabase
  .from('scores')
  .select('*')
  .eq('brand_id', brandId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// 3. Check if brand can be analyzed (has prompts)
const { count: promptCount } = await supabase
  .from('prompts')
  .select('*', { count: 'exact', head: true })
  .eq('brand_id', brandId)

const canAnalyze = promptCount > 0

// 4. Get all competitors for comparison
const { data: competitors } = await supabase
  .from('competitors')
  .select('*')
  .eq('brand_id', brandId)
  .order('created_at', { ascending: true })

// 5. Check for duplicate competitor
const { data: existing } = await supabase
  .from('competitors')
  .select('id')
  .eq('brand_id', brandId)
  .eq('competitor_domain', domain)
  .maybeSingle()

if (existing) {
  throw new Error('Competitor already exists')
}
```

---

## Performance Considerations

**Indexing Strategy**:
- Primary keys automatically indexed
- Foreign keys indexed for JOIN performance
- Composite index on `(brand_id, created_at DESC)` for chronological queries
- Unique indexes for constraint enforcement (domain uniqueness)

**Expected Data Volume** (MVP):
- Brands: ~1,000 records
- Prompts: ~5,000 records (avg 5 per brand)
- Competitors: ~3,000 records (avg 3 per brand)
- Scores: ~2,000 records (multiple analyses per brand)
- Total: <10MB database size

**Query Optimization**:
- Use `select('*')` sparingly - specify needed columns
- Use `.single()` for single-record queries (throws error if not found)
- Use `.maybeSingle()` when record might not exist
- Batch inserts for AI-generated prompts/competitors

---

## Data Migration Strategy

**Initial Setup** (Phase 2 implementation):
1. Run Supabase migration: `supabase/migrations/001_initial_schema.sql`
2. Verify constraints: Run test suite
3. Seed test data: `supabase/seed.sql`

**Future Migrations**:
- Version all schema changes in timestamped migration files
- Never modify existing migrations (create new ones)
- Test migrations on staging before production
- Maintain rollback scripts for each migration

---

## Summary

Data model complete with:
- ✅ 4 entities (Brand, Prompt, Competitor, Score)
- ✅ Foreign key relationships with CASCADE delete
- ✅ Validation constraints (domain format, score range, uniqueness)
- ✅ State machine for analysis workflow
- ✅ TypeScript interfaces for type safety
- ✅ SQL schema with indexes and triggers
- ✅ Query examples and performance considerations

**Next**: Generate API contracts based on functional requirements
