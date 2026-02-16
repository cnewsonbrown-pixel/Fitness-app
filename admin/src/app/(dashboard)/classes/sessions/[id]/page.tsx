'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, User, Users, Clock, CheckCircle, XCircle, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { classSessionsApi, RosterMember, WaitlistMember } from '@/lib/api/classes.api';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const rosterStatusColors: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function ClassSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = params.id as string;
  const defaultTab = searchParams.get('tab') || 'details';

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['class-sessions', sessionId],
    queryFn: () => classSessionsApi.getById(sessionId),
  });

  const { data: roster } = useQuery({
    queryKey: ['class-sessions', sessionId, 'roster'],
    queryFn: () => classSessionsApi.getRoster(sessionId),
    enabled: !!session,
  });

  const { data: waitlist } = useQuery({
    queryKey: ['class-sessions', sessionId, 'waitlist'],
    queryFn: () => classSessionsApi.getWaitlist(sessionId),
    enabled: !!session,
  });

  const { data: stats } = useQuery({
    queryKey: ['class-sessions', sessionId, 'stats'],
    queryFn: () => classSessionsApi.getStats(sessionId),
    enabled: !!session,
  });

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => classSessionsApi.checkIn(sessionId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] });
      toast.success('Member checked in');
    },
    onError: () => toast.error('Failed to check in member'),
  });

  const noShowMutation = useMutation({
    mutationFn: (bookingId: string) => classSessionsApi.markNoShow(sessionId, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] });
      toast.success('Member marked as no-show');
    },
    onError: () => toast.error('Failed to mark no-show'),
  });

  const startMutation = useMutation({
    mutationFn: () => classSessionsApi.start(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] });
      toast.success('Class started');
    },
    onError: () => toast.error('Failed to start class'),
  });

  const completeMutation = useMutation({
    mutationFn: () => classSessionsApi.complete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] });
      toast.success('Class completed');
    },
    onError: () => toast.error('Failed to complete class'),
  });

  if (isLoading) return <LoadingPage />;
  if (error || !session) return <ErrorPage message="Class session not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={session.classType?.name || 'Class Session'}
          description={format(new Date(session.startTime), 'EEEE, MMMM d, yyyy')}
        >
          <div className="flex gap-2">
            {session.status === 'SCHEDULED' && (
              <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                <Play className="mr-2 h-4 w-4" />
                Start Class
              </Button>
            )}
            {session.status === 'IN_PROGRESS' && (
              <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                <Square className="mr-2 h-4 w-4" />
                Complete Class
              </Button>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Booked" value={stats.totalBooked} icon={Users} />
          <StatCard title="Checked In" value={stats.checkedIn} icon={CheckCircle} />
          <StatCard title="No Shows" value={stats.noShows} icon={XCircle} />
          <StatCard title="Fill Rate" value={`${Math.round(stats.fillRate)}%`} icon={Calendar} />
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="roster">Roster ({roster?.length || 0})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({waitlist?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-medium">{session.location?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                    <p className="font-medium">
                      {session.instructor
                        ? `${session.instructor.firstName} ${session.instructor.lastName}`
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="font-medium">{session.bookedCount || 0} / {session.capacity || session.classType?.capacity || 0}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={session.status} colorMap={statusColors} />
              </div>
              {session.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{session.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {roster && roster.length > 0 ? (
                <div className="space-y-3">
                  {roster.map((member: RosterMember) => (
                    <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.memberAvatar} />
                          <AvatarFallback>
                            {member.memberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.memberName}</p>
                          <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={member.status} colorMap={rosterStatusColors} />
                        {member.status === 'BOOKED' && session.status !== 'COMPLETED' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkInMutation.mutate(member.id)}
                              disabled={checkInMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => noShowMutation.mutate(member.id)}
                              disabled={noShowMutation.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No members booked yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Waitlist</CardTitle>
            </CardHeader>
            <CardContent>
              {waitlist && waitlist.length > 0 ? (
                <div className="space-y-3">
                  {waitlist.map((member: WaitlistMember) => (
                    <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {member.position}
                        </Badge>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.memberAvatar} />
                          <AvatarFallback>
                            {member.memberName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            Added {format(new Date(member.addedAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Promote
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No one on the waitlist.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
