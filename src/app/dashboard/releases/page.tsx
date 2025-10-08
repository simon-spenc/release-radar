'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Copy, FileText, Sparkles, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReleaseNote {
  id: string;
  week_starting: string;
  entries: {
    total: number;
    features: number;
    fixes: number;
    improvements: number;
    docs: number;
    subject?: string; // Subject stored in entries JSONB
  };
  email_copy: string;
  sent_at: string | null;
  created_at: string;
}

export default function ReleasesPage() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [releaseNote, setReleaseNote] = useState<ReleaseNote | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'plain' | 'styled'>('plain');

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Release Notes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate weekly release notes email copy for HubSpot.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/releases/history">
            <FileText className="mr-2 h-4 w-4" />
            View History
          </Link>
        </Button>
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
              className="px-3 py-2 border border-input rounded-lg bg-background text-foreground"
            />
            <span className="text-sm text-muted-foreground">
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
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.total}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.features}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bug Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.fixes}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.improvements}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{releaseNote.entries.docs}</div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Line */}
          {releaseNote.entries.subject && (
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Email Subject</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(releaseNote.entries.subject!, 'Subject')}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{releaseNote.entries.subject}</p>
              </CardContent>
            </Card>
          )}

          {/* Email Copy */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Content</CardTitle>
                  <CardDescription>Toggle between plain text and styled preview</CardDescription>
                </div>
                <Button
                  onClick={() => copyToClipboard(releaseNote.email_copy, 'Email copy')}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Plain Text
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'plain' | 'styled')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="plain" className="gap-2">
                    <Code className="h-4 w-4" />
                    Plain Text
                  </TabsTrigger>
                  <TabsTrigger value="styled" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Styled Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="plain" className="mt-4">
                  <div className="bg-muted rounded-lg p-6 border">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {releaseNote.email_copy}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="styled" className="mt-4">
                  <div className="bg-background border rounded-lg p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {releaseNote.email_copy}
                      </ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-medium">
              No release notes yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Click &quot;Generate Release Notes&quot; to create email copy for this week.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
