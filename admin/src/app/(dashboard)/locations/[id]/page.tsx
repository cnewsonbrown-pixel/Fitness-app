'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Users, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { locationsApi } from '@/lib/api/locations.api';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;

  const { data: location, isLoading, error } = useQuery({
    queryKey: ['locations', locationId],
    queryFn: () => locationsApi.getById(locationId),
  });

  const { data: stats } = useQuery({
    queryKey: ['locations', locationId, 'stats'],
    queryFn: () => locationsApi.getStats(locationId),
    enabled: !!location,
  });

  if (isLoading) return <LoadingPage />;
  if (error || !location) return <ErrorPage message="Location not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={location.name} description="Location details and statistics">
          <Button variant="outline" onClick={() => router.push(`/locations/${locationId}?edit=true`)}>
            Edit Location
          </Button>
        </PageHeader>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Members" value={stats.memberCount} icon={Users} />
          <StatCard title="Active Classes" value={stats.activeClassCount} icon={Calendar} />
          <StatCard title="Staff" value={stats.staffCount} icon={Users} />
          <StatCard title="Monthly Bookings" value={stats.monthlyBookings} icon={BookOpen} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{location.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p>{location.city}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Country</p>
                <p>{location.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                <p>{location.timezone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge
                  status={location.isActive ? 'ACTIVE' : 'INACTIVE'}
                  colorMap={{ ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Classes at this location will appear here once connected to the API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
