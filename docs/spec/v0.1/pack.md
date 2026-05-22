# Pack envelope and extended shapes — v0.1

## Conformance language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) when, and only when, they appear in all capitals.

## Overview

The Pack is the top-level signed artifact. It carries:

- A JSON-LD `@context` URL pinning the semantic vocabulary.
- A `specVersion` semver string.
- A globally unique `packId` and an `issuedAt` timestamp.
- An ordered, non-empty `events` array forming the evidence body (see [events.md](events.md)).
- Optional `extended` content (audience-neutral evidence shapes).
- Optional `extensions` content (implementer-defined slots).
- A Pack-level `signature` over the whole envelope.

The Pack envelope is defined by [`pack-envelope.json`](../../../schemas/v0.1/core/pack-envelope.json).

## Pack envelope fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `@context` | string | MUST | Exactly `"https://spec.striadex.ai/v0.1/context.jsonld"` in v0.1. |
| `specVersion` | semver string | MUST | Pattern `0.1.x`. MAJOR.MINOR MUST match the `@context` URL. |
| `packId` | URI string | MUST | Globally unique. Two artifacts with the same `packId` MUST be byte-identical. |
| `issuedAt` | RFC 3339 timestamp | MUST | When the Pack was issued (signed). |
| `events` | array | MUST | At least one event. See [events.md](events.md). |
| `extended` | object | MAY | Audience-neutral evidence. See [Extended shapes](#extended-shapes). |
| `extensions` | object | MAY | Implementer-defined slots. See [extensions.md](extensions.md). |
| `signature` | string | MUST | Pack-level detached JWS. See [signing.md](signing.md). |

The Pack envelope MUST NOT contain any additional top-level fields. Audience-specific content (named controls, regulator mappings, vendor scores) belongs under `extensions.<implementer>.*`, not at the envelope root and not under `extended`.

## `@context`

The `@context` is pinned to the exact string `"https://spec.striadex.ai/v0.1/context.jsonld"` for v0.1. JSON-LD's array-of-contexts form is not permitted in v0.1; relaxation MAY be added additively in a later minor version.

A semantically-conformant validator MUST resolve this URL and interpret vocab URIs per [ADR 0002](../../adr/0002-normative-roles-json-schema-jsonld.md). A structurally-conformant validator MAY treat `@context` as an opaque constant.

## `specVersion` and version coupling

`specVersion` is a plain semver string. For Packs validating against this v0.1 envelope it MUST match the regex `^0\.1\.[0-9]+$`. The MAJOR.MINOR portion MUST agree with the MAJOR.MINOR encoded in `@context`.

Why both fields? `@context` lets a JSON-LD processor know the vocabulary version. `specVersion` lets a non-JSON-LD validator know the schema version without resolving the URL. The redundancy is intentional, and any disagreement between the two is a validation failure.

A validator MUST reject any Pack whose `specVersion` MAJOR.MINOR does not match its `@context` URL.

> **Pre-release identifiers** (e.g. `0.1.0-rc.1`) are not permitted in v0.1. A future minor version MAY relax this additively.

## `packId`

A globally unique URI identifying the Pack. Implementers SHOULD use `urn:uuid:...` or stable HTTPS URLs. Reusing a `packId` across two artifacts that differ in any byte is a conformance failure.

## `issuedAt`

The RFC 3339 timestamp at which the Pack was issued. Distinct from `events[i].occurredAt`. There is no requirement that `issuedAt` be later than every `occurredAt` (an issuer MAY back-issue a Pack covering events from an earlier interval), but implementers SHOULD record real wall-clock issuance time.

## `events`

An ordered, non-empty array of events. Each item MUST validate against the [event envelope](../../../schemas/v0.1/core/event-envelope.json). Full structural conformance also requires each event's `payload` to validate against its per-type schema under [`event/`](../../../schemas/v0.1/core/event/).

The Pack signature signs the entire `events` array, including each event's per-event signature and `prevHash`. Tampering with the events array — reordering, insertion, removal, mutation — invalidates the Pack signature, and additionally (for reorder / insert / remove) invalidates the hash chain.

> **Validator note.** A single JSON Schema cannot express "event[i].payload conforms to schema for event[i].eventType" cleanly without a discriminator chain (`if`/`then`/`else` or `oneOf` over all 8 types). v0.1.0 leaves this as a two-step validation: envelope + per-type. A future v0.1.x patch MAY add a bundled validator schema that encodes the discrimination — that would be additive (validators may opt in).

## Extended shapes

`extended` is an OPTIONAL object carrying audience-neutral evidence content. Every property within `extended` is itself OPTIONAL. The full set of v0.1 properties:

| Property | Schema |
|---|---|
| `subject` | [`extended/subject.json`](../../../schemas/v0.1/extended/subject.json) |
| `issuer` | [`extended/issuer.json`](../../../schemas/v0.1/extended/issuer.json) |
| `scope` | [`extended/scope.json`](../../../schemas/v0.1/extended/scope.json) |
| `executionEvidence` | [`extended/execution-evidence.json`](../../../schemas/v0.1/extended/execution-evidence.json) |
| `incidentSummary` | [`extended/incident-summary.json`](../../../schemas/v0.1/extended/incident-summary.json) |
| `humanOversightSummary` | [`extended/human-oversight-summary.json`](../../../schemas/v0.1/extended/human-oversight-summary.json) |
| `supplyChain` | [`extended/supply-chain.json`](../../../schemas/v0.1/extended/supply-chain.json) |
| `riskClassification` | [`extended/risk-classification.json`](../../../schemas/v0.1/extended/risk-classification.json) |
| `controlAttestations` | [`extended/control-attestations.json`](../../../schemas/v0.1/extended/control-attestations.json) |

`extended` MUST NOT contain properties other than those listed above. Implementers needing additional audience-neutral fields in v0.1 MUST place them under `extensions.<implementer>.*` and propose them upstream for inclusion in a future spec version.

Enumerations within `extended` shapes are **open**: implementers MAY use values outside the spec's example list, and validators MUST NOT reject a Pack solely because an `extended` enum field carries an unknown value. This is the "open arrays / enumerations" rule from [ADR 0005](../../adr/0005-three-layer-pack-structure.md).

## Extensions

`extensions` is an OPTIONAL object keyed by implementer namespace. The spec defines only the shape of the slot — see [extensions.md](extensions.md) and [ADR 0005](../../adr/0005-three-layer-pack-structure.md).

- Namespace keys MUST match the pattern `^[a-z][a-z0-9-]*(\.[a-z0-9-]+)*$`. Single-segment names (`striadex`) and dotted reverse-DNS-style names (`com.acme.audit`) are both valid. Implementers choose.
- Namespace values MUST be JSON objects. Their internal shape is the implementer's responsibility.
- The spec defines no required properties or vocabulary anywhere under `extensions.*`. A validator at structural conformance MUST ignore unknown namespace content.

## Pack signature

`signature` at the envelope level is a Detached JWS over the JCS canonicalisation of the Pack envelope with the top-level `signature` field removed. Per-event signatures and `prevHash` values remain in place during this canonicalisation.

The Pack signature therefore binds:

- The `@context` URL and `specVersion`.
- The `packId` and `issuedAt`.
- Every event in `events` — including each event's per-event signature and hash-chain backlink.
- Any `extended` and `extensions` content present.

A verifier MUST verify the Pack signature against the issuer's public key (resolution out of scope — see [ADR 0006](../../adr/0006-keys-and-trust-out-of-scope.md)). A failed Pack signature invalidates the entire Pack, regardless of per-event signature validity.

See [signing.md](signing.md) for the encoding details and [ADR 0004](../../adr/0004-signature-encoding-detached-jws-jcs.md) for the rationale.

## Per-shape specifications

This section is built up incrementally as each `extended` shape is specified. Shapes not yet covered carry stub schemas that accept any object. Once a shape is covered here, its schema enforces the documented contract and structural conformance for that shape is well-defined.

No `extended` shape's schema permits additional properties at the top level of the shape. Implementer-specific content belongs in `extensions.<implementer>.*` at the Pack level, not under `extended`. Sub-objects within `extended` shapes (e.g. `subject.owner`, `issuer.legalEntity`) are deliberately open-shaped — they accept arbitrary fields because their content is implementer-flavored even though the shape's existence is audience-neutral.

### `extended.subject`

Schema: [`extended/subject.json`](../../../schemas/v0.1/extended/subject.json).

Identifies what the Pack is attesting about.

| Field | Type | Required | Notes |
|---|---|---|---|
| `subjectId` | URI string | MUST | Stable identifier. SHOULD equal an `agentId` from a `project.agent.registered` event when the subject is an agent. |
| `subjectType` | string | MUST | Canonical values: `agent`, `system`, `deployment`, `project`. **Open** — validators MUST NOT reject solely on unknown values. |
| `name` | string | MAY | Display name. |
| `description` | string | MAY | What the subject is. |
| `version` | string | MAY | Version identifier at the time of attestation. Distinct from any per-event versioning in `project.*.registered`. |

Additional properties are not permitted at the top level.

#### Subject vs `project.agent.registered`

`extended.subject` and `project.agent.registered` overlap when the subject is an agent. They are not redundant: `project.agent.registered` is a project-state event (one event per registration, possibly many in a Pack); `extended.subject` is a Pack-level claim about *which* of those subjects this Pack attests about. A Pack with multiple `project.agent.registered` events but only one `extended.subject` is a Pack attesting about one specific agent, with related registrations included for context.

### `extended.issuer`

Schema: [`extended/issuer.json`](../../../schemas/v0.1/extended/issuer.json).

Identifies who is vouching for the attestation.

| Field | Type | Required | Notes |
|---|---|---|---|
| `issuerId` | URI string | MUST | Stable identifier. |
| `issuerType` | string | MUST | Canonical values: `organization`, `individual`, `automated_system`. **Open**. |
| `name` | string | MAY | Display name. |
| `legalEntity` | object | MAY | Legal entity info for organization issuers. Open shape: `jurisdiction`, `registrationNumber`, `legalName`, ... |
| `accreditation` | array of objects | MAY | Claimed certifications. Open shape per item. **Informational only** — spec does not validate. |
| `contact` | object | MAY | Contact info. Open shape. |

Additional properties are not permitted at the top level.

#### Issuer vs signing key

`extended.issuer` is a **semantic** claim about who is vouching. The `kid` in the Pack signature's JWS protected header is the **cryptographic** key identifier. These two are decoupled by design (per [ADR 0006](../../adr/0006-keys-and-trust-out-of-scope.md)):

- The spec does not require `kid` to be derivable from `issuerId`, nor vice versa.
- Verifiers reconcile the two via their own trust policy: "I trust kid X to issue Packs claiming issuerId Y" is a verifier-side configuration, not a spec rule.
- A Pack whose `extended.issuer.issuerId` does not match what the verifier expects for the `kid` MUST be rejected by the verifier — but that rejection is policy-driven, not spec-driven.

The `accreditation` array is similarly trust-policy-driven: a Pack claiming "ISO 17021 accredited" provides documentary information; whether the verifier accepts that claim depends on external verification of the accreditation.

### `extended.scope`

Schema: [`extended/scope.json`](../../../schemas/v0.1/extended/scope.json).

Describes the boundary of the attestation — what the Pack covers. Other claims in the Pack (e.g. `controlAttestations`) apply to this scope.

| Field | Type | Required | Notes |
|---|---|---|---|
| `description` | string | MUST | Human-readable boundary statement. Required when `scope` is present. |
| `timeWindow` | object | MAY | `{ start, end? }` RFC 3339. `start` MUST be present if `timeWindow` is. `end` MAY be omitted for ongoing scopes. |
| `environments` | array of strings | MAY | Environment identifiers (`production`, `staging`, or implementer URIs). |
| `runs` | array of URI strings | MAY | Specific runIds covered. runId references, not event references. |

Additional properties are not permitted at the top level.

#### Scope vs `events`

`extended.scope.runs` enumerates the runIds the attestation is *about*, regardless of whether every event for those runs is included in `core.events`. A Pack MAY contain `scope.runs` listing runs whose events were collected externally and not included in this Pack — in that case the Pack attests about those runs by reference, and validators with no access to the external events can verify only the Pack's own claims, not reconstruct the runs.

`core.events` MAY include events for runs not listed in `scope.runs` if they provide context (e.g. a `project.tool.registered` event referenced by `tool_call` events from in-scope runs).

### `extended.executionEvidence`

Schema: [`extended/execution-evidence.json`](../../../schemas/v0.1/extended/execution-evidence.json).

Aggregate summary of what happened within the Pack's scope. Not the raw events (those are in `core.events`); aggregate counts and metadata.

| Field | Type | Required | Notes |
|---|---|---|---|
| `period` | object | MAY | `{ start, end }` of actual coverage. MAY equal `scope.timeWindow` or be a subset. |
| `counters` | object | MAY | Aggregate counts. Open keys. Typical: `runs.total`, `toolCalls.byOutcome.denied`, `policyEvals.byDecision.deny`, `incidents.total`. Flat dotted or nested keying both valid. |
| `samplingMethod` | object | MAY | Describes sampling when applied. SHOULD be present when the counters do not cover every event in scope. |
| `dataIntegrity` | object | MAY | Issuer's claims about completeness and integrity. Distinct from cryptographic verification. |

Additional properties are not permitted at the top level.

#### Period vs scope.timeWindow

`scope.timeWindow` is the **declared boundary** of the attestation. `executionEvidence.period` is the **actual coverage** of the evidence supplied. They MAY differ:

- A `scope.timeWindow` of "2026-Q1" with an `executionEvidence.period` of "2026-01-15 to 2026-03-31" indicates instrumentation only started mid-January. This narrows the verifiable evidence period without narrowing the attestation scope — which is a meaningful disclosure for auditors.
- A `scope.timeWindow` of "2026-01-01 onwards" (no `end`) with an `executionEvidence.period` ending on `2026-05-22T00:00:00Z` matches the Pack's `issuedAt` and indicates the latest evidence collected.

Implementers SHOULD set `period.end` to a time at or before the Pack's `issuedAt`. A `period.end` after `issuedAt` is logically inconsistent (claiming evidence from the future) and validators SHOULD reject such Packs.

#### Sampling disclosure

If the issuer collected evidence by sampling (e.g. recording detailed events for 1% of runs but only aggregate counts for the rest), `samplingMethod` SHOULD describe how. The spec cannot enforce this — the schema does not know which counters represent samples — but omitting `samplingMethod` when sampling applies is anti-audit. The v0.2 conformance suite will include a heuristic check (e.g. flag counters whose magnitudes are inconsistent with the number of events in `core.events`).

#### Data integrity is a claim, not a proof

`dataIntegrity` claims (e.g. `signatureCoverage: 1.0`) are made by the issuer; they are not properties verifiable from the Pack bytes alone. A verifier MUST verify the cryptographic properties of the Pack independently and MAY use `dataIntegrity` only as a hint or as a documentary record of the issuer's claim.

### `extended.incidentSummary`

Schema: [`extended/incident-summary.json`](../../../schemas/v0.1/extended/incident-summary.json).

Summary of incidents that occurred within the Pack's scope. Taxonomy of severities, categories, and statuses is **open** — implementers use whatever framework their incident-management practice prescribes.

| Field | Type | Required | Notes |
|---|---|---|---|
| `period` | object | MAY | `{ start, end }`. SHOULD equal or be a subset of `scope.timeWindow`. |
| `total` | integer ≥ 0 | MAY | Total incidents. Zero is a meaningful claim. |
| `bySeverity` | object | MAY | Counts by severity. Conventional keys: `critical`, `high`, `medium`, `low`, `informational`. |
| `byCategory` | object | MAY | Counts by category. Conventional: `policy_violation`, `safety`, `data_quality`, `operational_failure`, `security`. |
| `byStatus` | object | MAY | Counts by resolution status. Conventional: `open`, `investigating`, `resolved`, `closed_no_action`. |
| `incidents` | array of objects | MAY | Individual records. Open shape; MAY be a subset of `total`. |

Additional properties are not permitted at the top level.

### `extended.humanOversightSummary`

Schema: [`extended/human-oversight-summary.json`](../../../schemas/v0.1/extended/human-oversight-summary.json).

Summary of human oversight actions within scope. Relevant for frameworks that mandate human oversight of high-risk AI systems (EU AI Act Article 14, NIST AI RMF, others).

| Field | Type | Required | Notes |
|---|---|---|---|
| `period` | object | MAY | `{ start, end }`. SHOULD align with `scope.timeWindow`. |
| `total` | integer ≥ 0 | MAY | Total oversight actions. Zero is meaningful but ambiguous — see below. |
| `byType` | object | MAY | Counts by action type. Conventional: `approval`, `intervention`, `review`, `escalation`. |
| `byOutcome` | object | MAY | Counts by outcome. Conventional: `approved`, `denied`, `modified`, `no_action`. |
| `events` | array of objects | MAY | Individual oversight records. Open shape. Conventional fields: `id`, `type`, `occurredAt`, `actor`, `subject`, `outcome`, `summary`, `eventRefs`. |

Additional properties are not permitted at the top level.

#### Why these are summary shapes, not event types

`incidentSummary` and `humanOversightSummary` are claims at Pack level, not event types in `core`. The 8 canonical event types in v0.1 cover machine events (runs, tool calls, policy evaluations, registrations); human actions and incident classifications are summary granularity. A future v0.2+ MAY add per-action event types if granular runtime recording becomes useful — that would be additive (the summary shapes remain valid alongside).

In v0.1, implementers wanting per-incident or per-oversight-action audit trails record them under `extensions.<implementer>.*` keyed by Pack-internal IDs, and reference those records from `incidents[].eventRefs` / `events[].eventRefs`.

#### `eventRefs` convention

Individual records in both shapes (`incidents[*]` and `events[*]`) MAY carry an `eventRefs` array of eventIds in this Pack that document the triggering machine events. Examples:

- An incident of category `policy_violation` lists the `policy_eval.eventId` that detected the violation and the `tool_call.eventId` that triggered the evaluation.
- An oversight `escalation` lists the `policy_eval.eventId` with `decision: "require_review"` that prompted escalation, and the `tool_result.eventId` whose outcome reflected the human's decision.

`eventRefs` is conventional, not normatively required — open shape, but where present SHOULD be an array of eventId strings.

#### Zero-total ambiguity

`humanOversightSummary.total = 0` could mean:

- The subject operates fully autonomously without any oversight points (legitimate for low-risk subjects).
- Oversight was expected but is missing (a compliance gap).

The spec does not interpret zero on its own. Auditors reconcile it against `extended.riskClassification` and `extended.controlAttestations` (where claims about oversight controls live) to judge whether zero oversight is appropriate for the subject. Issuers SHOULD include a brief explanatory note in `extended.scope.description` or in `controlAttestations` when zero is a legitimate claim.

### `extended.supplyChain`

Schema: [`extended/supply-chain.json`](../../../schemas/v0.1/extended/supply-chain.json).

Declares what the subject depends on. Five typed arrays grouped by dimension; all open-shaped at the item level.

| Field | Type | Required | Notes |
|---|---|---|---|
| `models` | array of objects | MAY | Foundation models. Conventional fields: `name`, `version`, `provider`, `modelCard`, `trainingDataDescription`, `license`. |
| `tools` | array of (URI strings or objects) | MAY | Tools the subject uses. URI form when the toolId is sufficient; object form when extra metadata applies. |
| `dataSources` | array of objects | MAY | Training/operational/retrieval data. Conventional: `name`, `type`, `provider`, `license`, `dataCard`, `collectionPeriod`. |
| `dependencies` | array of objects | MAY | Libraries, SDKs, infrastructure providers, sub-agents. Conventional: `name`, `version`, `provider`, `type`, `license`. |
| `attestations` | array of objects | MAY | Upstream SBOMs, SLSA provenance, model cards, supplier audits. Conventional: `type`, `uri`, `hash`, `validFrom`, `validUntil`, `issuer`. |

Additional properties are not permitted at the top level.

#### Why five typed arrays

A single open `components` array would be more flexible but worse for audit. An auditor asking "show me model provenance" should be able to look at `supplyChain.models` directly without filtering by a `type` discriminator. The five dimensions (models, tools, data, software/infra dependencies, upstream attestations) cover the standard supply-chain audit lens.

`infrastructure` is not a separate dimension in v0.1 — cloud providers and runtime hosts fit under `dependencies` with `type: "infrastructure"`. A v0.2+ MAY split it out additively if implementers prefer a clean separation.

#### Chain of trust via `attestations`

`attestations[]` records upstream attestations the issuer has received from its suppliers. A verifier processing this Pack MAY follow those URIs (with appropriate trust policy) to validate provenance claims further upstream: "this model came from supplier X, who provided SLSA L3 provenance Y, which references training data Z".

A `validFrom`/`validUntil` pair on each attestation lets verifiers reject expired upstream attestations. The spec does not enforce expiry — verifiers form their own policy.

### `extended.riskClassification`

Schema: [`extended/risk-classification.json`](../../../schemas/v0.1/extended/risk-classification.json).

Risk classification(s) of the subject. Multi-framework — one subject may carry multiple simultaneous classifications.

| Field | Type | Required | Notes |
|---|---|---|---|
| `classifications` | array of objects | MAY | One item per applied framework. Conventional fields: `framework`, `version`, `classification`, `aspects`, `justification`. |
| `assessmentMethod` | object | MAY | How the classification was determined. One method per Pack. Conventional: `type`, `assessor`, `methodologyRef`. |
| `lastAssessedAt` | RFC 3339 timestamp | MAY | When last assessed. SHOULD be ≤ `issuedAt`. |

Additional properties are not permitted at the top level.

#### Why `classifications` is plural

A high-risk AI subject often holds multiple simultaneous classifications across regulatory and standards frameworks. A single Pack might claim:

- `framework: eu-ai-act`, `classification: high-risk`, `aspects: { articles: [6, 9, 14] }`
- `framework: nist-ai-rmf`, `classification: managed`, `aspects: { functions: [govern, map, measure, manage] }`
- `framework: iso-42001`, `classification: compliant`, `aspects: { version: "2023" }`
- `framework: owasp-llm-top-10`, `classification: assessed`, `aspects: { applicableCategories: ["LLM01", "LLM02"] }`

Forcing implementers into a single classification would lose this nuance. The plural array makes multi-framework attestation first-class.

#### Vocab URIs

Per [ADR 0002](../../adr/0002-normative-roles-json-schema-jsonld.md), audit-significant fields SHOULD have vocab URIs in the JSON-LD `@context`. For `riskClassification`, the `@context` maps common terms — `aiActRole`, `aiActArticles`, `nistRmfFunction`, `owaspLlmCategory`, etc. — to canonical URIs. A semantically-conformant validator resolves these; a structurally-conformant validator treats them as opaque strings. The schema itself is the same for both validators.

#### Assessment freshness

`lastAssessedAt` after `issuedAt` is logically inconsistent (claiming the assessment was performed in the future). Validators SHOULD reject such Packs. Issuers re-issuing a Pack after re-assessment SHOULD bump `lastAssessedAt` to reflect the latest assessment.

### `extended.controlAttestations`

Schema: [`extended/control-attestations.json`](../../../schemas/v0.1/extended/control-attestations.json).

Per-control attestations grouped by framework. Multi-framework first-class.

**Top-level fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `frameworks` | array of objects | MAY | One entry per framework being attested. |
| `methodology` | object | MAY | How the attestation was conducted. Open shape. |
| `attestedAt` | RFC 3339 timestamp | MAY | When the overall attestation was performed. SHOULD be ≤ `issuedAt`. |
| `attestor` | object | MAY | Top-level attestor. MAY be omitted when attestation comes from `extended.issuer`. |

Additional properties are not permitted at the top level.

**Per-framework entry (`frameworks[]`):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `framework` | string | MUST | Framework identifier (e.g. `iso-27001`, `eu-ai-act`). Open — implementer-defined frameworks valid. |
| `version` | string | MAY | Framework version (`2022`, `5.0`, ...). |
| `controls` | array of objects | MUST | Per-control attestations. MAY be empty (but discouraged). |

Additional properties are not permitted on framework entries.

**Per-control entry (`frameworks[].controls[]`):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `controlId` | string | MUST | Framework-specific identifier (`A.5.1`, `AC-2`, `Article 14`, `LLM01`, `5.2`, ...). Format preserved verbatim. |
| `status` | string | MUST | Canonical: `implemented`, `partial`, `not_implemented`, `not_applicable`, `compensating_control`. **Open** — `not_assessed` and other values permitted. |
| `name` | string | MAY | Human-readable control name. |
| `description` | string | MAY | What the control requires. |
| `evidence` | array of objects | MAY | Pointers to supporting evidence. Open shape; conventional `eventRefs`/`uri`/`hash`/`description`. |
| `assessedAt` | RFC 3339 timestamp | MAY | When this control was assessed. Overrides top-level `attestedAt`. |
| `period` | object | MAY | `{ start, end? }`. When the control was in effect. `end` omitted = currently in effect. |
| `exceptions` | array of objects | MAY | Known deviations. Open shape; conventional `description`/`period`/`severity`/`compensatingControls`. |
| `attestor` | object | MAY | Per-control attestor; overrides top-level. |
| `justification` | string | MAY | SHOULD be present whenever `status` is not `implemented`. |

Additional properties are not permitted on control entries.

#### Why multi-framework matters

A single AI subject often needs to demonstrate controls across multiple frameworks at once: ISO 27001 for general infosec, ISO 42001 for AI management, EU AI Act for regulatory compliance in Europe, OWASP LLM mitigations for LLM-specific threats, SOC 2 for customer trust. Bundling these into one Pack avoids duplicating subject metadata, signatures, and execution evidence across separate attestations. The shape is designed to make this composition natural rather than awkward.

A Pack carrying control claims for only one framework remains valid — `frameworks` is an array of one in that case.

#### Evidence chain via `eventRefs`

Control evidence references in-Pack events through the `eventRefs` convention introduced in `incidentSummary` and `humanOversightSummary`. A `controls[*].evidence[*]` item with `type: "event_ref"` and `eventRefs: [<eventId>, ...]` claims the listed events demonstrate the control in effect. Verifiers can traverse from a control attestation to the underlying machine evidence.

Examples:

- ISO 42001 control "human oversight" attested with `eventRefs` pointing to `policy_eval` events that triggered human review and the corresponding `tool_result` events that reflected the human decision.
- NIST 800-53 control `AC-2` (account management) attested with `eventRefs` pointing to `project.agent.registered` events demonstrating the registration workflow.
- EU AI Act Article 12 (record-keeping) attested by the existence of the hash chain itself — no specific event needed, but the issuer documents this in `description`.

Evidence MAY also point outside the Pack via `uri` + `hash` (for documents, screenshots, scanned reports) or describe in-process evidence via free text. The schema does not enforce a particular form.

#### Exceptions and compensating controls

`exceptions[]` records known gaps. A common pattern is to combine `status: "compensating_control"` with `exceptions` listing what is missing and which other `controlId`s compensate:

```json
{
  "controlId": "AC-3",
  "status": "compensating_control",
  "justification": "Direct enforcement at the agent layer is not feasible; compensated by gateway-level enforcement.",
  "exceptions": [
    {
      "description": "Agent does not enforce role-based access on tool calls.",
      "compensatingControls": ["NETWORK-GW-RBAC", "AC-6"]
    }
  ]
}
```

`compensatingControls` references are string-equality against other `controlId`s in this same `controlAttestations` object. The schema does not enforce that the references resolve — that's a v0.2+ conformance suite check.

#### Attestor delegation

`attestor` appears at two levels:

- **Top-level** — the overall attestor for the Pack's control claims (often the same entity as `extended.issuer`, in which case it MAY be omitted).
- **Per-control** — overrides top-level for specific controls.

The override pattern supports realistic compliance arrangements: internal audit attests SOC 2 controls, an external assessor attests ISO 42001 controls, and the Pack issuer signs the bundle. Each control carries its actual attestor; the Pack signature still binds the whole.

Note that per-control `attestor` is a **claim about who attested**, not a separate cryptographic signature. Multi-signature support (separate signatures per controlling party) is deferred to v1.0+ — see [ADR 0004](../../adr/0004-signature-encoding-detached-jws-jcs.md).

#### Coverage disclosure

The schema does not distinguish "exhaustive list of all applicable controls" from "subset". Implementers SHOULD use `methodology.coverage` (e.g. `"exhaustive"` or `"subset"`) and/or include unattested controls with `status: "not_assessed"` (open-enum value). v0.2 MAY promote coverage disclosure to a structured field.

#### Vocab URIs

Per [ADR 0002](../../adr/0002-normative-roles-json-schema-jsonld.md), audit-significant terms get vocab URIs in the JSON-LD `@context`. For `controlAttestations`, the `@context` maps common identifiers — framework names (`iso-27001`, `eu-ai-act`), AI Act article references, OWASP LLM categories, NIST RMF functions — to canonical URIs. A semantically-conformant validator resolves these.
