#!/usr/bin/env node
// Validates the assurance-pack-spec schemas and reference examples.
// Runnable locally with `node scripts/validate.cjs` after `npm install`,
// and invoked from .github/workflows/ci.yml on every push.

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PACK_ENVELOPE_ID = 'https://spec.striadex.ai/v0.1/schemas/core/pack-envelope.json';

let exitCode = 0;
const pass = (msg) => console.log(`  PASS: ${msg}`);
const fail = (msg) => { console.error(`  FAIL: ${msg}`); exitCode = 1; };

function findJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findJsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

console.log('==> Loading schemas');
const ajv = new Ajv2020.default({ strict: false, allErrors: true });
addFormats.default(ajv);

const schemaFiles = findJsonFiles(path.join(REPO_ROOT, 'schemas'));
for (const f of schemaFiles) {
  try {
    const schema = JSON.parse(fs.readFileSync(f, 'utf8'));
    ajv.addSchema(schema);
  } catch (e) {
    fail(`could not load ${path.relative(REPO_ROOT, f)}: ${e.message}`);
  }
}
console.log(`  Loaded ${schemaFiles.length} schemas.`);

console.log('\n==> Compiling pack envelope (resolves all cross-schema $refs)');
let packValidator;
try {
  packValidator = ajv.getSchema(PACK_ENVELOPE_ID);
  if (!packValidator) throw new Error('getSchema returned null');
  pass(`Pack envelope compiled; all referenced schemas resolved.`);
} catch (e) {
  fail(`Pack envelope compilation failed: ${e.message}`);
  process.exit(exitCode);
}

console.log('\n==> Validating reference examples');

// Per-event-type schema IDs, matching the eventType enum in event-envelope.json.
const PAYLOAD_SCHEMA_BY_EVENT_TYPE = {
  'run_started':               'https://spec.striadex.ai/v0.1/schemas/core/event/run_started.json',
  'run_completed':             'https://spec.striadex.ai/v0.1/schemas/core/event/run_completed.json',
  'tool_call':                 'https://spec.striadex.ai/v0.1/schemas/core/event/tool_call.json',
  'tool_result':               'https://spec.striadex.ai/v0.1/schemas/core/event/tool_result.json',
  'policy_eval':               'https://spec.striadex.ai/v0.1/schemas/core/event/policy_eval.json',
  'policy.published':          'https://spec.striadex.ai/v0.1/schemas/core/event/policy.published.json',
  'project.agent.registered':  'https://spec.striadex.ai/v0.1/schemas/core/event/project.agent.registered.json',
  'project.tool.registered':   'https://spec.striadex.ai/v0.1/schemas/core/event/project.tool.registered.json'
};

function validateStructural(pack) {
  // Per docs/spec/v0.1/pack.md, full structural conformance is two-step:
  //   1. validate the Pack against pack-envelope (this also validates each event against event-envelope)
  //   2. for each event, validate event.payload against the per-type schema for event.eventType
  const errors = [];

  if (!packValidator(pack)) {
    for (const err of packValidator.errors) {
      errors.push(`pack envelope: ${err.instancePath || '<root>'}: ${err.message} ${JSON.stringify(err.params || {})}`);
    }
  }

  if (Array.isArray(pack.events)) {
    for (let i = 0; i < pack.events.length; i++) {
      const ev = pack.events[i];
      if (!ev || typeof ev !== 'object') continue;
      const typeId = PAYLOAD_SCHEMA_BY_EVENT_TYPE[ev.eventType];
      if (!typeId) continue; // unknown eventType already caught by envelope
      const v = ajv.getSchema(typeId);
      if (!v) {
        errors.push(`events[${i}].payload: cannot load schema ${typeId}`);
        continue;
      }
      if (!v(ev.payload || {})) {
        for (const err of v.errors) {
          errors.push(`events[${i}].payload (${ev.eventType}): ${err.instancePath || '<root>'}: ${err.message} ${JSON.stringify(err.params || {})}`);
        }
      }
    }
  }

  return errors;
}

function validateExample(name, expectStructurallyValid, rationale) {
  const filePath = path.join(REPO_ROOT, 'examples/v0.1', name);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const errors = validateStructural(data);
  const ok = errors.length === 0;
  if (ok === expectStructurallyValid) {
    pass(`${name}: structural validation = ${ok} (${rationale})`);
  } else {
    fail(`${name}: structural validation = ${ok}, expected ${expectStructurallyValid}`);
    for (const e of errors) console.error(`    ${e}`);
  }
}

validateExample('valid-pack.json', true, 'end-to-end example covering all 8 event types');
validateExample(
  'invalid-pack-bad-signature.json',
  true,
  'structurally valid; cryptographically invalid (see examples/v0.1/README.md)'
);

console.log('\n==> Regression: schema must reject a deliberately broken Pack');
const valid = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'examples/v0.1/valid-pack.json'), 'utf8'));

function expectReject(label, mutator) {
  const mutant = JSON.parse(JSON.stringify(valid));
  mutator(mutant);
  const errors = validateStructural(mutant);
  if (errors.length > 0) pass(`mutation "${label}" correctly rejected`);
  else fail(`mutation "${label}" should have been rejected but passed validation`);
}

expectReject('drop required packId', (p) => { delete p.packId; });
expectReject('add stray top-level property', (p) => { p.surpriseField = 'should not be here'; });
expectReject('wrong specVersion (v0.2.x)', (p) => { p.specVersion = '0.2.0'; });
expectReject('wrong @context URL', (p) => { p['@context'] = 'https://example.com/wrong-context.jsonld'; });
expectReject('unknown eventType', (p) => { p.events[3].eventType = 'definitely_not_canonical'; });
expectReject('non-base64url prevHash', (p) => { p.events[1].prevHash = 'has spaces and ! chars'; });
expectReject('empty events array', (p) => { p.events = []; });
expectReject('drop required event payload field', (p) => { delete p.events[3].payload.agentRef; });
expectReject('event payload with extra property', (p) => { p.events[3].payload.stowaway = true; });

// Documented schema limitations — cross-element constraints that JSON Schema cannot enforce
// in v0.1 and that the Pack-level conformance suite (deferred to v0.2) will cover:
//   - "first event prevHash MUST be null, subsequent events MUST NOT be null" (positional)
//   - "tool_call.runId == tool_result.runId" (cross-event reference equality)
//   - "policy_eval.policyVersionRef matches some policy.published.policyVersionId"
//   - "causality.parents references resolve to earlier events"
//   - "lastAssessedAt <= issuedAt"
// These are spec'd as MUST/SHOULD in pack.md and events.md prose, not in the schemas.

console.log(`\n${exitCode === 0 ? '✓ all checks passed' : '✗ some checks failed'}`);
process.exit(exitCode);
