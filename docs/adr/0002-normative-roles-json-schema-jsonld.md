# ADR 0002 — Normative roles of JSON Schema and JSON-LD context

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

A Pack carries both **structural** content (fields, types, required-ness) and **semantic** content (what those fields *mean* in a regulatory or audit vocabulary). Two formal mechanisms are in scope:

- **JSON Schema 2020-12** — well-established structural validation, broad tooling support.
- **JSON-LD `@context`** — maps fields to vocabulary URIs, allowing semantic interop with RDF-aware tooling and downstream regulators who want canonical term resolution.

We need to decide which is normative for what, so that validator authors know which one to run and what compliance claim it backs.

## Decision

- **JSON Schema is normative for structure.** It defines which fields exist, what types they have, and which are required. A validator that runs the published JSON Schemas against a Pack and passes is **structurally conformant**.
- **JSON-LD `@context` is normative for meaning.** It defines which vocabulary URI each field semantically maps to. A validator that additionally resolves `@context` and interprets vocabulary URIs is **semantically conformant**.
- **Two conformance levels** are defined. Structural conformance is the minimum bar; semantic conformance is opt-in additional commitment.
- **`@context` MAY be sparse in v0.1.0.** Not every field needs a vocab URI. Fields with regulatory or audit significance (e.g. `aiActRole`, `aiActArticles`, OWASP categories, control identifiers) SHOULD have vocab URIs. Statistical counters and operational metadata need not.

## Consequences

- Implementers can ship a structural validator with mainstream JSON Schema tooling and no JSON-LD processor. That is a legitimate v0.1.0 conformance claim.
- Adding vocab URIs to fields in later versions is additive (does not break structural conformance) and so is allowed even in post-1.0 minor bumps.
- Removing a vocab URI, or changing the URI a field maps to, IS a semantic break — treated as breaking under the post-1.0 additive rule.
- Downstream regulators or insurance carriers who want canonical term resolution have a path (semantic conformance) without burdening every validator author.

## Related

- [ADR 0001](0001-spec-status-and-breaking-change-policy.md) — breaking-change rules apply to both Schema and `@context`.
