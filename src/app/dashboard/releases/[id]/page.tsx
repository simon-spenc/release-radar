'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Copy, Calendar, FileText, Code, Eye } from 'lucide-react';

interface ReleaseNote {
  id: string;
  week_starting: string;
  entries: {
    total: number;
    features: number;
    fixes: number;
    improvements: number;
    docs: number;
    subject?: string;
  };
  email_copy: string;
  email_html?: string;
  sent_at: string | null;
  created_at: string;
}

export default function ReleaseNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [releaseNote, setReleaseNote] = useState<ReleaseNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchReleaseNote(params.id as string);
    }
  }, [params.id]);

  const fetchReleaseNote = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/release-notes/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Release note not found');
          router.push('/dashboard/releases/history');
          return;
        }
        throw new Error('Failed to fetch release note');
      }
      const data = await response.json();
      setReleaseNote(data.releaseNote);
    } catch (error) {
      console.error('Error fetching release note:', error);
      toast.error('Failed to load release note');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!releaseNote) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium">Release note not found</h3>
          <Button asChild className="mt-4">
            <Link href="/dashboard/releases/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/releases/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {releaseNote.entries.subject || 'Release Notes'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Week of {formatWeekRange(releaseNote.week_starting)}
            </p>
          </div>
        </div>
        {releaseNote.sent_at && (
          <Badge variant="default">Sent {formatDate(releaseNote.sent_at)}</Badge>
        )}
      </div>

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

      {/* Email Content with Toggle */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Toggle between plain text and styled preview
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="plain" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="plain" className="gap-2">
                  <Code className="h-4 w-4" />
                  Plain Text
                </TabsTrigger>
                <TabsTrigger value="styled" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Styled Preview
                </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(releaseNote.email_copy, 'Email copy')}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Plain Text
              </Button>
            </div>

            <TabsContent value="plain" className="mt-0">
              <div className="bg-muted rounded-lg p-6 border">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {releaseNote.email_copy}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="styled" className="mt-0">
              {releaseNote.email_html ? (
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className="bg-white p-8"
                    dangerouslySetInnerHTML={{ __html: releaseNote.email_html }}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-sm font-medium">
                      No styled version available
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This release note was generated before HTML support was added.
                    </p>
                  </CardContent>
                </Card>
              )}
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
            <span>Sent {formatDate(releaseNote.sent_at)}</span>
          </>
        )}
      </div>
    </div>
  );
}
