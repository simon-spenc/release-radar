# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Release Radar is an automated documentation and release notes system that:
- Processes GitHub PRs and Linear tickets via webhooks
- Generates user-friendly summaries using Claude Sonnet 4.5
- Provides an approval dashboard for business owners to review/edit summaries
- Automatically tracks approved changes for weekly release notes

**Current Status**: Phases 1, 2, 2.5, 2.6, 2.7, and 5 are complete. Live at https://release-radar.vercel.app

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Build MCP server
npm run build:mcp

# Run MCP server (after build)
node dist-mcp/mcp/server.js
```

## Tech Stack & Architecture

**Framework**: Next.js 15 with App Router (TypeScript)
- Uses React Server Components and API routes
- Path aliases: `@/*` maps to `./src/*`

**Database**: Supabase (PostgreSQL)
- Schema defined in `supabase-schema.sql`
- Four main tables: `pr_summaries`, `linear_tickets`, `release_entries`, `release_notes`
- Admin client initialized in `src/lib/supabase.ts`

**LLM Integration**: Anthropic Claude
- **IMPORTANT**: PR summarization uses `claude-sonnet-4-5-20250929` (latest Sonnet 4.5)
- Linear ticket summarization still uses `claude-3-5-sonnet-20241022`
- Service wrapper in `src/lib/llm-service.ts`
- Retry logic with exponential backoff in `src/lib/retry.ts`

**Webhook Processing Flow**:
1. Webhook received at `/api/webhooks/github` or `/api/webhooks/linear`
2. Signature verification using HMAC-SHA256
3. For merged PRs: Fetch diff via GitHub API (`src/lib/github-service.ts`)
4. Send to Claude for summarization (`src/lib/llm-service.ts`)
5. Store in Supabase with status `pending`
6. Business owner reviews in dashboard at `/dashboard`

**MCP Server**: Model Context Protocol integration
- Server code in `src/mcp/server.ts`
- Provides resources (pending/approved PRs/tickets), tools (approve/reject/search), and prompts
- Build with `npm run build:mcp` before running
- Uses separate Supabase client instance

## Key Code Patterns

### Webhook Signature Verification
All webhooks verify HMAC signatures using `crypto.timingSafeEqual()` to prevent timing attacks. If webhook secret is missing, verification is skipped in development (but logs warning).

### LLM Service Pattern
- Lazy client initialization to ensure env vars are loaded
- All LLM calls wrapped in `retryWithBackoff()` with 3 retries, exponential backoff
- JSON response extraction using regex: `/\{[\s\S]*\}/`
- Fallback responses if LLM fails after retries

### Database Access
- Always use `supabaseAdmin` from `src/lib/supabase.ts` for server-side operations
- MCP server creates its own client instance (doesn't import from lib)
- Admin client bypasses RLS policies

### Error Handling
- Webhook handlers catch all errors and return 500 with logged error
- LLM service provides fallback summaries on failure
- Retry logic implemented for transient failures

## Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `GITHUB_TOKEN` - GitHub personal access token (for API calls)
- `GITHUB_WEBHOOK_SECRET` - Secret for GitHub webhook verification
- `DOCS_REPO_OWNER` - GitHub org/user for docs repo (future use)
- `DOCS_REPO_NAME` - Docs repository name (future use)
- `LINEAR_WEBHOOK_SECRET` - Linear webhook secret (if using Linear)
- `LINEAR_API_KEY` - Linear API key (if using Linear)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/        # GitHub & Linear webhook handlers
│   │   │   ├── github/route.ts
│   │   │   └── linear/route.ts
│   │   ├── summaries/       # CRUD endpoints for summaries
│   │   │   ├── pending/route.ts
│   │   │   ├── approved/route.ts
│   │   │   └── [id]/route.ts
│   │   └── health/route.ts
│   ├── dashboard/           # Dashboard pages (approval UI)
│   ├── layout.tsx
│   └── page.tsx
├── components/              # React components (shadcn/ui based)
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase admin client
│   ├── anthropic.ts        # Anthropic client (basic)
│   ├── github.ts           # Octokit client
│   ├── github-service.ts   # GitHub API helpers (fetch PR diff)
│   ├── llm-service.ts      # LLM summarization functions
│   ├── retry.ts            # Retry logic with backoff
│   └── utils.ts            # General utilities
├── types/
│   ├── database.ts         # Supabase database types
│   ├── database.generated.ts
│   └── index.ts            # Application types (GitHubPRWebhook, etc.)
└── mcp/
    └── server.ts           # MCP server (Model Context Protocol)
```

## Important Notes

### When Modifying LLM Integration
- Always use `retryWithBackoff()` wrapper for LLM calls
- Ensure fallback responses are provided
- PR summarization prompt expects JSON with `summary`, `suggestedDocPages`, `category`
- Keep diff size to 3000 chars to avoid token limits

### When Adding API Routes
- Verify webhook signatures for external webhooks
- Use `NextRequest` and `NextResponse` from `next/server`
- Log errors before returning 500 responses
- Use Supabase admin client for database operations

### When Working with Webhooks
- Test locally using scripts: `test-webhook.sh` and `test-webhook-pr2.sh`
- GitHub webhook events: Only process `action === 'closed' && merged_at` for PRs
- Linear webhook events: Process ticket completed events

### Future Work (Not Yet Implemented)
- Phase 3: Automated documentation updates (Markdoc file modification, creating doc PRs)
- Phase 4: Weekly release notes email generation and sending
- Notifications (Slack/email for approvers)
- Monitoring and analytics

See `planning.md` for detailed roadmap and phase breakdowns.
