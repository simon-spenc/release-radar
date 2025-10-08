import type { PRSummary, LinearTicket } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SummaryTableProps {
  items: (PRSummary | LinearTicket)[];
  type: 'pr' | 'ticket';
  onSelectItem: (item: PRSummary | LinearTicket) => void;
}

export default function SummaryTable({ items, type, onSelectItem }: SummaryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncate = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === 'pr' ? 'PR' : 'Ticket'}</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Summary</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isPR = 'pr_number' in item;
            const title = isPR ? (item as PRSummary).pr_title : (item as LinearTicket).ticket_title;
            const url = isPR ? (item as PRSummary).pr_url : (item as LinearTicket).ticket_url;
            const identifier = isPR ? `#${(item as PRSummary).pr_number}` : (item as LinearTicket).ticket_id;
            const date = isPR ? (item as PRSummary).merged_at : (item as LinearTicket).completed_at;

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {identifier}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{title}</div>
                    {isPR && (item as PRSummary).author && (
                      <div className="text-sm text-muted-foreground">
                        by {(item as PRSummary).author}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="text-sm text-muted-foreground">
                    {truncate(item.llm_summary)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(date)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() => onSelectItem(item)}
                    variant="ghost"
                    size="sm"
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
