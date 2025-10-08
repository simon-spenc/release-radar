'use client';

import { useEffect, useState } from 'react';
import type { PRSummary, LinearTicket } from '@/types';

interface ApprovedItem {
  id: string;
  type: 'pr' | 'ticket';
  title: string;
  summary: string;
  url: string;
  approved_at: string;
  approved_by: string;
  release_week?: string;
  doc_pr_url?: string;
  doc_pr_merged?: boolean;
}

export default function ApprovedPage() {
  const [items, setItems] = useState<ApprovedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pr' | 'ticket'>('all');

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
        release_week: pr.release_entries?.[0]?.release_week,
        doc_pr_url: pr.release_entries?.[0]?.doc_pr_url,
        doc_pr_merged: pr.release_entries?.[0]?.doc_pr_merged,
      }));

      const ticketItems: ApprovedItem[] = (data.linearTickets || []).map((ticket: any) => ({
        id: ticket.id,
        type: 'ticket' as const,
        title: ticket.ticket_title,
        summary: ticket.edited_summary || ticket.llm_summary,
        url: ticket.ticket_url,
        approved_at: ticket.approved_at,
        approved_by: ticket.approved_by,
        release_week: ticket.release_entries?.[0]?.release_week,
        doc_pr_url: ticket.release_entries?.[0]?.doc_pr_url,
        doc_pr_merged: ticket.release_entries?.[0]?.doc_pr_merged,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Approved Changes
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          View all approved documentation updates and their release status.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setFilter('pr')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'pr'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}
        >
          PRs ({items.filter((i) => i.type === 'pr').length})
        </button>
        <button
          onClick={() => setFilter('ticket')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'ticket'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}
        >
          Tickets ({items.filter((i) => i.type === 'ticket').length})
        </button>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No approved items found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'pr'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}
                    >
                      {item.type === 'pr' ? 'Pull Request' : 'Linear Ticket'}
                    </span>
                    {item.release_week && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Week of {formatDate(item.release_week)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {item.title}
                    </a>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {item.summary}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Approved by {item.approved_by}</span>
                    <span>•</span>
                    <span>{formatDate(item.approved_at)}</span>
                  </div>
                </div>
                <div className="ml-4">
                  {item.doc_pr_url ? (
                    <div className="text-right">
                      <a
                        href={item.doc_pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Doc PR
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.doc_pr_merged
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {item.doc_pr_merged ? 'Merged' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      No doc PR
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
