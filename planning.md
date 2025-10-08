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
- [x] Build GitHub webhook receiver
- [x] Build Linear webhook receiver
- [x] Integrate LLM (Anthropic Claude)
- [x] Test webhook → LLM → database flow

### Phase 2: Core Features ✅ COMPLETED
- [x] Build approval dashboard UI (Next.js/React)
- [x] Create pending approvals page with table
- [x] Build approval modal with edit functionality
- [x] Create approved changes page
- [x] Add approve/reject API endpoints
- [x] Dashboard navigation and layout
- [x] Implement PR/ticket summarization workflow
- [x] Test full approval workflow

### Phase 2.5: LLM Summarization ✅ COMPLETED
- [x] Create LLM service wrapper (`src/lib/llm-service.ts`)
- [x] Implement PR summarization function
  - [x] Fetch PR diff from GitHub API
  - [x] Parse code changes and extract context
  - [x] Send to LLM with structured prompt (Claude Sonnet 4.5)
  - [x] Store summary in database
- [x] Implement Linear ticket summarization function
- [x] Update webhook handlers to call LLM service
- [x] Add error handling and retry logic with exponential backoff
- [x] Test with real PRs and tickets
- [x] Upgrade to latest Claude Sonnet 4.5 model

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

### Phase 3: Documentation Automation ✅ COMPLETED
- [x] Build doc update generation logic
- [x] Implement GitHub API integration for creating branches
- [x] Create Markdoc file modification system
- [x] Build automated PR creation for docs
- [ ] Set up doc PR merge webhook handler - FUTURE
- [x] Test end-to-end doc update flow

### Phase 4: Release Notes (FUTURE)
- [ ] Build weekly aggregation query logic
- [ ] Create email template system
- [ ] Implement scheduled jobs (Vercel cron or similar)
- [ ] Build release notes preview dashboard
- [ ] Integrate email sending service
- [ ] Test email generation and sending

### Phase 5: Polish & Production ✅ COMPLETED
- [x] Add comprehensive error handling
- [x] Implement retry logic for failed operations
- [x] Security audit (webhook signatures, API keys, environment variables)
- [x] Write documentation (README, DEPLOYMENT.md, STATUS.md)
- [x] Deploy to production (Vercel)
- [x] Set up GitHub webhook in production
- [x] Test production deployment with real PRs
- [ ] Add notifications (Slack/email for approvers) - FUTURE
- [ ] Set up monitoring and analytics - FUTURE
- [ ] Performance optimization - FUTURE

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

### ✅ Completed (Phases 1, 2, 2.5, 2.6, 2.7, 3, 5)
- **Foundation & Infrastructure**
  - Next.js 15 setup with TypeScript and App Router
  - Supabase database schema and integration
  - Environment configuration and secrets management
  - Deployed to Vercel at https://release-radar.vercel.app

- **Webhook Integration**
  - GitHub webhook receiver with signature verification
  - Linear webhook receiver with signature verification
  - Production webhook configured and tested
  - Real-time PR processing

- **LLM Integration**
  - Anthropic Claude Sonnet 4.5 integration
  - PR summarization with diff analysis
  - Linear ticket summarization
  - Documentation update generation with Claude Sonnet 4.5
  - Retry logic with exponential backoff
  - Error handling and fallback mechanisms

- **Dashboard & UI**
  - Approval dashboard with pending/approved views
  - Summary table and approval modal (shadcn/ui)
  - "Update Docs" button on approved items
  - API endpoints for CRUD operations
  - shadcn/ui component library integration
  - Toast notifications (Sonner)
  - Loading states with Skeleton components

- **Documentation Automation**
  - Automated doc update generation with LLM
  - GitHub branch creation in docs repository
  - Markdoc file modification and updates
  - Automated PR creation for documentation
  - Release entry tracking in database
  - Doc PR status display in dashboard

- **Developer Tools**
  - MCP server implementation with tools, resources, and prompts
  - Test scripts for webhook testing
  - Comprehensive documentation (README, DEPLOYMENT.md, STATUS.md, PHASE3-IMPLEMENTATION.md)

### 🚧 In Progress
- None

### 📋 Next Up (Phase 4)
- Weekly release notes generation (Phase 4)
  - Email templates
  - Scheduled jobs
  - Release notes dashboard
- Future enhancements
  - Doc PR merge webhook handler
  - Notifications (Slack/email for approvers)
  - Monitoring and analytics

---

## Future Enhancements

### Phase 6: UX & Visual Improvements
- [ ] **Update Docs Button State Management**
  - Grey out or mark "Update Docs" button as complete after doc PR is created
  - Add visual indicator (checkmark, badge) showing doc update status
  - Show doc PR link prominently with status badge
  - Add "Completed" page/tab for items with merged doc PRs

- [ ] **Complete UI Refactor with shadcn/ui**
  - Replace all remaining custom components with shadcn/ui
  - Implement custom layouts with proper spacing and hierarchy
  - Add data-table component for advanced filtering/sorting
  - Implement command palette (⌘K) for quick navigation
  - Add calendar component for date filtering
  - Responsive mobile design improvements
  - Dark mode enhancements
  - Loading skeletons for all async operations

### Phase 7: Authentication & Authorization
- [ ] **Google OAuth via Supabase Auth**
  - Implement Supabase Auth with Google provider
  - Create user profiles table
  - Add role-based access control (RBAC)
    - Admin: Full access
    - Approver: Can approve/reject summaries
    - Viewer: Read-only access
  - Protect dashboard routes with auth middleware
  - Add user menu with profile/logout
  - Track who approved/rejected items (already have approved_by field)

### Phase 8: Documentation Content Management
- [ ] **CMS Integration for Marketing**
  - Evaluate Tina CMS vs Decap CMS for docs editing
  - Tina CMS (recommended):
    - Real-time visual editing
    - Git-backed content
    - Custom fields for Markdoc frontmatter
    - Preview mode
  - Decap CMS (alternative):
    - Open source
    - Editorial workflow
    - Media library
  - Integrate chosen CMS with release-radar-docs repo
  - Configure custom fields for doc metadata
  - Set up preview templates

- [ ] **Doc Content Preview & Editing**
  - Preview markdown content before submitting to docs repo
  - Side-by-side markdown editor with live preview
  - Styled preview using docs site CSS
  - Edit generated content in-app before creating PR
  - Diff view showing before/after changes
  - Approve/reject individual doc file changes
  - Markdown toolbar for formatting assistance

- [ ] **Enhanced Doc PR Links**
  - Return direct links to changed content on docs site
  - Show preview URLs for doc PR branches (Vercel/Netlify preview)
  - Link to specific sections/headings that were modified
  - Highlight changed sections in preview

### Phase 9: Historical Data & Search
- [ ] **GitHub PR & Linear Ticket Sync**
  - Pull all historical PRs via GitHub API
    - Paginate through repository PRs
    - Store in database with metadata
    - Sync on schedule (daily/weekly)
  - Pull all historical Linear tickets via Linear API
    - Query completed tickets
    - Store in database
    - Sync on schedule
  - Add background job for syncing
  - Handle rate limits and pagination

- [ ] **Search & Filter Interface**
  - Advanced search across all PRs and tickets
  - Filters: date range, author, repository, status, category
  - Full-text search in titles and descriptions
  - Elasticsearch/Algolia integration for fast search
  - Save search queries
  - Export search results to CSV

### Phase 10: Additional Features
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
