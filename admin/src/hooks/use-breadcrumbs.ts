'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface Breadcrumb {
  label: string;
  href: string;
}

const LABEL_MAP: Record<string, string> = {
  members: 'Members',
  memberships: 'Memberships',
  locations: 'Locations',
  staff: 'Staff',
  classes: 'Classes',
  types: 'Types',
  schedule: 'Schedule',
  sessions: 'Sessions',
  bookings: 'Bookings',
  billing: 'Billing',
  payments: 'Payments',
  subscriptions: 'Subscriptions',
  analytics: 'Analytics',
  reports: 'Reports',
  'popular-times': 'Popular Times',
  retention: 'Retention',
  'member-activity': 'Member Activity',
  revenue: 'Revenue',
  attendance: 'Attendance',
  'instructor-pay': 'Instructor Pay',
  marketing: 'Marketing',
  campaigns: 'Campaigns',
  'lead-forms': 'Lead Forms',
  leads: 'Leads',
  crm: 'CRM',
  journeys: 'Journeys',
  segments: 'Segments',
  scoring: 'Lead Scoring',
  templates: 'Templates',
  content: 'Content',
  articles: 'Articles',
  announcements: 'Announcements',
  gamification: 'Gamification',
  badges: 'Badges',
  challenges: 'Challenges',
  points: 'Points',
  streaks: 'Streaks',
  video: 'Video',
  programs: 'Programs',
  videos: 'Videos',
  'custom-analytics': 'Custom Analytics',
  builder: 'Builder',
  settings: 'Settings',
  branding: 'Branding',
  'api-keys': 'API Keys',
  webhooks: 'Webhooks',
  developer: 'Developer',
  new: 'New',
};

export function useBreadcrumbs(): Breadcrumb[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return [{ label: 'Dashboard', href: '/' }];
    }

    const breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', href: '/' }];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;

      // Skip dynamic segments (UUIDs)
      if (segment.match(/^[0-9a-f-]{36}$/i)) {
        breadcrumbs.push({ label: 'Details', href: currentPath });
        continue;
      }

      const label = LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
  }, [pathname]);
}
