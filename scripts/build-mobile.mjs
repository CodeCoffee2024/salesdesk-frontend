#!/usr/bin/env node
// Builds the production Angular bundle and syncs it into the Capacitor native
// projects (android/, ios/). Vercel's own build substitutes environment.prod.ts's
// __API_BASE_URL__/__GA_MEASUREMENT_ID__ placeholders at deploy time (see
// vercel.json); this script does the same substitution locally, since a native
// app build isn't going through that pipeline, then restores the placeholders
// afterward so the committed files never carry a hardcoded URL.
//
// Usage: npm run cap:sync
// Env var (optional): MOBILE_API_BASE_URL, defaults to the deployed production API.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const API_BASE_URL = process.env.MOBILE_API_BASE_URL || 'https://salesdesk-api.codekopi.com';
const ENV_FILE = 'src/environments/environment.prod.ts';
const SW_FILE = 'src/custom-sw.js';

function run(command) {
  console.log(`$ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function substitutePlaceholders(content) {
  return content.replaceAll('__API_BASE_URL__', API_BASE_URL).replaceAll('__GA_MEASUREMENT_ID__', '');
}

const originalEnv = readFileSync(ENV_FILE, 'utf8');
const originalSw = readFileSync(SW_FILE, 'utf8');

try {
  writeFileSync(ENV_FILE, substitutePlaceholders(originalEnv));
  writeFileSync(SW_FILE, substitutePlaceholders(originalSw));

  run('npx ng build --configuration production');
  run('npx cap sync');

  console.log('\nSynced into android/ and ios/. Open a platform with:');
  console.log('  npm run cap:android   (needs Android Studio)');
  console.log('  npm run cap:ios       (needs Xcode, macOS only)');
} finally {
  // Always restore, even if the build itself failed partway through, so a
  // failed run never leaves a hardcoded production URL in a committed file.
  writeFileSync(ENV_FILE, originalEnv);
  writeFileSync(SW_FILE, originalSw);
}
