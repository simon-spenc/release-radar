'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Calendar, ExternalLink, Eye } from 'lucide-react';

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

export default function ReleaseNotesHistoryPage() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReleaseNotes();
  }, []);

  const fetchReleaseNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/release-notes/list');
      if (!response.ok) throw new Error('Failed to fetch release notes');
      const data = await response.json();
      setReleaseNotes(data.releaseNotes || []);
    } catch (error) {
      console.error('Error fetching release notes:', error);
      toast.error('Failed to load release notes history');
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Release Notes History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View all generated release notes
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Release Notes History</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View all generated release notes
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/releases">
            <FileText className="mr-2 h-4 w-4" />
            Generate New
          </Link>
        </Button>
      </div>

      {releaseNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-medium">No release notes yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate your first release note to see it here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/releases">Generate Release Notes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Release Notes</CardTitle>
            <CardDescription>
              {releaseNotes.length} release {releaseNotes.length === 1 ? 'note' : 'notes'} generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Total Changes</TableHead>
                  <TableHead className="text-center">Features</TableHead>
                  <TableHead className="text-center">Fixes</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releaseNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatWeekRange(note.week_starting)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate">
                        {note.entries.subject || 'No subject'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{note.entries.total}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {note.entries.features}
                    </TableCell>
                    <TableCell className="text-center">
                      {note.entries.fixes}
                    </TableCell>
                    <TableCell className="text-center">
                      {note.sent_at ? (
                        <Badge variant="default">Sent</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(note.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/releases/${note.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
