'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Calendar, Award, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { membersApi } from '@/lib/api/members.api';
import { LIFECYCLE_STAGE_COLORS, MEMBERSHIP_STATUS_COLORS } from '@/config/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LifecycleStage } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const memberId = params.id as string;

  const { data: member, isLoading, error } = useQuery({
    queryKey: ['members', memberId],
    queryFn: () => membersApi.getById(memberId),
  });

  const { data: stats } = useQuery({
    queryKey: ['members', memberId, 'stats'],
    queryFn: () => membersApi.getStats(memberId),
    enabled: !!member,
  });

  const { data: memberships } = useQuery({
    queryKey: ['members', memberId, 'memberships'],
    queryFn: () => membersApi.getMemberships(memberId),
    enabled: !!member,
  });

  const updateLifecycleMutation = useMutation({
    mutationFn: (stage: LifecycleStage) => membersApi.updateLifecycleStage(memberId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', memberId] });
      toast.success('Lifecycle stage updated');
    },
    onError: () => {
      toast.error('Failed to update lifecycle stage');
    },
  });

  if (isLoading) return <LoadingPage />;
  if (error || !member) return <ErrorPage message="Member not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${member.firstName} ${member.lastName}`}
          description="Member profile and activity"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <MemberAvatar
              firstName={member.firstName}
              lastName={member.lastName}
              avatarUrl={member.avatarUrl}
              className="mx-auto h-24 w-24"
            />
            <CardTitle className="mt-4">
              {member.firstName} {member.lastName}
            </CardTitle>
            <CardDescription>
              <StatusBadge status={member.lifecycleStage} colorMap={LIFECYCLE_STAGE_COLORS} />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDate(member.createdAt)}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Lifecycle Stage</label>
              <Select
                value={member.lifecycleStage}
                onValueChange={(value) => updateLifecycleMutation.mutate(value as LifecycleStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="CHURNED">Churned</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">{member.pointBalance}</span>
                </div>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-2xl font-bold">{member.currentStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {member.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-medium">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {member.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Bookings" value={stats.totalBookings} />
              <StatCard title="Classes Attended" value={stats.attendedClasses} />
              <StatCard
                title="Attendance Rate"
                value={`${Math.round(stats.attendanceRate * 100)}%`}
              />
              <StatCard title="Total Spent" value={formatCurrency(stats.totalSpent)} />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="memberships">
            <TabsList>
              <TabsTrigger value="memberships">Memberships</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="memberships" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Memberships</CardTitle>
                </CardHeader>
                <CardContent>
                  {memberships && memberships.length > 0 ? (
                    <div className="space-y-4">
                      {memberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p className="font-medium">{membership.membershipType.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {membership.membershipType.type} &middot;{' '}
                              {formatCurrency(membership.membershipType.price)}
                              {membership.membershipType.billingPeriod && `/${membership.membershipType.billingPeriod.toLowerCase()}`}
                            </p>
                            {membership.creditsRemaining !== undefined && (
                              <p className="text-sm text-muted-foreground">
                                {membership.creditsRemaining} credits remaining
                              </p>
                            )}
                          </div>
                          <StatusBadge
                            status={membership.status}
                            colorMap={MEMBERSHIP_STATUS_COLORS}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No active memberships
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Bookings will appear here once connected to the API.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Activity timeline will appear here once connected to the API.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
