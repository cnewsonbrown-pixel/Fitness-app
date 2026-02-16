import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Developer Portal Landing Page
 * Serves documentation links and API information
 */
router.get('/', (_req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  res.json({
    success: true,
    data: {
      name: 'FitStudio API',
      version: '1.0.0',
      description: 'API for gym and fitness studio management',
      documentation: {
        openapi: `${baseUrl}/api/docs`,
        postman: `${baseUrl}/api/developer/postman`,
      },
      authentication: {
        type: 'Bearer Token',
        description: 'Use JWT access tokens in Authorization header',
        example: 'Authorization: Bearer <access_token>',
        endpoints: {
          register: 'POST /api/v1/auth/register',
          login: 'POST /api/v1/auth/login',
          refresh: 'POST /api/v1/auth/refresh',
        },
      },
      apiKeys: {
        description: 'For Premium tier integrations',
        header: 'X-API-Key',
        endpoints: {
          create: 'POST /api/v1/api-keys',
          list: 'GET /api/v1/api-keys',
          rotate: 'POST /api/v1/api-keys/:id/rotate',
          revoke: 'DELETE /api/v1/api-keys/:id',
        },
      },
      webhooks: {
        description: 'Receive real-time event notifications',
        signatureHeader: 'X-FitStudio-Signature',
        algorithm: 'HMAC-SHA256',
        endpoints: {
          create: 'POST /api/v1/webhooks',
          list: 'GET /api/v1/webhooks',
          test: 'POST /api/v1/webhooks/:id/test',
        },
        events: [
          'member.created',
          'member.updated',
          'member.deleted',
          'booking.created',
          'booking.cancelled',
          'booking.checked_in',
          'class.created',
          'class.updated',
          'class.cancelled',
          'payment.succeeded',
          'payment.failed',
          'subscription.created',
          'subscription.cancelled',
        ],
      },
      rateLimits: {
        standard: '100 requests per 15 minutes',
        authenticated: '1000 requests per 15 minutes',
        apiKey: '10000 requests per hour',
      },
      resources: {
        tenants: '/api/v1/tenants',
        members: '/api/v1/members',
        memberships: '/api/v1/memberships',
        locations: '/api/v1/locations',
        classTypes: '/api/v1/class-types',
        classes: '/api/v1/classes',
        bookings: '/api/v1/bookings',
        staff: '/api/v1/staff',
        analytics: '/api/v1/analytics',
        billing: '/api/v1/billing',
        marketing: '/api/v1/marketing',
        crm: '/api/v1/crm',
        content: '/api/v1/content',
        gamification: '/api/v1/gamification',
        videos: '/api/v1/videos',
      },
      sdks: {
        javascript: 'Coming soon',
        python: 'Coming soon',
        ruby: 'Coming soon',
      },
      support: {
        email: 'api-support@fitstudio.io',
        documentation: 'https://docs.fitstudio.io',
      },
    },
  });
});

/**
 * Postman Collection Generator
 * Returns a Postman collection for easy API testing
 */
router.get('/postman', (_req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const collection = {
    info: {
      name: 'FitStudio API',
      description: 'API collection for FitStudio gym management platform',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{accessToken}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'baseUrl',
        value: baseUrl,
        type: 'string',
      },
      {
        key: 'accessToken',
        value: '',
        type: 'string',
      },
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Register',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'user@example.com',
                  password: 'SecurePassword123!',
                  firstName: 'John',
                  lastName: 'Doe',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/auth/register',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'auth', 'register'],
              },
            },
          },
          {
            name: 'Login',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'user@example.com',
                  password: 'SecurePassword123!',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/auth/login',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'auth', 'login'],
              },
            },
          },
          {
            name: 'Refresh Token',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  refreshToken: '{{refreshToken}}',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/auth/refresh',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'auth', 'refresh'],
              },
            },
          },
        ],
      },
      {
        name: 'Tenants',
        item: [
          {
            name: 'Create Tenant',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  name: 'My Fitness Studio',
                  slug: 'my-fitness-studio',
                  timezone: 'America/New_York',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/tenants',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'tenants'],
              },
            },
          },
          {
            name: 'Get Current Tenant',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/api/v1/tenants/me',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'tenants', 'me'],
              },
            },
          },
        ],
      },
      {
        name: 'Members',
        item: [
          {
            name: 'List Members',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/api/v1/members?page=1&limit=20',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'members'],
                query: [
                  { key: 'page', value: '1' },
                  { key: 'limit', value: '20' },
                ],
              },
            },
          },
          {
            name: 'Create Member',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'member@example.com',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  phone: '+1234567890',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/members',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'members'],
              },
            },
          },
        ],
      },
      {
        name: 'Classes',
        item: [
          {
            name: 'List Class Sessions',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/api/v1/classes?startDate={{startDate}}&endDate={{endDate}}',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'classes'],
                query: [
                  { key: 'startDate', value: '{{startDate}}' },
                  { key: 'endDate', value: '{{endDate}}' },
                ],
              },
            },
          },
          {
            name: 'Create Class Session',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  classTypeId: '{{classTypeId}}',
                  locationId: '{{locationId}}',
                  instructorId: '{{instructorId}}',
                  startTime: '2024-01-15T09:00:00Z',
                  endTime: '2024-01-15T10:00:00Z',
                  capacity: 20,
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/classes',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'classes'],
              },
            },
          },
        ],
      },
      {
        name: 'Bookings',
        item: [
          {
            name: 'Create Booking',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  classSessionId: '{{classSessionId}}',
                  memberId: '{{memberId}}',
                }, null, 2),
              },
              url: {
                raw: '{{baseUrl}}/api/v1/bookings',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'bookings'],
              },
            },
          },
          {
            name: 'Check In',
            request: {
              method: 'POST',
              url: {
                raw: '{{baseUrl}}/api/v1/bookings/{{bookingId}}/check-in',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'bookings', '{{bookingId}}', 'check-in'],
              },
            },
          },
        ],
      },
      {
        name: 'Analytics',
        item: [
          {
            name: 'Dashboard Metrics',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/api/v1/analytics/dashboard',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'analytics', 'dashboard'],
              },
            },
          },
          {
            name: 'Revenue Report',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/api/v1/analytics/reports/revenue?startDate={{startDate}}&endDate={{endDate}}',
                host: ['{{baseUrl}}'],
                path: ['api', 'v1', 'analytics', 'reports', 'revenue'],
                query: [
                  { key: 'startDate', value: '{{startDate}}' },
                  { key: 'endDate', value: '{{endDate}}' },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  res.json(collection);
});

/**
 * API Status endpoint
 */
router.get('/status', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: 'operational',
        cache: 'operational',
      },
    },
  });
});

export default router;
