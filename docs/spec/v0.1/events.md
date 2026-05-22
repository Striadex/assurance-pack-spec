# Events — v0.1

## Conformance language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) when, and only when, they appear in all capitals.

## Overview

A Pack's `core.events` is an ordered array of events. Each event consists of a common **envelope** plus an event-type-specific **payload**. This document is normative for the envelope and for the canonical event-type names. Per-type payload shapes are normative in the per-type schemas under [`schemas/v0.1/core/event/`](../../../schemas/v0.1/core/event/) and described informatively here.

The envelope is defined by [`event-envelope.json`](../../../schemas/v0.1/core/event-envelope.json).

## Event envelope

Every event MUST be a JSON object with the following fields, and MUST NOT contain any additional top-level fields.

| Field | Type | Required | Notes |
|---|---|---|---|
| `eventId` | URI string | MUST | Unique within the Pack. SHOULD be a URI (e.g. `urn:uuid:...` or an HTTPS URL). |
| `eventType` | enum string | MUST | One of the eight canonical types listed below. |
| `occurredAt` | RFC 3339 timestamp | MUST | When the event occurred. |
| `causality` | object | MUST | Causal relationship to other events. See [Causality](#causality). |
| `contextEvents` | array of URI strings | MAY | eventIds providing non-causal context. |
| `prevHash` | base64url string or `null` | MUST | Hash-chain backlink. See [Hash chain](#hash-chain). |
| `payload` | object | MUST | Event-type-specific content. Shape per [per-type schema](#canonical-event-types). |
| `signature` | string | MUST | Detached JWS. See [signing.md](signing.md). |

`contextEvents` is OPTIONAL in the envelope. If absent, no context references are claimed. If present, it MUST be an array (possibly empty).

## Canonical event types

The eight event types in v0.1, with one-line descriptions and pointers to the per-type schemas (currently stubs — to be filled in iteration-by-iteration):

| Type | Description | Schema |
|---|---|---|
| `run_started` | An agent run has begun. | [`event/run_started.json`](../../../schemas/v0.1/core/event/run_started.json) |
| `run_completed` | An agent run has terminated. | [`event/run_completed.json`](../../../schemas/v0.1/core/event/run_completed.json) |
| `tool_call` | The agent invoked a tool. | [`event/tool_call.json`](../../../schemas/v0.1/core/event/tool_call.json) |
| `tool_result` | A tool returned a result. | [`event/tool_result.json`](../../../schemas/v0.1/core/event/tool_result.json) |
| `policy_eval` | A policy was evaluated against an action. | [`event/policy_eval.json`](../../../schemas/v0.1/core/event/policy_eval.json) |
| `policy.published` | A policy version was published. | [`event/policy.published.json`](../../../schemas/v0.1/core/event/policy.published.json) |
| `project.agent.registered` | An agent was registered in the project. | [`event/project.agent.registered.json`](../../../schemas/v0.1/core/event/project.agent.registered.json) |
| `project.tool.registered` | A tool was registered in the project. | [`event/project.tool.registered.json`](../../../schemas/v0.1/core/event/project.tool.registered.json) |

> **Naming-style note.** Five types use snake_case (`run_started`, `tool_result`, `policy_eval`, …) while three use dotted segments (`policy.published`, `project.agent.registered`, `project.tool.registered`). The dotted form reflects a `<scope>.<resource>.<action>` convention for project-state events, distinct from runtime events. A future v0.x release MAY normalise these names; from v1.0 onward they are frozen.

A validator MUST reject any event whose `eventType` is not in this list. New event types added in later versions MUST be additive (an existing validator failing closed on unknown types is incompatible with the additive guarantee; see [ADR 0001](../../adr/0001-spec-status-and-breaking-change-policy.md)). Implementers SHOULD therefore treat unknown event types in newer-versioned Packs as "warn but continue" rather than "reject".

## Per-type payload

Each event MUST carry a `payload` object whose shape is constrained by the schema for its `eventType`. Structural conformance requires that, for every event in the Pack:

1. The event's envelope validates against `event-envelope.json`.
2. The event's `payload` validates against `event/<eventType>.json`.

The per-type schemas are scoped to the `payload` only — they do not redefine envelope fields.

## Causality

`causality` describes the agent-level causal relationship between events in the same Pack. It is a DAG, modelled as a list of direct parents.

```json
"causality": {
  "parents": ["urn:uuid:1111…", "urn:uuid:2222…"]
}
```

Rules:

- `parents` MUST be present (MAY be an empty array).
- Each parent MUST be an `eventId` of an event that appears **earlier** in the same Pack's `events` array. Forward references are forbidden.
- Cross-Pack references in `parents` are forbidden. Use `contextEvents` for non-causal cross-Pack pointers (see below — note that cross-Pack `contextEvents` are also out of scope in v0.1; they may be added additively later).
- The causality graph MUST be acyclic.

Causality is **distinct from the hash chain**. The hash chain is a positional, linear, tamper-evidence structure (every event has exactly one predecessor in the array). Causality is a semantic DAG (an event may have zero, one, or many causal parents). Mixing the two is a common mistake — implementers SHOULD keep them separate.

## Context events

`contextEvents` is an optional array of `eventId` values whose content provides **non-causal** context for interpreting this event. The canonical example: a `tool_call` event references the `project.tool.registered` event that defines the tool's schema and identity.

Referenced events:

- MUST be eventIds of events in the same Pack.
- MAY also appear in `causality.parents` (the relationships are independent).
- MAY appear earlier or later in the Pack — there is no temporal restriction (a tool registered late in a Pack can still provide context for an earlier `tool_call`, e.g. when registration was retroactively recorded).

The relationship is informational. A validator MUST NOT infer causality from `contextEvents`.

## Hash chain

`prevHash` provides positional tamper-evidence: events cannot be reordered, inserted, or removed from the `events` array without invalidating the chain.

**Construction:**

- For the **first** event in `events`, `prevHash` MUST be `null` (JSON `null`, not the string `"null"`).
- For every subsequent event at index `i`, `prevHash` MUST be `base64url(SHA-256(JCS(events[i-1])))`.
- The hashed bytes are the JCS canonicalisation of the *entire* preceding event, **including** its `signature` field. (Per-event signatures are computed before `prevHash` is set on the following event.)
- The base64url encoding is per [RFC 4648 §5](https://www.rfc-editor.org/rfc/rfc4648#section-5), without padding.

**Validation:**

- A verifier MUST recompute `prevHash` for every non-first event from the bytes of the preceding event and reject the Pack if any value does not match.
- A verifier MUST reject a non-first event whose `prevHash` is `null`, and MUST reject the first event whose `prevHash` is non-`null`.

**Layering with signatures (informative):**

The three integrity mechanisms layer as follows:

1. **Per-event signature** authenticates each event's content (the event excluding its `signature` field).
2. **Hash chain** authenticates each event's *position* by binding it to the bytes of its predecessor including signature.
3. **Pack signature** authenticates the Pack envelope and the entire `events` array as a whole.

An attacker who tampers with any event must (a) re-sign that event with the issuer's private key, (b) recompute every subsequent `prevHash`, (c) re-sign the Pack envelope. Without the private key, none of these steps is possible.

## Per-event signature

Each event's `signature` field is a Detached JWS over the JCS canonicalisation of the event with the `signature` field removed. The full encoding is normative in [signing.md](signing.md); the relevant points here:

- The signed bytes are produced by removing `signature` from the event object, applying JCS to the remainder, and using the resulting bytes as the detached JWS payload.
- `prevHash` is part of the signed event — the chain links are themselves signed.
- The protected header carries `alg=EdDSA` and the issuer's `kid`.

## Ordering and uniqueness

- `events` MUST be a non-empty array. An empty Pack has no evidence to attest and is rejected.
- `eventId` values MUST be unique across all events in the Pack.
- `occurredAt` values MAY repeat (events at the same instant) and MAY appear out of monotonic order in the array (the array order is authoritative for the hash chain; `occurredAt` is the agent-reported wall-clock time, which need not be monotonic).

## Per-type payload specifications

This section is built up incrementally as each event type's payload is specified. Types not yet covered carry stub schemas (`properties: {}`, no required fields) that accept any object — a Pack will pass envelope validation but cannot be claimed structurally conformant for the unfilled types until this section covers them.

No event type's payload schema permits additional properties. Implementer-specific per-event content belongs in `extensions.<implementer>.*` at the Pack level (keyed internally by `eventId` or `runId` if per-event granularity is needed). v0.1 does not provide a per-event extensions slot; introducing one later is additive.

### `run_started`

Schema: [`event/run_started.json`](../../../schemas/v0.1/core/event/run_started.json).

Marks the beginning of an agent run.

| Field | Type | Required | Notes |
|---|---|---|---|
| `runId` | URI string | MUST | Unique identifier for the run. All events relating to the same run MUST carry this exact value. |
| `agentRef` | URI string | MUST | The agent's identifier. SHOULD correspond to the `agentId` in a `project.agent.registered` event. |
| `objective` | string or object | SHOULD | What the agent was asked to do. Free text or structured. Implementers SHOULD provide a human-readable rendering even if the canonical form is structured. |
| `initiator` | object | MAY | Who/what triggered the run. Open shape; typical fields: `type` (user, agent, schedule, api), `id`, `display`. |
| `initialInput` | any | MAY | The starting input (prompt, parameters, structured request). MAY be omitted when recorded out-of-band — in that case SHOULD reference the out-of-band record via a `contextEvent` or via `initiator`. |
| `runtime` | object | MAY | Informational runtime metadata: `model`, `modelVersion`, `orchestrator`, etc. Open shape. |
| `correlationId` | string | MAY | Cross-system trace identifier (e.g. OpenTelemetry trace ID). |

Additional properties are not permitted in the payload.

### `run_completed`

Schema: [`event/run_completed.json`](../../../schemas/v0.1/core/event/run_completed.json).

Marks the termination of an agent run (success, failure, cancellation, or timeout).

| Field | Type | Required | Notes |
|---|---|---|---|
| `runId` | URI string | MUST | MUST match the `runId` of the corresponding `run_started`. |
| `status` | string | MUST | Terminal status. Canonical values: `succeeded`, `failed`, `cancelled`, `timed_out`. Enumeration is **open** — validators MUST NOT reject solely on unknown values. |
| `summary` | string or object | MAY | Human- or machine-readable outcome summary. |
| `metrics` | object | MAY | Counters and measurements: token usage, duration, tool-call count, retries, etc. Open keys. Typical fields: `durationMs`, `inputTokens`, `outputTokens`, `toolCallCount`. |
| `finalOutput` | any | MAY | The agent's final output to the initiator. |
| `error` | object | MAY | Structured error info. SHOULD be present when `status` indicates failure (`failed`, `timed_out`). Typical fields: `type`, `code`, `message`, `stack`. |

Additional properties are not permitted in the payload.

#### Pairing with `run_started`

A Pack that contains a `run_completed` for a given `runId` SHOULD also contain the corresponding `run_started` event. A Pack containing a `run_completed` without a `run_started` MAY be valid (e.g. an attestation spanning only the tail of a long-running run) but validators SHOULD flag it.

The `run_completed` envelope's `causality.parents` SHOULD include the `eventId` of the `run_started`. Intermediate events (`tool_call`, `tool_result`, `policy_eval`) MAY also appear in `causality.parents` when they are direct causal antecedents of completion (e.g. a `tool_result` that produced the final answer, or a `policy_eval` that triggered cancellation).

The Pack-level conformance suite (deferred to v0.2; see [ADR 0001](../../adr/0001-spec-status-and-breaking-change-policy.md)) will include cross-event checks that the schemas alone cannot express: `runId` consistency between paired events, `status`-vs-`error` correlation, parent eventId reachability, and so on. v0.1 validators MAY perform these checks but the spec does not require them.

### `tool_call`

Schema: [`event/tool_call.json`](../../../schemas/v0.1/core/event/tool_call.json).

Records the agent's invocation of a tool. The outcome is recorded in a paired `tool_result` event sharing the same `toolCallId`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `toolCallId` | URI string | MUST | Unique identifier for this invocation within the run. The paired `tool_result` MUST carry this exact value. |
| `runId` | URI string | MUST | The run this call belongs to. MUST match the run's `run_started.runId`. |
| `toolRef` | URI string | MUST | `toolId` of the tool being invoked. SHOULD correspond to a `project.tool.registered` event. |
| `toolName` | string | MAY | Human-readable display name. Convenience only — `toolRef` is canonical. |
| `input` | any | SHOULD | Arguments passed to the tool. Open shape, structured form preferred over stringified JSON. MAY be omitted only when the tool takes no input. |

Additional properties are not permitted in the payload.

#### Policy linkage

When a tool call is subject to policy evaluation (allow / deny), the relevant `policy_eval` event SHOULD be referenced from this event's envelope `contextEvents`, **not** from a payload field. This keeps the `tool_call` payload schema decoupled from policy concerns.

A `tool_call` that is ultimately refused by policy is still recorded — followed by a `tool_result` with `outcome: "denied"`. Capturing the attempt is more audit-useful than omitting it.

### `tool_result`

Schema: [`event/tool_result.json`](../../../schemas/v0.1/core/event/tool_result.json).

Records the terminal outcome of a tool invocation.

| Field | Type | Required | Notes |
|---|---|---|---|
| `toolCallId` | URI string | MUST | MUST match the paired `tool_call.toolCallId`. The `tool_call` SHOULD appear in this event's `causality.parents`. |
| `runId` | URI string | MUST | MUST match the paired `tool_call.runId`. Duplicated on the result so verifiers don't have to traverse the call event to identify the run. |
| `outcome` | string | MUST | Canonical values: `success`, `error`, `denied`, `timeout`. Enumeration is **open** — validators MUST NOT reject solely on unknown values. |
| `output` | any | MAY | What the tool returned. SHOULD be present when `outcome` is `success`. |
| `error` | object | MAY | Structured error info. SHOULD be present when `outcome` is `error`, `denied`, or `timeout`. Typical fields: `type`, `code`, `message`. |
| `metrics` | object | MAY | Counters: `durationMs`, `bytesIn`, `bytesOut`, `retryCount`, etc. Open keys. |

Additional properties are not permitted in the payload.

#### Pairing with `tool_call`

A `tool_result` MUST refer to exactly one `tool_call` (via `toolCallId`). A `tool_call` SHOULD be followed by exactly one `tool_result` in the same Pack; a Pack containing a `tool_call` with no matching `tool_result` is incomplete (the call's outcome is unknown) and validators SHOULD flag it. A Pack containing two `tool_result` events for the same `toolCallId` is invalid — the Pack-level conformance suite (v0.2+) will reject it.

The `tool_result` envelope's `causality.parents` SHOULD include the `tool_call.eventId`. If the result was determined by an intermediate event (e.g. a `policy_eval` producing a denial), that event MAY also appear in `causality.parents`.

### `policy_eval`

Schema: [`event/policy_eval.json`](../../../schemas/v0.1/core/event/policy_eval.json).

Records the evaluation of a specific policy version against a subject, with the resulting decision.

| Field | Type | Required | Notes |
|---|---|---|---|
| `policyEvalId` | URI string | MUST | Unique identifier for this evaluation. Other events may reference it via `causality.parents` or `contextEvents`. |
| `runId` | URI string | MAY | The run this eval belongs to. Omitted for project-level evaluations. |
| `policyRef` | URI string | MUST | Stable identity of the policy. SHOULD correspond to the `policyId` in some `policy.published` event. |
| `policyVersionRef` | string | MUST | Identifier of the specific version applied. MUST match a `policy.published.policyVersionId` (in this Pack or resolvable elsewhere). |
| `decision` | string | MUST | Canonical values: `allow`, `deny`, `require_review`, `error`. **Open** — validators MUST NOT reject solely on unknown values. |
| `subject` | object | SHOULD | What was evaluated. Typical fields: `type`, `ref` (an eventId), `description`. Omitted only when the policy applies to ambient context with no specific subject. |
| `inputs` | object | MAY | Data the policy considered. Distinct from `subject`. |
| `reasoning` | string or object | MAY | Explanation of the decision. Free text or structured rule trace. |

Additional properties are not permitted in the payload.

#### Cross-Pack policy references

`policy_eval` references a policy version by **string equality** (`policyVersionRef` ↔ `policyVersionId`), not by `eventId`. This is intentional: a Pack covering a run from yesterday may evaluate a policy that was published last week (whose `policy.published` event lives in last week's Pack). Cross-Pack `eventId` references via envelope `contextEvents` are not permitted in v0.1 — the string-based `policyVersionRef` is the canonical cross-Pack link.

When a `policy.published` event *is* present in the same Pack as the `policy_eval`, the `policy_eval`'s envelope `contextEvents` SHOULD include the `policy.published.eventId`.

#### Subject and contextEvents

When `subject.ref` is an `eventId` of an event in the same Pack (e.g. the `tool_call.eventId` being evaluated), that `eventId` SHOULD also appear in this event's envelope `contextEvents`. The payload field and the envelope field together let validators reason about the relationship without parsing free-form `subject` content.

### `policy.published`

Schema: [`event/policy.published.json`](../../../schemas/v0.1/core/event/policy.published.json).

Records the publication of a specific version of a policy. Subsequent `policy_eval` events apply a particular version by string-matching `policyVersionRef` against this event's `policyVersionId`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `policyId` | URI string | MUST | Stable identity of the policy across versions. |
| `policyVersionId` | string | MUST | Identifier of this specific version. Free-form string. Referenced from `policy_eval.policyVersionRef`. |
| `name` | string | MAY | Human-readable display name. |
| `description` | string | MAY | Human-readable description. |
| `source` | object | MAY | Where the policy definition lives. Typical: `type`, `uri`, `hash`. SHOULD be present unless `content` is. |
| `content` | string or object | MAY | Inline policy content. SHOULD only be used for small policies; large policies SHOULD use `source` with a content hash. |
| `publishedBy` | object | MAY | Who or what published this version. |
| `effectiveAt` | RFC 3339 timestamp | MAY | When this version takes effect for evaluations. MAY differ from envelope `occurredAt`. |
| `supersedes` | string | MAY | `policyVersionId` of the previous version this one replaces. |

Additional properties are not permitted in the payload.

#### Publication completeness

A `policy.published` event with neither `source` nor `content` records that *something* was published but provides no auditable definition of what. Validators SHOULD flag such events. The spec does not reject them — a downstream system may resolve the policy definition out-of-band (e.g. from a known artifact repository) — but the Pack-level conformance suite (v0.2+) will warn.

#### Pairing model

Unlike `run_*` and `tool_*`, `policy_eval` and `policy.published` are **not paired one-to-one**. A single `policy.published` may be referenced by many `policy_eval` events (potentially across many Packs), and a `policy_eval` references exactly one published version. There is no completeness requirement that a `policy_eval` be accompanied by its `policy.published` in the same Pack.

### `project.agent.registered`

Schema: [`event/project.agent.registered.json`](../../../schemas/v0.1/core/event/project.agent.registered.json).

Declares an agent's identity, metadata, and capabilities in the project. `run_started` events reference an agent via `agentRef` matching this event's `agentId`. This is a **project-state** event, not run-scoped — it carries no `runId`, and its envelope `causality.parents` is typically empty.

| Field | Type | Required | Notes |
|---|---|---|---|
| `agentId` | URI string | MUST | Stable identifier across versions. |
| `agentVersionId` | string | MAY | Version of the agent. Omitted by implementers who do not version agents. |
| `name` | string | MAY | Display name. SHOULD be provided — opaque IDs are harder to audit. |
| `description` | string | MAY | Description of what the agent does. |
| `owner` | object | MAY | Who owns/maintains the agent. |
| `model` | object | MAY | Foundation model: `name`, `version`, `provider`, ... |
| `instructions` | string or object | MAY | System prompt. SHOULD use a hash reference or redacted form for proprietary content. |
| `allowedTools` | array of URI strings | MAY | Static tool allowlist. Omitted when runtime policy is the sole gating mechanism. |
| `effectiveAt` | RFC 3339 timestamp | MAY | When the registration takes effect. |
| `supersedes` | string | MAY | `agentVersionId` of the previous version this replaces. |

Additional properties are not permitted in the payload.

### `project.tool.registered`

Schema: [`event/project.tool.registered.json`](../../../schemas/v0.1/core/event/project.tool.registered.json).

Declares a tool's identity, metadata, and schema in the project. `tool_call` events reference a tool via `toolRef` matching this event's `toolId`. Project-state event — no `runId`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `toolId` | URI string | MUST | Stable identifier across versions. |
| `toolVersionId` | string | MAY | Version of the tool. |
| `name` | string | MAY | Display name. SHOULD be provided. |
| `description` | string | MAY | What the tool does. |
| `owner` | object | MAY | Who owns/maintains the tool. |
| `schema` | object | MAY | Input/output schema. Typical: `{ "input": <JSON Schema>, "output": <JSON Schema> }`. Protobuf or other descriptor formats permitted; JSON Schema preferred for interop. |
| `implementation` | object | MAY | How the tool runs: `type`, `endpoint`, `hash`, ... |
| `effectiveAt` | RFC 3339 timestamp | MAY | When the registration takes effect. |
| `supersedes` | string | MAY | `toolVersionId` of the previous version this replaces. |

Additional properties are not permitted in the payload.

#### Pack composition with project events

Project events MAY appear:

- **Mixed with run events** in a per-run Pack — the registrations relevant to the run are included for self-containment, even if they predate the run.
- **Standalone in a registry-snapshot Pack** — e.g. an attestation that, as of `issuedAt`, these agents and tools were registered in the project.
- **Omitted entirely** from a run-only Pack — when registrations are resolvable from another Pack or external registry. Cross-Pack `eventId` references via envelope `contextEvents` are not permitted in v0.1, but cross-Pack string-equality references (`agentRef` ↔ `agentId`, `toolRef` ↔ `toolId`) are how the link is canonically expressed.

Like policy registrations, agent and tool registrations are **not paired** with their referencing events: one registration is referenced by many runs and many tool calls, often across many Packs.

#### Why dotted names

The three project-state event types — `project.agent.registered`, `project.tool.registered`, `policy.published` — use dotted segment names reflecting a `<scope>.<resource>.<action>` convention, distinct from the snake_case used for runtime events (`run_started`, `tool_call`, …). This split is preserved as-is in v0.1; a future v0.x release MAY normalise the naming style. From v1.0 onward, the naming style is frozen.
