'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Dumbbell, Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatusBadge } from '@/components/shared/status-badge';
import { classTypesApi } from '@/lib/api/classes.api';

export default function ClassTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classTypeId = params.id as string;

  const { data: classType, isLoading, error } = useQuery({
    queryKey: ['class-types', classTypeId],
    queryFn: () => classTypesApi.getById(classTypeId),
  });

  if (isLoading) return <LoadingPage />;
  if (error || !classType) return <ErrorPage message="Class type not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={classType.name} description="Class type details and settings">
          <Button variant="outline" onClick={() => router.push(`/classes/types/${classTypeId}?edit=true`)}>
            Edit Class Type
          </Button>
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Class Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl"
                style={{ backgroundColor: classType.color ? `${classType.color}20` : '#6366f120' }}
              >
                <Dumbbell
                  className="h-8 w-8"
                  style={{ color: classType.color || '#6366f1' }}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{classType.name}</h3>
                <StatusBadge
                  status={classType.isActive ? 'ACTIVE' : 'INACTIVE'}
                  colorMap={{ ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800' }}
                />
              </div>
            </div>

            {classType.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{classType.description}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{classType.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold">{classType.capacity} spots</p>
                </div>
              </div>
            </div>

            {classType.requiredCertifications && classType.requiredCertifications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Required Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {classType.requiredCertifications.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Upcoming class sessions will appear here once connected to the API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
