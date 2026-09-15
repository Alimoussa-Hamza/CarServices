import { ConflictException, Injectable } from '@nestjs/common';
import {
  BOOKING_DISPUTE_WINDOW_HOURS,
  type BookingActorType,
  type BookingStatus,
} from '@carservice/shared-types';

export const BOOKING_DISPUTE_WINDOW_MS =
  BOOKING_DISPUTE_WINDOW_HOURS * 60 * 60 * 1000;

export type BookingTransitionContext = {
  now?: Date;
  completedAt?: Date;
};

export type BookingStatusHistoryEntry = {
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorType: BookingActorType;
  actorId?: string;
  reason?: string;
};

type TransitionRule = {
  from: BookingStatus;
  to: BookingStatus;
  actors: readonly BookingActorType[];
};

/**
 * Transitions RG-BOOK. L’admin peut jouer chaque arête du graphe
 * (pas de saut hors graphe — RG-BOOK-01).
 */
const TRANSITION_RULES: readonly TransitionRule[] = [
  { from: 'draft', to: 'payment_authorized', actors: ['system', 'admin'] },
  { from: 'draft', to: 'cancelled_by_client', actors: ['client', 'admin'] },
  { from: 'draft', to: 'cancelled_by_admin', actors: ['admin'] },
  { from: 'draft', to: 'expired', actors: ['system', 'admin'] },

  {
    from: 'payment_authorized',
    to: 'pending_provider',
    actors: ['system', 'admin'],
  },
  {
    from: 'payment_authorized',
    to: 'cancelled_by_client',
    actors: ['client', 'admin'],
  },
  { from: 'payment_authorized', to: 'cancelled_by_admin', actors: ['admin'] },
  { from: 'payment_authorized', to: 'expired', actors: ['system', 'admin'] },
  { from: 'payment_authorized', to: 'unassigned', actors: ['system', 'admin'] },

  { from: 'pending_provider', to: 'accepted', actors: ['provider', 'admin'] },
  { from: 'pending_provider', to: 'unassigned', actors: ['system', 'admin'] },
  {
    from: 'pending_provider',
    to: 'cancelled_by_client',
    actors: ['client', 'admin'],
  },
  { from: 'pending_provider', to: 'cancelled_by_admin', actors: ['admin'] },
  { from: 'pending_provider', to: 'expired', actors: ['system', 'admin'] },

  { from: 'accepted', to: 'en_route', actors: ['provider', 'admin'] },
  { from: 'accepted', to: 'cancelled_by_client', actors: ['client', 'admin'] },
  {
    from: 'accepted',
    to: 'cancelled_by_provider',
    actors: ['provider', 'admin'],
  },
  { from: 'accepted', to: 'cancelled_by_admin', actors: ['admin'] },

  { from: 'en_route', to: 'in_progress', actors: ['provider', 'admin'] },
  { from: 'en_route', to: 'cancelled_by_client', actors: ['client', 'admin'] },
  {
    from: 'en_route',
    to: 'cancelled_by_provider',
    actors: ['provider', 'admin'],
  },
  { from: 'en_route', to: 'cancelled_by_admin', actors: ['admin'] },

  { from: 'in_progress', to: 'completed', actors: ['provider', 'admin'] },

  { from: 'completed', to: 'disputed', actors: ['client', 'provider', 'admin'] },
];

const TERMINAL_STATUSES: readonly BookingStatus[] = [
  'cancelled_by_client',
  'cancelled_by_provider',
  'cancelled_by_admin',
  'expired',
  'unassigned',
  'disputed',
];

@Injectable()
export class BookingStateMachine {
  /**
   * Indique si `actor` peut passer de `from` à `to` (RG-BOOK-01).
   * Pour `completed` → `disputed`, client et pro sont limités à 48 h si `completedAt` est fourni.
   */
  canTransition(
    from: BookingStatus,
    to: BookingStatus,
    actor: BookingActorType,
    context?: BookingTransitionContext,
  ): boolean {
    if (!this.findRule(from, to, actor)) {
      return false;
    }

    if (to === 'disputed' && (actor === 'client' || actor === 'provider')) {
      return this.isDisputeWindowOpen(context);
    }

    return true;
  }

  /**
   * Même règle que `canTransition`, lève `BOOKING_INVALID_TRANSITION` (409)
   * ou `BOOKING_DISPUTE_WINDOW_EXPIRED` (409).
   */
  assertCanTransition(
    from: BookingStatus,
    to: BookingStatus,
    actor: BookingActorType,
    context?: BookingTransitionContext,
  ): void {
    if (!this.findRule(from, to, actor)) {
      throw new ConflictException({
        code: 'BOOKING_INVALID_TRANSITION',
        message: 'Transition de statut interdite.',
        details: { from, to, actor },
      });
    }

    if (
      to === 'disputed' &&
      (actor === 'client' || actor === 'provider') &&
      !this.isDisputeWindowOpen(context)
    ) {
      throw new ConflictException({
        code: 'BOOKING_DISPUTE_WINDOW_EXPIRED',
        message: 'Le délai de 48 h pour ouvrir un litige est dépassé.',
        details: { from, to, actor },
      });
    }
  }

  /** Cibles autorisées pour un statut et un acteur (hors fenêtre litige). */
  allowedTargets(
    from: BookingStatus,
    actor: BookingActorType,
  ): BookingStatus[] {
    return TRANSITION_RULES.filter(
      (rule) => rule.from === from && rule.actors.includes(actor),
    ).map((rule) => rule.to);
  }

  isTerminal(status: BookingStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  /**
   * Construit l’entrée `booking_status_history` après validation.
   * La persistance Prisma est faite par le service bookings (S03).
   */
  buildHistoryEntry(
    from: BookingStatus | null,
    to: BookingStatus,
    actor: BookingActorType,
    options?: {
      actorId?: string;
      reason?: string;
      context?: BookingTransitionContext;
    },
  ): BookingStatusHistoryEntry {
    if (from !== null) {
      this.assertCanTransition(from, to, actor, options?.context);
    }

    return {
      fromStatus: from,
      toStatus: to,
      actorType: actor,
      actorId: options?.actorId,
      reason: options?.reason,
    };
  }

  private findRule(
    from: BookingStatus,
    to: BookingStatus,
    actor: BookingActorType,
  ): TransitionRule | undefined {
    return TRANSITION_RULES.find(
      (rule) =>
        rule.from === from &&
        rule.to === to &&
        rule.actors.includes(actor),
    );
  }

  private isDisputeWindowOpen(context?: BookingTransitionContext): boolean {
    if (!context?.completedAt) {
      return true;
    }

    const now = context.now ?? new Date();
    return now.getTime() - context.completedAt.getTime() <= BOOKING_DISPUTE_WINDOW_MS;
  }
}
