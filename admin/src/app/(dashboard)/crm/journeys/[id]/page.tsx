'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, Users, Play, Pause, TrendingUp, Mail, MessageSquare, Bell, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { journeysApi, JourneyStep } from '@/lib/api/crm.api';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
};

const stepIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-5 w-5" />,
  SMS: <MessageSquare className="h-5 w-5" />,
  PUSH: <Bell className="h-5 w-5" />,
  WAIT: <Clock className="h-5 w-5" />,
  CONDITION: <GitBranch className="h-5 w-5" />,
  ACTION: <Zap className="h-5 w-5" />,
};

const triggerLabels: Record<string, string> = {
  SIGNUP: 'New Signup',
  MEMBERSHIP_PURCHASE: 'Membership Purchase',
  CLASS_BOOKING: 'Class Booking',
  INACTIVITY: 'Inactivity',
  CUSTOM: 'Custom Trigger',
};

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const journeyId = params.id as string;

  const { data: journey, isLoading, error } = useQuery({
    queryKey: ['journeys', journeyId],
    queryFn: () => journeysApi.getById(journeyId),
  });

  const { data: stats } = useQuery({
    queryKey: ['journeys', journeyId, 'stats'],
    queryFn: () => journeysApi.getStats(journeyId),
    enabled: !!journey,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['journeys', journeyId, 'enrollments'],
    queryFn: () => journeysApi.getEnrollments(journeyId, { limit: 20 }),
    enabled: !!journey,
  });

  if (isLoading) return <LoadingPage />;
  if (error || !journey) return <ErrorPage message="Journey not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={journey.name} description={triggerLabels[journey.trigger] || journey.trigger}>
          <div className="flex gap-2">
            {journey.status === 'DRAFT' && (
              <Button>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {journey.status === 'ACTIVE' && (
              <Button variant="outline">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {journey.status === 'PAUSED' && (
              <Button>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/crm/journeys/${journeyId}?edit=true`)}>
              Edit
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Enrolled" value={stats.enrolled} icon={Users} />
          <StatCard title="Active" value={stats.active} icon={Play} />
          <StatCard title="Completed" value={stats.completed} icon={GitBranch} />
          <StatCard title="Conversion Rate" value={`${Math.round(stats.conversionRate)}%`} icon={TrendingUp} />
        </div>
      )}

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Steps ({journey.steps?.length || 0})</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments ({enrollments?.pagination.total || 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Journey Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {journey.steps && journey.steps.length > 0 ? (
                <div className="space-y-4">
                  {journey.steps.map((step: JourneyStep, index: number) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {stepIcons[step.type] || <Zap className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Step {index + 1}</span>
                          <StatusBadge
                            status={step.type}
                            colorMap={{
                              EMAIL: 'bg-blue-100 text-blue-800',
                              SMS: 'bg-green-100 text-green-800',
                              PUSH: 'bg-purple-100 text-purple-800',
                              WAIT: 'bg-yellow-100 text-yellow-800',
                              CONDITION: 'bg-orange-100 text-orange-800',
                              ACTION: 'bg-pink-100 text-pink-800',
                            }}
                          />
                        </div>
                        <p className="font-medium">{step.name}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No steps configured yet</p>
                  <Button>Add First Step</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments?.data && enrollments.data.length > 0 ? (
                <div className="space-y-3">
                  {enrollments.data.map((enrollment) => (
                    <div key={enrollment.memberId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{enrollment.memberName}</p>
                        <p className="text-sm text-muted-foreground">
                          Current step: {enrollment.currentStep}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No active enrollments</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Journey Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={journey.status} colorMap={statusColors} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trigger</p>
                <p>{triggerLabels[journey.trigger] || journey.trigger}</p>
              </div>
              {journey.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{journey.description}</p>
                </div>
              )}
              {journey.segment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Segment</p>
                  <p>{journey.segment.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
