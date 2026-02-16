import tracer from 'dd-trace';
import { config } from './index.js';

export const initDatadog = () => {
  if (!config.datadogEnabled) {
    console.log('Datadog not enabled, skipping initialization');
    return;
  }

  tracer.init({
    // Service name shown in Datadog APM
    service: 'fitstudio-api',

    // Environment tag
    env: config.env,

    // Version tag (use from package.json or git)
    version: process.env.npm_package_version || '1.0.0',

    // Enable runtime metrics
    runtimeMetrics: true,

    // Enable log injection for correlation
    logInjection: true,

    // Sample rate for traces (1.0 = 100%)
    sampleRate: config.env === 'production' ? 0.1 : 1.0,

    // Profiling configuration
    profiling: config.env === 'production',

    // Tags applied to all spans
    tags: {
      'app.type': 'api',
      'app.platform': 'fitstudio',
    },
  });

  console.log('Datadog APM initialized');
};

// Custom span wrapper for manual instrumentation
export const createSpan = <T>(
  operationName: string,
  fn: () => T | Promise<T>,
  options?: {
    service?: string;
    resource?: string;
    tags?: Record<string, string>;
  }
): T | Promise<T> => {
  const span = tracer.startSpan(operationName, {
    childOf: tracer.scope().active() || undefined,
    tags: {
      'service.name': options?.service || 'fitstudio-api',
      'resource.name': options?.resource || operationName,
      ...options?.tags,
    },
  });

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then((value) => {
          span.finish();
          return value;
        })
        .catch((error) => {
          span.setTag('error', true);
          span.setTag('error.message', error.message);
          span.setTag('error.stack', error.stack);
          span.finish();
          throw error;
        }) as T | Promise<T>;
    }

    span.finish();
    return result;
  } catch (error) {
    span.setTag('error', true);
    if (error instanceof Error) {
      span.setTag('error.message', error.message);
      span.setTag('error.stack', error.stack);
    }
    span.finish();
    throw error;
  }
};

// Add custom tags to the current active span
export const addSpanTags = (tags: Record<string, string | number | boolean>) => {
  const span = tracer.scope().active();
  if (span) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, value);
    });
  }
};

// Record a custom metric
export const recordMetric = (
  name: string,
  value: number,
  tags?: Record<string, string>
) => {
  // Datadog metrics are typically sent via StatsD
  // This is a placeholder for custom metric recording
  const span = tracer.scope().active();
  if (span) {
    span.setTag(`metric.${name}`, value);
    if (tags) {
      Object.entries(tags).forEach(([key, val]) => {
        span.setTag(`metric.${name}.${key}`, val);
      });
    }
  }
};

export { tracer };
