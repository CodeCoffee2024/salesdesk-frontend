// Production config, swapped in for environment.ts via angular.json's
// `fileReplacements` on `ng build --configuration production`.
//
// __API_BASE_URL__ is a literal placeholder, not a real fallback: the deploy
// workflow (.github/workflows/deploy-web.yml) replaces it with the
// NEXT_PUBLIC/VITE-equivalent build secret (API_BASE_URL) before building, so
// the production API domain is injected at build time rather than hardcoded
// here (TASK-019/TASK-020). If you see this literal string in a deployed
// build, the replacement step didn't run.
export const environment = {
  production: true,
  apiBaseUrl: '__API_BASE_URL__'
};
