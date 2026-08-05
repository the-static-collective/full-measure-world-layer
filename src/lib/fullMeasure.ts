import {
  Capacity,
  DomainEvent,
  Offer,
  Pledge,
  Project,
  Receipt,
} from '../types.js';

export type MeasureKey =
  | 'gift'
  | 'quest'
  | 'deed'
  | 'seed'
  | 'witness'
  | 'harvest';

export interface FullMeasureStat {
  key: MeasureKey;
  label: string;
  value: number;
  description: string;
}

export interface ProjectWithPledges extends Project {
  pledges: Pledge[];
}

export interface FullMeasureSheet {
  measures: FullMeasureStat[];
  chapter: 'Seed' | 'Sprout' | 'Growing' | 'Flowering' | 'Harvest';
  role: string;
  witnessedProgress: number;
  chapterProgress: number;
  nextChapterAt: number | null;
  capacitiesUnlocked: number;
}

export interface GardenQuest {
  project: ProjectWithPledges;
  pledge: Pledge | null;
  currentStep: number;
  eyebrow: string;
  nextAction: string;
  truthState: 'Tension' | 'Proposal' | 'Human witnessed' | 'Current form';
}

interface FullMeasureInput {
  userId: string;
  offers: Offer[];
  projects: ProjectWithPledges[];
  receipts: Receipt[];
  capacities: Capacity[];
  events: DomainEvent[];
}

const CHAPTERS = [
  { name: 'Seed' as const, threshold: 0 },
  { name: 'Sprout' as const, threshold: 1 },
  { name: 'Growing' as const, threshold: 3 },
  { name: 'Flowering' as const, threshold: 6 },
  { name: 'Harvest' as const, threshold: 10 },
];

const ROLE_BY_MEASURE: Record<MeasureKey, string> = {
  gift: 'Keeper of the Basket',
  quest: 'Companion',
  deed: 'Builder',
  seed: 'Scout',
  witness: 'Witness',
  harvest: 'Steward',
};

const isActivePledge = (pledge: Pledge) =>
  !['declined', 'withdrawn', 'confirmed'].includes(pledge.status);

const isOpenProject = (project: Project) =>
  !['completed', 'closed'].includes(project.status);

export function buildFullMeasureSheet({
  userId,
  offers,
  projects,
  receipts,
  capacities,
  events,
}: FullMeasureInput): FullMeasureSheet {
  const userPledges = projects.flatMap((project) =>
    project.pledges
      .filter((pledge) => pledge.pledgedBy === userId)
      .map((pledge) => ({ pledge, project }))
  );
  const joinedProjectIds = new Set(
    userPledges
      .filter(({ pledge }) => !['declined', 'withdrawn'].includes(pledge.status))
      .map(({ project }) => project.id)
  );
  const confirmedDeeds = userPledges.filter(
    ({ pledge }) => pledge.status === 'confirmed'
  );
  const openedProjects = projects.filter((project) => project.openedBy === userId);
  const authoredReceipts = receipts.filter((receipt) => receipt.createdBy === userId);
  const witnessedConfirmations = events.filter(
    (event) =>
      event.eventType === 'pledge.confirmed' &&
      event.actorId === userId &&
      event.payload.pledgedBy !== userId
  );
  const harvestedProjects = openedProjects.filter(
    (project) =>
      project.status === 'completed' ||
      receipts.some((receipt) => receipt.projectId === project.id)
  );

  const relatedProjectIds = new Set([
    ...confirmedDeeds.map(({ project }) => project.id),
    ...harvestedProjects.map((project) => project.id),
  ]);
  const relatedReceiptIds = new Set(
    receipts
      .filter((receipt) => relatedProjectIds.has(receipt.projectId))
      .map((receipt) => receipt.id)
  );
  const capacitiesUnlocked = capacities.filter((capacity) =>
    relatedReceiptIds.has(capacity.sourceReceiptId)
  ).length;

  const measures: FullMeasureStat[] = [
    {
      key: 'gift',
      label: 'Gifts',
      value: offers.filter((offer) => offer.offeredBy === userId).length,
      description: 'Capabilities placed in the shared basket.',
    },
    {
      key: 'quest',
      label: 'Quests',
      value: joinedProjectIds.size,
      description: 'Distinct shared endeavors joined.',
    },
    {
      key: 'deed',
      label: 'Deeds',
      value: confirmedDeeds.length,
      description: 'Contributions another human confirmed.',
    },
    {
      key: 'seed',
      label: 'Seeds',
      value: openedProjects.length,
      description: 'Possibilities opened for the circle.',
    },
    {
      key: 'witness',
      label: 'Witness',
      value: witnessedConfirmations.length + authoredReceipts.length,
      description: 'Returned deeds and outcomes faithfully sealed.',
    },
    {
      key: 'harvest',
      label: 'Harvests',
      value: harvestedProjects.length + capacitiesUnlocked,
      description: 'Completed work that made new capacity possible.',
    },
  ];

  const witnessedProgress =
    confirmedDeeds.length +
    witnessedConfirmations.length +
    authoredReceipts.length +
    harvestedProjects.length +
    capacitiesUnlocked;

  const chapterIndex = CHAPTERS.reduce(
    (current, chapter, index) =>
      witnessedProgress >= chapter.threshold ? index : current,
    0
  );
  const chapter = CHAPTERS[chapterIndex];
  const nextChapter = CHAPTERS[chapterIndex + 1] ?? null;
  const currentThreshold = chapter.threshold;
  const chapterProgress = nextChapter
    ? Math.min(
        100,
        Math.round(
          ((witnessedProgress - currentThreshold) /
            (nextChapter.threshold - currentThreshold)) *
            100
        )
      )
    : 100;

  const dominantMeasure = measures.reduce((dominant, measure) => {
    if (measure.value > dominant.value) return measure;
    if (measure.value === dominant.value && measure.key === 'deed') return measure;
    return dominant;
  }, measures[0]);

  return {
    measures,
    chapter: chapter.name,
    role:
      witnessedProgress === 0
        ? 'New Arrival'
        : ROLE_BY_MEASURE[dominantMeasure.key],
    witnessedProgress,
    chapterProgress,
    nextChapterAt: nextChapter?.threshold ?? null,
    capacitiesUnlocked,
  };
}

