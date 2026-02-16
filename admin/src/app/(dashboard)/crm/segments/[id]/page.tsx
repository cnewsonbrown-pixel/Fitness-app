'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Users, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { segmentsApi } from '@/lib/api/crm.api';
import { Member } from '@/types';

const operatorLabels: Record<string, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  greater_than: 'is greater than',
  less_than: 'is less than',
  in: 'is one of',
  not_in: 'is not one of',
};

export default function SegmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const segmentId = params.id as string;
  const [membersPage, setMembersPage] = useState(0);

  const { data: segment, isLoading, error } = useQuery({
    queryKey: ['segments', segmentId],
    queryFn: () => segmentsApi.getById(segmentId),
  });

  const { data: members } = useQuery({
    queryKey: ['segments', segmentId, 'members', { page: membersPage }],
    queryFn: () => segmentsApi.getMembers(segmentId, { page: membersPage + 1, limit: 20 }),
    enabled: !!segment,
  });

  const refreshMutation = useMutation({
    mutationFn: () => segmentsApi.refreshCount(segmentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['segments', segmentId] });
      toast.success(`Segment updated: ${data.count} members`);
    },
    onError: () => {
      toast.error('Failed to refresh segment');
    },
  });

  if (isLoading) return <LoadingPage />;
  if (error || !segment) return <ErrorPage message="Segment not found" />;

  const renderRule = (rule: Record<string, unknown>, depth = 0): React.ReactNode => {
    if ('logic' in rule && 'rules' in rule) {
      // It's a rule group
      const group = rule as { logic: string; rules: Record<string, unknown>[] };
      return (
        <div className={depth > 0 ? 'ml-4 border-l-2 pl-4' : ''}>
          <Badge variant="outline" className="mb-2">
            {group.logic}
          </Badge>
          {group.rules.map((r, i) => (
            <div key={i} className="mt-2">
              {renderRule(r, depth + 1)}
            </div>
          ))}
        </div>
      );
    } else {
      // It's a single rule
      const r = rule as { field: string; operator: string; value: unknown };
      return (
        <div className="flex items-center gap-2 py-1">
          <Badge variant="secondary">{r.field}</Badge>
          <span className="text-sm text-muted-foreground">
            {operatorLabels[r.operator] || r.operator}
          </span>
          <Badge variant="outline">{String(r.value)}</Badge>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={segment.name} description="Member segment details">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push(`/crm/segments/${segmentId}?edit=true`)}>
              Edit
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Members in Segment" value={segment.memberCount || 0} icon={Users} />
        <StatCard title="Rules" value={segment.rules ? 1 : 0} icon={Filter} />
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="members">Members ({members?.pagination.total || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Segment Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {segment.rules ? (
                renderRule(segment.rules)
              ) : (
                <p className="text-muted-foreground">No rules configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Members in Segment</CardTitle>
            </CardHeader>
            <CardContent>
              {members?.data && members.data.length > 0 ? (
                <div className="space-y-3">
                  {members.data.map((member: Member) => (
                    <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          firstName={member.firstName}
                          lastName={member.lastName}
                          avatarUrl={member.avatarUrl}
                        />
                        <div>
                          <Link href={`/members/${member.id}`} className="font-medium hover:underline">
                            {member.firstName} {member.lastName}
                          </Link>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {members.pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={membersPage === 0}
                        onClick={() => setMembersPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center text-sm text-muted-foreground">
                        Page {membersPage + 1} of {members.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={membersPage >= members.pagination.totalPages - 1}
                        onClick={() => setMembersPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No members in this segment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
