# ADR 0007 — RFC 2119 conformance language

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

The spec needs unambiguous language for requirements vs. recommendations vs. permissions. Two conventions are common in open specs:

- Informal English ("must", "should", "can") — ambiguous in audit contexts where regulators care about whether a statement is mandatory.
- [BCP 14](https://www.rfc-editor.org/info/bcp14) keywords ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) + [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) — capitalised keywords carry defined semantics, lowercase variants do not.

Given the regulatory audience for this spec, ambiguity is expensive.

## Decision

The spec uses BCP 14 (RFC 2119 + RFC 8174) keywords for normative statements.

- The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** carry their BCP 14 meanings when, and only when, written in all capitals.
- Lowercase or sentence-case occurrences of these words carry no normative weight.
- Each normative document (e.g. `docs/spec/v0.1/index.md`) MUST include a "Conformance language" section that references this convention.

## Consequences

- Auditors and regulators can identify normative requirements unambiguously by scanning for capitalised keywords.
- Authors of spec text MUST be deliberate about capitalisation. Reviews SHOULD flag accidental capitalisation of keywords in non-normative prose.
- The README and every spec document include a small boilerplate paragraph; this is acceptable overhead.

## Related

- [ADR 0001](0001-spec-status-and-breaking-change-policy.md) — uses the same keywords for the breaking-change policy itself.
