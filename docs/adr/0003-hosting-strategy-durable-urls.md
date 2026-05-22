# ADR 0003 — Hosting strategy for durable URLs

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

A signed Pack embeds a `@context` URL and may reference schema `$id` URLs. Those URLs MUST resolve **for the lifetime of any Pack ever signed under them** — a Pack signed in 2026 under v0.1 must still resolve and validate in 2036.

This forces decisions about:

1. The domain (long-lived, under our control).
2. The path shape (version embedded, not patch-coupled).
3. How major versions coexist (shared tree vs. disjoint trees).
4. Whether to use a redirect indirection layer (e.g. w3id) from day one.

## Decision

- **Domain:** `spec.striadex.ai`, served by GitHub Pages via CNAME from `Striadex.github.io`. Apex domain `striadex.ai` was registered 2026-05-22.
- **Path shape:** `https://spec.striadex.ai/v{MAJOR.MINOR}/...`. Patch is NOT in the URL — patch bumps cannot change normative content and so cannot change resolved artefacts.
- **Disjoint major version trees.** v0.1, v0.2, v1.0 share no URL space. Each lives at its own `v{MAJOR.MINOR}/` root and serves its own immutable copy of schemas, context, and spec docs.
- **No w3id indirection in v0.1.0.** Adding a `w3id.org/striadex/...` redirect later (e.g. for standards-body adoption) is a non-breaking, non-spec change and does not require any version bump.

## Consequences

- A Pack signed under v0.1 will always resolve at `https://spec.striadex.ai/v0.1/...`, regardless of what we ship in v0.2 or v1.0.
- We never have to perform a destructive content edit at a published URL. Patches can fix prose at the existing URL but only within the same MAJOR.MINOR.
- The disjoint-tree rule means small typo fixes in v0.1 do not propagate to v0.2 automatically. We accept this duplication cost in exchange for the guarantee.
- GitHub Pages is the underlying host. If we ever need to migrate (CDN, S3, custom infra), the public URLs stay stable — only the CNAME target changes.
- Adding w3id later is cheap and reversible.

## Operational setup

- `CNAME` file at repo root contains `spec.striadex.ai`.
- DNS CNAME record `spec.striadex.ai` → `Striadex.github.io` configured at the registrar of `striadex.ai`.
- GitHub Pages serves from a branch or directory decided during scaffolding (TBD: `gh-pages` branch vs. `docs/` directory).

## Related

- [ADR 0001](0001-spec-status-and-breaking-change-policy.md) — breaking-change policy that justifies disjoint major trees.
- [ADR 0002](0002-normative-roles-json-schema-jsonld.md) — `@context` URL is one of the artefacts that must remain resolvable.
