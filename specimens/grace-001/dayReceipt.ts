import {demandPressure} from "./culture.ts";
import {encodeSession, replaySession, type GraceSession} from "./session.ts";

export interface GraceDayReceipt {
  schema: "full-measure.grace-day-receipt.v1";
  campaignId: "GRACE-001";
  dayLabel: "An Ordinary Tuesday";
  session: GraceSession;
  replayChecksum: string;
  summary: {
    events: number;
    receipts: number;
    unresolvedDemand: number;
    cultureTraces: Record<string, number>;
    dreamWitnesses: number;
    upperRoomReturns: number;
    cards: number;
    party: string[];
    flashbacks: number;
    possibleWorldReturns: number;
  };
  claims: string[];
  nonClaims: string[];
}

function checksumText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

function replayFingerprint(session: GraceSession): string {
  const replay = replaySession(session);
  return checksumText(JSON.stringify({
    story: replay.story,
    culture: replay.culture,
    meaning: replay.meaning,
    apertures: replay.apertures,
    lastProposal: replay.lastProposal,
  }));
}

export function createDayReceipt(session: GraceSession): GraceDayReceipt {
  const replay = replaySession(session);
  return {
    schema: "full-measure.grace-day-receipt.v1",
    campaignId: "GRACE-001",
    dayLabel: "An Ordinary Tuesday",
    session: JSON.parse(encodeSession(session)) as GraceSession,
    replayChecksum: replayFingerprint(session),
    summary: {
      events: session.events.length,
      receipts: replay.story.receipts.length + replay.culture.history.length,
      unresolvedDemand: demandPressure(replay.culture).total,
      cultureTraces: {...replay.culture.traces},
      dreamWitnesses: replay.meaning.dreams.length,
      upperRoomReturns: replay.meaning.returns.length,
      cards: replay.meaning.cards.length,
      party: [...replay.apertures.party],
      flashbacks: replay.apertures.flashbacks.length,
      possibleWorldReturns: replay.apertures.possibleWorldReturns.length,
    },
    claims: [
      "this artifact contains the declared local event sequence for one campaign day",
      "the included replay checksum matches the deterministic replay at export time",
    ],
    nonClaims: [
      "the checksum is a corruption/replay witness, not a cryptographic signature",
      "export does not upgrade self-report into external witness",
      "a Day Receipt does not prove that fictional or interpreted events occurred outside the campaign",
    ],
  };
}

export function verifyDayReceipt(receipt: GraceDayReceipt): {
  ok: boolean;
  expected: string;
  actual: string;
} {
  if (receipt.schema !== "full-measure.grace-day-receipt.v1") {
    return {ok: false, expected: "unsupported-schema", actual: receipt.schema};
  }
  const actual = replayFingerprint(receipt.session);
  return {ok: actual === receipt.replayChecksum, expected: receipt.replayChecksum, actual};
}

export function encodeDayReceipt(receipt: GraceDayReceipt): string {
  return JSON.stringify(receipt, null, 2);
}

export function decodeDayReceipt(raw: string): GraceDayReceipt {
  const receipt = JSON.parse(raw) as GraceDayReceipt;
  if (receipt.schema !== "full-measure.grace-day-receipt.v1") {
    throw new Error("Unsupported Grace Day Receipt.");
  }
  const verification = verifyDayReceipt(receipt);
  if (!verification.ok) {
    throw new Error(`Day Receipt replay checksum mismatch: expected ${verification.expected}, got ${verification.actual}`);
  }
  return receipt;
}
