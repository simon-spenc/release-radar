import { NextRequest, NextResponse } from 'next/server';
import {
  fetchReleaseEntriesForWeek,
  categorizeReleases,
  getEntrySummary,
  getEntryTitle,
  formatWeekRange,
  getCurrentWeekStart,
} from '@/lib/release-notes-service';
import { generateReleaseNotes } from '@/lib/llm-service';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart } = body;

    // Use provided week or default to current week
    const targetWeek = weekStart || getCurrentWeekStart();

    // Fetch all release entries for the week
    const entries = await fetchReleaseEntriesForWeek(targetWeek);

    console.log('[Release Notes] Target week:', targetWeek);
    console.log('[Release Notes] Found entries:', entries.length);
    console.log('[Release Notes] Entries:', JSON.stringify(entries, null, 2));

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No release entries found for this week' },
        { status: 404 }
      );
    }

    // Categorize releases
    const categorized = categorizeReleases(entries);
    console.log('[Release Notes] Categorized:', {
      features: categorized.features.length,
      fixes: categorized.fixes.length,
      improvements: categorized.improvements.length,
      docs: categorized.docs.length,
      other: categorized.other.length,
    });

    // Prepare data for LLM
    const weekRange = formatWeekRange(targetWeek);
    const [weekStartDate, weekEndDate] = weekRange.split(' - ');

    const llmRequest = {
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      features: categorized.features.map(entry => ({
        title: getEntryTitle(entry),
        summary: getEntrySummary(entry),
        docLinks: entry.doc_pages_updated?.map(p => p.url) || [],
      })),
      fixes: categorized.fixes.map(entry => ({
        title: getEntryTitle(entry),
        summary: getEntrySummary(entry),
        docLinks: entry.doc_pages_updated?.map(p => p.url) || [],
      })),
      improvements: categorized.improvements.map(entry => ({
        title: getEntryTitle(entry),
        summary: getEntrySummary(entry),
        docLinks: entry.doc_pages_updated?.map(p => p.url) || [],
      })),
      docs: categorized.docs.map(entry => ({
        title: getEntryTitle(entry),
        summary: getEntrySummary(entry),
        docLinks: entry.doc_pages_updated?.map(p => p.url) || [],
      })),
    };

    console.log('[Release Notes] LLM Request:', JSON.stringify(llmRequest, null, 2));

    // Generate release notes with LLM
    const { emailCopy, subject } = await generateReleaseNotes(llmRequest);

    // Save to database (subject field will be added to schema separately)
    const { data: savedNote, error: saveError } = await supabaseAdmin
      .from('release_notes')
      .upsert(
        {
          week_starting: targetWeek,
          entries: {
            total: entries.length,
            features: categorized.features.length,
            fixes: categorized.fixes.length,
            improvements: categorized.improvements.length,
            docs: categorized.docs.length,
            categorized,
            subject, // Store subject in entries JSONB for now
          },
          email_copy: emailCopy,
        },
        {
          onConflict: 'week_starting',
        }
      )
      .select()
      .single();

    if (saveError) {
      console.error('Error saving release notes:', saveError);
      return NextResponse.json(
        {
          error: 'Failed to save release notes',
          details: saveError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      weekStart: targetWeek,
      weekRange,
      subject,
      emailCopy,
      stats: {
        total: entries.length,
        features: categorized.features.length,
        fixes: categorized.fixes.length,
        improvements: categorized.improvements.length,
        docs: categorized.docs.length,
        other: categorized.other.length,
      },
      releaseNoteId: savedNote?.id,
    });
  } catch (error) {
    console.error('Error generating release notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate release notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
