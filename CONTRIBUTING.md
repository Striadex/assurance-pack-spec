# Contributing

Thanks for your interest in the Assurance Pack specification.

## How to propose a change

1. **Open an issue first** for anything that affects the spec, schemas, or `@context`. This includes new event types, new fields in `core` or `extended`, signature-scheme changes, and versioning policy questions.
2. **Architecture decisions** are tracked under [`docs/adr/`](docs/adr/) using a lightweight ADR format (sequentially numbered, status + context + decision + consequences). Significant spec changes SHOULD be accompanied by an ADR.
3. **Pull requests** should include: the schema change, an updated example (if applicable), and a CHANGELOG entry under the next unreleased version.

## Versioning

See [ADR 0001](docs/adr/0001-spec-status-and-breaking-change-policy.md). In short:

- **Patch** — proza, typos, examples. No schema changes.
- **Minor pre-1.0** — MAY break. Schema changes allowed. New `@context` URL.
- **Minor post-1.0** — additive only.
- **Major** — disjoint `@context` tree.
- **Crypto-stability > spec-stability:** any change to signature format or canonicalisation is ALWAYS a major bump, even pre-1.0.

## Extension content

Implementer-specific evidence (named controls, regulatory mappings, scoring formulas, carrier-specific exports) belongs in `extensions.<implementer>.*`, documented in the implementer's own docs — not in this spec. See [ADR 0005](docs/adr/0005-three-layer-pack-structure.md).

## License

By contributing, you agree your contributions are licensed under Apache-2.0.
