# Quick Start: MCP Setup for Release Radar

## TL;DR Setup

### 1. Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/mxiqtehonsyjrvbjpvwo/settings/api
2. Copy the **anon/public** key

### 2. Add MCP Server Using Claude CLI

```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp"
```

When prompted:
- **SUPABASE_URL**: `https://mxiqtehonsyjrvbjpvwo.supabase.co`
- **SUPABASE_ANON_KEY**: [paste the key you copied]

### 3. Build and Add Release Radar MCP

The MCP server is already built! ✅

**Copy the config:**
```bash
# Copy the ready-to-use config to Claude Desktop location
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Or manually add** to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
"release-radar": {
  "command": "node",
  "args": [
    "/Users/simonspencer/Documents/Flipside/release-radar/dist-mcp/mcp/server.js"
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://mxiqtehonsyjrvbjpvwo.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aXF0ZWhvbnN5anJ2YmpwdndvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg5MjMzMSwiZXhwIjoyMDc1NDY4MzMxfQ.phADd01rk7V-mm5DfN5rJK078iMUqqx_CZZDVSeYa38"
  }
}
```

**Note**: Remember to update the Supabase anon key in the config!

### 4. Restart Claude Desktop

Quit and reopen Claude Desktop completely.

---

## Testing Your Setup

Once Claude Desktop restarts, try these commands:

### Test Supabase MCP

```
List all tables in my Release Radar database
```

```
Show me the schema for the pr_summaries table
```

```
Query all records from pr_summaries table
```

### Test Release Radar MCP

```
Show me all pending PR summaries
```

```
Search for summaries containing "auth"
```

```
Use the review-pending prompt
```

---

## What Can You Do?

### With Supabase MCP:
- Run SQL queries on your database
- View table schemas
- Insert test data
- Debug data issues
- Check RLS policies

### With Release Radar MCP:
- Approve/reject PR summaries
- Search through summaries
- Get summary details
- Bulk review workflows

---

## Common Tasks

### 1. Insert Test Data

```
Insert a test PR summary with title "Add authentication" and status "pending"
```

### 2. Approve a Summary

```
Show me pending PR summaries, then approve the first one
```

### 3. Debug Issues

```
Show me any approved PRs that don't have release entries
```

### 4. Clean Up

```
Delete all test data from pr_summaries table
```

---

## Troubleshooting

**MCP servers not showing up?**
1. Check the config file JSON is valid
2. Restart Claude Desktop completely
3. Check paths are absolute (not relative)

**Supabase connection failed?**
- Verify your anon key is correct
- Check the URL is exactly: `https://mxiqtehonsyjrvbjpvwo.supabase.co`

**Release Radar MCP not working?**
- Make sure you ran `npm run build:mcp`
- Check the path in config points to the built file
- Verify environment variables are set

---

## Files Reference

- `SUPABASE_MCP_SETUP.md` - Detailed Supabase MCP guide
- `MCP_SETUP.md` - Release Radar MCP guide
- `claude-mcp-config.json` - Ready-to-use config template
- `TESTING.md` - SQL queries for test data

---

## Next Steps

1. ✅ Set up both MCP servers
2. Insert test data using Supabase MCP
3. Test approval workflow with Release Radar MCP
4. Try the example workflows in the docs
