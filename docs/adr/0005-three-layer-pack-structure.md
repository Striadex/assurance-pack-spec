# ADR 0005 — Three-layer Pack structure: core, extended, extensions

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

A Pack carries content of three different kinds:

1. **Universal mechanics** that every Pack must have to be a Pack at all — event envelope, hash chain, Pack envelope, signature.
2. **Audience-neutral evidence shapes** that many regulators / insurers / procurement teams care about, but where the *content* differs per implementer (e.g. control attestations, supply chain, risk classification).
3. **Implementer-specific content** that is meaningful only inside one vendor's product world (e.g. Striadex's 5 named controls like `LEAST_AGENCY`, our Annex IV mapping, our risk-score formula).

Putting all of this in one open spec would force implementers either to adopt our vocabulary or to ignore the spec's audience-specific content. Putting it all in private implementer docs would defeat the point of having an open Assurance Pack format.

## Decision

A Pack is organised in three layers with distinct ownership rules:

| Layer | Contents | Spec defines | Implementer defines |
|---|---|---|---|
| **`core`** | Events (8 canonical types, causality, contextEvents, per-event signature, hash chain), Pack envelope (`specVersion`, `packId`, `issuedAt`, Pack signature) | Shape and content — normative, required | — |
| **`extended`** | Audience-neutral evidence: `subject`, `issuer`, `scope`, `executionEvidence`, `incidentSummary`, `humanOversightSummary`, `supplyChain`, `riskClassification`, `controlAttestations`. Open arrays / enumerations — no locked control IDs or regulation article lists. | Shape — normative, optional | Content within the open shape |
| **`extensions.<implementer>.*`** | Vendor-specific content (e.g. `extensions.striadex.controls`, `extensions.striadex.compliance`, `extensions.striadex.insurance`, `extensions.striadex.procurement`, `extensions.striadex.riskScore`) | Only the slot (`extensions: { [string]: object }`) | Shape AND content, in implementer-owned docs |

**Sauce discipline.** The rule we apply when deciding where a concept lives:

- *Audience-neutral concepts* (control attestations exist, risk classification exists, supply chain exists) → `extended` with open shapes.
- *Implementer-specific instantiations* (which 5 controls, which Annex IV mapping, which scoring formula) → `extensions.<implementer>.*`, documented in implementer-owned docs.

A Pack that contains only `core` is valid. A Pack with `extended` MUST conform to the open shapes defined here. A Pack with `extensions.<implementer>.*` content makes no claim against this spec for that content — verification of those fields is the implementer's responsibility.

## Consequences

- Third-party implementers can ship Packs that include their own `extensions.acme.*` namespace without needing our blessing or a spec change.
- We can publish Striadex-specific control vocabularies, regulator mappings, and scoring formulas without polluting the open spec — they live in product docs under our `extensions.striadex.*` namespace.
- Adding a new `extended` shape is additive (allowed post-1.0). Changing the meaning of an existing one is not.
- A downstream auditor who only cares about `core` (e.g. a hash-chain verifier) can ignore `extended` and `extensions` entirely.
- The `extensions` slot is forward-compatible — new implementers add new namespaces without colliding.

## Related

- [ADR 0001](0001-spec-status-and-breaking-change-policy.md) — additive rules apply per layer.
- [ADR 0002](0002-normative-roles-json-schema-jsonld.md) — `@context` covers `core` and `extended`; `extensions.*` are out of scope for the open vocab.
- Striadex product repo `ADR 0012` — companion ADR that codifies how Striadex uses `extensions.striadex.*`.
