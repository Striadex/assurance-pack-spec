# Assurance Pack Specification — v0.1

**Status:** Draft. v0.x minor bumps MAY introduce breaking changes (see [ADR 0001](../../adr/0001-spec-status-and-breaking-change-policy.md)).

## Conformance language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals.

## Conformance levels

An implementation MAY claim one of two conformance levels:

- **Structurally conformant.** Validates Packs against the JSON Schemas published under `https://spec.striadex.ai/v0.1/schemas/`.
- **Semantically conformant.** ALSO resolves the JSON-LD context at `https://spec.striadex.ai/v0.1/context.jsonld` and interprets vocabulary URIs.

See [ADR 0002](../../adr/0002-normative-roles-json-schema-jsonld.md).

## Pack structure

A Pack has three layers:

1. **`core`** — mandatory mechanics. See [pack.md](pack.md) and [events.md](events.md).
2. **`extended`** — optional audience-neutral evidence shapes. See [pack.md](pack.md).
3. **`extensions.<implementer>.*`** — implementer-defined slots. See [extensions.md](extensions.md).

See [ADR 0005](../../adr/0005-three-layer-pack-structure.md).

## Companion documents

- [events.md](events.md) — Event envelope and the 8 canonical event types.
- [pack.md](pack.md) — Pack envelope and `extended` shapes.
- [extensions.md](extensions.md) — Extension slot semantics.
- [signing.md](signing.md) — Detached JWS over JCS, what bytes are signed.
- [versioning.md](versioning.md) — Semver rules and `@context` URL convention.

## Status of this document

This document is a v0.1.0 draft. It is **not** yet ready for permanent reference under `https://spec.striadex.ai/v0.1/`. The schemas, examples, and prose under v0.1 will be filled in iteratively before the v0.1.0 tag is cut and the GitHub Pages site goes live.
