# Signing — v0.1

> **Status:** Stub. To be filled in.

## Encoding

Signatures MUST use **Detached JWS** ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)):

- Compact serialisation: `<protected-header>..<signature>` (note the empty payload segment between the two dots).
- The signed payload is supplied out-of-band and MUST be the JCS canonicalisation of the object being signed.

## Canonicalisation

The bytes signed by a Detached JWS MUST be produced by applying [JCS (RFC 8785)](https://www.rfc-editor.org/rfc/rfc8785) to the JSON object being signed, **with the `signature` field removed** prior to canonicalisation.

For per-event signatures: canonicalise the event object with `signature` removed.

For Pack-level signatures: canonicalise the Pack object with the top-level `signature` removed. Per-event signatures remain in place during Pack canonicalisation.

## Algorithm

For v0.1, the JWS protected header MUST contain:

- `"alg": "EdDSA"` (Ed25519).
- `"kid": "<implementer-defined key identifier>"`.

No other algorithms are permitted in v0.1. See [ADR 0004](../../adr/0004-signature-encoding-detached-jws-jcs.md).

## Key resolution

How a verifier resolves `kid` to a public key is **out of scope** for this spec. See [ADR 0006](../../adr/0006-keys-and-trust-out-of-scope.md). Implementers MUST document their own resolution mechanism.

## Hash chain

> **TODO:** specify the hash function (SHA-256), `prevHash` computation, and the relationship between event signatures and the hash chain.

## Multi-signature

Not supported in v0.1. A future major version may introduce a `proofs` array or similar.
