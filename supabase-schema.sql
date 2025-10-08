-- Release Radar Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PR Summaries Table
CREATE TABLE pr_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number INTEGER NOT NULL,
  pr_title TEXT NOT NULL,
  pr_url TEXT NOT NULL,
  repository TEXT NOT NULL,
  merged_at TIMESTAMP NOT NULL,
  author TEXT NOT NULL,
  code_changes JSONB, -- {files_changed, additions, deletions, files, category}
  llm_summary TEXT NOT NULL,
  original_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  edited_summary TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  doc_pr_url TEXT,
  doc_pr_merged BOOLEAN DEFAULT FALSE,
  doc_pages_updated JSONB, -- [{path, url, change_type}]
  created_at TIMESTAMP DEFAULT NOW()
);

-- Linear Tickets Table
CREATE TABLE linear_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT NOT NULL,
  ticket_title TEXT NOT NULL,
  ticket_url TEXT NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  llm_summary TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  edited_summary TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  doc_pr_url TEXT,
  doc_pr_merged BOOLEAN DEFAULT FALSE,
  doc_pages_updated JSONB, -- [{path, url, change_type}]
  created_at TIMESTAMP DEFAULT NOW()
);

-- Release Entries Table (DEPRECATED - doc info now stored directly on pr_summaries/linear_tickets)
-- Kept for reference, can be dropped after migration
-- CREATE TABLE release_entries (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   pr_summary_id UUID REFERENCES pr_summaries(id),
--   linear_ticket_id UUID REFERENCES linear_tickets(id),
--   release_week DATE NOT NULL,
--   doc_pages_updated JSONB, -- [{path, url, change_type}]
--   doc_pr_url TEXT,
--   doc_pr_merged BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- Release Notes Table
CREATE TABLE release_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_starting DATE NOT NULL UNIQUE,
  entries JSONB, -- aggregated release entries
  email_copy TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_pr_summaries_status ON pr_summaries(status);
CREATE INDEX idx_pr_summaries_created_at ON pr_summaries(created_at DESC);
CREATE INDEX idx_pr_summaries_doc_pr_url ON pr_summaries(doc_pr_url) WHERE doc_pr_url IS NOT NULL;
CREATE INDEX idx_linear_tickets_status ON linear_tickets(status);
CREATE INDEX idx_linear_tickets_created_at ON linear_tickets(created_at DESC);
CREATE INDEX idx_linear_tickets_doc_pr_url ON linear_tickets(doc_pr_url) WHERE doc_pr_url IS NOT NULL;
CREATE INDEX idx_release_notes_week ON release_notes(week_starting);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE pr_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE linear_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth strategy)
-- For now, allow service role to do everything
CREATE POLICY "Service role full access on pr_summaries"
  ON pr_summaries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on linear_tickets"
  ON linear_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on release_entries"
  ON release_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on release_notes"
  ON release_notes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- If you want to add authenticated user policies later, uncomment and modify:
-- CREATE POLICY "Authenticated users can read pr_summaries"
--   ON pr_summaries
--   FOR SELECT
--   TO authenticated
--   USING (true);
