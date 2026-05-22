# MAK-292 — Handoff voor `assurance-pack-spec` scaffolding

Originele bron: grilling-sessie 2026-05-22 over MAK-292 (Slice 9 — assurance-pack-spec v0.1.0). Doel: alle HITL-keuzes vastleggen vóórdat de spec-repo gescaffold wordt. Deze sessie heeft géén code geschreven; alleen ontwerpkeuzes vastgelegd.

**Status:** klaar voor scaffolding van `assurance-pack-spec` (separate public repo). Werkt los van de `Striadex` product-repo en van MAK-291 PR `#3`.

---

## Updates sinds originele grilling (2026-05-22, later die dag)

Stand sinds de grilling is afgesloten:

- **Domein geregistreerd:** `striadex.ai` (niet `.dev`). Rationale: brand-audience is regulators / insurers / procurement, niet primair developers; `.ai` signaleert het domein direct. Alle URLs hieronder reflecteren dat — `spec.striadex.ai` ipv `spec.striadex.dev`. (Geen `.dev` parallel geregistreerd; kan later eventueel als redirect.)
- **GitHub org bevestigd beschikbaar:** `github.com/Striadex` (capitale **S** — URL is case-insensitive maar display preserveert caps). Spec-repo wordt `github.com/Striadex/assurance-pack-spec`.
- **Beide LAUNCH-CHECKLIST blockers gecleared.** Repo kan aangemaakt worden zodra de org is aangemaakt op GitHub.
- **Werk reeds gedaan in de product-repo (`striadex`/delhi workspace):**
  - ADR 0012 ge-update met de "extensions.<implementer>.*"-nuance (Decisie 5).
  - `docs/product/AgentGate-Assurance-Pack-v0.1.md` heeft een "Superseded for structural details"-header gekregen en `views.compliance/insurance/procurement` is verplaatst naar `extensions.striadex.compliance/insurance/procurement`.
  - `docs/product/AgentGate-Event-Schema-v0.1.md` is "Superseded" gemarkeerd; de 19 event-types daar wijken af van de 8 canonical MAK-290 event-names (`run_started`, `run_completed`, `tool_call`, `tool_result`, `policy_eval`, `policy.published`, `project.agent.registered`, `project.tool.registered`). Spec-repo gebruikt de MAK-290 namen als canoniek.

---

## De zes beslissingen

### Decisie 1 — Doel van v0.1.0: "solide referentie, mag nog evolueren"

v0.1.0 is een gestructureerde referentie die externe validator-authors kunnen implementeren, maar v0.x mag breken bij minor bumps. v1.0+ wordt strikt additieve minors. Examples + conformance suite zijn welkom maar niet 100% verplicht voor 0.1.0. `@context` URL is wel meteen permanent.

**Consequentie:** ADRs in spec-repo mogen "draft"/"preliminary" markers hebben. Geen design-partner-validatie nodig voor v0.1.0 freeze.

### Decisie 2 — JSON Schema is normatief voor structuur, JSON-LD `@context` is normatief voor betekenis

- JSON Schema 2020-12 definieert: welke velden, welke types, welke required.
- JSON-LD `@context` definieert: welke URI elk veld semantisch betekent.
- Een validator die alleen JSON Schema runt is **structureel** conformant; een full-stack validator (Schema + JSON-LD processor) is **semantisch** conformant.
- `@context` mag in v0.1.0 nog sparse zijn — niet elk veld hoeft een vocab-URI te hebben. Belangrijke (zoals `aiActRole`, `aiActArticles`, OWASP categories) wel; statistische tellers niet.

### Decisie 3 — Hosting van durable URLs

- **Domain:** eigen subdomain `spec.striadex.ai`, met GitHub Pages als underlying host (CNAME `spec.striadex.ai` → `Striadex.github.io`).
- **Path shape:** `https://spec.striadex.ai/v{MAJOR.MINOR}/...`. Geen patch in URL.
- **Major versies zijn volledig disjuncte bomen.** v0.1, v0.2, v1.0 delen geen URL-ruimte. Reden: een Pack die in v0.1 is gesigned moet voor altijd kunnen resolven.
- **w3id later als nodig** — niet voor v0.1.0. Als ooit standards-body adoption wordt nagestreefd, kan een w3id-redirect naar `spec.striadex.ai/...` toegevoegd worden zonder breekrelease.

