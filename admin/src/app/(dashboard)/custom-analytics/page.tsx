'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  LayoutDashboard,
  FileText,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { customDashboardsApi, customReportsApi } from '@/lib/api/custom-analytics.api';

export default function CustomAnalyticsPage() {
  const queryClient = useQueryClient();
  const [deleteDashboardId, setDeleteDashboardId] = useState<string | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  const { data: dashboards, isLoading: dashboardsLoading } = useQuery({
    queryKey: ['custom-dashboards'],
    queryFn: () => customDashboardsApi.list({ limit: 50 }),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: () => customReportsApi.list({ limit: 50 }),
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: string) => customDashboardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      toast.success('Dashboard deleted');
      setDeleteDashboardId(null);
    },
    onError: () => {
      toast.error('Failed to delete dashboard');
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => customReportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast.success('Report deleted');
      setDeleteReportId(null);
    },
    onError: () => {
      toast.error('Failed to delete report');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => customDashboardsApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      toast.success('Default dashboard updated');
    },
    onError: () => {
      toast.error('Failed to set default dashboard');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Analytics"
        description="Create custom dashboards and reports to track your business"
      >
        <div className="flex gap-2">
          <Link href="/custom-analytics/reports/new">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
          <Link href="/custom-analytics/builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Dashboard
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Tabs defaultValue="dashboards">
        <TabsList>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="mt-6">
          {dashboardsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboards?.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No custom dashboards</h3>
                <p className="text-muted-foreground">Create your first dashboard to visualize your data</p>
                <Link href="/custom-analytics/builder">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboards?.data.map((dashboard) => (
                <Card key={dashboard.id} className="relative">
                  {dashboard.isDefault && (
                    <div className="absolute right-3 top-3">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/custom-analytics/builder?id=${dashboard.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Duplicate functionality coming soon')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {!dashboard.isDefault && (
                            <DropdownMenuItem onClick={() => setDefaultMutation.mutate(dashboard.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDashboardId(dashboard.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/custom-analytics/builder?id=${dashboard.id}`}>
                      <CardTitle className="text-lg hover:underline">{dashboard.name}</CardTitle>
                    </Link>
                    <CardDescription className="mt-1 line-clamp-2">
                      {dashboard.description || 'No description'}
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{dashboard.widgets?.length || 0} widgets</span>
                      <span>Updated {format(new Date(dashboard.updatedAt), 'MMM d')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports?.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No custom reports</h3>
                <p className="text-muted-foreground">Create custom reports to analyze your data</p>
                <Link href="/custom-analytics/reports/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Report
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports?.data.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/custom-analytics/reports/${report.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Run functionality coming soon')}>
                            Run Now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Duplicate functionality coming soon')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteReportId(report.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/custom-analytics/reports/${report.id}`}>
                      <CardTitle className="text-lg hover:underline">{report.name}</CardTitle>
                    </Link>
                    <CardDescription className="mt-1 line-clamp-2">
                      {report.description || 'No description'}
                    </CardDescription>
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {report.schedule ? `Scheduled ${report.schedule.frequency.toLowerCase()}` : 'Manual'}
                      </span>
                      <span>
                        {report.lastRunAt
                          ? `Last run ${format(new Date(report.lastRunAt), 'MMM d')}`
                          : 'Never run'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteDashboardId}
        onOpenChange={() => setDeleteDashboardId(null)}
        title="Delete Dashboard"
        description="Are you sure you want to delete this dashboard? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteDashboardId && deleteDashboardMutation.mutate(deleteDashboardId)}
        isLoading={deleteDashboardMutation.isPending}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteReportId}
        onOpenChange={() => setDeleteReportId(null)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteReportId && deleteReportMutation.mutate(deleteReportId)}
        isLoading={deleteReportMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
