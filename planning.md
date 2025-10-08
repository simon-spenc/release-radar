# Release Radar - Planning Document

## Overview
An automated documentation and release notes system that processes GitHub PRs and Linear tickets, generates summaries using LLM, manages approval workflows, and automatically updates documentation with weekly release notes.

---

## System Architecture

### Tech Stack
- **Backend**: Next.js 15 API routes with App Router
- **Frontend**: Next.js/React + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **LLM**: OpenAI GPT-4 or Anthropic Claude
- **Webhooks**: GitHub webhooks, Linear webhooks
- **Email**: SendGrid, Resend, or AWS SES
- **MCP Integration**: Model Context Protocol for enhanced tooling
- **Hosting**: Vercel (Next.js) or Railway/Render

---

## Database Schema (Supabase)

### PR Summaries Table
```sql
CREATE TABLE pr_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number INTEGER NOT NULL,
  pr_title TEXT NOT NULL,
  pr_url TEXT NOT NULL,
  repository TEXT NOT NULL,
  merged_at TIMESTAMP NOT NULL,
  author TEXT NOT NULL,
  code_changes JSONB, -- {files_changed, additions, deletions}
  llm_summary TEXT NOT NULL,
  original_description TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  edited_summary TEXT, -- business owner can edit
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Linear Tickets Table
```sql
CREATE TABLE linear_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT NOT NULL,
  ticket_title TEXT NOT NULL,
  ticket_url TEXT NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  llm_summary TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  edited_summary TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Release Entries Table
```sql
CREATE TABLE release_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_summary_id UUID REFERENCES pr_summaries(id),
  linear_ticket_id UUID REFERENCES linear_tickets(id),
  release_week DATE NOT NULL, -- week starting date
  doc_pages_updated JSONB, -- [{path, url, change_type}]
  doc_pr_url TEXT, -- PR URL for doc updates
  doc_pr_merged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Release Notes Table
```sql
CREATE TABLE release_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_starting DATE NOT NULL UNIQUE,
  entries JSONB, -- aggregated release entries
  email_copy TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Feature Breakdown

### Feature 1: GitHub PR Processing
**When a PR is merged:**
1. GitHub webhook → POST `/api/webhooks/github`
2. Verify webhook signature
3. Extract PR data (number, title, url, diff, files changed)
4. Call LLM to summarize changes
5. Store in `pr_summaries` table (status: pending)
6. Notify business owner (optional: Slack/email)

### Feature 2: Linear Ticket Processing
**When a ticket is completed:**
1. Linear webhook → POST `/api/webhooks/linear`
2. Verify webhook signature
3. Extract ticket data (id, title, description, url)
4. Call LLM to summarize ticket
5. Store in `linear_tickets` table (status: pending)
6. Notify business owner (optional)

### Feature 3: Approval Dashboard
**Business owner workflow:**
- View pending PR/ticket summaries in table format
- Click to expand full details
- Edit LLM-generated summary text
- Approve or reject each item
- Track approval history

**Pages/Components:**
1. **Pending Approvals** (`/dashboard/pending`)
   - Table view with filters (PRs, Linear tickets, date range)
   - Columns: Type, Title, Date, Summary Preview, Actions
   - Click to expand full details

2. **Approval Modal**
   - Original PR/ticket details
   - Code diff viewer (for PRs)
   - LLM-generated summary (editable)
   - Suggested doc pages to update
   - Approve/Reject buttons
   - Edit summary textarea

3. **Approved Changes** (`/dashboard/approved`)
   - View all approved entries
   - Filter by week for release planning
   - See associated doc PR status

4. **Release Notes Preview** (`/dashboard/releases`)
   - Weekly view
   - Preview email copy
   - Send/schedule release notes

### Feature 4: Automated Documentation Updates
**When PR/ticket is approved:**
1. GET approved summary from database
2. Clone docs repository (or use GitHub API)
3. Read existing Markdoc files mentioned in PR
4. Send to LLM: existing content + approved summary → generate doc updates
5. Create new branch: `docs-update-pr-{pr_number}`
6. Apply Markdoc file changes
7. Create PR to docs repo with:
   - Title: "docs: Update for PR #{pr_number} - {title}"
   - Body: Link to original PR + summary
