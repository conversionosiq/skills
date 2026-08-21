/**
 * Client scaffolder — onboard a new tenant in under 30 seconds.
 *
 *   npm run scaffold-client -- --name "Acme Roofing" --tenant-id acme-roofing \
 *     --crm builderprime --base-url https://api.builderprime.example.com \
 *     --secret-env ACME_BP_SECRET --primary "#0A2540" --secondary "#C9A23F"
 *
 * Missing flags are prompted for interactively. Emits: registry entry,
 * per-tenant schema migration, and a validation test folder. Run from platform/.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';
import process from 'node:process';
import type { CrmProvider, TenantConfig } from '../core/types.js';

const CRM_PROVIDERS: CrmProvider[] = ['leadperfection', 'builderprime', 'hubspot'];
const ROOT = process.cwd();

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length) args.set(a.slice(2), argv[++i]);
  }
  return args;
}

async function ask(args: Map<string, string>, key: string, question: string): Promise<string> {
  const fromFlag = args.get(key);
  if (fromFlag) return fromFlag;
  if (!process.stdin.isTTY) {
    // Fail closed: in a non-interactive run a missing flag must be an error,
    // never a silent half-scaffold.
    fail(`missing --${key} and no interactive terminal to prompt for it.`);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`${question}: `)).trim();
  } finally {
    rl.close();
  }
}

function fail(msg: string): never {
  console.error(`SCAFFOLD REFUSED: ${msg}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Validate each input as it's collected so a bad value is rejected before
  // the user is asked anything else (and before anything is written).
  const clientName = await ask(args, 'name', 'Client name');

  const tenantId = (await ask(args, 'tenant-id', 'Tenant ID (slug, e.g. acme-roofing)')).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(tenantId)) fail(`tenant id "${tenantId}" must be a lowercase slug.`);

  const crm = (await ask(args, 'crm', `CRM provider (${CRM_PROVIDERS.join('|')})`)) as CrmProvider;
  if (!CRM_PROVIDERS.includes(crm)) fail(`unknown CRM provider "${crm}".`);

  const baseUrl = await ask(args, 'base-url', 'CRM API base URL');
  if (!/^https:\/\//.test(baseUrl)) fail('CRM base URL must be https.');

  // Guardrail: this argument is the NAME of an env var. If someone pastes an
  // actual key here it would land in the committed registry — refuse it.
  const secretEnv = await ask(args, 'secret-env', 'Env var NAME that will hold the CRM key');
  if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(secretEnv)) {
    fail(`"${secretEnv.slice(0, 8)}…" doesn't look like an env-var NAME (e.g. ACME_BP_SECRET). Never paste the key itself.`);
  }

  const primary = (await ask(args, 'primary', 'Theme primary color (hex)')) || '#0A2540';
  const secondary = (await ask(args, 'secondary', 'Theme secondary color (hex)')) || '#C9A23F';

  const registryPath = path.join(ROOT, 'tenants', 'registry.json');
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as { tenants: TenantConfig[] };
  if (registry.tenants.some((t) => t.tenantId === tenantId)) fail(`tenant "${tenantId}" already exists.`);

  const dbSchema = `tenant_${tenantId.replace(/-/g, '_')}`;
  const entry: TenantConfig = {
    tenantId,
    clientName,
    isActive: true,
    databaseSchema: dbSchema,
    crmProvider: crm,
    crmApiSettings: { baseUrl, authHeaderName: 'Authorization', rateLimitPerMinute: 60, secretKeyEnvVar: secretEnv },
    features: { enableAutoDialer: false, enableSpeedToLeadSms: true, enableDynamicQueueRouting: false },
    theme: { primaryColor: primary, secondaryColor: secondary, accentColor: '#F4F1EA', logoUrl: `/assets/tenants/${tenantId}/logo.svg` },
  };
  registry.tenants.push(entry);
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

  const migrationsDir = path.join(ROOT, 'migrations');
  const seq = String(readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).length + 1).padStart(4, '0');
  const migrationPath = path.join(migrationsDir, `${seq}_tenant_${tenantId.replace(/-/g, '_')}.sql`);
  writeFileSync(
    migrationPath,
    `-- ${seq}: isolated schema for tenant "${tenantId}" (${clientName})\n` +
      `create schema if not exists ${dbSchema};\n` +
      `insert into public.tenants (tenant_id, client_name, is_active, database_schema, crm_provider, crm_api_settings, features, theme)\n` +
      `values ('${tenantId}', '${clientName.replace(/'/g, "''")}', true, '${dbSchema}', '${crm}',\n` +
      `        '${JSON.stringify(entry.crmApiSettings)}'::jsonb,\n` +
      `        '${JSON.stringify(entry.features)}'::jsonb,\n` +
      `        '${JSON.stringify(entry.theme)}'::jsonb)\n` +
      `on conflict (tenant_id) do nothing;\n`,
  );

  const validationDir = path.join(ROOT, 'tests', 'validation', tenantId);
  if (!existsSync(validationDir)) mkdirSync(validationDir, { recursive: true });
  writeFileSync(
    path.join(validationDir, 'connection-check.md'),
    `# ${clientName} — pre-launch validation\n\n` +
      `1. Set ${secretEnv} in the deployment secret store (scoped, lead-write only).\n` +
      `2. Run \`npm run test:multi-tenant\` — must be green including this tenant.\n` +
      `3. Live CRM round-trip: push one ZZTEST lead via the ${crm} adapter, verify in the CRM UI (screenshot), then delete it.\n` +
      `4. Verify cross-tenant denial: a JWT for another tenant must NOT read this tenant's data.\n`,
  );

  console.log(`Scaffolded tenant "${tenantId}" (${clientName})`);
  console.log(`  registry  : tenants/registry.json (entry appended)`);
  console.log(`  migration : ${path.relative(ROOT, migrationPath)}`);
  console.log(`  validation: tests/validation/${tenantId}/connection-check.md`);
  console.log(`Next: apply the migration, set ${secretEnv}, complete the validation checklist.`);
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
