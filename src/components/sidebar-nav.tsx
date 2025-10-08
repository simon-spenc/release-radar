'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileCheck, FileClock, FileText, Home } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Pending Approvals', href: '/dashboard/pending', icon: FileClock },
  { name: 'Approved', href: '/dashboard/approved', icon: FileCheck },
  { name: 'Release Notes', href: '/dashboard/releases', icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-3">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
