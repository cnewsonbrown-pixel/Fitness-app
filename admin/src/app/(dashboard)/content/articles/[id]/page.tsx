'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Eye, EyeOff, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingPage } from '@/components/layout/loading-page';
import { ErrorPage } from '@/components/layout/error-page';
import { StatusBadge } from '@/components/shared/status-badge';
import { articlesApi } from '@/lib/api/content.api';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-yellow-100 text-yellow-800',
};

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['articles', articleId],
    queryFn: () => articlesApi.getById(articleId),
  });

  const publishMutation = useMutation({
    mutationFn: () => articlesApi.publish(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', articleId] });
      toast.success('Article published');
    },
    onError: () => toast.error('Failed to publish article'),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => articlesApi.unpublish(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', articleId] });
      toast.success('Article unpublished');
    },
    onError: () => toast.error('Failed to unpublish article'),
  });

  if (isLoading) return <LoadingPage />;
  if (error || !article) return <ErrorPage message="Article not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={article.title} description="Article details">
          <div className="flex gap-2">
            {article.status === 'DRAFT' && (
              <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}
            {article.status === 'PUBLISHED' && (
              <Button
                variant="outline"
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/content/articles/${articleId}?edit=true`)}>
              Edit
            </Button>
          </div>
        </PageHeader>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {article.coverImageUrl && (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: article.content || '<p>No content</p>' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={article.status} colorMap={statusColors} />
              </div>

              {article.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{article.category}</p>
                </div>
              )}

              {article.excerpt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Excerpt</p>
                  <p className="text-sm">{article.excerpt}</p>
                </div>
              )}

              {article.tags && article.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(article.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{format(new Date(article.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
              {article.publishedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published</p>
                  <p className="text-sm">{format(new Date(article.publishedAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
