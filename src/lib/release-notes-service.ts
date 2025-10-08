import { supabaseAdmin } from './supabase';

export interface ReleaseEntry {
  id: string;
  pr_summary_id: string | null;
  linear_ticket_id: string | null;
  release_week: string;
  doc_pages_updated: Array<{
    path: string;
    url: string;
    change_type: string;
  }>;
  doc_pr_url: string | null;
  doc_pr_merged: boolean;
  pr_summary?: {
    pr_title: string;
    pr_url: string;
    llm_summary: string;
    edited_summary: string | null;
    code_changes: {
      category?: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
    };
  };
  linear_ticket?: {
    ticket_title: string;
    ticket_url: string;
    llm_summary: string;
    edited_summary: string | null;
    category?: 'feature' | 'fix' | 'improvement' | 'docs' | 'other';
  };
}

export interface CategorizedReleases {
  features: ReleaseEntry[];
  fixes: ReleaseEntry[];
  improvements: ReleaseEntry[];
  docs: ReleaseEntry[];
  other: ReleaseEntry[];
}

/**
 * Get the start and end dates for a given week
 */
export function getWeekRange(weekStart: string): { start: string; end: string } {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Add 6 days for end of week

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Get the Monday of the current week
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Fetch all approved PRs and Linear tickets for a specific week
 */
export async function fetchReleaseEntriesForWeek(weekStart: string): Promise<ReleaseEntry[]> {
  const { start, end } = getWeekRange(weekStart);
  const entries: ReleaseEntry[] = [];

  // Fetch approved PR summaries
  const { data: prSummaries, error: prError } = await supabaseAdmin
    .from('pr_summaries')
    .select('*')
    .eq('status', 'approved')
    .gte('approved_at', start)
    .lte('approved_at', end)
    .order('approved_at', { ascending: false });

  if (prError) {
    console.error('Error fetching PR summaries:', prError);
    throw new Error(`Failed to fetch PR summaries: ${prError.message}`);
  }

  // Convert PR summaries to release entries format
  if (prSummaries) {
    entries.push(...prSummaries.map(pr => ({
      id: pr.id,
      pr_summary_id: pr.id,
      linear_ticket_id: null,
      release_week: weekStart,
      doc_pages_updated: [],
      doc_pr_url: null,
      doc_pr_merged: false,
      pr_summary: {
        pr_title: pr.pr_title,
        pr_url: pr.pr_url,
        llm_summary: pr.llm_summary,
        edited_summary: pr.edited_summary,
        code_changes: pr.code_changes,
      },
    })));
  }

  // Fetch approved Linear tickets
  const { data: linearTickets, error: linearError } = await supabaseAdmin
    .from('linear_tickets')
    .select('*')
    .eq('status', 'approved')
    .gte('approved_at', start)
    .lte('approved_at', end)
    .order('approved_at', { ascending: false });

  if (linearError) {
    console.error('Error fetching Linear tickets:', linearError);
    throw new Error(`Failed to fetch Linear tickets: ${linearError.message}`);
  }

  // Convert Linear tickets to release entries format
  if (linearTickets) {
    entries.push(...linearTickets.map(ticket => ({
      id: ticket.id,
      pr_summary_id: null,
      linear_ticket_id: ticket.id,
      release_week: weekStart,
      doc_pages_updated: [],
      doc_pr_url: null,
      doc_pr_merged: false,
      linear_ticket: {
        ticket_title: ticket.ticket_title,
        ticket_url: ticket.ticket_url,
        llm_summary: ticket.llm_summary,
        edited_summary: ticket.edited_summary,
        category: ticket.category,
      },
    })));
  }

  return entries;
}

/**
 * Categorize release entries by type
 */
export function categorizeReleases(entries: ReleaseEntry[]): CategorizedReleases {
  const categorized: CategorizedReleases = {
    features: [],
    fixes: [],
    improvements: [],
    docs: [],
    other: [],
  };

  entries.forEach((entry) => {
    // Determine category from PR or Linear ticket, or default to 'other'
    let category: keyof CategorizedReleases = 'other';

    // Check PR category first
    if (entry.pr_summary?.code_changes?.category) {
      const prCategory = entry.pr_summary.code_changes.category;
      // Map singular to plural
      const categoryMap: Record<string, keyof CategorizedReleases> = {
        feature: 'features',
        fix: 'fixes',
        improvement: 'improvements',
        docs: 'docs',
        other: 'other',
      };
      category = categoryMap[prCategory] || 'other';
    }
    // Check Linear ticket category
    else if (entry.linear_ticket?.category) {
      const ticketCategory = entry.linear_ticket.category;
      // Map singular to plural
      const categoryMap: Record<string, keyof CategorizedReleases> = {
        feature: 'features',
        fix: 'fixes',
        improvement: 'improvements',
        docs: 'docs',
        other: 'other',
      };
      category = categoryMap[ticketCategory] || 'other';
    }

    // Ensure category is valid
    if (category in categorized) {
      categorized[category].push(entry);
    } else {
      categorized.other.push(entry);
    }
  });

  return categorized;
}

/**
 * Get summary text from entry (prioritize edited over LLM-generated)
 */
export function getEntrySummary(entry: ReleaseEntry): string {
  if (entry.pr_summary) {
    return entry.pr_summary.edited_summary || entry.pr_summary.llm_summary;
  }
  if (entry.linear_ticket) {
    return entry.linear_ticket.edited_summary || entry.linear_ticket.llm_summary;
  }
  return 'No summary available';
}

/**
 * Get title from entry
 */
export function getEntryTitle(entry: ReleaseEntry): string {
  if (entry.pr_summary) {
    return entry.pr_summary.pr_title;
  }
  if (entry.linear_ticket) {
    return entry.linear_ticket.ticket_title;
  }
  return 'Untitled';
}

/**
 * Get source URL from entry
 */
export function getEntrySourceUrl(entry: ReleaseEntry): string {
  if (entry.pr_summary) {
    return entry.pr_summary.pr_url;
  }
  if (entry.linear_ticket) {
    return entry.linear_ticket.ticket_url;
  }
  return '#';
}

/**
 * Format date range for display
 */
export function formatWeekRange(weekStart: string): string {
  const { start, end } = getWeekRange(weekStart);
  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}
