# Supabase MCP Setup for Release Radar

## Overview

Connect Claude Desktop to your Supabase database using the **official Supabase MCP server** to query, debug, and manage your Release Radar data directly through conversation.

## Quick Setup

### Option 1: Using Claude CLI (Recommended)

```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
```

This will prompt you for:
- **SUPABASE_URL**: `https://mxiqtehonsyjrvbjpvwo.supabase.co`
- **SUPABASE_ANON_KEY**: Get from Supabase Settings → API

### Option 2: Manual Configuration

Add the following to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "transport": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_URL": "https://mxiqtehonsyjrvbjpvwo.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR_ANON_KEY_HERE"
      }
    }
  }
}
```

### Getting Your Supabase Keys

1. Go to your Supabase project: https://supabase.com/dashboard/project/mxiqtehonsyjrvbjpvwo
2. Click **Settings** → **API**
3. Copy the **Project URL** (already have this)
4. Copy the **anon/public** key under **Project API keys**

## Testing the Connection

After configuring Claude Desktop and restarting:

1. Open Claude Desktop
2. Try these commands:

```
List all tables in the database
```

```
Show me the schema for the pr_summaries table
```

```
Query all pending PR summaries
```

## Useful Queries for Release Radar

### View All Tables
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Count Records in Each Table
```sql
SELECT 'pr_summaries' as table_name, COUNT(*) as count FROM pr_summaries
UNION ALL
SELECT 'linear_tickets', COUNT(*) FROM linear_tickets
UNION ALL
SELECT 'release_entries', COUNT(*) FROM release_entries
UNION ALL
SELECT 'release_notes', COUNT(*) FROM release_notes;
```

### View Pending Items
```sql
-- Pending PR summaries
SELECT id, pr_number, pr_title, created_at, status
FROM pr_summaries
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Pending Linear tickets
SELECT id, ticket_id, ticket_title, created_at, status
FROM linear_tickets
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### View Recent Approvals
```sql
SELECT
  id,
  pr_title,
  approved_by,
  approved_at,
  status
FROM pr_summaries
WHERE status = 'approved'
ORDER BY approved_at DESC
LIMIT 10;
```

### View Release Entries with Details
```sql
SELECT
  re.id,
  re.release_week,
  re.doc_pr_url,
  re.doc_pr_merged,
  pr.pr_title,
  pr.pr_number
FROM release_entries re
LEFT JOIN pr_summaries pr ON re.pr_summary_id = pr.id
ORDER BY re.release_week DESC;
```

### Check Database Indexes
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Example Workflows

### 1. Debug Approval Flow

Ask Claude:
```
Show me all pending PR summaries and their current status
```

```
Check if there are any release entries for approved PRs
```

### 2. Verify Data Integrity

```
Show me any PR summaries that are approved but don't have release entries
```

```sql
-- Claude can run this for you
SELECT pr.id, pr.pr_title, pr.approved_at
FROM pr_summaries pr
LEFT JOIN release_entries re ON pr.id = re.pr_summary_id
WHERE pr.status = 'approved'
  AND re.id IS NULL;
```

### 3. Clean Up Test Data

```
Delete all PR summaries with 'test' in the title
```

```
Show me the count of records before and after cleanup
```

### 4. Analyze Release Weeks

```
Show me how many items are scheduled for each release week
```

```sql
SELECT
  release_week,
  COUNT(*) as total_items,
  COUNT(DISTINCT pr_summary_id) as pr_count,
  COUNT(DISTINCT linear_ticket_id) as ticket_count
FROM release_entries
GROUP BY release_week
ORDER BY release_week DESC;
```

## Troubleshooting

### Connection Issues

1. **Wrong port**: Make sure you're using port **6543** (pooler), not 5432
2. **Password incorrect**: Get a new password from Supabase Settings → Database → Reset database password
3. **SSL required**: Connection string should include `?sslmode=require` if needed

### Permission Issues

The MCP server connects as the `postgres` user, which has full access. Make sure your RLS policies allow the service role.

### MCP Not Showing Up

1. Verify the JSON is valid (use a JSON validator)
2. Restart Claude Desktop completely
3. Check for error messages in Claude Desktop logs

## Security Notes

⚠️ **Important Security Considerations:**

1. Your database password is stored in plain text in the Claude Desktop config
2. Only use this on your local development machine
3. Never commit the config file to git
4. Consider using a separate read-only database user for querying
5. The MCP server has full database access - be careful with destructive queries

## Alternative: Direct npx Usage

If you prefer not to modify Claude Desktop config, you can run queries directly:

```bash
npx -y @modelcontextprotocol/server-postgres "postgresql://postgres.mxiqtehonsyjrvbjpvwo:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

Then interact via stdin/stdout using the MCP protocol.

## Combined Configuration

You can run both the Release Radar MCP and Supabase MCP together:

```json
{
  "mcpServers": {
    "release-radar": {
      "command": "node",
      "args": [
        "/Users/simonspencer/Documents/Flipside/release-radar/src/mcp/dist/server.js"
      ],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://mxiqtehonsyjrvbjpvwo.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aXF0ZWhvbnN5anJ2YmpwdndvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg5MjMzMSwiZXhwIjoyMDc1NDY4MzMxfQ.phADd01rk7V-mm5DfN5rJK078iMUqqx_CZZDVSeYa38"
      }
    },
    "supabase": {
      "transport": "http",
      "url": "https://mcp.supabase.com/mcp",
      "env": {
        "SUPABASE_URL": "https://mxiqtehonsyjrvbjpvwo.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR_ANON_KEY_HERE"
      }
    }
  }
}
```

**Note**: A ready-to-use config file is available at `claude-mcp-config.json` in this project. Just add your `SUPABASE_ANON_KEY`.

This gives you:
- **release-radar** MCP: High-level tools for approval workflows (approve, reject, search)
- **supabase** MCP: Low-level Supabase queries, real-time, storage, and more

## Next Steps

1. Configure the connection string in Claude Desktop
2. Restart Claude Desktop
3. Try querying your database: "Show me all tables"
4. Insert test data using `TESTING.md` queries
5. Verify data with SQL queries through Claude
