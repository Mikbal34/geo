# Development Guide

## Architecture

### Data Flow

1. **Brand Setup Flow**:
   - User creates brand → API validates → Save to database
   - User adds prompts (manual or AI-generated)
   - User adds competitors (manual or AI-suggested)

2. **Analysis Flow**:
   - Trigger analysis → Fetch brand, prompts, competitors
   - Call OpenAI API with structured prompt
   - Parse response and validate scores
   - Save scores to database
   - Display on dashboard

3. **Dashboard Flow**:
   - Fetch latest scores for brand
   - Render charts and cards
   - Calculate averages and insights

### Database Schema

- `brands`: Core brand information
- `prompts`: User-provided or AI-generated prompts
- `competitors`: Competitor information
- `scores`: Analysis results (6 dimensions per analysis)

### API Routes

- `/api/brands` - Create/get brands
- `/api/prompts/*` - Manage prompts
- `/api/competitors/*` - Manage competitors
- `/api/analyze` - Trigger AI analysis
- `/api/scores/[brandId]` - Get scores

### Components

- **Brand Components**: Form for brand creation
- **Prompt Components**: List, form, AI suggestion button
- **Competitor Components**: List, form, AI suggestion button
- **Dashboard Components**: Score cards, radar chart, bar chart

## Testing

### Unit Tests (Vitest)

Run unit tests:
```bash
npm test
```

Test files location: `__tests__/`

### E2E Tests (Playwright)

Run E2E tests:
```bash
npm run test:e2e
```

Test files location: `e2e/`

## Development Tips

### Mock LLM for Development

Set `USE_MOCK_LLM=true` in `.env.local` to use mock data instead of real API calls:

```bash
USE_MOCK_LLM=true
```

### Database Migrations

Migrations are in `supabase/migrations/`. Run them in order through Supabase SQL editor.

### Type Safety

- All types are defined in `types/`
- Use Zod schemas for runtime validation
- Leverage TypeScript strict mode

### Error Handling

- All API routes use `formatErrorResponse` utility
- Custom `AppError` class for structured errors
- Client components handle errors with try-catch

## Code Style

- Use TypeScript strict mode
- Prefer functional components
- Use Server Components by default
- Add 'use client' only when needed
- Follow Next.js App Router patterns
