# Versioning — v0.1

> **Status:** Stub. Pointer to ADRs for the binding decisions.

The full breaking-change policy is in [ADR 0001](../../adr/0001-spec-status-and-breaking-change-policy.md). The hosting model is in [ADR 0003](../../adr/0003-hosting-strategy-durable-urls.md). This document summarises both for spec readers.

## `specVersion`

Plain semver, e.g. `"specVersion": "0.1.0"`. MUST appear at the top level of every Pack.

## `@context` URL

Encodes only MAJOR.MINOR:

```
https://spec.striadex.ai/v0.1/context.jsonld
https://spec.striadex.ai/v0.2/context.jsonld
https://spec.striadex.ai/v1.0/context.jsonld
```

Patch is NOT in the URL. Patches MUST NOT change normative content.

## Bump rules

| Bump | May break? | Allowed changes |
|---|---|---|
| Patch (`0.1.0` → `0.1.1`) | Never | Prose, examples, typos. No schema changes. No `@context` URL change. |
| Minor pre-1.0 (`0.1.0` → `0.2.0`) | Yes | Schema changes. `@context` URL changes. Old Packs remain valid under their old URL. |
| Minor post-1.0 (`1.0.0` → `1.1.0`) | No | Additive only. |
| Major (`1.0.0` → `2.0.0`) | Yes | Anything. New disjoint `@context` URL tree. |

**Crypto stability outranks spec stability.** Any change to the signature format or canonicalisation method is ALWAYS a major bump, including pre-1.0.

## Major version coexistence

v0.1, v0.2, v1.0, ... live in disjoint URL trees. A Pack signed under v0.1 will always resolve at `https://spec.striadex.ai/v0.1/...`, regardless of newer versions.
