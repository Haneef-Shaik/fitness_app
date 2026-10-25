import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
if (status.API_URL !== 'http://127.0.0.1:55321' || !status.PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('Expected this rebuild’s isolated local stack');
writeFileSync('apps/mobile/.env.local', `EXPO_PUBLIC_SUPABASE_URL=${status.API_URL}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\n`, { mode: 0o600 });
console.log('Wrote the local mobile environment with a publishable key. Restart Expo after changing configuration.');
