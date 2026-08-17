import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initialSeedStore } from './src/lib/initialData.js';
import { authorizePledgeTransition } from './src/lib/pledgeAuthority.js';
import { createWorldRuntimeServices } from './src/lib/worldRuntime/services.js';
import { createWorldRuntimeHttpHandlers } from './src/lib/worldRuntime/http.js';
import { registerWorldRuntimeRoutes } from './src/lib/worldRuntime/routes.js';
import {
  JubileeDataStore,
  Offer,
  Project,
  Pledge,
  Receipt,
  Capacity,
  DomainEvent,
  ProjectNeed,
  Profile,
} from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data', 'jubilee_db.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Database helper functions
function loadDataStore(): JubileeDataStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw) as JubileeDataStore;
      if (!loaded.circleInvitations) {
        loaded.circleInvitations = JSON.parse(JSON.stringify(initialSeedStore.circleInvitations || []));
      }
      return loaded;
    }
  } catch (err) {
    console.error('Error reading DB_FILE, resetting to seed:', err);
  }
  // Initialize with seed data
  saveDataStore(initialSeedStore);
  return JSON.parse(JSON.stringify(initialSeedStore));
}

function saveDataStore(store: JubileeDataStore): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

let store: JubileeDataStore = loadDataStore();

function recordDomainEvent(
  circleId: string,
  aggregateType: DomainEvent['aggregateType'],
  aggregateId: string,
  eventType: string,
  actorId: string,
  payload: Record<string, unknown>
): DomainEvent {
  const event: DomainEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    circleId,
    aggregateType,
    aggregateId,
    eventType,
    actorId,
    payload,
    createdAt: new Date().toISOString(),
  };
  store.domainEvents.unshift(event); // newest first
  return event;
}

