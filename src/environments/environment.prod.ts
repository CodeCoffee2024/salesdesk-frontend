// Production config, swapped in for environment.ts via angular.json's
// `fileReplacements` on `ng build --configuration production`.
//
// __API_BASE_URL__ and __GA_MEASUREMENT_ID__ are literal placeholders, not
// real fallbacks: vercel.json's buildCommand sed-replaces them with the
// Vercel project env vars (API_BASE_URL, GA_MEASUREMENT_ID) before building,
// so the production API domain and GA4 property ID are injected at build
// time rather than hardcoded here (TASK-019/TASK-020, TASK-032). If you see
// either literal string in a deployed build, the replacement step didn't run
// — GA_MEASUREMENT_ID is optional, though: AnalyticsService just no-ops if
// it's still the placeholder or empty, so leaving it unset doesn't break
// anything, it just means no analytics.
export const environment = {
  production: true,
  apiBaseUrl: '__API_BASE_URL__',
  gaMeasurementId: '__GA_MEASUREMENT_ID__'
};
