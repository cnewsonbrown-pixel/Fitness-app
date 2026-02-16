'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Megaphone, Send, Pause, Play, Mail, Users, MousePointer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { campaignsApi } from '@/lib/api/marketing.api';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaigns', campaignId],
    queryFn: () => campaignsApi.getById(campaignId),
  });

  const { data: stats } = useQuery({
    queryKey: ['campaigns', campaignId, 'stats'],
    queryFn: () => campaignsApi.getStats(campaignId),
    enabled: !!campaign && campaign.status !== 'DRAFT',
  });

  if (isLoading) return <LoadingPage />;
  if (error || !campaign) return <ErrorPage message="Campaign not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={campaign.name} description={`${campaign.type} campaign`}>
          <div className="flex gap-2">
            {campaign.status === 'DRAFT' && (
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
            )}
            {campaign.status === 'ACTIVE' && (
              <Button variant="outline">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {campaign.status === 'PAUSED' && (
              <Button variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/marketing/campaigns/${campaignId}?edit=true`)}>
              Edit
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Stats (if sent) */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Sent" value={stats.sent.toLocaleString()} icon={Send} />
          <StatCard title="Delivered" value={stats.delivered.toLocaleString()} icon={Mail} />
          <StatCard title="Open Rate" value={`${Math.round(stats.openRate)}%`} icon={Eye} />
          <StatCard title="Click Rate" value={`${Math.round(stats.clickRate)}%`} icon={MousePointer} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={campaign.status} colorMap={statusColors} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="capitalize">{campaign.type.toLowerCase()}</p>
              </div>
              {campaign.subject && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p>{campaign.subject}</p>
                </div>
              )}
              {campaign.scheduledAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled For</p>
                  <p>{format(new Date(campaign.scheduledAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              {campaign.sentAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent At</p>
                  <p>{format(new Date(campaign.sentAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.segment ? (
              <div>
                <p className="font-medium">{campaign.segment.name}</p>
                <p className="text-sm text-muted-foreground">{campaign.segment.memberCount} members</p>
              </div>
            ) : (
              <p className="text-muted-foreground">All members</p>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: campaign.content || '<p>No content</p>' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        {stats && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.sent.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.delivered.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.opened.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Opened</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.clicked.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.bounced.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Bounced</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.unsubscribed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Unsubscribed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
