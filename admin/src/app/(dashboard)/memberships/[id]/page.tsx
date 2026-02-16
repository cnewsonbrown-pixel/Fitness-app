'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Users, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { membershipTypesApi } from '@/lib/api/memberships.api';
import { formatCurrency } from '@/lib/utils';

const typeColors: Record<string, string> = {
  RECURRING: 'bg-blue-100 text-blue-800',
  CLASS_PACK: 'bg-purple-100 text-purple-800',
  DROP_IN: 'bg-green-100 text-green-800',
};

export default function MembershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const membershipId = params.id as string;

  const { data: membership, isLoading, error } = useQuery({
    queryKey: ['membership-types', membershipId],
    queryFn: () => membershipTypesApi.getById(membershipId),
  });

  const { data: stats } = useQuery({
    queryKey: ['membership-types', membershipId, 'stats'],
    queryFn: () => membershipTypesApi.getStats(membershipId),
    enabled: !!membership,
  });

  if (isLoading) return <LoadingPage />;
  if (error || !membership) return <ErrorPage message="Membership type not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={membership.name} description="Membership type details and statistics">
          <Button variant="outline" onClick={() => router.push(`/memberships/${membershipId}?edit=true`)}>
            Edit Membership
          </Button>
        </PageHeader>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Active Members" value={stats.activeCount} icon={Users} />
          <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} />
          <StatCard title="Avg. Retention" value={`${Math.round(stats.averageRetention)}%`} icon={Clock} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Membership Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <StatusBadge status={membership.type} colorMap={typeColors} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(membership.price)}
                  {membership.billingPeriod && `/${membership.billingPeriod.toLowerCase()}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Credits</p>
                <p>{membership.classCredits ? `${membership.classCredits} classes` : 'Unlimited'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge
                  status={membership.isActive ? 'ACTIVE' : 'INACTIVE'}
                  colorMap={{ ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-800' }}
                />
              </div>
            </div>
            {membership.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{membership.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card>
          <CardHeader>
            <CardTitle>Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Members with this membership will appear here once connected to the API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
