# Quickstart Guide: Brand Analysis Platform

**Feature**: Brand Analysis & Scoring Platform
**Branch**: `001-goal-build-a`
**Last Updated**: 2025-10-15

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** ([download](https://nodejs.org/))
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```

- **npm or pnpm** (package manager)
  ```bash
  npm --version   # or: pnpm --version
  ```

- **Git** ([download](https://git-scm.com/))
  ```bash
  git --version
  ```

- **Supabase account** ([sign up free](https://supabase.com/))
- **OpenAI API key** ([get API key](https://platform.openai.com/api-keys))

---

## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd aivisib

# Checkout feature branch
git checkout 001-goal-build-a

# Install dependencies
npm install
```

### 2. Project Structure Overview

```
aivisib/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Home page
│   ├── brands/            # Brand management pages
│   └── api/               # API route handlers
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── supabase/         # Database client
│   ├── llm/              # LLM integration
│   └── validation/       # Input validation
├── types/                # TypeScript types
├── tests/                # Test suite
├── supabase/             # Database migrations
└── specs/                # Feature specifications
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env.local
```

### 2. Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Navigate to **Settings** → **API**
4. Copy your project credentials:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

### 3. Configure OpenAI

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env.local`:

```env
# .env.local
OPENAI_API_KEY=sk-...your-api-key
```

### 4. Complete Configuration

Your `.env.local` should look like:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Optional: for migrations

# OpenAI
OPENAI_API_KEY=sk-...

# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never commit `.env.local`** - it's already in `.gitignore`

---

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended for first time)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Verify tables created: `brands`, `prompts`, `competitors`, `scores`

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push

# Verify
supabase db diff
```

### Verify Database Setup

```bash
# Test connection in your app
npm run dev
# Visit http://localhost:3000/api/health (if health check endpoint exists)
```

Or test directly:

```typescript
// Quick test in browser console or Node REPL
import { supabase } from './lib/supabase/client'

const { data, error } = await supabase.from('brands').select('count')
console.log('Tables exist:', !error)
```

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Access the app at: **http://localhost:3000**

### 2. Development Mode Features

- **Hot Reload**: Changes update instantly
- **Error Overlay**: Detailed error messages in browser
- **Console Logging**: Server logs in terminal

### 3. File Watching

Next.js automatically watches:
- `app/` - Pages and API routes
- `components/` - React components
- `lib/` - Utilities (may require restart for some changes)

### 4. Mock LLM Mode (Development)

To avoid LLM API costs during development:

```typescript
// lib/llm/client.ts
const USE_MOCK = process.env.NODE_ENV === 'development'

export async function analyzeБренд(brand: Brand) {
  if (USE_MOCK) {
    return getMockAnalysis() // Static response
  }
  return callOpenAI(brand) // Real API
}
```

Or use the mock endpoint:
```bash
curl http://localhost:3000/api/analysis/mock
```

---

## Testing

### Run All Tests

```bash
# Unit + Integration tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Run all
npm run test:all
```

### Test in Watch Mode

```bash
npm run test:watch
```

### Test Specific File

```bash
npm run test -- validation.test.ts
```

### View Test Coverage

```bash
npm run test:coverage
```

### E2E Test in UI Mode

```bash
npx playwright test --ui
```

---

## Common Tasks

### Create a Brand (Manual Test)

```bash
# Using curl
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "EcoClean",
    "domain": "ecoclean.com",
    "region": "Global"
  }'
```

### Generate AI Prompts

```bash
curl -X POST http://localhost:3000/api/prompts/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "550e8400-e29b-41d4-a716-446655440000",
    "count": 5
  }'
```

### Run Analysis

```bash
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### View Database

```bash
# Using Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/_/editor

# Or use SQL:
supabase db remote sql "SELECT * FROM brands LIMIT 10;"
```

### Generate TypeScript Types from Database

```bash
# Auto-generate types matching your Supabase schema
npx supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Database Connection Failed

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl https://your-project-id.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"
```

### OpenAI API Errors

```bash
# Check API key is set
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Common errors:
# - "Incorrect API key" → Check key in .env.local
# - "Rate limit exceeded" → Wait or upgrade plan
# - "Insufficient quota" → Add credits to OpenAI account
```

### Type Errors

```bash
# Rebuild Next.js types
rm -rf .next
npm run dev

# Check TypeScript
npx tsc --noEmit
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
```

### Database Migration Issues

```bash
# Reset database (⚠️ DESTROYS ALL DATA)
supabase db reset

# Re-run migrations
supabase db push

# Check migration status
supabase migration list
```

---

## Development Tips

### 1. Use TypeScript Strictly

```typescript
// Enable strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Validate Early

```typescript
// Validate at API boundary, not in components
export async function POST(request: Request) {
  const body = await request.json()
  const validated = CreateBrandSchema.parse(body) // Throws if invalid
  // ... rest of logic
}
```

### 3. Use Server Components

```typescript
// app/brands/[brandId]/page.tsx
// This is a Server Component by default - can fetch data directly
export default async function BrandPage({ params }: { params: { brandId: string } }) {
  const brand = await supabase
    .from('brands')
    .select('*')
    .eq('id', params.brandId)
    .single()

  return <BrandDetail brand={brand} />
}
```

### 4. Optimize LLM Calls

```typescript
// Cache AI suggestions
import { unstable_cache } from 'next/cache'

const getSuggestedPrompts = unstable_cache(
  async (brandId: string) => generatePrompts(brandId),
  ['prompts', brandId],
  { revalidate: 3600 } // Cache for 1 hour
)
```

### 5. Handle Errors Gracefully

```typescript
// app/brands/[brandId]/error.tsx
'use client'

export default function Error({ error, reset }: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## Next Steps

After completing this quickstart:

1. ✅ Read [data-model.md](./data-model.md) for database schema details
2. ✅ Review [contracts/README.md](./contracts/README.md) for API documentation
3. ✅ Check [research.md](./research.md) for technology decisions
4. ✅ Run `/speckit.tasks` to generate implementation tasks
5. ✅ Start implementing following [tasks.md](./tasks.md)

---

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Support

- **Issues**: File in project GitHub issues
- **Questions**: Ask in project discussions or team chat
- **Spec Questions**: Refer to [spec.md](./spec.md)

---

**Happy coding! 🚀**
