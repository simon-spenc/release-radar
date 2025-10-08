# Release Radar

An automated documentation and release notes system that processes GitHub PRs and Linear tickets, generates summaries using LLM, manages approval workflows, and automatically updates documentation with weekly release notes.

## Project Structure

```
release-radar/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   │   ├── webhooks/ # GitHub & Linear webhook handlers
│   │   │   ├── summaries/# Summary management endpoints
│   │   │   ├── releases/ # Release notes endpoints
│   │   │   └── docs/     # Documentation update endpoints
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   ├── lib/             # Utility libraries
│   │   ├── supabase.ts  # Supabase client
│   │   ├── openai.ts    # OpenAI client
│   │   ├── anthropic.ts # Anthropic client
│   │   └── github.ts    # GitHub/Octokit client
│   └── types/           # TypeScript types
│       ├── database.ts  # Supabase database types
│       └── index.ts     # Application types
├── planning.md          # Detailed project planning
├── supabase-schema.sql  # Database schema
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- GitHub account (with repo access)
- Linear account (optional)
- OpenAI or Anthropic API key

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the contents of `supabase-schema.sql`
   - Get your project URL and service role key from Settings > API

3. **Configure environment variables:**

   Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - LLM API key
- `GITHUB_TOKEN` - GitHub personal access token
- `DOCS_REPO_OWNER` - GitHub org/user for docs repo
- `DOCS_REPO_NAME` - Name of docs repository

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Setting Up Webhooks

#### GitHub Webhook

1. Go to your repository Settings > Webhooks > Add webhook
2. Set Payload URL to: `https://your-domain.com/api/webhooks/github`
3. Set Content type to `application/json`
4. Set Secret to match your `GITHUB_WEBHOOK_SECRET`
5. Select "Let me select individual events" and check:
   - Pull requests
6. Save the webhook

#### Linear Webhook

1. Go to Linear Settings > API > Webhooks
2. Create a new webhook
3. Set URL to: `https://your-domain.com/api/webhooks/linear`
4. Set Secret to match your `LINEAR_WEBHOOK_SECRET`
5. Select events: Issue updated/completed
6. Save the webhook

## Development Roadmap

See `planning.md` for detailed implementation phases and features.

### Current Status: Phase 1 - Foundation ✅

- [x] Next.js project setup with TypeScript
- [x] Supabase configuration
- [x] Database schema
- [x] Basic API routes structure
- [x] TypeScript types and interfaces
- [ ] Complete webhook processing logic
- [ ] LLM integration for summarization

### Next Steps: Phase 2 - Core Features

- [ ] Build approval dashboard UI
- [ ] Implement PR/ticket summarization
- [ ] Create approval workflow
- [ ] Test webhook → LLM → database flow

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **LLM**: OpenAI GPT-4 / Anthropic Claude
- **Git**: GitHub API (Octokit)

## License

ISC
