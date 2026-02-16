'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, X, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/layout/page-header';
import {
  customReportsApi,
  analyticsMetadataApi,
  CreateReportData,
  ReportConfig,
} from '@/lib/api/custom-analytics.api';

export default function NewReportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<ReportConfig>({
    metrics: [],
    dimensions: [],
    dateRange: 'LAST_30_DAYS',
    sortOrder: 'DESC',
    limit: 100,
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => analyticsMetadataApi.getMetrics(),
  });

  const { data: dimensions } = useQuery({
    queryKey: ['analytics-dimensions'],
    queryFn: () => analyticsMetadataApi.getDimensions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReportData) => customReportsApi.create(data),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      toast.success('Report created successfully');
      router.push(`/custom-analytics/reports/${report.id}`);
    },
    onError: () => {
      toast.error('Failed to create report');
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => analyticsMetadataApi.previewQuery(config),
    onSuccess: (data) => {
      setPreviewData(data);
      setIsPreviewing(false);
    },
    onError: () => {
      toast.error('Failed to preview report');
      setIsPreviewing(false);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a report name');
      return;
    }
    if (config.metrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }
    createMutation.mutate({ name, description, config });
  };

  const handlePreview = () => {
    if (config.metrics.length === 0) {
      toast.error('Please select at least one metric');
      return;
    }
    setIsPreviewing(true);
    previewMutation.mutate();
  };

  const toggleMetric = (metricKey: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricKey)
        ? prev.metrics.filter((m) => m !== metricKey)
        : [...prev.metrics, metricKey],
    }));
  };

  const toggleDimension = (dimensionKey: string) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimensionKey)
        ? prev.dimensions.filter((d) => d !== dimensionKey)
        : [...prev.dimensions, dimensionKey],
    }));
  };

  // Default metrics if API not loaded
  const defaultMetrics = [
    { key: 'total_revenue', label: 'Total Revenue', category: 'Finance', type: 'currency' as const },
    { key: 'active_members', label: 'Active Members', category: 'Members', type: 'number' as const },
    { key: 'new_signups', label: 'New Signups', category: 'Members', type: 'number' as const },
    { key: 'class_attendance', label: 'Class Attendance', category: 'Classes', type: 'number' as const },
    { key: 'retention_rate', label: 'Retention Rate', category: 'Members', type: 'percentage' as const },
    { key: 'churn_rate', label: 'Churn Rate', category: 'Members', type: 'percentage' as const },
    { key: 'avg_revenue_per_member', label: 'Avg Revenue per Member', category: 'Finance', type: 'currency' as const },
    { key: 'total_bookings', label: 'Total Bookings', category: 'Classes', type: 'number' as const },
  ];

  const defaultDimensions = [
    { key: 'date', label: 'Date', category: 'Time', type: 'date' as const },
    { key: 'month', label: 'Month', category: 'Time', type: 'date' as const },
    { key: 'location', label: 'Location', category: 'Location', type: 'string' as const },
    { key: 'membership_type', label: 'Membership Type', category: 'Members', type: 'string' as const },
    { key: 'class_type', label: 'Class Type', category: 'Classes', type: 'string' as const },
    { key: 'instructor', label: 'Instructor', category: 'Staff', type: 'string' as const },
  ];

  const availableMetrics = metrics || defaultMetrics;
  const availableDimensions = dimensions || defaultDimensions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Report" description="Build a custom report to analyze your data" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Revenue Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this report shows..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Select the metrics to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      config.metrics.includes(metric.key) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleMetric(metric.key)}
                  >
                    <Checkbox
                      checked={config.metrics.includes(metric.key)}
                      onCheckedChange={() => toggleMetric(metric.key)}
                    />
                    <div>
                      <p className="font-medium">{metric.label}</p>
                      <p className="text-xs text-muted-foreground">{metric.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
              <CardDescription>Group your data by these dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableDimensions.map((dimension) => (
                  <div
                    key={dimension.key}
                    className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      config.dimensions.includes(dimension.key) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleDimension(dimension.key)}
                  >
                    <Checkbox
                      checked={config.dimensions.includes(dimension.key)}
                      onCheckedChange={() => toggleDimension(dimension.key)}
                    />
                    <div>
                      <p className="font-medium">{dimension.label}</p>
                      <p className="text-xs text-muted-foreground">{dimension.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filters & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select
                    value={config.dateRange}
                    onValueChange={(value) => setConfig({ ...config, dateRange: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                      <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                      <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                      <SelectItem value="LAST_YEAR">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Select
                    value={config.sortOrder}
                    onValueChange={(value) => setConfig({ ...config, sortOrder: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESC">Descending</SelectItem>
                      <SelectItem value="ASC">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Row Limit</Label>
                <Input
                  type="number"
                  value={config.limit}
                  onChange={(e) => setConfig({ ...config, limit: parseInt(e.target.value) || 100 })}
                  min={1}
                  max={10000}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected Metrics</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {config.metrics.length > 0 ? (
                    config.metrics.map((m) => (
                      <span key={m} className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        {availableMetrics.find((met) => met.key === m)?.label || m}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Group By</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {config.dimensions.length > 0 ? (
                    config.dimensions.map((d) => (
                      <span key={d} className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {availableDimensions.find((dim) => dim.key === d)?.label || d}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No grouping</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                <p className="text-sm capitalize">{config.dateRange.toLowerCase().replace(/_/g, ' ')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePreview}
                disabled={isPreviewing || config.metrics.length === 0}
              >
                {isPreviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Preview Report
              </Button>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Report
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.back()}>
                Cancel
              </Button>
            </CardContent>
          </Card>

          {/* Preview Results */}
          {previewData && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Results</CardTitle>
                <CardDescription>
                  {previewData.rows?.length || 0} rows returned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-auto rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {previewData.columns?.map((col: any) => (
                          <th key={col.key} className="px-2 py-1 text-left font-medium">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows?.slice(0, 10).map((row: any, i: number) => (
                        <tr key={i} className="border-t">
                          {previewData.columns?.map((col: any) => (
                            <td key={col.key} className="px-2 py-1">
                              {row[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.rows?.length > 10 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Showing 10 of {previewData.rows.length} rows
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
