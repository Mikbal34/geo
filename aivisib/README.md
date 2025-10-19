# Brand Analyzer

A Next.js web application for AI-powered brand analysis and competitive intelligence.

## Features

- **Brand Setup**: Create brands with domain and region information
- **Prompt Management**: Add manual prompts or generate AI suggestions
- **Competitor Analysis**: Track competitors manually or via AI suggestions
- **AI Analysis**: Get brand scores across 6 dimensions using GPT-4
- **Visual Dashboard**: View results with radar and bar charts

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- OpenAI GPT-4 Turbo
- Recharts
- TailwindCSS 4

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. Set up Supabase database:
   ```bash
   # Run migrations in your Supabase SQL editor
   # Use files in supabase/migrations/
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/              # Next.js pages and API routes
components/       # React components
lib/              # Business logic and utilities
  supabase/       # Database client and queries
  llm/            # LLM client and prompts
  validation/     # Input validation
  utils/          # Utility functions
types/            # TypeScript type definitions
supabase/         # Database migrations and seeds
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Environment Variables

See `.env.example` for required variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `USE_MOCK_LLM` (optional) - Set to 'true' to use mock data instead of real API calls

## License

MIT