### Decisie 4 — Signature scheme: Detached JWS over JCS

- **Encoding:** Detached JWS (RFC 7515) — drie-segment `header.payload.signature` met leeg payload-segment.
- **Canonicalisation:** JCS (RFC 8785) over de Pack of Event **exclusief** het `signature`/`proof`-veld.
- **Algoritme:** Ed25519 (alg=EdDSA) only voor v0.1.0. Geen algoritme-agility — toevoeging via `cryptosuite`-veld kan in v1.0.
- **Multi-signature:** niet in v0.1.0. Dual-sign (klant + product) is future work.
- **Key distribution: expliciet OUT of scope** — per ADR 0011. Spec definieert `kid`-veld semantiek, niet hoe de public key gevonden wordt. Implementations documenteren hun eigen approach (bv. JWKS endpoint).

### Decisie 5 — Drielagen Pack-structuur: core / extended / extensions

| Laag | Wat erin | Wie definieert shape | Wie definieert inhoud |
|---|---|---|---|
| **`core`** | Events (8 types + causality + contextEvents + per-event signature + hash chain), Pack envelope (`specVersion`, `packId`, `issuedAt`, Pack signature) | Open spec, normatief required | Open spec, normatief |
| **`extended`** | Audience-**neutrale** content: `subject`, `issuer`, `scope`, `executionEvidence`, `incidentSummary`, `humanOversightSummary`, `supplyChain`, `riskClassification`, `controlAttestations`. Als **open arrays/enumeraties** — geen gelockte controlIds of article-lijsten. | Open spec, normatief optional | Open per implementer |
| **`extensions.<implementer>.*`** | Vendor-specifieke content. Voor ons: `extensions.striadex.controls` (de 5 named controls zoals LEAST_AGENCY), `extensions.striadex.compliance` (Annex IV mapping), `extensions.striadex.insurance` (carrier-export), `extensions.striadex.procurement` (SIG/CAIQ), `extensions.striadex.riskScore` | Spec definieert alleen het *slot* (`extensions: { [string]: object }`) | Implementer volledig vrij |

**Saus-discipline:**
- Audience-neutrale concepten (control attestations bestaan, risk classification bestaat, supply chain bestaat) → `extended` met open shapes.
- Striadex-specifieke inhoud (welke 5 controls, welke Annex IV mapping, welke risk-score-formule) → `extensions.striadex.*`, **gedocumenteerd in product-docs, niet in de open spec**.

**ADR 0012 in de product-repo is hierop al ge-update** (zie "Updates sinds originele grilling" hierboven) — bevat nu expliciet: "Implementers MAY add audience-flavored content under namespaced `extensions.<implementer>.*` slots; this does not contradict the audience-neutral nature of `core` and `extended`."

**De product Pack-draft (`docs/product/AgentGate-Assurance-Pack-v0.1.md`) is ook al ge-update** — `views.*` velden zijn al verplaatst naar `extensions.striadex.*`.

### Decisie 6 — Versioning rules

`specVersion` is plain semver string (e.g. `"0.1.0"`). `@context` URL encodet alleen MAJOR.MINOR.

| Bump | Mag breken? | Wat mag wijzigen |
|---|---|---|
| **Patch** (`0.1.0` → `0.1.1`) | Nooit | Alleen niet-normatieve content: proza, examples, typo's. Geen schema-wijzigingen. Geen `@context` URL-wijziging. |
| **Minor pre-1.0** (`0.1.0` → `0.2.0`) | Mag breken | Schema-wijzigingen toegestaan. `@context` URL wijzigt. Oude Packs blijven valide tegen oude URL. |
| **Minor post-1.0** (`1.0.0` → `1.1.0`) | Niet | Alleen additief. Geen removals, type-wijzigingen, of required-toevoegingen. |
| **Major** (`1.0.0` → `2.0.0`) | Mag breken | Alles. Nieuwe disjuncte `@context` URL-boom. |

**Crypto-stabiliteit > spec-stabiliteit:** wijzigt het signature-formaat of de canonicalisation-method, dan is dat **altijd** een major bump — ook pre-1.0.

**Definities:**
- **Additief = niet-brekend:** nieuwe optionele velden, nieuwe enum-waardes aan open enumeraties, nieuwe event-types, nieuwe `extensions.*`-slots.
- **Brekend:** velden verwijderen, types wijzigen, optional naar required, enum-waardes verwijderen, semantiek van bestaande velden wijzigen.

