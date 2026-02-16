'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { templatesApi, EmailTemplate } from '@/lib/api/crm.api';

export default function TemplatesPage() {
  const [search, setSearch] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list(),
  });

  const filteredTemplates = templates?.filter(
    (t: EmailTemplate) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTemplates = filteredTemplates?.reduce((acc: Record<string, EmailTemplate[]>, template: EmailTemplate) => {
    const category = template.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Email Templates" description="Reusable email templates for campaigns and journeys">
        <Link href="/crm/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </Link>
      </PageHeader>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading templates...
        </div>
      ) : groupedTemplates && Object.keys(groupedTemplates).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">{category}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(categoryTemplates as EmailTemplate[]).map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        Subject: {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create reusable email templates to use in campaigns and journeys
            </p>
            <Link href="/crm/templates/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
