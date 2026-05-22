# Reference examples — v0.1

Two reference Packs for v0.1.0:

| File | Purpose |
|---|---|
| [`valid-pack.json`](valid-pack.json) | End-to-end valid Pack covering all 8 event types and all 9 `extended` shapes. |
| [`invalid-pack-bad-signature.json`](invalid-pack-bad-signature.json) | Minimal Pack with a deliberately corrupted Pack-level signature. For negative testing. |

## What "valid" means here

`valid-pack.json` is **structurally** conformant: it passes JSON Schema validation against [`schemas/v0.1/core/pack-envelope.json`](../../schemas/v0.1/core/pack-envelope.json) and every event passes both the envelope and per-type payload schemas.

It is **not** cryptographically valid:

- **Signatures are placeholders.** Strings like `EXAMPLE_PROTECTED_HEADER_E1..EXAMPLE_SIGNATURE_E1` match the JWS regex in [`schemas/v0.1/core/signature.json`](../../schemas/v0.1/core/signature.json) but won't verify against any real public key. A verifier configured with a real trust policy MUST reject them.
- **`prevHash` values are placeholders.** Strings like `EXAMPLE_PREV_HASH_OF_EVENT_1_BASE64URL` match the base64url pattern but are not the actual `base64url(SHA-256(JCS(prev event)))`. A verifier recomputing the chain will detect the mismatch.

These placeholders are intentional for v0.1.0. Generating cryptographically valid examples requires implementing JCS, Ed25519 signing, and hash-chain computation — orthogonal work to the spec itself. A future v0.1.x release MAY include a generator script and freshly-signed examples; the v0.2 conformance suite will produce them as part of its test fixtures.

## What "invalid" means here

`invalid-pack-bad-signature.json` is **structurally** conformant (the schema accepts it) but has a Pack-level signature value that an attentive reader will recognise as deliberately wrong:

```
"signature": "INVALID_BAD_SIGNATURE_HEADER..THIS_PACK_SIGNATURE_IS_DELIBERATELY_BROKEN_FOR_NEGATIVE_TESTING"
```

The string matches the JWS regex syntactically — so JSON Schema validation succeeds — but a cryptographic verifier would reject it (no matter what public key it tried). This is the simplest negative case: schema-valid, signature-invalid. A real conformance suite for v0.2 will include negative cases for hash-chain breaks, per-event signature corruption, missing required fields, forward-referenced causality parents, and so on.

## What's covered in `valid-pack.json`

**All 8 event types**, in a single customer-service refund narrative:

1. `project.agent.registered` — registers the Customer Service Bot.
2. `project.tool.registered` — registers the Refund API tool.
3. `policy.published` — publishes the refund-approval policy v3.
4. `run_started` — agent receives a refund request from Jane Doe.
5. `policy_eval` — agent evaluates the refund policy (decision: `allow`, within auto-approval threshold).
6. `tool_call` — agent calls the Refund API.
7. `tool_result` — refund issued, ID `REF-54321`, outcome `success`.
8. `run_completed` — run ends with status `succeeded`.

**All 9 extended shapes**:

- `subject` — the Customer Service Bot.
- `issuer` — Acme Corp (organization).
- `scope` — single-interaction scope on 2026-05-22.
- `executionEvidence` — counters (1 run, 1 tool call, 1 policy eval, 0 incidents).
- `incidentSummary` — total: 0.
- `humanOversightSummary` — total: 0 (auto-approved within policy threshold; no human involvement was required for this run).
- `supplyChain` — Anthropic Claude model + the refund API tool + an upstream model-card attestation.
- `riskClassification` — multi-framework (EU AI Act `limited-risk` with Article 50, OWASP LLM Top 10 with applicable categories).
- `controlAttestations` — multi-framework (EU AI Act Article 50 `implemented`, ISO 42001 clause 6.1 `implemented` with `eventRefs` pointing at the `policy_eval`, ISO 42001 clause 9.2 `not_applicable` with justification).

## Causality and context references

The example wires up `causality.parents` and `contextEvents` between events:

- `policy_eval` parent: `run_started`; context: `policy.published` (the policy version applied).
- `tool_call` parents: `run_started` + `policy_eval` (the policy that authorised it); context: `project.tool.registered` + `policy_eval`.
- `tool_result` parent: `tool_call`.
- `run_completed` parents: `run_started` + `tool_result`.

Project-state events (`project.agent.registered`, `project.tool.registered`, `policy.published`) have empty `causality.parents` — they are state declarations, not effects of prior events.

`contextEvents` from `run_started` points at the relevant agent registration, demonstrating the in-Pack convention from [`events.md`](../../docs/spec/v0.1/events.md).

## Using these examples

For structural validation, point your JSON Schema validator at `pack-envelope.json` with the other schemas loaded as referenced schemas. Once CI is wired up (see [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)), these examples will be validated automatically on every push.

For cryptographic interop testing, generate your own Pack against the same schemas with real Ed25519 keys, and treat these placeholder examples as a structural baseline only.
