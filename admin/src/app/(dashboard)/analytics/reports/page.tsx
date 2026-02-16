'use client';

import Link from 'next/link';
import { ArrowLeft, Users, DollarSign, Calendar, Briefcase, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';

const reports = [
  {
    title: 'Member Activity',
    description: 'Track member engagement, activity levels, and churn patterns',
    href: '/analytics/reports/member-activity',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Revenue',
    description: 'Analyze revenue trends, top memberships, and payment sources',
    href: '/analytics/reports/revenue',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Attendance',
    description: 'View class attendance, fill rates, and no-show patterns',
    href: '/analytics/reports/attendance',
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Instructor Pay',
    description: 'Summarize instructor hours, classes taught, and compensation',
    href: '/analytics/reports/instructor-pay',
    icon: Briefcase,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Reports" description="Detailed analytics reports for your business" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
