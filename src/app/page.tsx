import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, FileClock, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered Documentation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Release Radar
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatically generate release notes and documentation from your GitHub PRs and Linear tickets
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/pending">
              <Button size="lg" variant="outline" className="gap-2">
                <FileClock className="h-4 w-4" />
                View Pending
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-12">
          <Card className="shadow-sm">
            <CardHeader>
              <FileClock className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Review PRs</CardTitle>
              <CardDescription>
                Automatically summarize merged PRs and Linear tickets for review
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <FileCheck className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Approve Changes</CardTitle>
              <CardDescription>
                Review and approve AI-generated summaries for your documentation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg">Generate Notes</CardTitle>
              <CardDescription>
                Create polished release notes and update docs automatically
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
