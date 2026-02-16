import * as Sentry from '@sentry/node';
import { config } from './index.js';

export const initSentry = () => {
  if (!config.sentryDsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.env,

    // Performance Monitoring
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,

    // Set sampling rate for profiling
    profilesSampleRate: config.env === 'production' ? 0.1 : 1.0,

    // Filter out health check noise
    beforeSend(event) {
      // Don't send events for health check endpoints
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },

    // Capture unhandled promise rejections
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
  });

  console.log('Sentry initialized');
};

export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error: Error & { status?: number }) {
    // Capture 500 errors and above
    if (error.status !== undefined) {
      return error.status >= 500;
    }
    return true;
  },
});

export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  // Include user context
  user: ['id', 'email'],
});

// Helper to capture exceptions with context
export const captureException = (
  error: Error,
  context?: {
    user?: { id: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) => {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

// Helper to capture messages
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
};

// Set user context for the current scope
export const setUserContext = (user: { id: string; email?: string; tenantId?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
  if (user.tenantId) {
    Sentry.setTag('tenantId', user.tenantId);
  }
};

// Clear user context
export const clearUserContext = () => {
  Sentry.setUser(null);
};

export { Sentry };
