'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, User, Clock, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatusBadge } from '@/components/shared/status-badge';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { Timeline } from '@/components/shared/timeline';
import { bookingsApi } from '@/lib/api/bookings.api';

const statusColors: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['bookings', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
  });

  const checkInMutation = useMutation({
    mutationFn: () => bookingsApi.checkIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] });
      toast.success('Member checked in');
    },
    onError: () => toast.error('Failed to check in'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] });
      toast.success('Booking cancelled');
    },
    onError: () => toast.error('Failed to cancel booking'),
  });

  const noShowMutation = useMutation({
    mutationFn: () => bookingsApi.markNoShow(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] });
      toast.success('Member marked as no-show');
    },
    onError: () => toast.error('Failed to mark no-show'),
  });

  if (isLoading) return <LoadingPage />;
  if (error || !booking) return <ErrorPage message="Booking not found" />;

  const timelineItems = [
    {
      id: 'booked',
      title: 'Booking Created',
      description: 'Member booked the class',
      timestamp: booking.bookedAt ? format(new Date(booking.bookedAt), 'MMM d, h:mm a') : 'Unknown',
      status: 'completed' as const,
    },
    ...(booking.checkedInAt
      ? [
          {
            id: 'checkedIn',
            title: 'Checked In',
            description: 'Member arrived and checked in',
            timestamp: format(new Date(booking.checkedInAt), 'MMM d, h:mm a'),
            status: 'completed' as const,
          },
        ]
      : []),
    ...(booking.cancelledAt
      ? [
          {
            id: 'cancelled',
            title: 'Cancelled',
            description: booking.cancellationReason || 'Booking was cancelled',
            timestamp: format(new Date(booking.cancelledAt), 'MMM d, h:mm a'),
            status: 'completed' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Booking Details" description={`Booking #${bookingId.slice(0, 8)}`}>
          {booking.status === 'BOOKED' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Check In
              </Button>
              <Button
                variant="outline"
                onClick={() => noShowMutation.mutate()}
                disabled={noShowMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                No Show
              </Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancel Booking
              </Button>
            </div>
          )}
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <MemberAvatar
                firstName={booking.member?.firstName || ''}
                lastName={booking.member?.lastName || ''}
                avatarUrl={booking.member?.avatarUrl}
                size="lg"
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {booking.member?.firstName} {booking.member?.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{booking.member?.email}</p>
                {booking.member?.phone && (
                  <p className="text-sm text-muted-foreground">{booking.member.phone}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push(`/members/${booking.member?.id}`)}>
                View Member Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: booking.classSession?.classType?.color
                    ? `${booking.classSession.classType.color}20`
                    : '#6366f120',
                }}
              >
                <Calendar
                  className="h-6 w-6"
                  style={{ color: booking.classSession?.classType?.color || '#6366f1' }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {booking.classSession?.classType?.name || 'Unknown Class'}
                </h3>
                <StatusBadge status={booking.status} colorMap={statusColors} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="text-sm">
                    {booking.classSession?.startTime
                      ? format(new Date(booking.classSession.startTime), 'EEEE, MMM d')
                      : 'Unknown'}
                  </p>
                  <p className="text-sm">
                    {booking.classSession?.startTime
                      ? format(new Date(booking.classSession.startTime), 'h:mm a')
                      : ''}{' '}
                    -{' '}
                    {booking.classSession?.endTime
                      ? format(new Date(booking.classSession.endTime), 'h:mm a')
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-sm">{booking.classSession?.location?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                  <p className="text-sm">
                    {booking.classSession?.instructor
                      ? `${booking.classSession.instructor.firstName} ${booking.classSession.instructor.lastName}`
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
              {booking.creditsUsed && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
                    <p className="text-sm">{booking.creditsUsed}</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => router.push(`/classes/sessions/${booking.classSession?.id}`)}
            >
              View Class Session
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Booking Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={timelineItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
