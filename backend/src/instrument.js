// This file must be required FIRST, before any other import, in the app's
// entry point (server.js) — that's how Sentry's auto-instrumentation for
// Express/Mongoose/HTTP hooks into modules before they're loaded elsewhere.
//
// Setup:
//   1. npm install @sentry/node --save
//   2. Create a free project at https://sentry.io (Node/Express platform)
//   3. Add SENTRY_DSN to your Render env vars (the DSN is safe to be public,
//      it's not a secret — but keep it in env vars for easy rotation)
//
// If SENTRY_DSN isn't set, this no-ops safely — nothing breaks locally
// without it configured.

const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Sample 100% of errors, but only a fraction of performance traces
    // to stay within the free tier's event quota.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [Sentry.expressIntegration()],
    // Don't send raw request bodies to Sentry — emergency reports contain
    // medical info, phone numbers, and location. Sentry gets the error
    // and stack trace, not the payload that triggered it.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },
  });
  console.log('Sentry error tracking enabled');
} else {
  console.log('SENTRY_DSN not set — error tracking disabled (set it in Render env vars to enable)');
}

module.exports = Sentry;
