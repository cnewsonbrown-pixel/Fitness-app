'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { BarChart } from '@/components/shared/bar-chart';
import { analyticsApi } from '@/lib/api/analytics.api';
import { formatCurrency } from '@/lib/utils';

export default function InstructorPayReportPage() {
  const router = useRouter();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics', 'reports', 'instructor-pay'],
    queryFn: () => analyticsApi.getInstructorPayReport(),
  });

  const handleExport = async () => {
    try {
      const result = await analyticsApi.exportReport('instructor-pay', 'csv');
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Instructor Pay Report" description="Instructor hours and compensation summary">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </PageHeader>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96 text-muted-foreground">Loading...</div>
      ) : report ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total Pay" value={formatCurrency(report.totalPay)} icon={Briefcase} />
            <StatCard title="Total Hours" value={report.totalHours} icon={Briefcase} />
            <StatCard
              title="Avg. Hourly Rate"
              value={formatCurrency(report.averageHourlyRate)}
              icon={Briefcase}
            />
          </div>

          {/* Pay by Instructor Chart */}
          <ChartCard title="Pay by Instructor">
            {report.instructorPay && report.instructorPay.length > 0 ? (
              <BarChart
                data={report.instructorPay.map((d) => ({
                  name: d.instructorName,
                  pay: d.pay / 100,
                  hours: d.hours,
                }))}
                xKey="name"
                bars={[{ dataKey: 'pay', name: 'Pay ($)', color: '#6366f1' }]}
                height={350}
                yAxisFormatter={(v) => `$${v}`}
                tooltipFormatter={(v) => formatCurrency(v * 100)}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No data available
              </div>
            )}
          </ChartCard>

          {/* Instructor Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {report.instructorPay && report.instructorPay.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          Instructor
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          Classes
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          Hours
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          Rate
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          Total Pay
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.instructorPay.map((instructor) => (
                        <tr key={instructor.instructorId} className="border-b last:border-0">
                          <td className="py-3 px-4">
                            <Link
                              href={`/staff/${instructor.instructorId}`}
                              className="font-medium hover:underline"
                            >
                              {instructor.instructorName}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-right">{instructor.classes}</td>
                          <td className="py-3 px-4 text-right">{instructor.hours}</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(instructor.hourlyRate)}/hr
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {formatCurrency(instructor.pay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td className="py-3 px-4 font-semibold">Total</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {report.instructorPay.reduce((sum, i) => sum + i.classes, 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">{report.totalHours}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(report.averageHourlyRate)}/hr
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatCurrency(report.totalPay)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No instructor data available</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
