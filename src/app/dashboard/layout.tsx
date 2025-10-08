import Link from 'next/link';
import { SidebarNav } from '@/components/sidebar-nav';
import { Separator } from '@/components/ui/separator';
import { Radar } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Radar className="h-6 w-6 text-primary" />
            <span className="text-lg">Release Radar</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Automated release notes &amp; documentation
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col sm:pl-64">
        {/* Mobile header - shown only on mobile */}
        <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4 sm:hidden">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Radar className="h-6 w-6 text-primary" />
            <span className="text-lg">Release Radar</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