---

## Bevestigde kleine keuzes

1. **Repo naam + owner:** `assurance-pack-spec` onder `github.com/Striadex`. Apache-2.0. Org bevestigd beschikbaar 2026-05-22.
2. **ADR conventie in spec-repo:** zelfde als de product-repo — `docs/adr/0001-...md`, sequentieel genummerd. Spec-repo-ADRs gaan over spec-keuzes; product-repo-ADRs blijven over product-keuzes.
3. **Conformance language:** RFC 2119 + RFC 8174 (MUST/SHOULD/MAY/MUST NOT/SHOULD NOT). Spec heeft een standaard "Conformance language" sectie.
4. **Reference examples in v0.1.0:** één valide end-to-end Pack die alle 8 event-types covert (`examples/v0.1/valid-pack.json`), plus één invalid Pack voor negative testing (`examples/v0.1/invalid-pack-bad-signature.json`). Geen volledige conformance suite voor v0.1.0.
5. **specVersion-veld shape:** plain semver string (`"specVersion": "0.1.0"`). Versie-identifier in `@context` URL is de andere bron; geen dubbele encoding.

---

## ADRs te schrijven in `assurance-pack-spec` repo

Bij scaffolding, deze ADRs vastleggen (sequentieel genummerd):

1. **0001 — Spec status and breaking-change policy.** Decisie 1 + Decisie 6 samen. Vastleggen dat v0.x mag breken in minor bumps, v1.0+ strikt additief in minor.
2. **0002 — Normative roles of JSON Schema and JSON-LD context.** Decisie 2. JSON Schema voor structuur, `@context` voor betekenis.
3. **0003 — Hosting strategy for durable URLs.** Decisie 3. `spec.striadex.ai` via GH Pages, path-based versioning, disjuncte major bomen.
4. **0004 — Signature encoding: Detached JWS over JCS.** Decisie 4. RFC 7515 + RFC 8785, Ed25519 only voor v0.1.0, multi-sig deferred.
5. **0005 — Three-layer Pack structure: core, extended, extensions.** Decisie 5. Definieer wat in welke laag hoort en waarom.
6. **0006 — Keys and trust model are out of scope.** Codificeert ADR 0011's positie in spec-repo-context. Spec definieert `kid`-semantiek, niet key-distributie of revocation.
7. **0007 — RFC 2119 conformance language.** Kleine ADR — formaliseren dat we deze keywords gebruiken.

---

## Werk in de product-repo na MAK-292 scaffolding

Reeds gedaan vóór deze handoff (zie "Updates sinds originele grilling"):

- ✅ ADR 0012 ge-update met `extensions.<implementer>.*` nuance.
- ✅ `docs/product/AgentGate-Assurance-Pack-v0.1.md` heeft "Superseded for structural details"-header + `views.*` → `extensions.striadex.*`.
- ✅ `docs/product/AgentGate-Event-Schema-v0.1.md` "Superseded" gemarkeerd, met expliciete vermelding dat de 19 event-types afwijken van de 8 MAK-290 canonicals.

Nog te doen (los van spec-repo werk):

- Algemene rename pass van "AgentGate" → "Striadex" in alle product-docs (LAUNCH-CHECKLIST item). `agentgate.dev` URL-referenties in beide product-docs zijn bewust ongemoeid gelaten — die horen bij die rename pass.

---

## Repo skeleton voor `assurance-pack-spec` v0.1.0

Onder `github.com/Striadex/assurance-pack-spec`, Apache-2.0:

