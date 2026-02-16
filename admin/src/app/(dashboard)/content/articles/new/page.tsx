'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { articlesApi, CreateArticleData } from '@/lib/api/content.api';

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
});

type CreateArticleForm = z.infer<typeof createArticleSchema>;

export default function NewArticlePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateArticleForm>({
    resolver: zodResolver(createArticleSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateArticleData) => articlesApi.create(data),
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created successfully');
      router.push(`/content/articles/${article.id}`);
    },
    onError: () => {
      toast.error('Failed to create article');
    },
  });

  const onSubmit = (data: CreateArticleForm) => {
    const articleData: CreateArticleData = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category,
      coverImageUrl: data.coverImageUrl || undefined,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : undefined,
      status: 'DRAFT',
    };
    createMutation.mutate(articleData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Create Article" description="Write a new article for your members" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
            <CardDescription>Basic information about your article</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} placeholder="Enter article title" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                placeholder="A brief summary of the article..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register('category')} placeholder="e.g., Nutrition" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" {...register('tags')} placeholder="e.g., health, fitness, tips" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                {...register('coverImageUrl')}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Write your article content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                id="content"
                {...register('content')}
                placeholder="Write your article content here. HTML formatting is supported."
                rows={20}
                className="font-mono text-sm"
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
              <p className="text-xs text-muted-foreground">
                HTML formatting is supported for rich content
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Article
          </Button>
        </div>
      </form>
    </div>
  );
}
