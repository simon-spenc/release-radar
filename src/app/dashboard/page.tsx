'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileCheck, FileClock, FileText, TrendingUp, ArrowRight } from 'lucide-react';

interface Stats {
  pending: number;
  approved: number;
  thisWeek: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [pendingRes, approvedRes] = await Promise.all([
          fetch('/api/summaries/pending'),
          fetch('/api/summaries/approved'),
        ]);

        // Check if responses are OK
        if (!pendingRes.ok) {
          console.error('Pending API error:', pendingRes.status, pendingRes.statusText);
          const pendingText = await pendingRes.text();
          console.error('Pending API response:', pendingText);
        }

        if (!approvedRes.ok) {
          console.error('Approved API error:', approvedRes.status, approvedRes.statusText);
          const approvedText = await approvedRes.text();
          console.error('Approved API response:', approvedText);
        }

        // Try to parse JSON, but handle HTML responses gracefully
        let pending, approved;
        
        try {
          pending = await pendingRes.json();
        } catch (jsonError) {
          console.error('Failed to parse pending response as JSON:', jsonError);
          pending = { prSummaries: [], linearTickets: [] };
        }

        try {
          approved = await approvedRes.json();
        } catch (jsonError) {
          console.error('Failed to parse approved response as JSON:', jsonError);
          approved = { prSummaries: [], linearTickets: [] };
        }

        // Calculate this week's approved items
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeek = approved.prSummaries?.filter((item: any) =>
          new Date(item.approved_at) > weekAgo
        ).length || 0;

        const approvedTicketsThisWeek = approved.linearTickets?.filter((item: any) =>
          new Date(item.approved_at) > weekAgo
        ).length || 0;

        setStats({
          pending: (pending.prSummaries?.length || 0) + (pending.linearTickets?.length || 0),
          approved: (approved.prSummaries?.length || 0) + (approved.linearTickets?.length || 0),
          thisWeek: thisWeek + approvedTicketsThisWeek,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set default stats on error
        setStats({
          pending: 0,
          approved: 0,
          thisWeek: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your release documentation workflow
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your release documentation workflow
        </p>
      </div>

      <div className="@xl/main:grid-cols-3 grid grid-cols-1 gap-4">
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-sm">
          <CardHeader className="relative">
            <CardDescription className="flex items-center gap-2">
              <FileClock className="h-4 w-4" />
              Pending Approvals
            </CardDescription>
            <CardTitle className="@[250px]/card:text-4xl text-3xl font-semibold tabular-nums">
              {stats?.pending || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="rounded-lg">
                Awaiting Review
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3 pt-4">
            <div className="text-sm text-muted-foreground">
              PRs and tickets ready for review
            </div>
            <Link href="/dashboard/pending" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Review pending
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-sm">
          <CardHeader className="relative">
            <CardDescription className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Approved Items
            </CardDescription>
            <CardTitle className="@[250px]/card:text-4xl text-3xl font-semibold tabular-nums">
              {stats?.approved || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                <TrendingUp className="size-3" />
                Ready
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3 pt-4">
            <div className="text-sm text-muted-foreground">
              Ready for release notes and documentation
            </div>
            <Link href="/dashboard/approved" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                View approved
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-sm">
          <CardHeader className="relative">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              This Week
            </CardDescription>
            <CardTitle className="@[250px]/card:text-4xl text-3xl font-semibold tabular-nums">
              {stats?.thisWeek || 0}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                Last 7 days
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3 pt-4">
            <div className="text-sm text-muted-foreground">
              Items approved in the last 7 days
            </div>
            <Link href="/dashboard/releases" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between">
                Generate notes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/pending">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <FileClock className="mr-2 h-5 w-5" />
              Review Pending PRs
            </Button>
          </Link>
          <Link href="/dashboard/releases">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <FileText className="mr-2 h-5 w-5" />
              Generate Release Notes
            </Button>
          </Link>
          <Link href="/dashboard/approved">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <FileCheck className="mr-2 h-5 w-5" />
              Update Documentation
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
