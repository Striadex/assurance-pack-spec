# Assurance Pack Specification

Open specification for the **Assurance Pack** — a signed, replayable bundle of evidence about an AI agent run, intended for use by regulators, insurers, procurement teams, and other downstream auditors.

This repository contains the normative spec, JSON Schemas, JSON-LD context, and reference examples. It is maintained by [Striadex](https://striadex.ai) and published under Apache-2.0.

The canonical home is <https://spec.striadex.ai>. Versioned trees live at `https://spec.striadex.ai/v{MAJOR.MINOR}/...`.

## Status

**v0.1.0 — draft.** Pre-1.0 minor bumps MAY break compatibility. From v1.0.0 onward, minor bumps MUST be strictly additive. See [ADR 0001](docs/adr/0001-spec-status-and-breaking-change-policy.md).

## What's in a Pack

A Pack has three layers (see [ADR 0005](docs/adr/0005-three-layer-pack-structure.md)):

| Layer | Definition |
|---|---|
| `core` | Event envelope + 8 canonical event types + Pack envelope + signature. Normative, required. |
| `extended` | Audience-neutral evidence shapes: subject, issuer, scope, executionEvidence, incidentSummary, humanOversightSummary, supplyChain, riskClassification, controlAttestations. Normative, optional, open enumerations. |
| `extensions.<implementer>.*` | Implementer-defined content. The spec defines only the slot; implementers define the shape and meaning of their own namespace. |

The 8 canonical event types are: `run_started`, `run_completed`, `tool_call`, `tool_result`, `policy_eval`, `policy.published`, `project.agent.registered`, `project.tool.registered`.

## Conformance levels

A validator MAY claim one of two conformance levels:

- **Structurally conformant** — validates a Pack against the JSON Schemas in `schemas/v0.1/core/` (and optionally `extended/`).
- **Semantically conformant** — also resolves the JSON-LD `@context` at `https://spec.striadex.ai/v0.1/context.jsonld` and interprets vocabulary URIs.

See [ADR 0002](docs/adr/0002-normative-roles-json-schema-jsonld.md).

## Conformance language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals, as shown here.

## Repository layout

```
docs/
  adr/        Architecture decision records for the spec itself
  spec/v0.1/  Normative + informative spec documents
schemas/v0.1/ JSON Schema 2020-12 schemas (core, extended)
context/v0.1/ JSON-LD context
examples/v0.1/ Reference Packs (valid + invalid)
```

## License

Apache-2.0. See [LICENSE](LICENSE).
