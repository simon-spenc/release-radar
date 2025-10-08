#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly in MCP server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const server = new Server(
  {
    name: 'release-radar-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Resources - Read-only context
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'pr-summaries://pending',
        name: 'Pending PR Summaries',
        description: 'List of pending PR summaries awaiting approval',
        mimeType: 'application/json',
      },
      {
        uri: 'pr-summaries://approved',
        name: 'Approved PR Summaries',
        description: 'List of approved PR summaries',
        mimeType: 'application/json',
      },
      {
        uri: 'linear-tickets://pending',
        name: 'Pending Linear Tickets',
        description: 'List of pending Linear tickets awaiting approval',
        mimeType: 'application/json',
      },
      {
        uri: 'linear-tickets://approved',
        name: 'Approved Linear Tickets',
        description: 'List of approved Linear tickets',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'pr-summaries://pending') {
    const { data, error } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch pending PRs: ${error.message}`);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (uri === 'pr-summaries://approved') {
    const { data, error } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch approved PRs: ${error.message}`);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (uri === 'linear-tickets://pending') {
    const { data, error } = await supabaseAdmin
      .from('linear_tickets')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch pending tickets: ${error.message}`);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (uri === 'linear-tickets://approved') {
    const { data, error } = await supabaseAdmin
      .from('linear_tickets')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch approved tickets: ${error.message}`);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Tools - Actions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'approve_summary',
        description: 'Approve a PR or ticket summary, optionally with edited text',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'UUID of the PR summary or Linear ticket',
            },
            type: {
              type: 'string',
              enum: ['pr', 'ticket'],
              description: 'Type of summary (pr or ticket)',
            },
            edited_summary: {
              type: 'string',
              description: 'Optional edited summary text',
            },
            approved_by: {
              type: 'string',
              description: 'Name of the person approving',
              default: 'MCP User',
            },
          },
          required: ['id', 'type'],
        },
      },
      {
        name: 'reject_summary',
        description: 'Reject a PR or ticket summary',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'UUID of the PR summary or Linear ticket',
            },
            type: {
              type: 'string',
              enum: ['pr', 'ticket'],
              description: 'Type of summary (pr or ticket)',
            },
            approved_by: {
              type: 'string',
              description: 'Name of the person rejecting',
              default: 'MCP User',
            },
          },
          required: ['id', 'type'],
        },
      },
      {
        name: 'get_summary_details',
        description: 'Get full details of a specific PR or ticket summary',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'UUID of the PR summary or Linear ticket',
            },
            type: {
              type: 'string',
              enum: ['pr', 'ticket'],
              description: 'Type of summary (pr or ticket)',
            },
          },
          required: ['id', 'type'],
        },
      },
      {
        name: 'search_summaries',
        description: 'Search through PR summaries and Linear tickets',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            type: {
              type: 'string',
              enum: ['pr', 'ticket', 'all'],
              description: 'Filter by type',
              default: 'all',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'all'],
              description: 'Filter by status',
              default: 'all',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'approve_summary') {
    const { id, type, edited_summary, approved_by = 'MCP User' } = args as any;
    const table = type === 'pr' ? 'pr_summaries' : 'linear_tickets';

    const updateData: any = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by,
    };

    if (edited_summary) {
      updateData.edited_summary = edited_summary;
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve: ${error.message}`);

    // Create release entry
    const releaseWeek = getWeekStartDate(new Date());
    const entryData: any = {
      release_week: releaseWeek,
    };

    if (type === 'pr') {
      entryData.pr_summary_id = id;
    } else {
      entryData.linear_ticket_id = id;
    }

    await supabaseAdmin.from('release_entries').insert(entryData);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully approved ${type} summary ${id}. Release entry created for week of ${releaseWeek}.`,
        },
      ],
    };
  }

  if (name === 'reject_summary') {
    const { id, type, approved_by = 'MCP User' } = args as any;
    const table = type === 'pr' ? 'pr_summaries' : 'linear_tickets';

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        status: 'rejected',
        approved_by,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to reject: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully rejected ${type} summary ${id}.`,
        },
      ],
    };
  }

  if (name === 'get_summary_details') {
    const { id, type } = args as any;
    const table = type === 'pr' ? 'pr_summaries' : 'linear_tickets';

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to get summary: ${error.message}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (name === 'search_summaries') {
    const { query, type = 'all', status = 'all' } = args as any;
    let results: any[] = [];

    // Search PR summaries
    if (type === 'all' || type === 'pr') {
      let prQuery = supabaseAdmin
        .from('pr_summaries')
        .select('*')
        .or(`pr_title.ilike.%${query}%,llm_summary.ilike.%${query}%`);

      if (status !== 'all') {
        prQuery = prQuery.eq('status', status);
      }

      const { data } = await prQuery;
      if (data) {
        results = [...results, ...data.map((item) => ({ ...item, _type: 'pr' }))];
      }
    }

    // Search Linear tickets
    if (type === 'all' || type === 'ticket') {
      let ticketQuery = supabaseAdmin
        .from('linear_tickets')
        .select('*')
        .or(`ticket_title.ilike.%${query}%,llm_summary.ilike.%${query}%`);

      if (status !== 'all') {
        ticketQuery = ticketQuery.eq('status', status);
      }

      const { data } = await ticketQuery;
      if (data) {
        results = [...results, ...data.map((item) => ({ ...item, _type: 'ticket' }))];
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'review-pr',
        description: 'Template for reviewing a PR summary',
        arguments: [
          {
            name: 'pr_id',
            description: 'UUID of the PR summary',
            required: true,
          },
        ],
      },
      {
        name: 'review-pending',
        description: 'Review all pending summaries',
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'review-pr') {
    const pr_id = args?.pr_id as string;

    const { data, error } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('id', pr_id)
      .single();

    if (error) throw new Error(`Failed to fetch PR: ${error.message}`);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review this PR summary and suggest improvements:

**PR #${data.pr_number}: ${data.pr_title}**
Author: ${data.author}
Merged: ${new Date(data.merged_at).toLocaleDateString()}

**Current Summary:**
${data.llm_summary}

**Original Description:**
${data.original_description || 'N/A'}

Please provide:
1. Is the summary accurate and user-friendly?
2. Any suggested edits to make it clearer
3. Should this PR be approved for release notes?`,
          },
        },
      ],
    };
  }

  if (name === 'review-pending') {
    const { data: prs } = await supabaseAdmin
      .from('pr_summaries')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    const { data: tickets } = await supabaseAdmin
      .from('linear_tickets')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    const totalPending = (prs?.length || 0) + (tickets?.length || 0);

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `There are ${totalPending} pending items to review.

Use the resources and tools to:
1. Review each pending PR and ticket
2. Approve or reject based on quality
3. Edit summaries if needed to be more user-friendly

Start by reading the pr-summaries://pending and linear-tickets://pending resources.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// Helper function
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Release Radar MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
