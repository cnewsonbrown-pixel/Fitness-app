'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trophy, Search, Plus, Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { pointsApi } from '@/lib/api/gamification.api';
import { membersApi } from '@/lib/api/members.api';

export default function PointsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [awardPoints, setAwardPoints] = useState(0);
  const [awardReason, setAwardReason] = useState('');

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: () => pointsApi.getLeaderboard({ limit: 50 }),
  });

  const { data: members } = useQuery({
    queryKey: ['members', 'search', searchQuery],
    queryFn: () => membersApi.list({ search: searchQuery, limit: 10 }),
    enabled: searchQuery.length > 2,
  });

  const awardMutation = useMutation({
    mutationFn: () =>
      pointsApi.award({
        memberId: selectedMemberId,
        points: awardPoints,
        reason: awardReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'leaderboard'] });
      toast.success('Points awarded successfully');
      setIsAwardOpen(false);
      setSelectedMemberId('');
      setAwardPoints(0);
      setAwardReason('');
    },
    onError: () => {
      toast.error('Failed to award points');
    },
  });

  const selectedMember = members?.data.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      <PageHeader title="Points" description="Manage points awards and view the leaderboard">
        <Dialog open={isAwardOpen} onOpenChange={setIsAwardOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Award Points
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Award Points</DialogTitle>
              <DialogDescription>Award points to a member manually</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Search Member</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-9"
                  />
                </div>
                {searchQuery.length > 2 && members?.data && (
                  <div className="mt-2 max-h-40 overflow-auto rounded-md border">
                    {members.data.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className={`flex w-full items-center gap-3 p-2 text-left hover:bg-muted ${
                          selectedMemberId === member.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => {
                          setSelectedMemberId(member.id);
                          setSearchQuery('');
                        }}
                      >
                        <MemberAvatar
                          name={`${member.firstName} ${member.lastName}`}
                          imageUrl={member.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </button>
                    ))}
                    {members.data.length === 0 && (
                      <p className="p-2 text-center text-sm text-muted-foreground">No members found</p>
                    )}
                  </div>
                )}
                {selectedMember && (
                  <div className="mt-2 flex items-center gap-3 rounded-md border bg-muted p-2">
                    <MemberAvatar
                      name={`${selectedMember.firstName} ${selectedMember.lastName}`}
                      imageUrl={selectedMember.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMemberId('')}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points to Award</Label>
                <Input
                  id="points"
                  type="number"
                  value={awardPoints}
                  onChange={(e) => setAwardPoints(parseInt(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder="e.g., Referral bonus"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAwardOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => awardMutation.mutate()}
                disabled={awardMutation.isPending || !selectedMemberId || awardPoints <= 0}
              >
                {awardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Award Points
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rules">Point Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Leaderboard</CardTitle>
              <CardDescription>Top members by total points earned</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard?.map((entry, index) => (
                    <div
                      key={entry.memberId}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
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
                      <MemberAvatar name={entry.memberName} size="md" />
                      <div className="flex-1">
                        <p className="font-medium">{entry.memberName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {entry.badgeCount || 0} badges
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {entry.totalPoints.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                      {index < 3 && (
                        <Trophy
                          className={`h-6 w-6 ${
                            index === 0
                              ? 'text-yellow-500'
                              : index === 1
                              ? 'text-gray-400'
                              : 'text-orange-500'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No points earned yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Point Rules</CardTitle>
              <CardDescription>How members can earn points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Class Attendance', points: 10, description: 'Awarded for each class attended' },
                  { action: 'First Class of the Day', points: 5, description: 'Bonus for attending early morning classes' },
                  { action: 'Weekly Streak', points: 25, description: 'Attending at least 3 classes in a week' },
                  { action: 'Monthly Goal', points: 100, description: 'Reaching monthly attendance target' },
                  { action: 'Referral', points: 200, description: 'When a referred member signs up' },
                  { action: 'Profile Completion', points: 50, description: 'One-time bonus for completing profile' },
                ].map((rule) => (
                  <div key={rule.action} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{rule.action}</p>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-bold text-primary">+{rule.points}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Point rules are configured in the system settings. Contact your administrator to modify these rules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
