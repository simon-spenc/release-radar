'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, Copy, FileText, Sparkles } from 'lucide-react';

interface ReleaseNote {
  id: string;
  week_starting: string;
  entries: {
    total: number;
    features: number;
    fixes: number;
    improvements: number;
    docs: number;
  };
  email_copy: string;
  subject: string;
  sent_at: string | null;
  created_at: string;
}

export default function ReleasesPage() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [releaseNote, setReleaseNote] = useState<ReleaseNote | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  useEffect(() => {
    // Set current week on mount
    const currentWeek = getCurrentWeekStart();
    setSelectedWeek(currentWeek);
    fetchReleaseNote(currentWeek);
  }, []);

  const getCurrentWeekStart = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchReleaseNote = async (weekStart: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/release-notes?week=${weekStart}`);
      const data = await response.json();
      setReleaseNote(data.releaseNote);
    } catch (error) {
      console.error('Error fetching release note:', error);
      toast.error('Failed to fetch release notes');
    } finally {
      setLoading(false);
    }
  };

  const generateReleaseNotes = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/release-notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weekStart: selectedWeek }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate release notes');
      }

      const data = await response.json();
      toast.success('Release notes generated successfully!');

      // Refresh the release note
      await fetchReleaseNote(selectedWeek);
    } catch (error) {
      console.error('Error generating release notes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate release notes');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatWeekRange = (weekStart: string): string => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Release Notes
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Generate weekly release notes email copy for HubSpot.
        </p>
      </div>

      {/* Week Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Week
          </CardTitle>
          <CardDescription>Choose the week to generate release notes for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(e.target.value);
                fetchReleaseNote(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Week of {formatWeekRange(selectedWeek)}
            </span>
            <Button
              onClick={generateReleaseNotes}
              disabled={generating}
              className="ml-auto"
            >
              {generating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {releaseNote ? 'Regenerate' : 'Generate'} Release Notes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Release Note Display */}
      {!loading && releaseNote && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{releaseNote.entries.features}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bug Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{releaseNote.entries.fixes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{releaseNote.entries.improvements}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{releaseNote.entries.docs}</div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Line */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Subject</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(releaseNote.subject, 'Subject')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{releaseNote.subject}</p>
            </CardContent>
          </Card>

          {/* Email Copy */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Copy</CardTitle>
                  <CardDescription>Ready for HubSpot - Markdown format</CardDescription>
                </div>
                <Button
                  onClick={() => copyToClipboard(releaseNote.email_copy, 'Email copy')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {releaseNote.email_copy}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Generated {formatDate(releaseNote.created_at)}</span>
            {releaseNote.sent_at && (
              <>
                <span>•</span>
                <Badge variant="outline">Sent {formatDate(releaseNote.sent_at)}</Badge>
              </>
            )}
          </div>
        </div>
      )}

      {/* No Release Note */}
      {!loading && !releaseNote && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
            No release notes yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Click &quot;Generate Release Notes&quot; to create email copy for this week.
          </p>
        </div>
      )}
    </div>
  );
}
