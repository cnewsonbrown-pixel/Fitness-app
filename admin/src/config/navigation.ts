import {
  LayoutDashboard,
  Users,
  CreditCard,
  MapPin,
  UserCog,
  Calendar,
  BookOpen,
  DollarSign,
  BarChart3,
  Megaphone,
  GitBranch,
  FileText,
  Bell,
  Trophy,
  Video,
  Settings,
  Key,
  Webhook,
  Code,
  PieChart,
  type LucideIcon,
} from 'lucide-react';
import { StaffRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredRoles?: StaffRole[];
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gym Management',
    items: [
      { label: 'Members', href: '/members', icon: Users },
      { label: 'Memberships', href: '/memberships', icon: CreditCard },
      { label: 'Locations', href: '/locations', icon: MapPin },
      { label: 'Staff', href: '/staff', icon: UserCog, requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'] },
      {
        label: 'Classes',
        href: '/classes/schedule',
        icon: Calendar,
        children: [
          { label: 'Schedule', href: '/classes/schedule', icon: Calendar },
          { label: 'Sessions', href: '/classes/sessions', icon: Calendar },
          { label: 'Types', href: '/classes/types', icon: Calendar },
        ],
      },
      { label: 'Bookings', href: '/bookings', icon: BookOpen },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Billing',
        href: '/billing',
        icon: DollarSign,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        label: 'Campaigns',
        href: '/marketing/campaigns',
        icon: Megaphone,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
      {
        label: 'Lead Forms',
        href: '/marketing/lead-forms',
        icon: FileText,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    label: 'CRM',
    items: [
      {
        label: 'Journeys',
        href: '/crm/journeys',
        icon: GitBranch,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
      {
        label: 'Segments',
        href: '/crm/segments',
        icon: Users,
        requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Articles', href: '/content/articles', icon: FileText, requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Announcements', href: '/content/announcements', icon: Bell, requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'] },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { label: 'Gamification', href: '/gamification', icon: Trophy, requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'] },
      { label: 'Video', href: '/video/programs', icon: Video, requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'General', href: '/settings', icon: Settings, requiredRoles: ['OWNER', 'ADMIN'] },
      { label: 'Branding', href: '/settings/branding', icon: PieChart, requiredRoles: ['OWNER', 'ADMIN'] },
      { label: 'API Keys', href: '/settings/api-keys', icon: Key, requiredRoles: ['OWNER', 'ADMIN'] },
      { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook, requiredRoles: ['OWNER', 'ADMIN'] },
      { label: 'Developer', href: '/settings/developer', icon: Code, requiredRoles: ['OWNER', 'ADMIN'] },
    ],
  },
];