8. Store doc PR URL in `release_entries` table
9. Await manual review/merge of doc PR

**GitHub Actions/Automation:**
- Set up webhook to detect when doc PR is merged
- Update `doc_pr_merged` flag in `release_entries`

### Feature 5: Weekly Release Notes Email
**Scheduled job (Every Monday/Friday):**
1. Query all approved `release_entries` for current week
2. Group by category (features, fixes, improvements)
3. Send to LLM with prompt for email copy
4. Generate email with:
   - Executive summary
   - Categorized updates with doc links
   - Direct links to updated doc pages
5. Store in `release_notes` table
6. Send to marketer via email/dashboard notification

**Email Template Structure:**
```markdown
# Weekly Updates - [Date Range]

## 🚀 New Features
- [Feature name]: [Summary] → [Doc link]

## 🐛 Bug Fixes
- [Fix description] → [Doc link]

## 📚 Documentation Updates
- [Page updated] - [What changed] → [Doc link]

---
View full release: [Release URL]
```

---

## LLM Integration Strategy

### Prompt 1: PR Summarization
```
Role: Technical documentation writer
Input: PR title, description, code diff, files changed
Output:
- User-facing feature description (2-3 sentences)
- Technical changes summary
- Suggested doc pages to update (based on files changed)
```

### Prompt 2: Linear Ticket Summarization
```
Role: Technical documentation writer
Input: Ticket title, description, completion notes
Output:
- User-facing feature/fix description
- Impact summary
- Suggested doc pages to update
```

### Prompt 3: Documentation Updates
```
Role: Technical documentation writer
Input: Approved PR/ticket summary, existing doc content (Markdoc files)
Output:
- Specific Markdoc file updates with exact diff
- Change rationale
- Updated sections
```

### Prompt 4: Release Notes Email
```
Role: Marketing copywriter
Input: All approved entries for the week with doc URLs
Output:
- Engaging email copy
- Categorized features/fixes/improvements
- Links to updated doc pages
```

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETED
- [x] Set up Next.js project with TypeScript
- [x] Configure Supabase and create database schema
- [x] Set up environment variables and configuration
- [x] Build GitHub webhook receiver (skeleton)
- [x] Build Linear webhook receiver (skeleton)
- [x] Integrate LLM (OpenAI/Anthropic) - clients configured
- [ ] Test webhook → LLM → database flow (pending LLM implementation)

### Phase 2: Core Features ✅ COMPLETED
- [x] Build approval dashboard UI (Next.js/React)
- [x] Create pending approvals page with table
- [x] Build approval modal with edit functionality
- [x] Create approved changes page
- [x] Add approve/reject API endpoints
- [x] Dashboard navigation and layout
- [ ] Implement PR/ticket summarization workflow (pending)
- [ ] Test full approval workflow (pending LLM)

### Phase 2.5: LLM Summarization (NEXT - DEFERRED)
**Steps to complete LLM integration:**
- [ ] Create LLM service wrapper (`src/lib/llm-service.ts`)
- [ ] Implement PR summarization function
  - [ ] Fetch PR diff from GitHub API
  - [ ] Parse code changes and extract context
  - [ ] Send to LLM with structured prompt
  - [ ] Store summary in database
- [ ] Implement Linear ticket summarization function
- [ ] Update webhook handlers to call LLM service
- [ ] Add error handling and retry logic
- [ ] Test with real PRs and tickets

### Phase 2.6: UI Enhancement with shadcn/ui ✅ COMPLETED
- [x] Install shadcn/ui and dependencies
- [x] Set up shadcn/ui configuration
- [x] Replace custom components with shadcn/ui:
  - [x] Button component
  - [x] Table component
  - [x] Dialog/Modal component
  - [x] Card component
  - [x] Badge component
  - [x] Tabs component
  - [x] Dropdown menu component
  - [x] Select component
  - [x] Textarea component
  - [x] Skeleton component
- [x] Enhance dashboard UX with improved styling
- [x] Add loading states and animations
- [x] Add toast notifications (Sonner)

