'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { Heatmap } from '@/components/shared/heatmap';
import { analyticsApi } from '@/lib/api/analytics.api';
import { locationsApi } from '@/lib/api/locations.api';
import { classTypesApi } from '@/lib/api/classes.api';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 7 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PopularTimesPage() {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string>('all');
  const [classTypeId, setClassTypeId] = useState<string>('all');

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const { data: classTypes } = useQuery({
    queryKey: ['class-types'],
    queryFn: () => classTypesApi.list({ limit: 100 }),
  });

  const { data: popularTimes, isLoading } = useQuery({
    queryKey: ['analytics', 'popular-times', { locationId, classTypeId }],
    queryFn: () =>
      analyticsApi.getPopularTimes({
        locationId: locationId !== 'all' ? locationId : undefined,
        classTypeId: classTypeId !== 'all' ? classTypeId : undefined,
      }),
  });

  // Transform data for heatmap
  const heatmapData = popularTimes?.map((d) => ({
    x: d.hour - 6, // Offset to match HOURS array index
    y: d.dayOfWeek === 0 ? 6 : d.dayOfWeek - 1, // Convert Sunday=0 to Monday=0 format
    value: d.averageAttendance,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Popular Times" description="See when your gym is busiest" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Heatmap
            </CardTitle>
            <div className="flex gap-2">
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations?.data.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={classTypeId} onValueChange={setClassTypeId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classTypes?.data.map((classType) => (
                    <SelectItem key={classType.id} value={classType.id}>
                      {classType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Loading...
            </div>
          ) : heatmapData.length > 0 ? (
            <Heatmap
              data={heatmapData}
              xLabels={HOURS.map((h) => `${h}:00`)}
              yLabels={DAYS}
              valueFormatter={(v) => `${v} avg attendees`}
              cellSize={36}
            />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No data available for the selected filters
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Busiest Day</p>
              <p className="text-2xl font-bold">
                {popularTimes && popularTimes.length > 0
                  ? DAYS[
                      popularTimes.reduce((max, d) => (d.averageAttendance > max.averageAttendance ? d : max)).dayOfWeek === 0
                        ? 6
                        : popularTimes.reduce((max, d) => (d.averageAttendance > max.averageAttendance ? d : max)).dayOfWeek - 1
                    ]
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Peak Hour</p>
              <p className="text-2xl font-bold">
                {popularTimes && popularTimes.length > 0
                  ? `${popularTimes.reduce((max, d) => (d.averageAttendance > max.averageAttendance ? d : max)).hour}:00`
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Peak Attendance</p>
              <p className="text-2xl font-bold">
                {popularTimes && popularTimes.length > 0
                  ? Math.round(popularTimes.reduce((max, d) => (d.averageAttendance > max.averageAttendance ? d : max)).averageAttendance)
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
