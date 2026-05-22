# ADR 0004 — Signature encoding: Detached JWS over JCS

- **Status:** Accepted (draft)
- **Date:** 2026-05-22
- **Deciders:** Striadex spec authors

## Context

A Pack and each Event need to be cryptographically signed so that downstream auditors can verify the bundle was produced by a known issuer and has not been tampered with. The signature must:

1. Be independently verifiable using standard tooling.
2. Survive whitespace and key-ordering differences in JSON (canonicalisation).
3. Not embed itself inside the bytes that it signs (chicken-and-egg).
4. Be auditable by parties who do not trust our infrastructure.

Several well-trodden options exist (JOSE/JWS, COSE, Data Integrity Proofs with VC-style proof blocks, ad-hoc HMAC, etc.). Algorithm-agility and multi-signature add complexity that we do not yet need.

## Decision

- **Encoding: Detached JWS** ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)). A three-segment compact serialisation `header.payload.signature` with the middle segment empty. The signed payload is supplied out-of-band — see canonicalisation below.
- **Canonicalisation: JCS** ([RFC 8785](https://www.rfc-editor.org/rfc/rfc8785)) applied to the JSON object being signed, **excluding** the `signature` (or `proof`) field itself. The JCS output is the input to the JWS signing operation.
- **Algorithm: Ed25519 only** (JWS `alg=EdDSA`) for v0.1.0. No algorithm agility in v0.1.0. A `cryptosuite` field or similar may be added later — that would be a major bump (see ADR 0001's crypto-stability carve-out).
- **Multi-signature: out of scope for v0.1.0.** A dual-sign scheme (issuer + co-signer) is plausible future work.
- **Key distribution: out of scope.** The spec defines only the `kid` field's semantics. How a verifier resolves `kid` to a public key (JWKS endpoint, x509 chain, DID, manual trust store, ...) is the implementer's choice and is documented separately by each implementer. See [ADR 0006](0006-keys-and-trust-out-of-scope.md).

## Consequences

- A verifier needs three things: a JCS implementation, a JWS verifier with EdDSA support, and a way to map `kid` to a public key. The first two are widely available; the third is explicitly the verifier's responsibility.
- Excluding the `signature` field from canonicalisation avoids the self-reference problem cleanly.
- Hardcoding Ed25519 keeps v0.1.0 simple and rules out negotiation-related attacks (no algorithm downgrade).
- Adding new algorithms requires a major bump. This is intentional — we don't want to ship JCS+EdDSA today and find ourselves needing to redo every signed Pack in production because we wanted ECDSA next quarter.
- A signed v0.1 Pack remains verifiable forever as long as the public key for its `kid` is still resolvable.

## Related

- [ADR 0001](0001-spec-status-and-breaking-change-policy.md) — crypto changes are always major.
- [ADR 0006](0006-keys-and-trust-out-of-scope.md) — key distribution out of scope.
