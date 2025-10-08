'use client';

import { useState } from 'react';
import type { PRSummary, LinearTicket, CodeChanges } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ExternalLink, FileText, AlertCircle } from 'lucide-react';

interface ApprovalModalProps {
  item: PRSummary | LinearTicket;
  type: 'pr' | 'ticket';
  onApprove: (editedSummary?: string) => void;
  onReject: () => void;
  onClose: () => void;
}

export default function ApprovalModal({
  item,
  type,
  onApprove,
  onReject,
  onClose,
}: ApprovalModalProps) {
  const [editedSummary, setEditedSummary] = useState(
    item.edited_summary || item.llm_summary
  );
  const [isEditing, setIsEditing] = useState(false);

  const isPR = type === 'pr';
  const prItem = isPR ? (item as PRSummary) : null;
  const ticketItem = !isPR ? (item as LinearTicket) : null;

  const title = isPR ? prItem!.pr_title : ticketItem!.ticket_title;
  const url = isPR ? prItem!.pr_url : ticketItem!.ticket_url;
  const identifier = isPR ? `PR #${prItem!.pr_number}` : ticketItem!.ticket_id;
  const author = isPR ? prItem!.author : null;
  const codeChanges = isPR ? (prItem!.code_changes as CodeChanges | null) : null;

  const handleApprove = () => {
    const summaryToSave = editedSummary !== item.llm_summary ? editedSummary : undefined;
    onApprove(summaryToSave);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {identifier}: {title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View on {isPR ? 'GitHub' : 'Linear'}
              <ExternalLink className="h-3 w-3" />
            </a>
            {author && <span className="text-muted-foreground">by {author}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Changes (PR only) */}
          {isPR && codeChanges && (
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Code Changes
              </h4>
              <div className="flex gap-4 text-sm mb-3">
                <Badge variant="outline">
                  {codeChanges.files_changed} files changed
                </Badge>
                <Badge variant="outline" className="text-green-600">
                  +{codeChanges.additions}
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  -{codeChanges.deletions}
                </Badge>
              </div>
              {codeChanges.files && codeChanges.files.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-primary hover:underline">
                    View files changed ({codeChanges.files.length})
                  </summary>
                  <ul className="mt-2 ml-4 list-disc text-muted-foreground">
                    {codeChanges.files.map((file, idx) => (
                      <li key={idx}>{file}</li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
          )}

          {/* Original Description */}
          {isPR && prItem!.original_description && (
            <Card className="p-4">
              <h4 className="text-sm font-medium mb-2">Original PR Description</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {prItem!.original_description}
              </div>
            </Card>
          )}

          {/* LLM Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">AI-Generated Summary</h4>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="ghost"
                size="sm"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Summary'}
              </Button>
            </div>
            {isEditing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={6}
                className="mt-2"
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                {editedSummary}
              </div>
            )}
            {editedSummary !== item.llm_summary && !isEditing && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                <AlertCircle className="h-3 w-3" />
                Summary has been edited
              </div>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onReject} variant="outline">
            Reject
          </Button>
          <Button onClick={handleApprove}>
            Approve & Create Release Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
