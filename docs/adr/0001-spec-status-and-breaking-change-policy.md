# ADR 0001 — Spec status and breaking-change policy

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

v0.1.0 of the Assurance Pack spec is the first publishable cut. We need a clear policy on what guarantees it offers to external validator authors before v1.0.0, and what changes between versions.

There is tension between two goals:

1. Make v0.1.0 useful **now** as a structured reference that third parties can implement against.
2. Preserve the freedom to fix structural mistakes before locking in a v1.0.0 compatibility commitment.

## Decision

**v0.x is a "solid reference, may still evolve":**

- v0.x minor bumps MAY introduce breaking changes.
- v1.0+ minor bumps MUST be strictly additive (no removals, no type changes, no optional→required transitions, no removed enum values, no semantic changes to existing fields).
- Patch bumps MUST NOT change normative content. They cover prose, examples, and typos only.
- Major bumps MAY change anything and live in a disjoint `@context` URL tree.
- **Crypto-stability outranks spec-stability.** Any change to the signature format or canonicalisation method is ALWAYS a major bump, including pre-1.0. This protects the trust model from regressions that a "v0.x may break" rule would otherwise allow.

**Additive vs. breaking definitions:**

| Additive (non-breaking) | Breaking |
|---|---|
| New optional fields | Removing fields |
| New enum values in open enumerations | Removing enum values |
| New event types | Type changes |
| New `extensions.*` slots | Optional → required |
| | Changing semantics of existing fields |

**`specVersion` field** is a plain semver string (e.g. `"specVersion": "0.1.0"`). The `@context` URL encodes only MAJOR.MINOR, not patch.

The v0.1.0 ADRs MAY carry "draft" or "preliminary" markers. Design-partner validation is NOT required to freeze v0.1.0.

## Consequences

- External implementers building against v0.1.0 are explicitly warned that v0.2.0 may break them.
- We retain the freedom to redesign field shapes through the v0.x line based on early implementation feedback.
- Once v1.0.0 ships, the additive-only rule constrains future design choices significantly — so the v1.0.0 cut MUST be deliberate.
- The crypto-stability carve-out means we cannot, for example, swap JCS for another canonicalisation method in a v0.2.0 bump; that would require v1.0.0 even from v0.5.0.

## Related

- [ADR 0003](0003-hosting-strategy-durable-urls.md) — how disjoint major version trees are hosted.
- [ADR 0004](0004-signature-encoding-detached-jws-jcs.md) — the signature format whose stability outranks spec stability.
