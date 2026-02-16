'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Target,
  Users,
  Trophy,
  Calendar,
  Star,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { challengesApi } from '@/lib/api/gamification.api';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenges', params.id],
    queryFn: () => challengesApi.get(params.id as string),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['challenges', params.id, 'leaderboard'],
    queryFn: () => challengesApi.getLeaderboard(params.id as string, { limit: 10 }),
  });

  const activateMutation = useMutation({
    mutationFn: () => challengesApi.activate(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', params.id] });
      toast.success('Challenge activated');
      setShowActivateDialog(false);
    },
    onError: () => {
      toast.error('Failed to activate challenge');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => challengesApi.complete(params.id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', params.id] });
      toast.success('Challenge completed');
      setShowCompleteDialog(false);
    },
    onError: () => {
      toast.error('Failed to complete challenge');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Target className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Challenge not found</h3>
        <Button variant="link" onClick={() => router.push('/gamification/challenges')}>
          Back to Challenges
        </Button>
      </div>
    );
  }

  const completionRate =
    challenge.participantCount > 0 ? (challenge.completedCount / challenge.participantCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{challenge.name}</h1>
            <StatusBadge status={challenge.status} colorMap={statusColors} />
          </div>
          <p className="text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="flex gap-2">
          {challenge.status === 'DRAFT' && (
            <Button onClick={() => setShowActivateDialog(true)}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </Button>
          )}
          {challenge.status === 'ACTIVE' && (
            <Button variant="outline" onClick={() => setShowCompleteDialog(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/gamification/challenges/${challenge.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Participants"
          value={challenge.participantCount || 0}
          icon={<Users className="h-4 w-4" />}
          description="Members enrolled"
        />
        <StatCard
          title="Completed"
          value={challenge.completedCount || 0}
          icon={<Trophy className="h-4 w-4" />}
          description={`${completionRate.toFixed(1)}% completion rate`}
        />
        <StatCard
          title="Points Reward"
          value={challenge.pointsReward?.toLocaleString() || 0}
          icon={<Star className="h-4 w-4" />}
          description="Per completion"
        />
        <StatCard
          title="Duration"
          value={
            challenge.startDate
              ? `${format(new Date(challenge.startDate), 'MMM d')} - ${
                  challenge.endDate ? format(new Date(challenge.endDate), 'MMM d') : 'Ongoing'
                }`
              : 'Not set'
          }
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>Overall challenge completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {challenge.completedCount} of {challenge.participantCount} completed
              </span>
              <span className="font-medium">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="h-4 rounded-full bg-muted">
              <div
                className="h-4 rounded-full bg-primary transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Participants</CardTitle>
              <CardDescription>Leading members in this challenge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard?.map((entry, index) => (
                  <div key={entry.memberId} className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <MemberAvatar
                      name={entry.memberName}
                      imageUrl={entry.memberAvatar}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{entry.memberName}</p>
                      <p className="text-sm text-muted-foreground">
                        Progress: {entry.progress}%
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.completedAt ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Completed</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">In progress</span>
                      )}
                    </div>
                  </div>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No participants yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                  <dd className="mt-1 capitalize">{challenge.type?.toLowerCase().replace('_', ' ') || 'General'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Goal</dt>
                  <dd className="mt-1">{challenge.goal || 'Complete the challenge requirements'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Target Value</dt>
                  <dd className="mt-1">{challenge.targetValue || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Badge Reward</dt>
                  <dd className="mt-1">{challenge.badgeId ? 'Yes' : 'No badge'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1">
                    {challenge.createdAt && format(new Date(challenge.createdAt), 'PPP')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        title="Activate Challenge"
        description="Are you sure you want to activate this challenge? Members will be able to join and start participating."
        confirmLabel="Activate"
        onConfirm={() => activateMutation.mutate()}
        isLoading={activateMutation.isPending}
      />

      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Complete Challenge"
        description="Are you sure you want to complete this challenge? Points will be awarded to all members who completed the challenge."
        confirmLabel="Complete"
        onConfirm={() => completeMutation.mutate()}
        isLoading={completeMutation.isPending}
      />
    </div>
  );
}
