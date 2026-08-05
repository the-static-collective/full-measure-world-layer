import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFullMeasureSheet,
  countProjectTraces,
  findGardenQuest,
  ProjectWithPledges,
} from '../src/lib/fullMeasure.js';
import {
  Capacity,
  DomainEvent,
  Offer,
  Pledge,
  Receipt,
} from '../src/types.js';

const offer: Offer = {
  id: 'offer_1',
  circleId: 'circle_1',
  offeredBy: 'builder',
  title: 'Two capable hands',
  description: null,
  category: 'skill',
  availability: null,
  locationNote: null,
  boundaries: null,
  status: 'available',
  createdAt: '2026-07-01T00:00:00.000Z',
};

const confirmedPledge: Pledge = {
  id: 'pledge_1',
  projectId: 'project_1',
  needId: 'need_1',
  pledgedBy: 'builder',
  offerId: offer.id,
  description: 'Repair the greenhouse brace',
  quantity: 1,
  unit: 'brace',
  status: 'confirmed',
  createdAt: '2026-07-02T00:00:00.000Z',
  acceptedAt: '2026-07-02T01:00:00.000Z',
  reportedCompleteAt: '2026-07-03T00:00:00.000Z',
  confirmedAt: '2026-07-03T01:00:00.000Z',
};

const project: ProjectWithPledges = {
  id: 'project_1',
  circleId: 'circle_1',
  openedBy: 'steward',
  title: 'Repair the Greenhouse',
  story: 'A broken brace keeps the greenhouse from serving the next planting.',
  locationNote: null,
  desiredDate: null,
  status: 'completed',
  seedStage: 'Harvest',
  addressHash: 'jubilee://seed/project_1',
  needs: [
    {
      id: 'need_1',
      projectId: 'project_1',
      title: 'Repair one brace',
      description: null,
      quantity: 1,
      unit: 'brace',
      status: 'met',
    },
  ],
  createdAt: '2026-07-01T00:00:00.000Z',
  completedAt: '2026-07-04T00:00:00.000Z',
  pledges: [confirmedPledge],
};

const receipt: Receipt = {
  id: 'receipt_1',
  circleId: 'circle_1',
  projectId: project.id,
  createdBy: 'steward',
  summary: 'Greenhouse brace repaired',
  outcome: 'The frame is stable.',
  createdAt: '2026-07-04T00:00:00.000Z',
};

const capacity: Capacity = {
  id: 'capacity_1',
  circleId: 'circle_1',
  title: 'Greenhouse repair',
  description: 'The circle can repair and document its greenhouse frame.',
  sourceReceiptId: receipt.id,
  createdAt: '2026-07-04T00:00:00.000Z',
};

const confirmation: DomainEvent = {
  id: 'event_confirmed',
  circleId: 'circle_1',
  aggregateType: 'pledge',
  aggregateId: confirmedPledge.id,
  eventType: 'pledge.confirmed',
  actorId: 'steward',
  payload: {
    projectId: project.id,
    pledgeId: confirmedPledge.id,
    pledgedBy: 'builder',
  },
  createdAt: '2026-07-03T01:00:00.000Z',
};

test('credits a confirmed deed to its contributor, not to the confirming witness', () => {
  const builder = buildFullMeasureSheet({
    userId: 'builder',
    offers: [offer],
    projects: [project],
    receipts: [receipt],
    capacities: [capacity],
    events: [confirmation],
  });
  const steward = buildFullMeasureSheet({
    userId: 'steward',
    offers: [offer],
    projects: [project],
    receipts: [receipt],
    capacities: [capacity],
    events: [confirmation],
  });

  assert.equal(
    builder.measures.find((measure) => measure.key === 'deed')?.value,
    1
  );
  assert.equal(
    builder.measures.find((measure) => measure.key === 'witness')?.value,
    0
  );
  assert.equal(
    steward.measures.find((measure) => measure.key === 'deed')?.value,
    0
  );
  assert.equal(
    steward.measures.find((measure) => measure.key === 'witness')?.value,
    2
  );
});

test('does not grow the deed measure from a self-reported proposal', () => {
  const reportedProject: ProjectWithPledges = {
    ...project,
    status: 'active',
    completedAt: null,
    pledges: [
      {
        ...confirmedPledge,
        status: 'reported_complete',
        confirmedAt: null,
      },
    ],
  };

  const sheet = buildFullMeasureSheet({
    userId: 'builder',
    offers: [offer],
    projects: [reportedProject],
    receipts: [],
    capacities: [],
    events: [],
  });

  assert.equal(
    sheet.measures.find((measure) => measure.key === 'deed')?.value,
    0
  );
  assert.equal(sheet.witnessedProgress, 0);
});

test('puts a returned report in front of the human who can witness it', () => {
  const reportedProject: ProjectWithPledges = {
    ...project,
    status: 'active',
    completedAt: null,
    pledges: [
      {
        ...confirmedPledge,
        status: 'reported_complete',
        confirmedAt: null,
      },
    ],
  };

  const calling = findGardenQuest('steward', [reportedProject]);

  assert.equal(calling?.project.id, reportedProject.id);
  assert.equal(calling?.pledge?.id, confirmedPledge.id);
  assert.equal(calling?.nextAction, 'Take the witness seat');
  assert.equal(calling?.currentStep, 3);
});

test('counts project traces whether the project is the aggregate or payload parent', () => {
  const projectEvent: DomainEvent = {
    ...confirmation,
    id: 'event_project',
    aggregateType: 'project',
    aggregateId: project.id,
    eventType: 'project.opened',
    payload: {},
  };

  assert.equal(
    countProjectTraces(project.id, [projectEvent, confirmation]),
    2
  );
});