### Phase 2.7: MCP Integration ✅ COMPLETED
- [x] Research and design MCP architecture for Release Radar
- [x] Define MCP tools/resources:
  - [x] PR summary retrieval
  - [x] Approval workflow actions
  - [x] Release notes generation (via prompts)
  - [x] Search functionality
- [x] Implement MCP server
- [x] Create MCP client integration (.mcp.json configuration)
- [x] Build MCP server (npm run build:mcp)

### Phase 3: Documentation Automation (FUTURE)
- [ ] Build doc update generation logic
- [ ] Implement GitHub API integration for creating branches
- [ ] Create Markdoc file modification system
- [ ] Build automated PR creation for docs
- [ ] Set up doc PR merge webhook handler
- [ ] Test end-to-end doc update flow

### Phase 4: Release Notes (FUTURE)
- [ ] Build weekly aggregation query logic
- [ ] Create email template system
- [ ] Implement scheduled jobs (Vercel cron or similar)
- [ ] Build release notes preview dashboard
- [ ] Integrate email sending service
- [ ] Test email generation and sending

### Phase 5: Polish & Production (FUTURE)
- [ ] Add comprehensive error handling
- [ ] Implement retry logic for failed operations
- [ ] Add notifications (Slack/email for approvers)
- [ ] Set up monitoring and analytics
- [ ] Security audit (webhook signatures, API keys, RLS)
- [ ] Performance optimization
- [ ] Write documentation
- [ ] Deploy to production

---

## Key Considerations

### Security
- Verify webhook signatures (GitHub HMAC, Linear)
- Use environment variables for all API keys
- Implement RBAC for approval dashboard
- Configure Supabase Row Level Security (RLS) policies
- Validate all user inputs
- Sanitize LLM outputs before storing

### Error Handling
- Retry failed LLM calls with exponential backoff
- Handle API rate limits gracefully
- Log all webhook events for debugging
- Alert on critical failures (webhook processing, doc PR creation)
- Store failed operations in dead letter queue

### Cost Optimization
- Cache LLM responses where appropriate
- Use smaller/cheaper models for simple summaries
- Batch operations where possible
- Monitor token usage and costs
- Implement request deduplication

### Performance
- Use database indexes on frequently queried fields
- Implement pagination for dashboard tables
- Lazy load code diffs and large content
- Use Vercel Edge Functions for webhooks
- Optimize LLM prompts for speed

### User Experience
- Real-time updates on approval dashboard
- Clear feedback on actions (loading states, success/error messages)
- Keyboard shortcuts for approval workflow
- Search and filter capabilities
- Mobile-responsive design

---

## API Endpoints

### Webhooks
- `POST /api/webhooks/github` - Receive GitHub PR merged events
- `POST /api/webhooks/linear` - Receive Linear ticket completed events
- `POST /api/webhooks/docs-pr` - Receive doc PR merged events

### Dashboard
- `GET /api/summaries/pending` - Get pending PR/ticket summaries
- `GET /api/summaries/approved` - Get approved summaries
- `PATCH /api/summaries/:id` - Update summary (edit text, approve/reject)
- `GET /api/releases/:week` - Get release notes for specific week
- `POST /api/releases/:week/send` - Send release notes email

### Documentation
- `POST /api/docs/update` - Trigger doc update for approved summary
- `GET /api/docs/pr-status/:id` - Check doc PR merge status

---

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
OPENAI_API_KEY=
# OR
ANTHROPIC_API_KEY=

# GitHub
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=
DOCS_REPO_OWNER=
DOCS_REPO_NAME=

# Linear
LINEAR_WEBHOOK_SECRET=
LINEAR_API_KEY=

# Email
SENDGRID_API_KEY=
# OR
RESEND_API_KEY=

# Notifications (Optional)
SLACK_WEBHOOK_URL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Success Metrics

- **Automation Rate**: % of doc updates requiring no manual editing
- **Approval Time**: Average time from PR merge to approval
- **Doc Update Speed**: Time from approval to doc PR created
- **Release Notes Quality**: Marketer satisfaction score
- **Error Rate**: Failed webhook/LLM/doc update operations
- **Cost per Update**: LLM token costs per processed PR/ticket

