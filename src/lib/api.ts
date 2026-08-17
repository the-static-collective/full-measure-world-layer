import {
  Offer,
  Project,
  Pledge,
  Receipt,
  Capacity,
  DomainEvent,
  Profile,
  Circle,
  OfferCategory,
} from '../types.js';
import type {
  ConfirmCrossingResult,
  WorldEncounterResidue,
  WorldFieldProjection,
} from '../world-runtime/contracts.js';

let currentUserId = localStorage.getItem('jubilee_user_id') || 'user_lu';

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  localStorage.setItem('jubilee_user_id', userId);
}

export function getCurrentUserId(): string {
  return currentUserId;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    const record = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const message = typeof record.error === 'string'
      ? record.error
      : typeof record.reasonCode === 'string'
        ? record.reasonCode
        : typeof record.failureClass === 'string'
          ? record.failureClass
          : `HTTP error! status: ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  return response.json();
}

export type WorldFieldResponse =
  | { available: true; field: WorldFieldProjection }
  | { available: false; reasonCode: string; field: WorldFieldProjection };

export interface WorldDecodeResult {
  kind: 'confirmation-required';
  pendingId: string;
  decoding: {
    authority: 'none';
    decodingRef: string;
    candidates: Array<{ doorRef: string; totalCost: number }>;
    ambiguity: {
      kind: 'none' | 'collision';
      leadingDoorRefs: string[];
    };
  };
}

export const api = {
  // Profiles & Auth
  getProfiles: () => apiFetch<Profile[]>('/api/profiles'),
  getProfile: (id: string) => apiFetch<Profile>(`/api/profiles/${id}`),
  login: (displayName: string, note?: string) =>
    apiFetch<{ profile: Profile; circleId: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ displayName, note }),
    }),

  // Circle & Invitations
  getCircle: () =>
    apiFetch<{
      circle: Circle;
      members: Array<{ circleId: string; userId: string; role: 'member' | 'steward'; profile?: Profile }>;
    }>('/api/circle'),
  getCircleInvitations: (circleId: string) =>
    apiFetch<
      Array<{
        id: string;
        circleId: string;
        code: string;
        createdById: string;
        note: string | null;
        maxUses: number | null;
        usesCount: number;
        expiresAt: string | null;
        createdAt: string;
        creator?: Profile;
      }>
    >(`/api/circles/${circleId}/invitations`),
  createCircleInvitation: (
    circleId: string,
    data: { note?: string; customCode?: string; maxUses?: number; expiresDays?: number }
  ) =>
    apiFetch<{
      id: string;
      circleId: string;
      code: string;
      createdById: string;
      note: string | null;
      maxUses: number | null;
      usesCount: number;
      expiresAt: string | null;
      createdAt: string;
      creator?: Profile;
      circleName: string;
    }>(`/api/circles/${circleId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validateInvitationCode: (code: string) =>
    apiFetch<{
      valid: boolean;
      invitation: any;
      circle: Circle;
      inviter?: Profile;
    }>(`/api/invitations/validate/${encodeURIComponent(code)}`),
  joinCircleWithInvitation: (data: { code: string; displayName?: string; note?: string }) =>
    apiFetch<{
      success: boolean;
      profile: Profile;
      circle: Circle;
      message: string;
    }>('/api/invitations/join', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Seed Reset
  resetSeedData: () =>
    apiFetch<{ message: string }>('/api/seed/reset', { method: 'POST' }),

  // Offers
  getOffers: () => apiFetch<Array<Offer & { author?: Profile }>>('/api/offers'),
  createOffer: (data: {
    title: string;
    description?: string;
    category: OfferCategory;
    availability?: string;
    locationNote?: string;
    boundaries?: string;
    makesPossible?: string[];
  }) =>
    apiFetch<Offer & { author?: Profile }>('/api/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOfferStatus: (offerId: string, status: 'available' | 'paused' | 'retired') =>
    apiFetch<Offer>(`/api/offers/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Projects
  getProjects: () =>
    apiFetch<Array<Project & { opener?: Profile; pledges: Array<Pledge & { pledger?: Profile }> }>>('/api/projects'),
  getProject: (id: string) =>
    apiFetch<
      Project & {
        opener?: Profile;
        pledges: Array<Pledge & { pledger?: Profile }>;
        receipt?: Receipt;
        capacities: Capacity[];
        events: DomainEvent[];
      }
    >(`/api/projects/${id}`),
  createProject: (data: {
    title: string;
    story: string;
    locationNote?: string;
    desiredDate?: string;
    futurePossibility?: string;
    fruit?: string;
    makesPossible?: string[];
    needs: Array<{ title: string; description?: string; quantity?: number; unit?: string }>;
  }) =>
    apiFetch<Project & { opener?: Profile }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Pledges
  createPledge: (data: {
    projectId: string;
    needId?: string | null;
    offerId?: string | null;
    description: string;
    quantity?: number | null;
    unit?: string | null;
  }) =>
    apiFetch<Pledge & { pledger?: Profile }>('/api/pledges', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transitionPledge: (
    pledgeId: string,
    action: 'accept' | 'decline' | 'withdraw' | 'report_complete' | 'confirm'
  ) =>
    apiFetch<Pledge & { pledger?: Profile }>(`/api/pledges/${pledgeId}/transition`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),

  // Project Completion & Receipt
  completeProject: (
    projectId: string,
    data: {
      summary: string;
      outcome: string;
      fruit?: string;
      makesPossible?: string[];
      newCapacityTitle?: string;
      newCapacityDescription?: string;
    }
  ) =>
    apiFetch<{ project: Project; receipt: Receipt; capacity?: Capacity }>(
      `/api/projects/${projectId}/complete`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  // Remember Tab
  getReceipts: () =>
    apiFetch<Array<Receipt & { project?: Project; author?: Profile; confirmedPledges: Array<Pledge & { pledger?: Profile }> }>>('/api/receipts'),
  getCapacities: () =>
    apiFetch<Array<Capacity & { receipt?: Receipt; project?: Project }>>('/api/capacities'),
  getEvents: () => apiFetch<Array<DomainEvent & { actor?: Profile }>>('/api/events'),

  // Participant Lineage
  getParticipantLineage: (id: string) =>
    apiFetch<{
      profile: Profile;
      offers: Offer[];
      openedProjects: Project[];
      userPledges: Array<Pledge & { project?: Project }>;
      confirmedContributions: Array<Pledge & { project?: Project }>;
      capacitiesHelped: Capacity[];
    }>(`/api/participants/${id}`),

  // Boot the House world threshold
  getWorldField: () => apiFetch<WorldFieldResponse>('/api/world/field'),
  decodeWorldStroke: (points: Array<{ x: number; y: number }>) =>
    apiFetch<WorldDecodeResult>('/api/world/decode', {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),
  crossWorldDoor: (pendingId: string, doorRef: string) =>
    apiFetch<ConfirmCrossingResult>('/api/world/cross', {
      method: 'POST',
      body: JSON.stringify({ pendingId, doorRef, confirmed: true }),
    }),
  getWorldResidue: (residueRef: string) =>
    apiFetch<WorldEncounterResidue>(`/api/world/residue/${encodeURIComponent(residueRef)}`),
};
