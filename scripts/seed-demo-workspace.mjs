#!/usr/bin/env node
// TASK-035: thin CLI wrapper around POST /api/admin/seed-demo. The real work
// (provisioning/wiping the "Lumina Event Hosting & Production" demo workspace)
// lives in the backend's SeedDemoWorkspaceCommandHandler; this script only logs
// in as a SystemAdmin and calls it, so `npm run seed:demo-workspace` matches the
// task's own acceptance criteria without duplicating any seed logic in Node.
//
// Usage: npm run seed:demo-workspace
// Env vars (all optional, fall back to this project's known local dev seed
// account, see SalesDeskDbContextSeeder): API_BASE_URL, SEED_ADMIN_EMAIL,
// SEED_ADMIN_PASSWORD.

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5187';
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'superadmin@salesdesk.app';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Password123!';

async function main() {
  const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });

  if (!loginResponse.ok) {
    console.error(`Login failed (${loginResponse.status}). Set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD to a SystemAdmin account's credentials.`);
    process.exit(1);
  }

  const { token } = await loginResponse.json();

  const seedResponse = await fetch(`${apiBaseUrl}/api/admin/seed-demo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!seedResponse.ok) {
    const body = await seedResponse.text();
    console.error(`Seeding failed (${seedResponse.status}): ${body}`);
    process.exit(1);
  }

  const result = await seedResponse.json();

  console.log(result.wasReseed ? 'Demo workspace reseeded.' : 'Demo workspace created.');
  console.log(`  Login email:    ${result.loginEmail}`);
  console.log(`  Login password: ${result.loginPassword}`);
  console.log(`  Customers:      ${result.customersCreated}`);
  console.log(`  Documents:      ${result.documentsCreated}`);
}

main().catch((error) => {
  console.error('Could not reach the API. Is it running?', error.message);
  process.exit(1);
});
