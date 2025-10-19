# API Contracts

**Feature**: Brand Analysis & Scoring Platform
**Version**: 1.0.0
**Last Updated**: 2025-10-15

## Overview

This directory contains the API contracts for the brand analysis platform. Contracts define the interface between frontend and backend, ensuring type safety and consistency.

## Files

- **`api-contracts.yaml`**: OpenAPI 3.1 specification with all endpoints, schemas, and examples
- **`types.ts`**: TypeScript interfaces derived from OpenAPI spec
- **`README.md`**: This file

## API Endpoints

### Brands

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| `POST` | `/api/brands` | Create brand | FR-001, FR-002 |
| `GET` | `/api/brands/{brandId}` | Get brand details | - |

### Prompts

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| `POST` | `/api/prompts` | Add prompt manually | FR-007 |
| `POST` | `/api/prompts/suggest` | Generate AI prompts | FR-008 |
| `GET` | `/api/prompts/{brandId}` | List brand prompts | - |

### Competitors

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| `POST` | `/api/competitors` | Add competitor manually | FR-010 |
| `POST` | `/api/competitors/suggest` | Generate AI competitors | FR-009 |
| `GET` | `/api/competitors/{brandId}` | List brand competitors | - |

### Analysis

| Method | Path | Description | FR |
|--------|------|-------------|-----|
| `POST` | `/api/analysis` | Run brand analysis | FR-012-017 |
| `GET` | `/api/analysis/mock` | Get mock results (testing) | FR-019 |
| `GET` | `/api/analysis/{brandId}/latest` | Get latest analysis | - |

## Usage Examples

### Creating a Brand

```typescript
import { CreateBrandRequest, BrandResponse } from './contracts/types'

const request: CreateBrandRequest = {
  brand_name: 'EcoClean',
  domain: 'ecoclean.com',
  region: 'Global'
}

const response = await fetch('/api/brands', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})

const brand: BrandResponse = await response.json()
// { id: "550e8400-...", brand_name: "EcoClean", ... }
```

### Suggesting Prompts

```typescript
import { SuggestPromptsRequest, SuggestPromptsResponse } from './contracts/types'

const request: SuggestPromptsRequest = {
  brand_id: brand.id,
  count: 5
}

const response = await fetch('/api/prompts/suggest', {
  method: 'POST',
  body: JSON.stringify(request)
})

const { prompts }: SuggestPromptsResponse = await response.json()
// prompts: [{ id: "...", prompt_text: "...", is_ai_generated: true }, ...]
```

### Running Analysis

```typescript
import { RunAnalysisRequest, AnalysisResponse } from './contracts/types'

const request: RunAnalysisRequest = {
  brand_id: brand.id
}

const response = await fetch('/api/analysis', {
  method: 'POST',
  body: JSON.stringify(request)
})

const analysis: AnalysisResponse = await response.json()
// {
//   relevance: 82,
//   clarity: 76,
//   reasoning_json: { Relevance: { score: 82, reason: "..." }, ... }
// }
```

## Validation

All requests are validated against:

1. **Schema validation**: TypeScript types + runtime validation (Zod recommended)
2. **Business rules**: Enforced in API route handlers
3. **Database constraints**: Enforced by PostgreSQL

### Example Validation Flow

```typescript
import { z } from 'zod'
import { isValidDomain, isValidBrandName } from './contracts/types'

const CreateBrandSchema = z.object({
  brand_name: z.string().min(1).max(255).refine(isValidBrandName),
  domain: z.string().refine(isValidDomain, 'Invalid domain format'),
  region: z.string().min(1).max(100)
})

// In API route
export async function POST(request: Request) {
  const body = await request.json()

  // Validate
  const result = CreateBrandSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error },
      { status: 400 }
    )
  }

  // Process valid data
  const brand = await createBrand(result.data)
  return NextResponse.json(brand, { status: 201 })
}
```

## Error Handling

All endpoints return errors in consistent format:

```typescript
interface ErrorResponse {
  error: string          // Human-readable message
  code?: string          // Machine-readable code
  details?: object       // Additional context
}
```

### Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `VALIDATION_ERROR` | Invalid input | 400 |
| `DUPLICATE_DOMAIN` | Brand domain exists | 409 |
| `DUPLICATE_COMPETITOR` | Competitor exists | 409 |
| `MISSING_PROMPTS` | No prompts for analysis | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `LLM_ERROR` | LLM API failure | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `INTERNAL_ERROR` | Unexpected error | 500 |

### Example Error Response

```json
{
  "error": "Brand must have at least one prompt before analysis",
  "code": "MISSING_PROMPTS"
}
```

## Testing Contracts

