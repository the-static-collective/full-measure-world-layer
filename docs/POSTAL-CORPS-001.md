# POSTAL-CORPS-001 — Full Measure's Postal Quest Door

**Source:** GHoT POSTAL-CORPS-001 PR #118, stacked on PostEmahh'n MAIL-005.
**Source owner:** LemonPRESS Dispatch Gate PR #17, pinned to SHA 62a20ebf...
**PENNY source:** Jubilee Treasury PENNY-014 PR #17, native accounting is separate.

The Full Measure receiver accepts only a strictly bounded, public-safe proposal export. A source claim cannot become a Full Measure Deed merely because its JSON says that a carrier and witness signed it.

## Human choices

- HOLD: retain the proposal as a local encounter only.
- REST: leave it unresolved without penalty.
- LEAVE_OPEN: do not act now.
- PREVIEW_GARDEN_DRAFT: only after the source reports a complete ten-step simulated scenario, generate a basic Garden project draft for *separate* human creation and witnessed participation.

No action creates an actual Garden project, pledge, authoritative DomainEvent, confirmed Deed, or network carrier job. Every imported source is labeled EXTERNAL_UNVERIFIED_IMPORT. Independent signature and source validation would be needed for official integration.

## Financial firewall

The receiver expects zero issued/released PENNY units, zero backing coins, and no native PENNY witness proof. It actively rejects a GHoT packet that claims financial settlement, real postage, payment terms, private recipient addresses, or Full Measure Deed authority.

PENNY-014 and Full Measure remain sovereign. The Full Measure local deck does not certify the physical source or countersign Treasury work.

## Real three-repository check

The dedicated GitHub Actions workflow checks out exact GHoT and LemonPRESS source SHA pins; runs the real LemonPRESS Dispatch Gate to create a synthetic record; sends it through GHoT's signed ten-step carrier simulation; then feeds the exported projection into the real Full Measure TypeScript adapter/tests.

The source-native PENNY-014 proof remains in GHoT PR #118's own CI. Full Measure never imports PENNY's private keys or writes to its ledger.

    node --import tsx --test tests/postal-corps-quest.test.ts
    npm run lint

Full Measure does not provide a physical route reservation system, courier compensation, USPS letter carriage exemption or identity verification. Do not expose private addresses or encourage paid letter routes without legal review.

**LAWS:** UNVERIFIED IMPORT != PROVEN DELIVERY; REPORT != DEED; DEED != PENNY; CANDIDATE != PAYMENT; QUEST != OBLIGATION; REST IS VALID.

References:
https://github.com/the-static-collective/GHoT/pull/118
https://github.com/the-static-collective/lemonPRESS/pull/17
https://github.com/the-static-collective/Jubilee-treasury/pull/17
