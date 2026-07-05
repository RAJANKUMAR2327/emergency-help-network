// Replaces app.json (delete app.json once this is in place — Expo uses
// whichever one exists, and having both causes confusing "which one wins"
// bugs). Static JSON can't read environment variables; this can.
//
// Why this matters: your Maps key was sitting in plain text in app.json,
// which is a committed file — anyone with repo access (or anyone who
// decompiles the built APK) had it. Moving it to an env var doesn't make
// the key secret in the built app (Android Maps keys are inherently
// client-embedded — that's normal), but it stops it from being casually
// copy-pasted from source, and — critically — makes it easy to rotate
// without a code change if it ever needs to be.
//
// You still MUST restrict this key in Google Cloud Console to your
// package name (com.rajankumar2327.emergencyhelpnetwork) + SHA1
// fingerprint. An unrestricted key is exploitable regardless of where it
// lives in your codebase.
//
// Local dev: create mobile/.env (gitignored, see .env.example for the
// format) with GOOGLE_MAPS_API_KEY=<your key>.
// EAS builds: run once —
//   eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value <your key>
// EAS automatically injects project secrets as env vars during the build,
// no further config needed.

require('dotenv').config();

module.exports = {
  expo: {
    name: 'Emergency Help Network',
    slug: 'emergency-help-network',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
    },
    android: {
      package: 'com.rajankumar2327.emergencyhelpnetwork',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '0a892d7f-080f-4f1c-967e-13707fa5ae18',
      },
    },
  },
};
