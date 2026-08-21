/**
 * Multi-tenant isolation & normalization harness (`npm run test:multi-tenant`).
 * Mocks simultaneous requests from Client A (LeadPerfection) and Client B
 * (BuilderPrime) and proves: correct adapter/schema resolution, cross-tenant
 * denial, fail-closed identity handling, and payload normalization.
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import { loadRegistry } from '../core/registry.js';
import { MultiTenantManager, extractTenantId } from '../core/middleware/tenant.js';
import { LeadPerfectionAdapter } from '../adapters/leadperfection.js';
import { BuilderPrimeAdapter } from '../adapters/builderprime.js';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}\n        ${err instanceof Error ? err.message : err}`);
  }
}

const registry = loadRegistry(path.resolve(process.cwd(), 'tenants', 'registry.json'));
const manager = new MultiTenantManager(registry);

await test('Client A resolves to LeadPerfection adapter and isolated schema', () => {
  const ctx = manager.resolveTenant('carolina-home');
  assert.ok(ctx.adapter instanceof LeadPerfectionAdapter);
  assert.equal(ctx.dbSchema, 'tenant_carolina');
});

await test('Client B resolves to BuilderPrime adapter and isolated schema', () => {
  const ctx = manager.resolveTenant('privacy-fence');
  assert.ok(ctx.adapter instanceof BuilderPrimeAdapter);
  assert.equal(ctx.dbSchema, 'tenant_privacy_fence');
});

await test('Simultaneous A+B requests stay tenant-scoped (no cross-contamination)', async () => {
  const [leadA, leadB] = await Promise.all([
    manager.resolveTenant('carolina-home').adapter.getLead('LP-1001'),
    manager.resolveTenant('privacy-fence').adapter.getLead('BP-2002'),
  ]);
  assert.equal(leadA.tenantId, 'carolina-home');
  assert.equal(leadB.tenantId, 'privacy-fence');
  assert.notEqual(leadA.tenantId, leadB.tenantId);
  assert.notEqual(manager.resolveTenant('carolina-home').dbSchema, manager.resolveTenant('privacy-fence').dbSchema);
});

await test('Unknown tenant id is rejected (forged tenant_id cannot resolve)', () => {
  assert.throws(() => manager.resolveTenant('client-c-forged'), /unknown tenant/i);
});

await test('Suspended tenant is rejected', () => {
  assert.throws(() => manager.resolveTenant('demo-suspended'), /suspended/i);
});

await test('Missing tenant_id claim fails closed', () => {
  assert.throws(() => extractTenantId({}), /no tenant_id claim/i);
  assert.throws(() => manager.resolveFromClaims({ tenant_id: 42 }), /no tenant_id claim/i);
});

await test('Verified claim resolves end-to-end through the middleware', () => {
  const ctx = manager.resolveFromClaims({ tenant_id: 'privacy-fence' });
  assert.equal(ctx.config.clientName, 'Privacy Fence Company');
});

await test('LeadPerfection payloads normalize into the unified model', async () => {
  const lead = await manager.resolveTenant('carolina-home').adapter.getLead('LP-1001');
  assert.match(lead.phone, /^\+1\d{10}$/, 'phone must be E.164');
  assert.equal(lead.email, lead.email.toLowerCase());
  assert.equal(lead.status, 'new');
  assert.ok(lead.netRevenueExpected > 0);
});

await test('BuilderPrime payloads normalize into the unified model', async () => {
  const lead = await manager.resolveTenant('privacy-fence').adapter.getLead('BP-2002');
  assert.match(lead.phone, /^\+1\d{10}$/, 'phone must be E.164');
  assert.equal(lead.status, 'appointment_set');
  assert.equal(lead.externalId, 'BP-2002');
});

await test('Registry refuses entries that store a raw key instead of an env-var name', () => {
  assert.throws(
    () => loadRegistry(path.resolve(process.cwd(), 'tests', 'fixtures', 'bad-registry.json')),
    /Never store raw keys/i,
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