// Helper to resolve actor ID from header or body
function getActorId(req: Request): string {
  const headerUserId = req.headers['x-user-id'];
  if (typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId;
  }
  return 'user_lu'; // Default fallback actor
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const worldRuntimeServices = createWorldRuntimeServices(process.env, process.platform);
  const worldRuntimeHttp = createWorldRuntimeHttpHandlers(worldRuntimeServices);
  registerWorldRuntimeRoutes(app, worldRuntimeHttp);

  // Log requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // API Routes

  // 1. Health check & store overview
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Reset database to seed data
  app.post('/api/seed/reset', (req: Request, res: Response) => {
    store = JSON.parse(JSON.stringify(initialSeedStore));
    saveDataStore(store);
    res.json({ message: 'Store reset to seed data successfully', store });
  });

  // 3. User & Profiles
  app.get('/api/profiles', (req: Request, res: Response) => {
    res.json(store.profiles);
  });

  app.get('/api/profiles/:id', (req: Request, res: Response) => {
    const profile = store.profiles.find((p) => p.id === req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  });

  // Login / Register Magic User
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { displayName, note } = req.body;
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const trimmed = displayName.trim();
    let profile = store.profiles.find(
      (p) => p.displayName.toLowerCase() === trimmed.toLowerCase()
    );

    if (!profile) {
      const colors = [
        'bg-amber-800 text-amber-50',
        'bg-emerald-800 text-emerald-50',
        'bg-stone-800 text-stone-50',
        'bg-terracotta-800 text-amber-50',
        'bg-teal-800 text-teal-50',
      ];
      profile = {
        id: `user_${Date.now()}`,
        displayName: trimmed,
        note: note || 'Participant at The First Campfire',
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        createdAt: new Date().toISOString(),
      };
      store.profiles.push(profile);

      // Join First Campfire circle
      store.circleMembers.push({
        circleId: 'circle_1',
        userId: profile.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });

      recordDomainEvent('circle_1', 'circle', 'circle_1', 'member.joined', profile.id, {
        displayName: profile.displayName,
      });

      saveDataStore(store);
    }

    res.json({ profile, circleId: 'circle_1' });
  });

  // 4. Circle Information & Invitations
  app.get('/api/circle', (req: Request, res: Response) => {
    const circle = store.circles[0];
    const members = store.circleMembers.map((cm) => {
      const p = store.profiles.find((prof) => prof.id === cm.userId);
      return {
        ...cm,
        profile: p,
      };
    });
    res.json({ circle, members });
  });

  // Get active circle invitations (Member / Steward auth required)
  app.get('/api/circles/:circleId/invitations', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { circleId } = req.params;

    const isMember = store.circleMembers.some(
      (cm) => cm.circleId === circleId && cm.userId === actorId
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Only circle members can view invitations.' });
    }

    const invitations = store.circleInvitations
      .filter((inv) => inv.circleId === circleId)
      .map((inv) => {
        const creator = store.profiles.find((p) => p.id === inv.createdById);
        return { ...inv, creator };
      });

    res.json(invitations);
  });

  // Create new unique circle invitation (Member / Steward auth required)
  app.post('/api/circles/:circleId/invitations', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { circleId } = req.params;
    const { note, customCode, maxUses, expiresDays } = req.body;

    const member = store.circleMembers.find(
      (cm) => cm.circleId === circleId && cm.userId === actorId
    );
    if (!member) {
      return res.status(403).json({ error: 'Only authenticated circle members or stewards can invite others.' });
    }

    const circle = store.circles.find((c) => c.id === circleId);
    if (!circle) {
      return res.status(404).json({ error: 'Circle not found.' });
    }

    // Code generation
    let code = customCode && typeof customCode === 'string' ? customCode.trim().toUpperCase() : '';
    if (!code) {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const circlePrefix = circle.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'CAMP';
      code = `${circlePrefix}-${suffix}`;
    }

    // Check code collision
    const existing = store.circleInvitations.find((inv) => inv.code.toUpperCase() === code);
    if (existing) {
      return res.status(400).json({ error: 'This invitation code is already in use.' });
    }

    const invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      circleId,
      code,
      createdById: actorId,
      note: note?.trim() || null,
      maxUses: maxUses ? Number(maxUses) : null,
      usesCount: 0,
      expiresAt: expiresDays ? new Date(Date.now() + Number(expiresDays) * 86400000).toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    store.circleInvitations.unshift(invitation);

    recordDomainEvent(circleId, 'invitation', invitation.id, 'invitation.created', actorId, {
      code: invitation.code,
      note: invitation.note,
    });

    saveDataStore(store);

    const creator = store.profiles.find((p) => p.id === actorId);
    res.status(201).json({ ...invitation, creator, circleName: circle.name });
  });

  // Validate an invitation code
  app.get('/api/invitations/validate/:code', (req: Request, res: Response) => {
    const code = req.params.code.trim().toUpperCase();

    // Check custom invitations
    let invitation = store.circleInvitations.find((inv) => inv.code.toUpperCase() === code);
    let circle = invitation ? store.circles.find((c) => c.id === invitation.circleId) : null;

    // Fallback: check circle main invite code
    if (!circle) {
      circle = store.circles.find((c) => c.inviteCode.toUpperCase() === code);
      if (circle) {
        invitation = {
          id: `inv_default_${circle.id}`,
          circleId: circle.id,
          code: circle.inviteCode,
          createdById: circle.createdBy,
          note: `Welcome to ${circle.name}!`,
          maxUses: null,
          usesCount: store.circleMembers.filter((m) => m.circleId === circle!.id).length,
          expiresAt: null,
          createdAt: circle.createdAt,
        };
      }
    }

    if (!circle || !invitation) {
      return res.status(404).json({ error: 'Invalid invitation code.' });
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This invitation link has expired.' });
    }

    if (invitation.maxUses && invitation.usesCount >= invitation.maxUses) {
      return res.status(400).json({ error: 'This invitation link has reached its maximum usage limit.' });
    }

    const inviter = store.profiles.find((p) => p.id === invitation!.createdById);

    res.json({
      valid: true,
      invitation,
      circle,
      inviter,
    });
  });

  // Join a circle using an invitation code
  app.post('/api/invitations/join', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { code, displayName, note } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invitation code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Find invitation or circle
    let invitation = store.circleInvitations.find((inv) => inv.code.toUpperCase() === cleanCode);
    let circle = invitation ? store.circles.find((c) => c.id === invitation.circleId) : null;

    if (!circle) {
      circle = store.circles.find((c) => c.inviteCode.toUpperCase() === cleanCode);
      if (circle) {
        invitation = {
          id: `inv_default_${circle.id}`,
          circleId: circle.id,
          code: circle.inviteCode,
          createdById: circle.createdBy,
          note: `Welcome to ${circle.name}!`,
          maxUses: null,
          usesCount: 0,
          expiresAt: null,
          createdAt: circle.createdAt,
        };
      }
    }

    if (!circle) {
      return res.status(404).json({ error: 'Invalid invitation code.' });
    }

    // Resolve or create profile
    let profile = store.profiles.find((p) => p.id === actorId);

    if (!profile && displayName && typeof displayName === 'string' && displayName.trim()) {
      const colors = [
        'bg-amber-800 text-amber-50',
        'bg-emerald-800 text-emerald-50',
        'bg-stone-800 text-stone-50',
        'bg-terracotta-800 text-amber-50',
        'bg-teal-800 text-teal-50',
      ];
      profile = {
        id: `user_${Date.now()}`,
        displayName: displayName.trim(),
        note: note || 'Participant at Jubilee Campfire',
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        createdAt: new Date().toISOString(),
      };
      store.profiles.push(profile);
    }

    if (!profile) {
      return res.status(400).json({ error: 'Profile not found. Please provide a display name.' });
    }

    // Add to circle members if not already
    const existingMember = store.circleMembers.find(
      (cm) => cm.circleId === circle!.id && cm.userId === profile!.id
    );

    if (!existingMember) {
      store.circleMembers.push({
        circleId: circle.id,
        userId: profile.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });

      if (invitation && invitation.id !== `inv_default_${circle.id}`) {
        invitation.usesCount += 1;
      }

      recordDomainEvent(circle.id, 'circle', circle.id, 'member.joined_via_invitation', profile.id, {
        displayName: profile.displayName,
        invitationCode: cleanCode,
      });

      saveDataStore(store);
    }

    res.json({
      success: true,
      profile,
      circle,
      message: existingMember
        ? `You are already a member of ${circle.name}!`
        : `Welcome to ${circle.name}!`,
    });
  });

  // 5. Offers (Basket)
  app.get('/api/offers', (req: Request, res: Response) => {
    const offers = store.offers.map((offer) => {
      const author = store.profiles.find((p) => p.id === offer.offeredBy);
      return {
        ...offer,
        author,
      };
    });
    res.json(offers);
  });

  app.post('/api/offers', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { title, description, category, availability, locationNote, boundaries } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Offer title is required' });
    }

    const offer: Offer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      circleId: 'circle_1',
      offeredBy: actorId,
      title: title.trim(),
      description: description?.trim() || null,
      category: category || 'other',
      availability: availability?.trim() || null,
      locationNote: locationNote?.trim() || null,
      boundaries: boundaries?.trim() || null,
      status: 'available',
      makesPossible: Array.isArray(req.body.makesPossible)
        ? req.body.makesPossible.filter((m: any) => typeof m === 'string' && m.trim())
        : req.body.makesPossible
        ? [String(req.body.makesPossible).trim()]
        : null,
      addressHash: `jubilee://offer/${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    store.offers.unshift(offer);

    recordDomainEvent('circle_1', 'offer', offer.id, 'offer.created', actorId, {
      title: offer.title,
      category: offer.category,
    });

    saveDataStore(store);

    const author = store.profiles.find((p) => p.id === actorId);
    res.status(201).json({ ...offer, author });
  });

  app.patch('/api/offers/:id/status', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { status } = req.body;
    const offer = store.offers.find((o) => o.id === req.params.id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // Authorization rule: Only offer author can change status
    if (offer.offeredBy !== actorId) {
      return res.status(403).json({ error: 'Only the offer author may change its status' });
    }

    if (!['available', 'paused', 'retired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    offer.status = status;

    recordDomainEvent('circle_1', 'offer', offer.id, `offer.${status}`, actorId, {
      title: offer.title,
      status,
    });

    saveDataStore(store);
    res.json(offer);
  });

  // 6. Projects & Needs
  app.get('/api/projects', (req: Request, res: Response) => {
    const projects = store.projects.map((project) => {
      const opener = store.profiles.find((p) => p.id === project.openedBy);
      const projectPledges = store.pledges
        .filter((pl) => pl.projectId === project.id)
        .map((pl) => {
          const pledger = store.profiles.find((p) => p.id === pl.pledgedBy);
          return { ...pl, pledger };
        });

      return {
        ...project,
        opener,
        pledges: projectPledges,
      };
    });
    res.json(projects);
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const project = store.projects.find((p) => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const opener = store.profiles.find((p) => p.id === project.openedBy);
    const projectPledges = store.pledges
      .filter((pl) => pl.projectId === project.id)
      .map((pl) => {
        const pledger = store.profiles.find((p) => p.id === pl.pledgedBy);
        return { ...pl, pledger };
      });

    const receipt = store.receipts.find((r) => r.projectId === project.id);
    const capacities = store.capacities.filter((c) => c.sourceReceiptId === receipt?.id);
    const events = store.domainEvents.filter(
      (e) => e.aggregateId === project.id || projectPledges.some((pl) => pl.id === e.aggregateId)
    );

    res.json({
      ...project,
      opener,
      pledges: projectPledges,
      receipt,
      capacities,
      events,
    });
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { title, story, locationNote, desiredDate, futurePossibility, fruit, makesPossible, needs } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    if (!story || typeof story !== 'string' || !story.trim()) {
      return res.status(400).json({ error: 'Project story is required' });
    }

    const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const parsedNeeds: ProjectNeed[] = Array.isArray(needs)
      ? needs
          .filter((n) => n.title && n.title.trim())
          .map((n, idx) => ({
            id: `need_${projectId}_${idx + 1}`,
            projectId,
            title: n.title.trim(),
            description: n.description?.trim() || null,
            quantity: n.quantity ? Number(n.quantity) : null,
            unit: n.unit?.trim() || null,
            status: 'open',
          }))
      : [];

    const parsedMakesPossible = Array.isArray(makesPossible)
      ? makesPossible.filter((m: any) => typeof m === 'string' && m.trim())
      : typeof makesPossible === 'string' && makesPossible.trim()
      ? [makesPossible.trim()]
      : null;

    const project: Project = {
      id: projectId,
      circleId: 'circle_1',
      openedBy: actorId,
      title: title.trim(),
      story: story.trim(),
      locationNote: locationNote?.trim() || null,
      desiredDate: desiredDate?.trim() || null,
      status: 'forming',
      seedStage: 'Sprout',
      fruit: fruit?.trim() || null,
      futurePossibility: futurePossibility?.trim() || null,
      makesPossible: parsedMakesPossible,
      addressHash: `jubilee://seed/${projectId}`,
      needs: parsedNeeds,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    store.projects.unshift(project);

    recordDomainEvent('circle_1', 'project', project.id, 'project.opened', actorId, {
      title: project.title,
      needCount: parsedNeeds.length,
    });

    saveDataStore(store);

    const opener = store.profiles.find((p) => p.id === actorId);
    res.status(201).json({ ...project, opener, pledges: [] });
  });

  // 7. Pledges & State Transitions (Strict Authority Rules)
  app.post('/api/pledges', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const { projectId, needId, offerId, description, quantity, unit } = req.body;

    const project = store.projects.find((p) => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Contribution description is required' });
    }

    const pledge: Pledge = {
      id: `pledge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      needId: needId || null,
      pledgedBy: actorId,
      offerId: offerId || null,
      description: description.trim(),
      quantity: quantity ? Number(quantity) : null,
      unit: unit?.trim() || null,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      reportedCompleteAt: null,
      confirmedAt: null,
    };

    store.pledges.push(pledge);

    recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.proposed', actorId, {
      projectId,
      description: pledge.description,
    });

    saveDataStore(store);

    const pledger = store.profiles.find((p) => p.id === actorId);
    res.status(201).json({ ...pledge, pledger });
  });

  // Pledge State Transitions endpoint
  app.patch('/api/pledges/:id/transition', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const requestedAction = req.body?.action;

    const pledge = store.pledges.find((pl) => pl.id === req.params.id);
    if (!pledge) {
      return res.status(404).json({ error: 'Pledge not found' });
    }

    const project = store.projects.find((p) => p.id === pledge.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    const isOpenerOrSteward =
      project.openedBy === actorId ||
      store.circleMembers.some((cm) => cm.userId === actorId && cm.role === 'steward');
    const isPledgeAuthor = pledge.pledgedBy === actorId;

    const decision = authorizePledgeTransition({
      action: requestedAction,
      currentStatus: pledge.status,
      isOpenerOrSteward,
      isPledgeAuthor,
    });
    if (decision.ok === false) {
      return res.status(decision.status).json({ error: decision.error });
    }

    const action = decision.action;
    const now = new Date().toISOString();

    switch (action) {
      case 'accept':
        pledge.status = 'accepted';
        pledge.acceptedAt = now;
        recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.accepted', actorId, {
          projectId: project.id,
          pledgeId: pledge.id,
        });
        break;

      case 'decline':
        pledge.status = 'declined';
        recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.declined', actorId, {
          projectId: project.id,
          pledgeId: pledge.id,
        });
        break;

      case 'withdraw':
        pledge.status = 'withdrawn';
        recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.withdrawn', actorId, {
          projectId: project.id,
          pledgeId: pledge.id,
        });
        break;

      case 'report_complete':
        pledge.status = 'reported_complete';
        pledge.reportedCompleteAt = now;
        recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.reported_complete', actorId, {
          projectId: project.id,
          pledgeId: pledge.id,
        });
        break;

      case 'confirm':
        pledge.status = 'confirmed';
        pledge.confirmedAt = now;

        // Update corresponding project need status if linked
        if (pledge.needId) {
          const need = project.needs.find((n) => n.id === pledge.needId);
          if (need) {
            need.status = 'met';
          }
        }

        recordDomainEvent('circle_1', 'pledge', pledge.id, 'pledge.confirmed', actorId, {
          projectId: project.id,
          pledgeId: pledge.id,
          pledgedBy: pledge.pledgedBy,
        });
        break;
    }

    saveDataStore(store);

    const pledger = store.profiles.find((p) => p.id === pledge.pledgedBy);
    res.json({ ...pledge, pledger });
  });

  // 8. Project Completion & Receipt Creation (Atomic)
  app.post('/api/projects/:id/complete', (req: Request, res: Response) => {
    const actorId = getActorId(req);
    const projectId = req.params.id;
    const { summary, outcome, fruit, makesPossible, newCapacityTitle, newCapacityDescription } = req.body;

    const project = store.projects.find((p) => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOpenerOrSteward =
      project.openedBy === actorId ||
      store.circleMembers.some((cm) => cm.userId === actorId && cm.role === 'steward');

    if (!isOpenerOrSteward) {
      return res.status(403).json({ error: 'Only project opener or steward can complete the project and write a receipt.' });
    }

    const hasHumanWitnessedContribution = store.pledges.some(
      (pledge) => pledge.projectId === project.id && pledge.status === 'confirmed'
    );
    if (!hasHumanWitnessedContribution) {
      return res.status(400).json({
        error:
          'A project cannot be harvested until at least one reported contribution has been confirmed by another human.',
      });
    }

    if (!summary || !summary.trim()) {
      return res.status(400).json({ error: 'Receipt summary is required.' });
    }
    if (!outcome || !outcome.trim()) {
      return res.status(400).json({ error: 'Receipt outcome description is required.' });
    }

    const now = new Date().toISOString();

    const parsedMakesPossible = Array.isArray(makesPossible)
      ? makesPossible.filter((m: any) => typeof m === 'string' && m.trim())
      : typeof makesPossible === 'string' && makesPossible.trim()
      ? [makesPossible.trim()]
      : project.makesPossible || null;

    // 1. Mark project completed & updated seed stage
    project.status = 'completed';
    project.seedStage = 'Harvest';
    project.completedAt = now;
    if (fruit && fruit.trim()) project.fruit = fruit.trim();

    // 2. Create Receipt
    const receipt: Receipt = {
      id: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      circleId: 'circle_1',
      projectId: project.id,
      createdBy: actorId,
      summary: summary.trim(),
      outcome: outcome.trim(),
      fruit: fruit?.trim() || project.fruit || null,
      makesPossible: parsedMakesPossible,
      addressHash: `jubilee://receipt/${project.id}`,
      createdAt: now,
    };
    store.receipts.unshift(receipt);

    recordDomainEvent('circle_1', 'receipt', receipt.id, 'receipt.created', actorId, {
      projectId: project.id,
      summary: receipt.summary,
    });

    // 3. Optional Capacity creation
    let capacity: Capacity | null = null;
    if (newCapacityTitle && newCapacityTitle.trim()) {
      capacity = {
        id: `capacity_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        circleId: 'circle_1',
        title: newCapacityTitle.trim(),
        description: newCapacityDescription?.trim() || newCapacityTitle.trim(),
        sourceReceiptId: receipt.id,
        makesPossible: parsedMakesPossible,
        addressHash: `jubilee://capacity/${Date.now().toString(36)}`,
        createdAt: now,
      };
      store.capacities.unshift(capacity);

      recordDomainEvent('circle_1', 'capacity', capacity.id, 'capacity.created', actorId, {
        title: capacity.title,
        sourceReceiptId: receipt.id,
      });
    }

    recordDomainEvent('circle_1', 'project', project.id, 'project.completed', actorId, {
      title: project.title,
      receiptId: receipt.id,
    });

    saveDataStore(store);

    res.json({ project, receipt, capacity });
  });

  // 9. Remember Tab APIs (Receipts, Capacities, Domain Events)
  app.get('/api/receipts', (req: Request, res: Response) => {
    const receipts = store.receipts.map((r) => {
      const project = store.projects.find((p) => p.id === r.projectId);
      const author = store.profiles.find((p) => p.id === r.createdBy);
      const confirmedPledges = store.pledges
        .filter((pl) => pl.projectId === r.projectId && pl.status === 'confirmed')
        .map((pl) => {
          const pledger = store.profiles.find((p) => p.id === pl.pledgedBy);
          return { ...pl, pledger };
        });

      return {
        ...r,
        project,
        author,
        confirmedPledges,
      };
    });
    res.json(receipts);
  });

  app.get('/api/capacities', (req: Request, res: Response) => {
    const capacities = store.capacities.map((c) => {
      const receipt = store.receipts.find((r) => r.id === c.sourceReceiptId);
      const project = receipt ? store.projects.find((p) => p.id === receipt.projectId) : null;
      return {
        ...c,
        receipt,
        project,
      };
    });
    res.json(capacities);
  });

  app.get('/api/events', (req: Request, res: Response) => {
    const events = store.domainEvents.map((e) => {
      const actor = store.profiles.find((p) => p.id === e.actorId);
      return {
        ...e,
        actor,
      };
    });
    res.json(events);
  });

  // 10. Participant Lineage
  app.get('/api/participants/:id', (req: Request, res: Response) => {
    const profile = store.profiles.find((p) => p.id === req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const offers = store.offers.filter((o) => o.offeredBy === profile.id);
    const openedProjects = store.projects.filter((p) => p.openedBy === profile.id);
    const userPledges = store.pledges
      .filter((pl) => pl.pledgedBy === profile.id)
      .map((pl) => {
        const project = store.projects.find((p) => p.id === pl.projectId);
        return { ...pl, project };
      });

    const confirmedContributions = userPledges.filter((pl) => pl.status === 'confirmed');

    // Capacities user helped create through confirmed contributions or opening project
    const userConfirmedProjectIds = new Set([
      ...openedProjects.map((p) => p.id),
      ...confirmedContributions.map((pl) => pl.projectId),
    ]);

    const userReceipts = store.receipts.filter((r) => userConfirmedProjectIds.has(r.projectId));
    const userReceiptIds = new Set(userReceipts.map((r) => r.id));
    const capacitiesHelped = store.capacities.filter((c) => userReceiptIds.has(c.sourceReceiptId));

    res.json({
      profile,
      offers,
      openedProjects,
      userPledges,
      confirmedContributions,
      capacitiesHelped,
    });
  });

  // Mount Vite Middleware or Serve Production Build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jubilee Campfire server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});