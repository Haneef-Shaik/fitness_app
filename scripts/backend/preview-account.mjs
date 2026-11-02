import { randomUUID } from 'node:crypto';
import { readLocalStatus } from './status-command.mjs';
import { readCreatedAccount, readLoginSession } from './preview-response.mjs';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const status = readLocalStatus();
if (status.API_URL !== 'http://127.0.0.1:55321') throw new Error('Local rebuild only');
const email = `preview-${randomUUID()}@example.invalid`; const password = randomUUID() + 'aA1!';
const response = await fetch(status.API_URL + '/auth/v1/admin/users', { method: 'POST', headers: { apikey: status.SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) });
const user = await readCreatedAccount(response);
const login = await fetch(status.API_URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: status.PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
const session = await readLoginSession(login);
const profile = await fetch(status.API_URL + '/rest/v1/rpc/complete_onboarding', { method: 'POST', headers: { apikey: status.PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_name: 'Local preview', p_dob: '1995-01-01', p_timezone: 'Asia/Kolkata', p_locale: 'en', p_terms: 'test-notice', p_privacy: 'test-notice' }) });
if (!profile.ok) throw new Error('Could not initialize preview profile');
writeFileSync(join(tmpdir(), 'fitlog-preview-account.json'), JSON.stringify({ email, password, id: user.id }), { mode: 0o600 });
console.log('Created a synthetic local preview account. Credentials saved privately for browser testing.');