### Unit Tests (validate schemas)

```typescript
import { describe, it, expect } from 'vitest'
import { isValidDomain, isValidScore } from './contracts/types'

describe('Contract Validation', () => {
  it('validates domain format', () => {
    expect(isValidDomain('example.com')).toBe(true)
    expect(isValidDomain('sub.example.co.uk')).toBe(true)
    expect(isValidDomain('-bad.com')).toBe(false)
    expect(isValidDomain('no-tld')).toBe(false)
  })

  it('validates score range', () => {
    expect(isValidScore(0)).toBe(true)
    expect(isValidScore(50)).toBe(true)
    expect(isValidScore(100)).toBe(true)
    expect(isValidScore(-1)).toBe(false)
    expect(isValidScore(101)).toBe(false)
  })
})
```

### Integration Tests (test API routes)

```typescript
import { describe, it, expect } from 'vitest'
import { CreateBrandRequest } from './contracts/types'

describe('POST /api/brands', () => {
  it('creates brand successfully', async () => {
    const request: CreateBrandRequest = {
      brand_name: 'TestBrand',
      domain: 'test.com',
      region: 'Global'
    }

    const response = await fetch('http://localhost:3000/api/brands', {
      method: 'POST',
      body: JSON.stringify(request)
    })

    expect(response.status).toBe(201)
    const brand = await response.json()
    expect(brand.id).toBeDefined()
    expect(brand.brand_name).toBe('TestBrand')
  })

  it('rejects invalid domain', async () => {
    const request = {
      brand_name: 'Bad',
      domain: '-invalid',
      region: 'Global'
    }

    const response = await fetch('http://localhost:3000/api/brands', {
      method: 'POST',
      body: JSON.stringify(request)
    })

    expect(response.status).toBe(400)
    const error = await response.json()
    expect(error.code).toBe('VALIDATION_ERROR')
  })
})
```

### E2E Tests (test full flows)

```typescript
import { test, expect } from '@playwright/test'

test('complete brand analysis flow', async ({ page }) => {
  // Create brand
  await page.goto('/brands/new')
  await page.fill('[name="brand_name"]', 'EcoClean')
  await page.fill('[name="domain"]', 'ecoclean.com')
  await page.fill('[name="region"]', 'Global')
  await page.click('button[type="submit"]')

  // Should redirect to prompts page
  await expect(page).toHaveURL(/\/brands\/.*\/prompts/)

  // Add prompt
  await page.fill('[name="prompt_text"]', 'What makes our brand unique?')
  await page.click('button:has-text("Add Prompt")')
  await expect(page.locator('text=What makes our brand unique?')).toBeVisible()

  // Add competitor
  await page.goto(page.url().replace('/prompts', '/competitors'))
  await page.fill('[name="competitor_name"]', 'GreenWash')
  await page.fill('[name="competitor_domain"]', 'greenwash.com')
  await page.fill('[name="region"]', 'Global')
  await page.click('button:has-text("Add Competitor")')

  // Run analysis
  await page.goto(page.url().replace('/competitors', '/analysis'))
  await page.click('button:has-text("Run Analysis")')

  // Wait for results (max 30s)
  await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 30000 })

  // View dashboard
  await page.goto(page.url().replace('/analysis', '/dashboard'))
  await expect(page.locator('text=Relevance')).toBeVisible()
  await expect(page.locator('text=Clarity')).toBeVisible()
})
```

## Contract Maintenance

### When to Update Contracts

1. **Adding new endpoint**: Update both YAML and types.ts
2. **Changing request/response shape**: Update schemas, regenerate types
3. **Adding validation rule**: Update TypeScript validators
4. **New error code**: Add to ApiErrorCode enum

### Update Process

1. Modify `api-contracts.yaml`
2. Regenerate `types.ts` (or update manually)
3. Update this README if needed
4. Run tests to verify no breaking changes
5. Update implementation to match new contract

### Breaking Changes

Avoid breaking changes in production. If necessary:

1. Version the API (`/api/v2/...`)
2. Deprecate old endpoints (don't remove immediately)
3. Communicate changes to consumers
4. Provide migration guide

## Tools

### OpenAPI Validation

```bash
# Validate YAML syntax
npx @redocly/cli lint api-contracts.yaml

# Generate HTML documentation
npx @redocly/cli build-docs api-contracts.yaml -o api-docs.html
```

### Type Generation (optional)

```bash
# Auto-generate types from OpenAPI (alternative to manual types.ts)
npx openapi-typescript api-contracts.yaml -o generated-types.ts
```

## Resources

- [OpenAPI 3.1 Spec](https://swagger.io/specification/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Validation](https://zod.dev/)
