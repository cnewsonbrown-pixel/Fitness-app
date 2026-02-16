'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { analyticsApi, RetentionCohort } from '@/lib/api/analytics.api';
import { cn } from '@/lib/utils';

function getRetentionColor(rate: number): string {
  if (rate >= 80) return 'bg-green-500';
  if (rate >= 60) return 'bg-green-400';
  if (rate >= 40) return 'bg-yellow-400';
  if (rate >= 20) return 'bg-orange-400';
  return 'bg-red-400';
}

export default function RetentionPage() {
  const router = useRouter();

  const { data: cohorts, isLoading } = useQuery({
    queryKey: ['analytics', 'retention'],
    queryFn: () => analyticsApi.getRetentionCohorts({ cohortCount: 6 }),
  });

  const maxMonths = cohorts?.reduce((max, c) => Math.max(max, c.retentionRates.length), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Retention Analysis" description="Cohort-based member retention breakdown" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Retention Cohorts
          </CardTitle>
          <CardDescription>
            Track how well you retain members who joined in each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Loading...
            </div>
          ) : cohorts && cohorts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left text-sm font-medium text-muted-foreground">Cohort</th>
                    <th className="py-2 px-3 text-center text-sm font-medium text-muted-foreground">Members</th>
                    {Array.from({ length: maxMonths }, (_, i) => (
                      <th key={i} className="py-2 px-3 text-center text-sm font-medium text-muted-foreground">
                        Month {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((cohort: RetentionCohort) => (
                    <tr key={cohort.cohortMonth} className="border-b last:border-0">
                      <td className="py-3 px-3 text-sm font-medium">{cohort.cohortMonth}</td>
                      <td className="py-3 px-3 text-center text-sm">{cohort.initialCount}</td>
                      {cohort.retentionRates.map((rate, i) => (
                        <td key={i} className="py-3 px-3">
                          <div
                            className={cn(
                              'mx-auto w-16 py-1 rounded text-center text-xs font-medium text-white',
                              getRetentionColor(rate)
                            )}
                          >
                            {Math.round(rate)}%
                          </div>
                        </td>
                      ))}
                      {/* Fill empty cells if this cohort has fewer months */}
                      {Array.from({ length: maxMonths - cohort.retentionRates.length }, (_, i) => (
                        <td key={`empty-${i}`} className="py-3 px-3">
                          <div className="mx-auto w-16 py-1 rounded text-center text-xs text-muted-foreground">
                            -
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No retention data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {cohorts && cohorts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average Month 1 Retention</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    cohorts.reduce((sum, c) => sum + (c.retentionRates[0] || 0), 0) / cohorts.length
                  )}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average Month 3 Retention</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    cohorts
                      .filter((c) => c.retentionRates.length >= 3)
                      .reduce((sum, c) => sum + (c.retentionRates[2] || 0), 0) /
                      cohorts.filter((c) => c.retentionRates.length >= 3).length || 0
                  )}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Members Tracked</p>
                <p className="text-2xl font-bold">
                  {cohorts.reduce((sum, c) => sum + c.initialCount, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
