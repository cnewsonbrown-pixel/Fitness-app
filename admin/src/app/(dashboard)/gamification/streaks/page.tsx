'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame, TrendingUp, Users, Calendar, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { streaksApi } from '@/lib/api/gamification.api';

export default function StreaksPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['streaks', 'stats'],
    queryFn: () => streaksApi.getStats(),
  });

  const { data: topStreaks, isLoading: streaksLoading } = useQuery({
    queryKey: ['streaks', 'top'],
    queryFn: () => streaksApi.getTopStreaks({ limit: 20 }),
  });

  const { data: atRisk } = useQuery({
    queryKey: ['streaks', 'at-risk'],
    queryFn: () => streaksApi.getAtRisk({ limit: 10 }),
  });

  const isLoading = statsLoading || streaksLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Streaks"
        description="Track member attendance streaks and engagement patterns"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active Streaks"
          value={stats?.activeStreaks || 0}
          icon={<Flame className="h-4 w-4" />}
          description="Members with active streaks"
        />
        <StatCard
          title="Average Streak"
          value={`${stats?.averageStreak || 0} days`}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Across all members"
        />
        <StatCard
          title="Longest Streak"
          value={`${stats?.longestStreak || 0} days`}
          icon={<Trophy className="h-4 w-4" />}
          description="Current record"
        />
        <StatCard
          title="At Risk"
          value={atRisk?.length || 0}
          icon={<Users className="h-4 w-4" />}
          description="Streaks ending today"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Top Streaks
            </CardTitle>
            <CardDescription>Members with the longest active streaks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {topStreaks?.map((streak, index) => (
                  <div key={streak.memberId} className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-orange-100 text-orange-700'
                          : index === 1
                          ? 'bg-orange-50 text-orange-600'
                          : index === 2
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <MemberAvatar
                      name={streak.memberName}
                      imageUrl={streak.memberAvatar}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{streak.memberName}</p>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(streak.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame
                        className={`h-5 w-5 ${
                          streak.currentStreak >= 30
                            ? 'text-orange-500'
                            : streak.currentStreak >= 14
                            ? 'text-yellow-500'
                            : 'text-gray-400'
                        }`}
                      />
                      <span className="text-lg font-bold">{streak.currentStreak}</span>
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                ))}
                {(!topStreaks || topStreaks.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No active streaks</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              At Risk
            </CardTitle>
            <CardDescription>Streaks that will end if no activity today</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {atRisk?.map((streak) => (
                  <div
                    key={streak.memberId}
                    className="flex items-center gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                  >
                    <MemberAvatar
                      name={streak.memberName}
                      imageUrl={streak.memberAvatar}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{streak.memberName}</p>
                      <p className="text-sm text-yellow-700">
                        {streak.currentStreak} day streak at risk
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Flame className="h-4 w-4" />
                      <span className="font-bold">{streak.currentStreak}</span>
                    </div>
                  </div>
                ))}
                {(!atRisk || atRisk.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No streaks at risk today</p>
                    <p className="text-sm text-green-600 mt-1">All members are on track!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Streak Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Streak Milestones</CardTitle>
          <CardDescription>Rewards for maintaining attendance streaks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { days: 7, name: 'Week Warrior', points: 50, color: 'bg-blue-100 text-blue-700' },
              { days: 14, name: 'Fortnight Fighter', points: 100, color: 'bg-green-100 text-green-700' },
              { days: 30, name: 'Monthly Master', points: 250, color: 'bg-purple-100 text-purple-700' },
              { days: 90, name: 'Quarterly Champion', points: 750, color: 'bg-orange-100 text-orange-700' },
            ].map((milestone) => (
              <div key={milestone.days} className={`rounded-lg p-4 ${milestone.color}`}>
                <div className="flex items-center justify-between">
                  <Flame className="h-6 w-6" />
                  <span className="text-2xl font-bold">{milestone.days}</span>
                </div>
                <p className="mt-2 font-semibold">{milestone.name}</p>
                <p className="text-sm opacity-80">+{milestone.points} points</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
