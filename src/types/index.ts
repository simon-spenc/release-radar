export interface PRSummary {
  id: string;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  repository: string;
  merged_at: string;
  author: string;
  code_changes: CodeChanges | null;
  llm_summary: string;
  original_description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  edited_summary: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface CodeChanges {
  files_changed: number;
  additions: number;
  deletions: number;
  files?: string[];
}

export interface LinearTicket {
  id: string;
  ticket_id: string;
  ticket_title: string;
  ticket_url: string;
  completed_at: string;
  llm_summary: string;
  status: 'pending' | 'approved' | 'rejected';
  edited_summary: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ReleaseEntry {
  id: string;
  pr_summary_id: string | null;
  linear_ticket_id: string | null;
  release_week: string;
  doc_pages_updated: DocPageUpdate[] | null;
  doc_pr_url: string | null;
  doc_pr_merged: boolean;
  created_at: string;
}

export interface DocPageUpdate {
  path: string;
  url: string;
  change_type: 'added' | 'updated' | 'removed';
}

export interface ReleaseNotes {
  id: string;
  week_starting: string;
  entries: ReleaseNotesEntry[] | null;
  email_copy: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ReleaseNotesEntry {
  type: 'pr' | 'ticket';
  id: string;
  title: string;
  summary: string;
  url: string;
  doc_links: string[];
  category: 'feature' | 'fix' | 'improvement' | 'docs';
}

// GitHub Webhook Types
export interface GitHubPRWebhook {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    merged_at: string | null;
    user: {
      login: string;
    };
    body: string | null;
    additions: number;
    deletions: number;
    changed_files: number;
  };
  repository: {
    full_name: string;
  };
}

// Linear Webhook Types
export interface LinearWebhook {
  action: string;
  data: {
    id: string;
    title: string;
    identifier: string;
    url: string;
    completedAt: string | null;
    description: string | null;
  };
  type: string;
}
