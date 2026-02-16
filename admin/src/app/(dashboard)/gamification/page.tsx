'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Trophy, Award, Target, Flame, Users, TrendingUp, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { pointsApi, badgesApi, challengesApi, streaksApi } from '@/lib/api/gamification.api';

export default function GamificationPage() {
  const { data: leaderboard } = useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: () => pointsApi.getLeaderboard({ limit: 5 }),
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesApi.list({ limit: 100 }),
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges', 'active'],
    queryFn: () => challengesApi.list({ status: 'ACTIVE', limit: 5 }),
  });

  const { data: streakStats } = useQuery({
    queryKey: ['streaks', 'stats'],
    queryFn: () => streaksApi.getStats(),
  });

  const quickLinks = [
    {
      title: 'Badges',
      description: 'Create and manage achievement badges',
      icon: Award,
      href: '/gamification/badges',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Challenges',
      description: 'Set up member challenges and competitions',
      icon: Target,
      href: '/gamification/challenges',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Points',
      description: 'Configure point rules and awards',
      icon: Star,
      href: '/gamification/points',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Streaks',
      description: 'Track member attendance streaks',
      icon: Flame,
      href: '/gamification/streaks',
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gamification"
        description="Engage members with points, badges, challenges, and streaks"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active Members"
          value={leaderboard?.length || 0}
          icon={<Users className="h-4 w-4" />}
          description="With points this month"
        />
        <StatCard
          title="Total Badges"
          value={badges?.data.length || 0}
          icon={<Award className="h-4 w-4" />}
          description="Available to earn"
        />
        <StatCard
          title="Active Challenges"
          value={challenges?.data.length || 0}
          icon={<Target className="h-4 w-4" />}
          description="Running now"
        />
        <StatCard
          title="Avg. Streak"
          value={`${streakStats?.averageStreak || 0} days`}
          icon={<Flame className="h-4 w-4" />}
          description="Across all members"
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className={`w-fit rounded-lg p-2 ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription className="mt-1">{link.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Members</CardTitle>
              <CardDescription>Points leaderboard this month</CardDescription>
            </div>
            <Link href="/gamification/points">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
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
                  <div className="flex-1">
                    <p className="font-medium">{entry.memberName}</p>
                    <p className="text-sm text-muted-foreground">{entry.totalPoints.toLocaleString()} pts</p>
                  </div>
                  {index < 3 && (
                    <Trophy
                      className={`h-5 w-5 ${
                        index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-500'
                      }`}
                    />
                  )}
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <p className="text-center text-muted-foreground py-4">No points earned yet this month</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Challenges</CardTitle>
              <CardDescription>Currently running challenges</CardDescription>
            </div>
            <Link href="/gamification/challenges/new">
              <Button size="sm">
                <Zap className="mr-2 h-4 w-4" />
                New Challenge
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {challenges?.data.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/gamification/challenges/${challenge.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{challenge.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{challenge.pointsReward} pts</p>
                      <p className="text-xs text-muted-foreground">{challenge.participantCount} joined</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, (challenge.completedCount / challenge.participantCount) * 100 || 0)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {challenge.completedCount} of {challenge.participantCount} completed
                    </p>
                  </div>
                </Link>
              ))}
              {(!challenges?.data || challenges.data.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No active challenges</p>
                  <Link href="/gamification/challenges/new">
                    <Button variant="link" className="mt-2">
                      Create your first challenge
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
