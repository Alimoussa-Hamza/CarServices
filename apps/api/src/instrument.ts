import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

/**
 * Init Sentry only when SENTRY_DSN is set (no-op locally otherwise).
 * Must be imported before AppModule.
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        for (const key of ['phone', 'email', 'code', 'password']) {
          if (key in breadcrumb.data) {
            breadcrumb.data[key] = '[Filtered]';
          }
        }
      }
      return breadcrumb;
    },
  });
}