export function findGardenQuest(
  userId: string,
  projects: ProjectWithPledges[]
): GardenQuest | null {
  const openProjects = projects.filter(isOpenProject);

  for (const project of openProjects) {
    const returnedDeed = project.pledges.find(
      (pledge) =>
        pledge.status === 'reported_complete' &&
        pledge.pledgedBy !== userId &&
        project.openedBy === userId
    );
    if (returnedDeed) {
      return {
        project,
        pledge: returnedDeed,
        currentStep: 3,
        eyebrow: 'A deed has returned',
        nextAction: 'Take the witness seat',
        truthState: 'Proposal',
      };
    }
  }

  for (const project of openProjects) {
    const proposedPledge = project.pledges.find(
      (pledge) =>
        pledge.status === 'proposed' &&
        pledge.pledgedBy !== userId &&
        project.openedBy === userId
    );
    if (proposedPledge) {
      return {
        project,
        pledge: proposedPledge,
        currentStep: 1,
        eyebrow: 'A companion is at the gate',
        nextAction: 'Welcome or decline the pledge',
        truthState: 'Proposal',
      };
    }
  }

  for (const project of openProjects) {
    const ownPledge = project.pledges.find(
      (pledge) => pledge.pledgedBy === userId && isActivePledge(pledge)
    );
    if (!ownPledge) continue;

    if (ownPledge.status === 'reported_complete') {
      return {
        project,
        pledge: ownPledge,
        currentStep: 3,
        eyebrow: 'Your report awaits another',
        nextAction: 'Review the trace',
        truthState: 'Proposal',
      };
    }

    if (ownPledge.status === 'accepted') {
      return {
        project,
        pledge: ownPledge,
        currentStep: 2,
        eyebrow: 'Your quest is in the world',
        nextAction: 'Return and report what happened',
        truthState: 'Proposal',
      };
    }

    return {
      project,
      pledge: ownPledge,
      currentStep: 1,
      eyebrow: 'Your pledge awaits welcome',
      nextAction: 'Review your pledge',
      truthState: 'Proposal',
    };
  }

  const joinableProject =
    openProjects.find(
      (project) =>
        project.openedBy !== userId &&
        project.needs.some((need) => need.status !== 'met' && need.status !== 'withdrawn')
    ) ??
    openProjects.find((project) =>
      project.needs.some(
        (need) => need.status !== 'met' && need.status !== 'withdrawn'
      )
    );

  if (joinableProject) {
    return {
      project: joinableProject,
      pledge: null,
      currentStep: 0,
      eyebrow:
        joinableProject.openedBy === userId
          ? 'A tension in your keeping'
          : 'A tension is asking for a hand',
      nextAction:
        joinableProject.openedBy === userId ? 'Tend this quest' : 'Enter this quest',
      truthState: 'Tension',
    };
  }

  const latestHarvest = projects.find((project) => project.status === 'completed');
  if (!latestHarvest) return null;

  return {
    project: latestHarvest,
    pledge:
      latestHarvest.pledges.find((pledge) => pledge.pledgedBy === userId) ?? null,
    currentStep: 5,
    eyebrow: 'The latest current form',
    nextAction: 'Read the harvest',
    truthState: 'Current form',
  };
}

export function countProjectTraces(projectId: string, events: DomainEvent[]): number {
  return events.filter(
    (event) =>
      event.aggregateId === projectId || event.payload.projectId === projectId
  ).length;
}
