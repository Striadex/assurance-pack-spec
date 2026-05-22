# ADR 0006 — Keys and trust model are out of scope

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

A signed Pack is only useful if a verifier can find the right public key, decide whether to trust it, and detect revocation. Key management is a deep topic with several well-trodden options (JWKS endpoints, x509 chains, DIDs, manual trust stores, transparency logs). Each has operational and policy implications.

If we standardise a key-distribution mechanism in this spec, we are making a commitment about infrastructure that is not actually about *the Pack format*. We would also be picking a side in debates (centralised vs. decentralised PKI) that the spec has no business taking a position on.

This decision also has a parallel in the product repo (ADR 0011), which already concluded that key distribution is product-level concern, not spec concern.

## Decision

The spec defines **only** the `kid` field's semantics in the signature header:

- `kid` is a string identifier for the signing key.
- The spec MUST NOT mandate how `kid` is resolved to a public key.
- The spec MUST NOT mandate revocation, rotation, or trust-anchor mechanisms.

Implementers MUST document how their `kid` values can be resolved to public keys (e.g. "our `kid` values are URLs to JWKS endpoints", or "our `kid` values are DIDs, resolve via the DID method spec").

Verifiers MUST be configured with their own trust policy — which issuers they accept, how they discover keys, what they do on revocation. The spec does not constrain these decisions.

## Consequences

- The spec stays focused on the Pack format and signature *encoding*, not on PKI.
- Implementers retain flexibility to use whatever key-distribution model suits their context (vendor with JWKS endpoint, government with x509 chain, decentralised system with DIDs).
- A `kid` value alone cannot be used as a trust signal — verifiers must combine it with their own policy.
- If standards-body adoption eventually demands a normative key-distribution mechanism, that addition is **breaking** (changes what `kid` means) and would require a major bump.

## Related

- Striadex product repo `ADR 0011` — original product-level decision; this ADR codifies its position in the open spec.
- [ADR 0004](0004-signature-encoding-detached-jws-jcs.md) — defines the JWS header that carries `kid`.
