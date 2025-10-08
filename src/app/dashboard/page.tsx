'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

        const pending = await pendingRes.json();
        const approved = await approvedRes.json();

        // Calculate this week's approved items
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeek = approved.summaries?.filter((item: any) =>
          new Date(item.approved_at) > weekAgo
        ).length || 0;

        setStats({
          pending: pending.summaries?.length || 0,
          approved: approved.summaries?.length || 0,
          thisWeek,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
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
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your release documentation workflow
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
            <Link href="/dashboard/pending">
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start">
                View pending <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Items
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for release notes
            </p>
            <Link href="/dashboard/approved">
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start">
                View approved <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Week
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.thisWeek || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Approved in last 7 days
            </p>
            <Link href="/dashboard/releases">
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start">
                Generate notes <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
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
