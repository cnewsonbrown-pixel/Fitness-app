'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Save,
  Loader2,
  LayoutDashboard,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table,
  Hash,
  Trash2,
  Settings,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import {
  customDashboardsApi,
  analyticsMetadataApi,
  DashboardWidget,
  CreateDashboardData,
} from '@/lib/api/custom-analytics.api';

const widgetTypes = [
  { type: 'METRIC', label: 'Metric', icon: Hash, description: 'Single value with comparison' },
  { type: 'LINE_CHART', label: 'Line Chart', icon: LineChartIcon, description: 'Trend over time' },
  { type: 'BAR_CHART', label: 'Bar Chart', icon: BarChart2, description: 'Compare categories' },
  { type: 'PIE_CHART', label: 'Pie Chart', icon: PieChartIcon, description: 'Show proportions' },
  { type: 'TABLE', label: 'Table', icon: Table, description: 'Detailed data view' },
];

export default function DashboardBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const dashboardId = searchParams.get('id');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [newWidget, setNewWidget] = useState<Partial<DashboardWidget>>({
    type: 'METRIC',
    title: '',
    config: {
      dateRange: 'LAST_30_DAYS',
      comparison: 'PREVIOUS_PERIOD',
    },
    position: { x: 0, y: 0, w: 1, h: 1 },
  });

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['custom-dashboards', dashboardId],
    queryFn: () => customDashboardsApi.get(dashboardId as string),
    enabled: !!dashboardId,
  });

  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: () => analyticsMetadataApi.getMetrics(),
  });

  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name);
      setDescription(dashboard.description || '');
      setWidgets(dashboard.widgets || []);
    }
  }, [dashboard]);

  const saveMutation = useMutation({
    mutationFn: (data: CreateDashboardData) =>
      dashboardId
        ? customDashboardsApi.update(dashboardId, data)
        : customDashboardsApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
      toast.success(dashboardId ? 'Dashboard updated' : 'Dashboard created');
      if (!dashboardId) {
        router.push(`/custom-analytics/builder?id=${result.id}`);
      }
    },
    onError: () => {
      toast.error('Failed to save dashboard');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a dashboard name');
      return;
    }
    saveMutation.mutate({ name, description, widgets });
  };

  const handleAddWidget = () => {
    if (!newWidget.title?.trim()) {
      toast.error('Please enter a widget title');
      return;
    }

    const widget: DashboardWidget = {
      id: editingWidget?.id || `widget-${Date.now()}`,
      type: newWidget.type as DashboardWidget['type'],
      title: newWidget.title,
      config: newWidget.config || { dateRange: 'LAST_30_DAYS' },
      position: editingWidget?.position || {
        x: (widgets.length % 3) * 4,
        y: Math.floor(widgets.length / 3) * 4,
        w: newWidget.type === 'METRIC' ? 1 : 2,
        h: newWidget.type === 'METRIC' ? 1 : 2,
      },
    };

    if (editingWidget) {
      setWidgets(widgets.map((w) => (w.id === editingWidget.id ? widget : w)));
    } else {
      setWidgets([...widgets, widget]);
    }

    setShowWidgetDialog(false);
    setEditingWidget(null);
    setNewWidget({
      type: 'METRIC',
      title: '',
      config: { dateRange: 'LAST_30_DAYS', comparison: 'PREVIOUS_PERIOD' },
      position: { x: 0, y: 0, w: 1, h: 1 },
    });
  };

  const handleEditWidget = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setNewWidget(widget);
    setShowWidgetDialog(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter((w) => w.id !== widgetId));
  };

  if (isLoading && dashboardId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/custom-analytics')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dashboard Name"
            className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="text-muted-foreground border-none shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
          />
        </div>
        <Button variant="outline" onClick={() => setShowWidgetDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Widget
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Widget Grid */}
      {widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No widgets yet</h3>
            <p className="text-muted-foreground">Add widgets to build your custom dashboard</p>
            <Button className="mt-4" onClick={() => setShowWidgetDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <Card key={widget.id} className="relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditWidget(widget)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteWidget(widget.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex h-24 items-center justify-center rounded-lg bg-muted">
                  {widget.type === 'METRIC' && <Hash className="h-8 w-8 text-muted-foreground" />}
                  {widget.type === 'LINE_CHART' && <LineChartIcon className="h-8 w-8 text-muted-foreground" />}
                  {widget.type === 'BAR_CHART' && <BarChart2 className="h-8 w-8 text-muted-foreground" />}
                  {widget.type === 'PIE_CHART' && <PieChartIcon className="h-8 w-8 text-muted-foreground" />}
                  {widget.type === 'TABLE' && <Table className="h-8 w-8 text-muted-foreground" />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {widget.config.metric || 'No metric selected'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Widget Dialog */}
      <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWidget ? 'Edit Widget' : 'Add Widget'}</DialogTitle>
            <DialogDescription>Configure your dashboard widget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {widgetTypes.map((wt) => (
                  <button
                    key={wt.type}
                    type="button"
                    onClick={() => setNewWidget({ ...newWidget, type: wt.type as DashboardWidget['type'] })}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      newWidget.type === wt.type ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <wt.icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{wt.label}</p>
                      <p className="text-xs text-muted-foreground">{wt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="widgetTitle">Widget Title</Label>
              <Input
                id="widgetTitle"
                value={newWidget.title || ''}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                placeholder="e.g., Total Revenue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <Select
                value={newWidget.config?.metric || ''}
                onValueChange={(value) =>
                  setNewWidget({
                    ...newWidget,
                    config: { ...newWidget.config, metric: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics?.map((metric) => (
                    <SelectItem key={metric.key} value={metric.key}>
                      {metric.label}
                    </SelectItem>
                  )) || (
                    <>
                      <SelectItem value="total_revenue">Total Revenue</SelectItem>
                      <SelectItem value="active_members">Active Members</SelectItem>
                      <SelectItem value="new_signups">New Signups</SelectItem>
                      <SelectItem value="class_attendance">Class Attendance</SelectItem>
                      <SelectItem value="retention_rate">Retention Rate</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select
                value={newWidget.config?.dateRange || 'LAST_30_DAYS'}
                onValueChange={(value) =>
                  setNewWidget({
                    ...newWidget,
                    config: { ...newWidget.config, dateRange: value as any },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                  <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                  <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newWidget.type === 'METRIC' && (
              <div className="space-y-2">
                <Label htmlFor="comparison">Comparison</Label>
                <Select
                  value={newWidget.config?.comparison || 'PREVIOUS_PERIOD'}
                  onValueChange={(value) =>
                    setNewWidget({
                      ...newWidget,
                      config: { ...newWidget.config, comparison: value as any },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVIOUS_PERIOD">Previous Period</SelectItem>
                    <SelectItem value="PREVIOUS_YEAR">Previous Year</SelectItem>
                    <SelectItem value="NONE">No Comparison</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWidgetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget}>
              {editingWidget ? 'Update Widget' : 'Add Widget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
