'use client';

import { useEffect, useState } from 'react';
import type { PRSummary, LinearTicket } from '@/types';
import SummaryTable from '@/components/SummaryTable';
import ApprovalModal from '@/components/ApprovalModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PendingApprovalsPage() {
  const [prSummaries, setPrSummaries] = useState<PRSummary[]>([]);
  const [linearTickets, setLinearTickets] = useState<LinearTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'pr' | 'ticket';
    data: PRSummary | LinearTicket;
  } | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/summaries/pending');
      const data = await response.json();
      setPrSummaries(data.prSummaries || []);
      setLinearTickets(data.linearTickets || []);
    } catch (error) {
      console.error('Error fetching pending summaries:', error);
      toast.error('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'pr' | 'ticket', editedSummary?: string) => {
    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          status: 'approved',
          edited_summary: editedSummary,
          approved_by: 'Admin User', // TODO: Get from auth
        }),
      });

      if (response.ok) {
        toast.success('Item approved successfully');
        setSelectedItem(null);
        fetchPending(); // Refresh the list
      } else {
        toast.error('Failed to approve item');
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve item');
    }
  };

  const handleReject = async (id: string, type: 'pr' | 'ticket') => {
    try {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          status: 'rejected',
          approved_by: 'Admin User',
        }),
      });

      if (response.ok) {
        toast.success('Item rejected');
        setSelectedItem(null);
        fetchPending();
      } else {
        toast.error('Failed to reject item');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject item');
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-0 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const totalPending = prSummaries.length + linearTickets.length;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pending Approvals
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Review and approve documentation updates from merged PRs and completed Linear tickets.
        </p>
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {totalPending} pending {totalPending === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {totalPending === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No pending approvals
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All items have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prSummaries.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Pull Requests ({prSummaries.length})
              </h2>
              <SummaryTable
                items={prSummaries}
                type="pr"
                onSelectItem={(item) => setSelectedItem({ type: 'pr', data: item })}
              />
            </div>
          )}

          {linearTickets.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Linear Tickets ({linearTickets.length})
              </h2>
              <SummaryTable
                items={linearTickets}
                type="ticket"
                onSelectItem={(item) => setSelectedItem({ type: 'ticket', data: item })}
              />
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <ApprovalModal
          item={selectedItem.data}
          type={selectedItem.type}
          onApprove={(editedSummary) =>
            handleApprove(selectedItem.data.id, selectedItem.type, editedSummary)
          }
          onReject={() => handleReject(selectedItem.data.id, selectedItem.type)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
