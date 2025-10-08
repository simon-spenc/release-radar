'use client';

import { useEffect, useState } from 'react';
import type { PRSummary, LinearTicket } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle2, Clock, ExternalLink, FileEdit, Loader2 } from 'lucide-react';

interface ApprovedItem {
  id: string;
  type: 'pr' | 'ticket';
  title: string;
  summary: string;
  url: string;
  approved_at: string;
  approved_by: string;
  doc_pr_url?: string;
  doc_pr_merged?: boolean;
}

export default function ApprovedPage() {
  const [items, setItems] = useState<ApprovedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pr' | 'ticket'>('all');
  const [updatingDocs, setUpdatingDocs] = useState<string | null>(null);

  useEffect(() => {
    fetchApproved();
  }, []);

  const fetchApproved = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/summaries/approved');
      const data = await response.json();

      const prItems: ApprovedItem[] = (data.prSummaries || []).map((pr: any) => ({
        id: pr.id,
        type: 'pr' as const,
        title: pr.pr_title,
        summary: pr.edited_summary || pr.llm_summary,
        url: pr.pr_url,
        approved_at: pr.approved_at,
        approved_by: pr.approved_by,
        doc_pr_url: pr.doc_pr_url,
        doc_pr_merged: pr.doc_pr_merged,
      }));

      const ticketItems: ApprovedItem[] = (data.linearTickets || []).map((ticket: any) => ({
        id: ticket.id,
        type: 'ticket' as const,
        title: ticket.ticket_title,
        summary: ticket.edited_summary || ticket.llm_summary,
        url: ticket.ticket_url,
        approved_at: ticket.approved_at,
        approved_by: ticket.approved_by,
        doc_pr_url: ticket.doc_pr_url,
        doc_pr_merged: ticket.doc_pr_merged,
      }));

      const allItems = [...prItems, ...ticketItems].sort(
        (a, b) => new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime()
      );

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching approved items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleUpdateDocs = async (item: ApprovedItem) => {
    setUpdatingDocs(item.id);
    try {
      const response = await fetch('/api/docs/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: item.type,
          id: item.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to update documentation');
      }

      const result = await response.json();
      toast.success(`Documentation PR created: ${result.docPrUrl}`);

      // Refresh the list to show the new doc PR
      fetchApproved();
    } catch (error) {
      console.error('Error updating docs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update documentation');
    } finally {
      setUpdatingDocs(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Approved Changes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View all approved documentation updates and their release status.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </Button>
        <Button
          variant={filter === 'pr' ? 'default' : 'outline'}
          onClick={() => setFilter('pr')}
        >
          PRs ({items.filter((i) => i.type === 'pr').length})
        </Button>
        <Button
          variant={filter === 'ticket' ? 'default' : 'outline'}
          onClick={() => setFilter('ticket')}
        >
          Tickets ({items.filter((i) => i.type === 'ticket').length})
        </Button>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No approved items found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={item.type === 'pr' ? 'default' : 'secondary'}>
                        {item.type === 'pr' ? 'Pull Request' : 'Linear Ticket'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {item.title}
                      </a>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {item.summary}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Approved by {item.approved_by}</span>
                      <span>•</span>
                      <span>{formatDate(item.approved_at)}</span>
                    </div>
                  </div>
                <div className="ml-4 flex flex-col gap-2">
                  {item.doc_pr_url ? (
                    <>
                      <Badge variant={item.doc_pr_merged ? "default" : "outline"} className="w-fit gap-1">
                        {item.doc_pr_merged ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Docs Updated
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            PR Pending
                          </>
                        )}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={item.doc_pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-1"
                        >
                          View PR
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleUpdateDocs(item)}
                      disabled={updatingDocs === item.id}
                      size="sm"
                      className="gap-2"
                    >
                      {updatingDocs === item.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FileEdit className="h-4 w-4" />
                          Update Docs
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