```
assurance-pack-spec/
├── README.md                          # Spec overview, conformance levels, RFC 2119 statement
├── LICENSE                            # Apache-2.0
├── CONTRIBUTING.md                    # How to propose changes
├── CHANGELOG.md                       # Per-version changelog
├── docs/
│   ├── adr/
│   │   ├── 0001-spec-status-and-breaking-change-policy.md
│   │   ├── 0002-normative-roles-json-schema-jsonld.md
│   │   ├── 0003-hosting-strategy-durable-urls.md
│   │   ├── 0004-signature-encoding-detached-jws-jcs.md
│   │   ├── 0005-three-layer-pack-structure.md
│   │   ├── 0006-keys-and-trust-out-of-scope.md
│   │   └── 0007-rfc2119-conformance-language.md
│   └── spec/
│       └── v0.1/
│           ├── index.md               # Main spec doc — normative + informative
│           ├── events.md              # Event envelope + 8 event types
│           ├── pack.md                # Pack envelope + signature
│           ├── extensions.md          # Extension slot semantics
│           ├── signing.md             # JWS-over-JCS detail, what's hashed
│           └── versioning.md          # Semver rules + @context URL conventie
├── schemas/
│   └── v0.1/
│       ├── core/
│       │   ├── event-envelope.json    # Required event-level fields
│       │   ├── event/
│       │   │   ├── run_started.json
│       │   │   ├── run_completed.json
│       │   │   ├── tool_call.json
│       │   │   ├── tool_result.json
│       │   │   ├── policy_eval.json
│       │   │   ├── policy.published.json
│       │   │   ├── project.agent.registered.json
│       │   │   └── project.tool.registered.json
│       │   ├── pack-envelope.json     # core Pack envelope (specVersion, packId, issuedAt, signature)
│       │   └── signature.json         # Detached JWS structure
│       └── extended/
│           ├── subject.json
│           ├── issuer.json
│           ├── scope.json
│           ├── execution-evidence.json
│           ├── incident-summary.json
│           ├── human-oversight-summary.json
│           ├── supply-chain.json
│           ├── risk-classification.json
│           └── control-attestations.json
├── context/
│   └── v0.1/
│       └── context.jsonld             # JSON-LD context — vocab URIs voor audience-neutral fields
├── examples/
│   └── v0.1/
│       ├── valid-pack.json            # End-to-end voorbeeld met alle 8 event types
│       └── invalid-pack-bad-signature.json
└── .github/
    └── workflows/
        ├── ci.yml                     # JSON Schema validation, example validation
        └── pages.yml                  # Publish GitHub Pages (served at spec.striadex.ai via CNAME)
```

**GH Pages CNAME setup:**
- File `CNAME` in repo root met inhoud `spec.striadex.ai`
- DNS CNAME-record voor `spec.striadex.ai` → `Striadex.github.io` (te configureren bij DNS provider van `striadex.ai`)
- GH Pages serveert vanaf `docs/` of `gh-pages` branch — kiezen bij scaffolding

**`$id` URLs in schemas:** elk schema heeft `"$id": "https://spec.striadex.ai/v0.1/schemas/core/event/run_started.json"`-stijl absolute URL.

**`@context` URL in elke Pack:** `"@context": "https://spec.striadex.ai/v0.1/context.jsonld"`.

---

## Open vragen die naar v0.2 (of later) verschoven zijn

- Volledige conformance test suite (positive + negative cases per event-type, per Pack envelope variant)
- w3id-redirect inrichten (alleen relevant als design-partners of standards-bodies dat vragen)
- Algoritme-agility in signature scheme (`cryptosuite`-veld)
- Multi-signature support (klant + product dual-sign)
- Annex IV renderer-spec (separate document, niet in `assurance-pack-spec`)
- ISO 42001 mapping in `extended.controlAttestations` open enumeraties
- Carrier-specific export-renderer specs (Klaimee, Corgi templates)

---

## Volgende stappen voor de nieuwe workspace

1. **GitHub org `Striadex` aanmaken** (URL bevestigd beschikbaar 2026-05-22 — moet nu nog daadwerkelijk geregistreerd worden op GitHub).
2. **Repo `assurance-pack-spec` aanmaken** onder de org, Apache-2.0, met initieel deze handoff als `docs/initial-handoff.md` (of equivalent) zodat het scaffolding-werk traceerbaar is.
3. **Clone als nieuwe Conductor workspace.**
4. **Scaffold per repo-skeleton** hierboven. ADRs eerst (1 → 7), dan `docs/spec/v0.1/`, dan `schemas/v0.1/`, dan `context/v0.1/`, dan `examples/v0.1/`.
5. **CNAME + DNS setup** voor `spec.striadex.ai` → `Striadex.github.io`. GH Pages workflow activeren.
6. **CI workflow** voor JSON Schema validation van examples tegen schemas.
7. **README.md** met conformance levels (`core` required, `extended` optional) en RFC 2119 conformance language statement.

Geen werk meer aan MAK-292 in de product-repo — dat is afgesloten.
