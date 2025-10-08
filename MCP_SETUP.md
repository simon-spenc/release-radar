# MCP Server Setup Guide

## Overview

The Release Radar MCP (Model Context Protocol) server enables AI assistants like Claude to interact with the Release Radar system programmatically. This allows you to approve/reject summaries, search through data, and manage release notes directly through conversation.

## Installation

The MCP server is already installed as part of the project dependencies.

## Configuration

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "release-radar": {
      "command": "node",
      "args": [
        "/absolute/path/to/release-radar/src/mcp/server.js"
      ],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-supabase-key"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/release-radar` with the actual absolute path to your project directory.

### Build the MCP Server

Since the MCP server is written in TypeScript, you need to build it first:

```bash
# Build the TypeScript files
npx tsc src/mcp/server.ts --outDir src/mcp/dist --module nodenext --target es2022 --moduleResolution nodenext
```

Or add a build script to your main `package.json`:

```json
{
  "scripts": {
    "build:mcp": "tsc src/mcp/server.ts --outDir src/mcp/dist --module nodenext --target es2022 --moduleResolution nodenext"
  }
}
```

## Available Resources

Resources provide read-only context to Claude:

- `pr-summaries://pending` - List all pending PR summaries
- `pr-summaries://approved` - List all approved PR summaries
- `linear-tickets://pending` - List all pending Linear tickets
- `linear-tickets://approved` - List all approved Linear tickets

**Example usage in Claude:**
```
Show me all pending PR summaries
```

## Available Tools

Tools allow Claude to perform actions:

### 1. `approve_summary`
Approve a PR or ticket summary with optional edits.

**Parameters:**
- `id` (required): UUID of the summary
- `type` (required): "pr" or "ticket"
- `edited_summary` (optional): Modified summary text
- `approved_by` (optional): Your name (defaults to "MCP User")

**Example:**
```
Approve PR summary abc-123 with the edited text "Added new authentication system with JWT tokens."
```

### 2. `reject_summary`
Reject a PR or ticket summary.

**Parameters:**
- `id` (required): UUID of the summary
- `type` (required): "pr" or "ticket"
- `approved_by` (optional): Your name

**Example:**
```
Reject ticket summary xyz-456
```

### 3. `get_summary_details`
Get full details of a specific summary.

**Parameters:**
- `id` (required): UUID of the summary
- `type` (required): "pr" or "ticket"

**Example:**
```
Show me the details of PR summary abc-123
```

### 4. `search_summaries`
Search through all summaries by keyword.

**Parameters:**
- `query` (required): Search term
- `type` (optional): "pr", "ticket", or "all" (default: "all")
- `status` (optional): "pending", "approved", "rejected", or "all" (default: "all")

**Example:**
```
Search for summaries containing "authentication"
```

## Available Prompts

Prompts provide templates for common workflows:

### 1. `review-pr`
Get a structured review template for a specific PR.

**Parameters:**
- `pr_id` (required): UUID of the PR summary

**Example:**
```
Use the review-pr prompt for PR abc-123
```

### 2. `review-pending`
Review all pending summaries in bulk.

**Example:**
```
Use the review-pending prompt
```

## Example Workflows

### Approve Multiple PRs

```
1. Show me all pending PR summaries
2. Approve PR summary abc-123
3. Approve PR summary def-456 with edited text "Fixed critical bug in payment processing"
```

### Search and Review

```
1. Search for summaries containing "authentication"
2. Show me the details of the first result
3. Approve it if it looks good
```

### Bulk Review

```
1. Use the review-pending prompt
2. Review each item and approve or reject based on quality
```

## Troubleshooting

### MCP Server Not Connecting

1. Check that the path in `claude_desktop_config.json` is absolute and correct
2. Verify environment variables are set correctly
3. Ensure the TypeScript files are compiled
4. Restart Claude Desktop

### Permission Errors

Make sure the server file is executable:
```bash
chmod +x src/mcp/dist/server.js
```

### Supabase Connection Issues

1. Verify your Supabase credentials in the environment variables
2. Check that your Supabase project is running
3. Ensure RLS policies allow service role access

## Development

To test the MCP server locally:

```bash
# Run the server directly
node src/mcp/dist/server.js

# It will wait for MCP protocol messages on stdin
```

## Security Notes

- The MCP server uses the Supabase service role key, which has full access to your database
- Only share your Claude Desktop configuration with trusted team members
- Keep your `.env` file and Supabase credentials secure
- The MCP server runs locally on your machine and doesn't expose any network ports
