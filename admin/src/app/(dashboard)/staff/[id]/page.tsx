'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ArrowLeft, User, Briefcase, Clock, DollarSign, Calendar, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { BarChart } from '@/components/shared/bar-chart';
import { staffApi, AvailabilitySlot, Certification, ScheduledShift } from '@/lib/api/staff.api';
import { formatCurrency } from '@/lib/utils';

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  INSTRUCTOR: 'bg-green-100 text-green-800',
  FRONT_DESK: 'bg-yellow-100 text-yellow-800',
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = params.id as string;
  const defaultTab = searchParams.get('tab') || 'info';

  const { data: staff, isLoading, error } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: () => staffApi.getById(staffId),
  });

  const { data: availability } = useQuery({
    queryKey: ['staff', staffId, 'availability'],
    queryFn: () => staffApi.getAvailability(staffId),
    enabled: !!staff,
  });

  const { data: certifications } = useQuery({
    queryKey: ['staff', staffId, 'certifications'],
    queryFn: () => staffApi.getCertifications(staffId),
    enabled: !!staff,
  });

  const { data: paySummary } = useQuery({
    queryKey: ['staff', staffId, 'pay', 'summary'],
    queryFn: () => staffApi.getPaySummary(staffId),
    enabled: !!staff,
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: schedule } = useQuery({
    queryKey: ['staff', staffId, 'schedule', { start: weekStart, end: weekEnd }],
    queryFn: () =>
      staffApi.getSchedule(staffId, {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
      }),
    enabled: !!staff,
  });

  const { data: metrics } = useQuery({
    queryKey: ['staff', staffId, 'metrics'],
    queryFn: () => staffApi.getMetrics(staffId),
    enabled: !!staff,
  });

  if (isLoading) return <LoadingPage />;
  if (error || !staff) return <ErrorPage message="Staff member not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${staff.user?.firstName} ${staff.user?.lastName}`}
          description="Staff member profile"
        >
          <Button variant="outline" onClick={() => router.push(`/staff/${staffId}?edit=true`)}>
            Edit Profile
          </Button>
        </PageHeader>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={staff.user?.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {staff.user?.firstName?.[0]}
                {staff.user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {staff.user?.firstName} {staff.user?.lastName}
                </h2>
                <StatusBadge status={staff.role} colorMap={roleColors} />
              </div>
              <p className="text-muted-foreground">{staff.user?.email}</p>
              {staff.bio && <p className="mt-2 text-sm">{staff.bio}</p>}
              {staff.specialties && staff.specialties.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {staff.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {paySummary && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="text-2xl font-bold">{formatCurrency(paySummary.currentPeriodPay)}</p>
                <p className="text-sm text-muted-foreground">{paySummary.currentPeriodHours} hours</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="pay">Pay</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{staff.user?.email}</p>
                </div>
                {staff.user?.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{staff.user.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <StatusBadge status={staff.role} colorMap={roleColors} />
                </div>
                {staff.hourlyRate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                    <p className="text-lg font-semibold">{formatCurrency(staff.hourlyRate)}/hr</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge
                    status={staff.isActive ? 'ACTIVE' : 'INACTIVE'}
                    colorMap={{
                      ACTIVE: 'bg-green-100 text-green-800',
                      INACTIVE: 'bg-gray-100 text-gray-800',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availability && availability.length > 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                    const daySlots = availability.filter(
                      (slot: AvailabilitySlot) => slot.dayOfWeek === dayOfWeek
                    );
                    return (
                      <div key={dayOfWeek} className="flex items-center py-2 border-b last:border-0">
                        <p className="w-28 font-medium">{dayNames[dayOfWeek]}</p>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.length > 0 ? (
                            daySlots.map((slot: AvailabilitySlot) => (
                              <Badge key={slot.id} variant="secondary">
                                {slot.startTime} - {slot.endTime}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Not available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No availability set. Click Edit to configure.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certifications && certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.map((cert: Certification) => (
                    <div key={cert.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuingOrganization}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {format(new Date(cert.issueDate), 'MMM d, yyyy')}
                          {cert.expiryDate && ` · Expires: ${format(new Date(cert.expiryDate), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      {cert.expiryDate && new Date(cert.expiryDate) < new Date() ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No certifications on file.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pay" className="mt-6">
          {paySummary && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard title="Current Period Hours" value={paySummary.currentPeriodHours} icon={Clock} />
                <StatCard title="Current Period Pay" value={formatCurrency(paySummary.currentPeriodPay)} icon={DollarSign} />
                <StatCard title="YTD Hours" value={paySummary.ytdHours} icon={Clock} />
                <StatCard title="YTD Pay" value={formatCurrency(paySummary.ytdPay)} icon={DollarSign} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pay Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Detailed pay history will appear here once connected to the API.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Week's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedule && schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.map((shift: ScheduledShift) => (
                    <div key={shift.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">
                          {shift.type === 'CLASS' ? shift.className : 'Shift'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(shift.date), 'EEEE, MMM d')} · {shift.startTime} - {shift.endTime}
                        </p>
                        <p className="text-xs text-muted-foreground">{shift.locationName}</p>
                      </div>
                      <Badge variant={shift.type === 'CLASS' ? 'default' : 'secondary'}>
                        {shift.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No scheduled shifts this week.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          {metrics && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <StatCard title="Total Classes" value={metrics.totalClasses} icon={Calendar} />
                <StatCard title="Total Hours" value={metrics.totalHours} icon={Clock} />
                <StatCard title="Avg. Attendance" value={`${Math.round(metrics.averageAttendance)}%`} icon={BarChart3} />
                <StatCard title="Member Rating" value={metrics.memberRating.toFixed(1)} icon={Award} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.popularClasses && metrics.popularClasses.length > 0 ? (
                    <BarChart
                      data={metrics.popularClasses}
                      xKey="classTypeName"
                      bars={[{ dataKey: 'count', name: 'Classes Taught', color: '#6366f1' }]}
                      height={250}
                      layout="vertical"
                    />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No class data available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
