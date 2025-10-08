-- Migration: Add doc fields to pr_summaries and linear_tickets
-- Run this in your Supabase SQL editor

-- Add doc fields to pr_summaries table
ALTER TABLE pr_summaries
ADD COLUMN IF NOT EXISTS doc_pr_url TEXT,
ADD COLUMN IF NOT EXISTS doc_pr_merged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS doc_pages_updated JSONB;

-- Add doc fields to linear_tickets table
ALTER TABLE linear_tickets
ADD COLUMN IF NOT EXISTS doc_pr_url TEXT,
ADD COLUMN IF NOT EXISTS doc_pr_merged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS doc_pages_updated JSONB;

-- Add indexes for doc PR URL lookups
CREATE INDEX IF NOT EXISTS idx_pr_summaries_doc_pr_url ON pr_summaries(doc_pr_url) WHERE doc_pr_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_linear_tickets_doc_pr_url ON linear_tickets(doc_pr_url) WHERE doc_pr_url IS NOT NULL;

-- Note: The release_entries table can be dropped after verifying this migration works:
-- DROP TABLE IF EXISTS release_entries;
