# Testing Guide

## Testing the Approval Dashboard

Since we don't have real webhooks set up yet, you can test the dashboard by manually inserting test data into your Supabase database.

### Add Test PR Summary

Go to your Supabase SQL Editor and run:

```sql
INSERT INTO pr_summaries (
  pr_number,
  pr_title,
  pr_url,
  repository,
  merged_at,
  author,
  code_changes,
  llm_summary,
  original_description,
  status
) VALUES (
  123,
  'Add new feature: User authentication',
  'https://github.com/yourorg/yourrepo/pull/123',
  'yourorg/yourrepo',
  NOW(),
  'johndoe',
  '{"files_changed": 5, "additions": 120, "deletions": 30, "files": ["src/auth/login.ts", "src/auth/register.ts", "src/middleware/auth.ts"]}'::jsonb,
  'Implemented a new authentication system with JWT tokens. Users can now register, login, and maintain sessions securely. Added middleware to protect routes and validate tokens.',
  'This PR adds user authentication using JWT tokens.

## Changes
- Added login/register endpoints
- Created auth middleware
- Updated user model
- Added token validation',
  'pending'
);
```

### Add Test Linear Ticket

```sql
INSERT INTO linear_tickets (
  ticket_id,
  ticket_title,
  ticket_url,
  completed_at,
  llm_summary,
  status
) VALUES (
  'ENG-456',
  'Fix: Database connection pool exhaustion',
  'https://linear.app/yourorg/issue/ENG-456',
  NOW(),
  'Fixed an issue where the database connection pool would become exhausted under high load. Implemented connection pooling limits and automatic cleanup of idle connections.',
  'pending'
);
```

### View the Dashboard

1. Navigate to http://localhost:3000/dashboard/pending
2. You should see the test PR and Linear ticket in the pending approvals list
3. Click "Review" on any item to open the approval modal
4. Edit the summary if needed
5. Click "Approve & Create Release Entry" or "Reject"

### Test Approved Items

After approving items, navigate to:
- http://localhost:3000/dashboard/approved

You should see your approved items with their release week information.

## Testing Webhooks Locally

### Using ngrok for GitHub/Linear Webhooks

1. Install ngrok: https://ngrok.com/download

2. Start ngrok:
```bash
ngrok http 3000
```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Set up webhooks:
   - **GitHub**: Repository Settings → Webhooks → Add webhook
     - URL: `https://abc123.ngrok.io/api/webhooks/github`
     - Content type: `application/json`
     - Events: Pull requests

   - **Linear**: Settings → API → Webhooks → Create webhook
     - URL: `https://abc123.ngrok.io/api/webhooks/linear`
     - Events: Issue updated/completed

5. Merge a PR or complete a Linear ticket and watch the webhook fire!

## Manual API Testing

### Test GitHub Webhook

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{
    "action": "closed",
    "number": 789,
    "pull_request": {
      "number": 789,
      "title": "Test PR",
      "html_url": "https://github.com/test/test/pull/789",
      "merged_at": "2025-10-08T00:00:00Z",
      "user": {
        "login": "testuser"
      },
      "body": "This is a test PR",
      "additions": 10,
      "deletions": 5,
      "changed_files": 2
    },
    "repository": {
      "full_name": "test/test"
    }
  }'
```

### Test Approve Endpoint

```bash
curl -X PATCH http://localhost:3000/api/summaries/YOUR_PR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pr",
    "status": "approved",
    "edited_summary": "Updated summary text",
    "approved_by": "Test User"
  }'
```

Replace `YOUR_PR_ID` with an actual UUID from your database.
