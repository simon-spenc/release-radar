export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pr_summaries: {
        Row: {
          id: string;
          pr_number: number;
          pr_title: string;
          pr_url: string;
          repository: string;
          merged_at: string;
          author: string;
          code_changes: Json | null;
          llm_summary: string;
          original_description: string | null;
          status: 'pending' | 'approved' | 'rejected';
          edited_summary: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pr_number: number;
          pr_title: string;
          pr_url: string;
          repository: string;
          merged_at: string;
          author: string;
          code_changes?: Json | null;
          llm_summary: string;
          original_description?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          edited_summary?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pr_number?: number;
          pr_title?: string;
          pr_url?: string;
          repository?: string;
          merged_at?: string;
          author?: string;
          code_changes?: Json | null;
          llm_summary?: string;
          original_description?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          edited_summary?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      linear_tickets: {
        Row: {
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
        };
        Insert: {
          id?: string;
          ticket_id: string;
          ticket_title: string;
          ticket_url: string;
          completed_at: string;
          llm_summary: string;
          status?: 'pending' | 'approved' | 'rejected';
          edited_summary?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          ticket_title?: string;
          ticket_url?: string;
          completed_at?: string;
          llm_summary?: string;
          status?: 'pending' | 'approved' | 'rejected';
          edited_summary?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
      };
      release_entries: {
        Row: {
          id: string;
          pr_summary_id: string | null;
          linear_ticket_id: string | null;
          release_week: string;
          doc_pages_updated: Json | null;
          doc_pr_url: string | null;
          doc_pr_merged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pr_summary_id?: string | null;
          linear_ticket_id?: string | null;
          release_week: string;
          doc_pages_updated?: Json | null;
          doc_pr_url?: string | null;
          doc_pr_merged?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          pr_summary_id?: string | null;
          linear_ticket_id?: string | null;
          release_week?: string;
          doc_pages_updated?: Json | null;
          doc_pr_url?: string | null;
          doc_pr_merged?: boolean;
          created_at?: string;
        };
      };
      release_notes: {
        Row: {
          id: string;
          week_starting: string;
          entries: Json | null;
          email_copy: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_starting: string;
          entries?: Json | null;
          email_copy?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_starting?: string;
          entries?: Json | null;
          email_copy?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
