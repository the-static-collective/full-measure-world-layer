export type SeedLifecycle =
  | 'Seed'
  | 'Sprout'
  | 'Growing'
  | 'Flowering'
  | 'Harvest'
  | 'Compost';

export type OfferCategory =
  | 'skill'
  | 'tool'
  | 'time'
  | 'space'
  | 'material'
  | 'care'
  | 'food'
  | 'transport'
  | 'creative'
  | 'other';

export type OfferStatus = 'available' | 'paused' | 'retired';

export type ProjectStatus =
  | 'open'
  | 'forming'
  | 'active'
  | 'ready_for_confirmation'
  | 'completed'
  | 'paused'
  | 'closed';

export type ProjectNeedStatus = 'open' | 'partially_met' | 'met' | 'withdrawn';

export type PledgeStatus =
  | 'proposed'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'reported_complete'
  | 'confirmed';

export type MemberRole = 'member' | 'steward';

export type AggregateType =
  | 'offer'
  | 'project'
  | 'pledge'
  | 'receipt'
  | 'capacity'
  | 'circle'
  | 'invitation';

export interface Profile {
  id: string;
  displayName: string;
  note?: string | null;
  avatarColor?: string;
  createdAt: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export interface CircleMember {
  circleId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Offer {
  id: string;
  circleId: string;
  offeredBy: string;
  title: string;
  description: string | null;
  category: OfferCategory;
  availability: string | null;
  locationNote: string | null;
  boundaries: string | null;
  status: OfferStatus;
  makesPossible?: string[] | null;
  addressHash?: string;
  createdAt: string;
}

export interface ProjectNeed {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  status: ProjectNeedStatus;
}

export interface Project {
  id: string;
  circleId: string;
  openedBy: string;
  title: string;
  story: string;
  locationNote: string | null;
  desiredDate: string | null;
  status: ProjectStatus;
  futurePossibility?: string | null; // BananaGram seed field
  makesPossible?: string[] | null;   // Ecological growth graph connections
  fruit?: string | null;             // Tangible output/harvest of this seed
  seedStage?: SeedLifecycle;         // Seed organism stage
  addressHash?: string;              // jubilee://seed/hash
  parentSeedId?: string | null;      // Ecological parent seed/capacity
  descendantsCount?: number;
  needs: ProjectNeed[];
  createdAt: string;
  completedAt: string | null;
}

export interface Pledge {
  id: string;
  projectId: string;
  needId: string | null;
  pledgedBy: string;
  offerId: string | null;
  description: string;
  quantity: number | null;
  unit: string | null;
  status: PledgeStatus;
  addressHash?: string;
  createdAt: string;
  acceptedAt: string | null;
  reportedCompleteAt: string | null;
  confirmedAt: string | null;
}

export interface Receipt {
  id: string;
  circleId: string;
  projectId: string;
  createdBy: string;
  summary: string;
  outcome: string;
  fruit?: string | null;
  makesPossible?: string[] | null;
  addressHash?: string;
  createdAt: string;
}

export interface Capacity {
  id: string;
  circleId: string;
  title: string;
  description: string;
  sourceReceiptId: string;
  makesPossible?: string[] | null;
  addressHash?: string;
  createdAt: string;
}

export interface CircleInvitation {
  id: string;
  circleId: string;
  code: string;
  createdById: string;
  note?: string | null;
  maxUses?: number | null;
  usesCount: number;
  expiresAt?: string | null;
  createdAt: string;
}

export interface DomainEvent {
  id: string;
  circleId: string;
  aggregateType: AggregateType;
  aggregateId: string;
  eventType: string;
  actorId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface JubileeDataStore {
  profiles: Profile[];
  circles: Circle[];
  circleMembers: CircleMember[];
  circleInvitations: CircleInvitation[];
  offers: Offer[];
  projects: Project[];
  pledges: Pledge[];
  receipts: Receipt[];
  capacities: Capacity[];
  domainEvents: DomainEvent[];
}
