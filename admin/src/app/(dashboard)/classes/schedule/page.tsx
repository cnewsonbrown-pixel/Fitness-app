'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { classSessionsApi } from '@/lib/api/classes.api';
import { locationsApi } from '@/lib/api/locations.api';
import { ClassSession } from '@/types';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 7 PM

export default function ClassSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.list({ limit: 100 }),
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['class-sessions', 'schedule', { startDate: format(weekStart, 'yyyy-MM-dd'), endDate: format(weekEnd, 'yyyy-MM-dd'), locationId: locationFilter !== 'all' ? locationFilter : undefined }],
    queryFn: () =>
      classSessionsApi.getSchedule({
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        locationId: locationFilter !== 'all' ? locationFilter : undefined,
      }),
  });

  const sessionsByDay = useMemo(() => {
    if (!sessions) return {};
    const grouped: Record<string, ClassSession[]> = {};
    sessions.forEach((session) => {
      const dayKey = format(new Date(session.startTime), 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(session);
    });
    return grouped;
  }, [sessions]);

  const getSessionPosition = (session: ClassSession) => {
    const start = new Date(session.startTime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const top = ((hours - 6) * 60 + minutes) * (64 / 60); // 64px per hour
    const duration = session.classType?.duration || 60;
    const height = duration * (64 / 60);
    return { top, height };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Class Schedule" description="View and manage your weekly class schedule">
        <Link href="/classes/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Class
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
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
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b">
                <div className="w-16" /> {/* Time column */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'p-3 text-center border-l',
                      isSameDay(day, new Date()) && 'bg-primary/5'
                    )}
                  >
                    <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                    <p className={cn(
                      'text-lg font-semibold',
                      isSameDay(day, new Date()) && 'text-primary'
                    )}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div className="relative grid grid-cols-8">
                {/* Time labels */}
                <div className="w-16">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 border-b pr-2 text-right">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date().setHours(hour, 0), 'h a')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const daySessions = sessionsByDay[dayKey] || [];

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'relative border-l',
                        isSameDay(day, new Date()) && 'bg-primary/5'
                      )}
                    >
                      {/* Hour lines */}
                      {HOURS.map((hour) => (
                        <div key={hour} className="h-16 border-b" />
                      ))}

                      {/* Sessions */}
                      {daySessions.map((session) => {
                        const { top, height } = getSessionPosition(session);
                        return (
                          <Link
                            key={session.id}
                            href={`/classes/sessions/${session.id}`}
                            className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs overflow-hidden hover:ring-2 hover:ring-primary transition-shadow"
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: session.classType?.color ? `${session.classType.color}20` : '#6366f120',
                              borderLeft: `3px solid ${session.classType?.color || '#6366f1'}`,
                            }}
                          >
                            <p className="font-medium truncate">{session.classType?.name}</p>
                            <p className="text-muted-foreground truncate">
                              {format(new Date(session.startTime), 'h:mm a')}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