---

## MCP (Model Context Protocol) Integration Plan

### Overview
Integrate MCP to provide intelligent context and automation for the Release Radar system, enabling AI assistants to interact with the system programmatically.

### MCP Server Architecture

**Resources (Read-only context):**
- `pr-summaries://pending` - List pending PR summaries
- `pr-summaries://approved` - List approved PR summaries
- `linear-tickets://pending` - List pending Linear tickets
- `linear-tickets://approved` - List approved Linear tickets
- `release-notes://{week}` - Get release notes for specific week
- `config://docs-repo` - Get documentation repository configuration

**Tools (Actions):**
- `approve_summary` - Approve a PR/ticket summary (with optional edits)
- `reject_summary` - Reject a PR/ticket summary
- `generate_release_notes` - Generate release notes for a specific week
- `create_doc_pr` - Create documentation update PR
- `search_summaries` - Search through summaries by keyword/date
- `get_summary_details` - Get full details of a specific summary

**Prompts:**
- `review-pr` - Template for reviewing a PR summary
- `generate-docs` - Template for generating doc updates
- `create-release-notes` - Template for creating release notes

### Implementation Steps

1. **Install MCP SDK**
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. **Create MCP Server** (`src/mcp/server.ts`)
   - Define resources, tools, and prompts
   - Connect to Supabase for data access
   - Implement tool handlers

3. **Configure MCP Client**
   - Add MCP server configuration to Claude Desktop
   - Test MCP integration locally

4. **Document MCP Usage**
   - Create examples for common workflows
   - Add MCP commands to README

---

## shadcn/ui Integration Plan

### Components to Install

**Core Components:**
- `button` - Replace custom buttons
- `card` - For summary cards and containers
- `dialog` - For approval modal
- `table` - For summary tables
- `badge` - For status indicators
- `tabs` - For filtering views
- `dropdown-menu` - For actions menu
- `toast` - For notifications
- `skeleton` - For loading states
- `select` - For filters
- `textarea` - For editing summaries

**Advanced Components:**
- `data-table` - Enhanced table with sorting/filtering
- `command` - For search/command palette
- `calendar` - For date filtering
- `form` - For structured forms

### Implementation Steps

1. **Install shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```

2. **Install Components**
   ```bash
   npx shadcn-ui@latest add button card dialog table badge tabs dropdown-menu toast skeleton select textarea
   ```

3. **Refactor Components**
   - Replace `SummaryTable.tsx` with shadcn Table + data-table
   - Replace `ApprovalModal.tsx` with shadcn Dialog
   - Update dashboard layout with shadcn Card components
   - Add Toast notifications for actions
   - Add Skeleton loading states

4. **Theme Customization**
   - Configure dark mode
   - Customize color palette
   - Add custom animations

---

## Current Status

### ✅ Completed
- Next.js 15 setup with TypeScript
- Supabase database schema and integration
- GitHub and Linear webhook receivers (skeleton)
- Approval dashboard with pending/approved views
- Summary table and approval modal (shadcn/ui)
- API endpoints for CRUD operations
- shadcn/ui integration (Button, Table, Dialog, Card, Badge, Tabs, Skeleton, Textarea, Dropdown, Select)
- Toast notifications (Sonner)
- Loading states with Skeleton components
- MCP server implementation with tools, resources, and prompts

### 🚧 In Progress
- None

### 📋 Next Up
- Add LLM summarization (Phase 2.5 - deferred)
- Documentation automation (Phase 3)
- Weekly release notes (Phase 4)

---

## Future Enhancements

- [ ] Support for multiple repositories
- [ ] AI-powered categorization (feature/fix/improvement)
- [ ] Changelog generation from release notes
- [ ] Integration with other project management tools (Jira, Asana)
- [ ] Screenshot/video attachment support
- [ ] Multi-language documentation support
- [ ] Analytics dashboard for doc update patterns
- [ ] Custom LLM prompt templates per project
- [ ] Rollback capability for doc changes
- [ ] A/B testing for release note copy
- [ ] Real-time collaboration on approvals
- [ ] Mobile-responsive dashboard improvements
