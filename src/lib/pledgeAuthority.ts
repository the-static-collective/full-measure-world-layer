import { PledgeStatus } from '../types.js';

export type PledgeTransitionAction =
  | 'accept'
  | 'decline'
  | 'withdraw'
  | 'report_complete'
  | 'confirm';

interface TransitionRequest {
  action: unknown;
  currentStatus: PledgeStatus;
  isOpenerOrSteward: boolean;
  isPledgeAuthor: boolean;
}

export type TransitionDecision =
  | { ok: true; action: PledgeTransitionAction }
  | { ok: false; status: 400 | 403; error: string };

const isPledgeAction = (action: unknown): action is PledgeTransitionAction =>
  typeof action === 'string' &&
  ['accept', 'decline', 'withdraw', 'report_complete', 'confirm'].includes(action);

export function authorizePledgeTransition({
  action,
  currentStatus,
  isOpenerOrSteward,
  isPledgeAuthor,
}: TransitionRequest): TransitionDecision {
  if (!isPledgeAction(action)) {
    return { ok: false, status: 400, error: 'Invalid transition action' };
  }

  if (action === 'accept' || action === 'decline') {
    if (!isOpenerOrSteward) {
      return {
        ok: false,
        status: 403,
        error: `Only the project opener or circle steward can ${action} pledges.`,
      };
    }
    if (currentStatus !== 'proposed') {
      return {
        ok: false,
        status: 400,
        error: `Only proposed pledges can be ${action}ed.`,
      };
    }
  }

  if (action === 'withdraw') {
    if (!isPledgeAuthor) {
      return {
        ok: false,
        status: 403,
        error: 'Only the pledge author may withdraw their pledge.',
      };
    }
    if (currentStatus === 'confirmed') {
      return {
        ok: false,
        status: 400,
        error: 'Confirmed pledges cannot be withdrawn.',
      };
    }
  }

  if (action === 'report_complete') {
    if (!isPledgeAuthor) {
      return {
        ok: false,
        status: 403,
        error: 'Only the pledge author can report their contribution complete.',
      };
    }
    if (currentStatus !== 'accepted') {
      return {
        ok: false,
        status: 400,
        error: 'Pledge must be accepted before reporting complete.',
      };
    }
  }

  if (action === 'confirm') {
    if (!isOpenerOrSteward) {
      return {
        ok: false,
        status: 403,
        error:
          'Only the project opener or circle steward can confirm completed contributions.',
      };
    }
    if (isPledgeAuthor) {
      return {
        ok: false,
        status: 403,
        error: 'A contributor cannot confirm their own fulfillment.',
      };
    }
    if (currentStatus !== 'reported_complete') {
      return {
        ok: false,
        status: 400,
        error: 'Contribution must be reported complete before confirmation.',
      };
    }
  }

  return { ok: true, action };
}
