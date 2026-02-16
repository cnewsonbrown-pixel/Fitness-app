'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Plus, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/page-header';
import { MemberAvatar } from '@/components/shared/member-avatar';
import { scoringApi, ScoringRule, ScoringLeaderboardEntry } from '@/lib/api/crm.api';

export default function ScoringPage() {
  const router = useRouter();

  const { data: rules } = useQuery({
    queryKey: ['scoring', 'rules'],
    queryFn: () => scoringApi.getRules(),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['scoring', 'leaderboard'],
    queryFn: () => scoringApi.getLeaderboard({ limit: 10 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Lead Scoring" description="Configure scoring rules and view top members">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scoring Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Scoring Rules
            </CardTitle>
            <CardDescription>
              Define how members earn engagement points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rules && rules.length > 0 ? (
              <div className="space-y-4">
                {rules.map((rule: ScoringRule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Star className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          +{rule.points} points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch checked={rule.isActive} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No scoring rules configured</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Members
            </CardTitle>
            <CardDescription>
              Members with the highest engagement scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry: ScoringLeaderboardEntry, index: number) => (
                  <div
                    key={entry.memberId}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : index === 1
                            ? 'bg-gray-100 text-gray-800'
                            : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <Link
                          href={`/members/${entry.memberId}`}
                          className="font-medium hover:underline"
                        >
                          {entry.memberName}
                        </Link>
                        <p className="text-sm text-muted-foreground">{entry.memberEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No scored members yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Common Rules Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Rules</CardTitle>
          <CardDescription>Quick-add common scoring rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Class Attendance', points: 10, description: 'Per class attended' },
              { name: 'Referral', points: 50, description: 'For each referral' },
              { name: 'Membership Renewal', points: 25, description: 'On renewal' },
              { name: 'Profile Complete', points: 15, description: 'One-time bonus' },
            ].map((template) => (
              <div
                key={template.name}
                className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{template.name}</p>
                  <Badge variant="outline">+{template.points}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
