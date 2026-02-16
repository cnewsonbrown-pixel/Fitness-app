'use client';

import Link from 'next/link';
import { Code, Key, Webhook, Book, ExternalLink, Terminal, FileJson, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';

const resources = [
  {
    title: 'API Keys',
    description: 'Create and manage API keys for authentication',
    icon: Key,
    href: '/settings/api-keys',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Webhooks',
    description: 'Set up webhooks for real-time event notifications',
    icon: Webhook,
    href: '/settings/webhooks',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'API Documentation',
    description: 'Explore our comprehensive API reference',
    icon: Book,
    href: '/docs/api',
    external: true,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'SDK Downloads',
    description: 'Download official SDKs for various platforms',
    icon: Code,
    href: '/docs/sdks',
    external: true,
    color: 'bg-orange-100 text-orange-600',
  },
];

const codeExamples = [
  {
    title: 'Authentication',
    language: 'bash',
    code: `curl -X POST https://api.fitstudio.app/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "your_api_key"}'`,
  },
  {
    title: 'List Members',
    language: 'javascript',
    code: `const response = await fetch('https://api.fitstudio.app/v1/members', {
  headers: {
    'Authorization': 'Bearer your_token',
    'Content-Type': 'application/json'
  }
});
const members = await response.json();`,
  },
  {
    title: 'Create Booking',
    language: 'python',
    code: `import requests

response = requests.post(
    'https://api.fitstudio.app/v1/bookings',
    headers={'Authorization': 'Bearer your_token'},
    json={
        'member_id': 'mem_123',
        'class_session_id': 'cls_456'
    }
)`,
  },
];

export default function DeveloperPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Portal"
        description="Build integrations with the FitStudio API"
      >
        <Button asChild>
          <a href="https://docs.fitstudio.app" target="_blank" rel="noopener noreferrer">
            <Book className="mr-2 h-4 w-4" />
            View Docs
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </PageHeader>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resources.map((resource) => (
          <Link
            key={resource.href}
            href={resource.href}
            target={resource.external ? '_blank' : undefined}
            rel={resource.external ? 'noopener noreferrer' : undefined}
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className={`w-fit rounded-lg p-2 ${resource.color}`}>
                  <resource.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg flex items-center gap-1">
                  {resource.title}
                  {resource.external && <ExternalLink className="h-4 w-4" />}
                </CardTitle>
                <CardDescription className="mt-1">{resource.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* API Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>API Overview</CardTitle>
          </div>
          <CardDescription>Key information about the FitStudio API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="font-semibold">Base URL</h4>
              <code className="mt-1 block rounded bg-muted px-2 py-1 text-sm">
                https://api.fitstudio.app/v1
              </code>
            </div>
            <div>
              <h4 className="font-semibold">Authentication</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Bearer token in Authorization header
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Rate Limits</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                1,000 requests per minute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Quick Start Examples</CardTitle>
          </div>
          <CardDescription>Common API operations to get you started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {codeExamples.map((example) => (
            <div key={example.title}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{example.title}</h4>
                <span className="text-xs text-muted-foreground uppercase">{example.language}</span>
              </div>
              <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-50 overflow-x-auto">
                <code>{example.code}</code>
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Available Endpoints */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            <CardTitle>Available Endpoints</CardTitle>
          </div>
          <CardDescription>Main API resources and their endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { resource: 'Members', endpoints: ['GET /members', 'POST /members', 'GET /members/:id'] },
              { resource: 'Bookings', endpoints: ['GET /bookings', 'POST /bookings', 'DELETE /bookings/:id'] },
              { resource: 'Classes', endpoints: ['GET /class-types', 'GET /class-sessions', 'POST /class-sessions'] },
              { resource: 'Billing', endpoints: ['GET /payments', 'POST /payments', 'GET /subscriptions'] },
              { resource: 'Staff', endpoints: ['GET /staff', 'POST /staff', 'GET /staff/:id/schedule'] },
              { resource: 'Analytics', endpoints: ['GET /analytics/dashboard', 'GET /analytics/reports'] },
            ].map((group) => (
              <div key={group.resource} className="rounded-lg border p-4">
                <h4 className="font-semibold">{group.resource}</h4>
                <ul className="mt-2 space-y-1">
                  {group.endpoints.map((endpoint) => (
                    <li key={endpoint} className="text-sm text-muted-foreground font-mono">
                      {endpoint}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <a href="https://docs.fitstudio.app/api" target="_blank" rel="noopener noreferrer">
                View Full API Reference
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
