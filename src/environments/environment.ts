// Development config, used by `ng serve` / `npm start`. Left empty so every
// service's `${environment.apiBaseUrl}/api/...` call resolves to a relative
// `/api/...` URL, which proxy.conf.json forwards to the local backend — no
// hardcoded `localhost:<port>` anywhere in application code (TASK-019 guardrail).
export const environment = {
  production: false,
  apiBaseUrl: ''
};
