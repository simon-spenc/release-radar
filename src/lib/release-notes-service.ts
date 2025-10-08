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
 * Fetch all release entries for a specific week
 */
export async function fetchReleaseEntriesForWeek(weekStart: string): Promise<ReleaseEntry[]> {
  const { data, error } = await supabaseAdmin
    .from('release_entries')
    .select(`
      *,
      pr_summary:pr_summaries(
        pr_title,
        pr_url,
        llm_summary,
        edited_summary,
        code_changes
      ),
      linear_ticket:linear_tickets(
        ticket_title,
        ticket_url,
        llm_summary,
        edited_summary
      )
    `)
    .eq('release_week', weekStart)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching release entries:', error);
    throw new Error(`Failed to fetch release entries: ${error.message}`);
  }

  return (data || []) as ReleaseEntry[];
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
    // Determine category from PR or default to 'other'
    let category: keyof CategorizedReleases = 'other';

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
