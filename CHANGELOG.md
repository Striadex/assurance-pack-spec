# Changelog

All notable changes to the Assurance Pack specification are documented in this file. Format loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows the rules in [ADR 0001](docs/adr/0001-spec-status-and-breaking-change-policy.md).

## [Unreleased]

## [0.1.0] — Unreleased

Initial draft of the Assurance Pack specification.

### Added

- Three-layer Pack structure: `core`, `extended`, `extensions.<implementer>.*`.
- Eight canonical event types in `core`: `run_started`, `run_completed`, `tool_call`, `tool_result`, `policy_eval`, `policy.published`, `project.agent.registered`, `project.tool.registered`.
- `extended` shapes: subject, issuer, scope, executionEvidence, incidentSummary, humanOversightSummary, supplyChain, riskClassification, controlAttestations (open enumerations).
- Signature scheme: Detached JWS (RFC 7515) over JCS (RFC 8785), Ed25519 only.
- JSON-LD `@context` at `https://spec.striadex.ai/v0.1/context.jsonld`.
- Hosting at `https://spec.striadex.ai/v0.1/...` via GitHub Pages.
- ADRs 0001 through 0007.
