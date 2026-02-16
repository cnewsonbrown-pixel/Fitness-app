'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Users, CheckCircle, Code, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { leadFormsApi, LeadFormSubmission } from '@/lib/api/marketing.api';

export default function LeadFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['lead-forms', formId],
    queryFn: () => leadFormsApi.getById(formId),
  });

  const { data: submissions } = useQuery({
    queryKey: ['lead-forms', formId, 'submissions'],
    queryFn: () => leadFormsApi.getSubmissions(formId, { limit: 50 }),
    enabled: !!form,
  });

  const { data: embedData } = useQuery({
    queryKey: ['lead-forms', formId, 'embed'],
    queryFn: () => leadFormsApi.getEmbedCode(formId),
    enabled: showEmbedCode,
  });

  const copyEmbedCode = () => {
    if (embedData?.embedCode) {
      navigator.clipboard.writeText(embedData.embedCode);
      toast.success('Embed code copied to clipboard');
    }
  };

  if (isLoading) return <LoadingPage />;
  if (error || !form) return <ErrorPage message="Form not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={form.name} description="Lead capture form details">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmbedCode(true)}>
              <Code className="mr-2 h-4 w-4" />
              Get Embed Code
            </Button>
            <Button variant="outline" onClick={() => router.push(`/marketing/lead-forms/${formId}?edit=true`)}>
              Edit Form
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Submissions" value={form.submissionCount || 0} icon={Users} />
        <StatCard
          title="Conversion Rate"
          value={form.conversionRate ? `${Math.round(form.conversionRate)}%` : '-'}
          icon={CheckCircle}
        />
        <StatCard title="Form Fields" value={form.fields?.length || 0} icon={FileText} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions?.pagination.total || 0})</TabsTrigger>
          {showEmbedCode && <TabsTrigger value="embed">Embed Code</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Form Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge
                    status={form.isActive ? 'ACTIVE' : 'INACTIVE'}
                    colorMap={{
                      ACTIVE: 'bg-green-100 text-green-800',
                      INACTIVE: 'bg-gray-100 text-gray-800',
                    }}
                  />
                </div>
                {form.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{form.description}</p>
                  </div>
                )}
                {form.thankYouMessage && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Thank You Message</p>
                    <p className="text-sm">{form.thankYouMessage}</p>
                  </div>
                )}
                {form.redirectUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Redirect URL</p>
                    <p className="text-sm text-primary">{form.redirectUrl}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {form.fields && form.fields.length > 0 ? (
                  <div className="space-y-3">
                    {form.fields.map((field: { id: string; label: string; type: string; required: boolean }) => (
                      <div key={field.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{field.label}</p>
                          <p className="text-sm text-muted-foreground capitalize">{field.type}</p>
                        </div>
                        {field.required && <Badge variant="secondary">Required</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No fields configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions?.data && submissions.data.length > 0 ? (
                <div className="space-y-4">
                  {submissions.data.map((submission: LeadFormSubmission) => (
                    <div key={submission.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(submission.submittedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                        {submission.converted ? (
                          <Badge variant="default">Converted</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(submission.data).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground capitalize">{key}</p>
                            <p className="text-sm">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No submissions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showEmbedCode && (
          <TabsContent value="embed" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Embed Code
                  <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm">
                  <code>{embedData?.embedCode || 'Loading...'}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
