# Extension slots — v0.1

> **Status:** Stub. To be filled in.

## Slot semantics

A Pack MAY carry vendor-specific content under an `extensions` object. The spec defines only the shape of the slot:

```json
{
  "extensions": {
    "<implementer-namespace>": { /* arbitrary JSON, implementer-defined */ }
  }
}
```

Rules:

- `extensions` is OPTIONAL.
- Keys under `extensions` SHOULD be DNS-style or short identifiers chosen by the implementer (e.g. `striadex`, `acme.audit`).
- A Pack MAY contain multiple namespaces simultaneously.
- The spec MUST NOT define any required field, type, or vocabulary under `extensions.<implementer>.*`.
- Implementers MUST document their own namespaces externally.

## Conformance and validation

- A validator at structural conformance level MUST ignore unknown `extensions` namespaces.
- A validator MAY also verify a specific implementer's namespace against that implementer's schema — but doing so is not a claim of conformance to this spec.

## Why this layer exists

See [ADR 0005](../../adr/0005-three-layer-pack-structure.md). In short: audience-specific or implementer-specific content does not belong in the open spec, but Packs still need a defined slot for it so that implementers don't collide.
