import { ConflictException } from '@nestjs/common';
import {
  BookingActorTypeSchema,
  BookingStatusSchema,
  type BookingActorType,
  type BookingStatus,
} from '@carservice/shared-types';
import { BookingStateMachine } from '../booking-state.machine';

const STATUSES = BookingStatusSchema.options;
const ACTORS = BookingActorTypeSchema.options;

/** Contrat de test RG-BOOK — volontairement dupliqué de la machine. */
const EXPECTED_TRANSITIONS: ReadonlyArray<
  [BookingStatus, BookingStatus, BookingActorType]
> = [
  ['draft', 'payment_authorized', 'system'],
  ['draft', 'payment_authorized', 'admin'],
  ['draft', 'cancelled_by_client', 'client'],
  ['draft', 'cancelled_by_client', 'admin'],
  ['draft', 'cancelled_by_admin', 'admin'],
  ['draft', 'expired', 'system'],
  ['draft', 'expired', 'admin'],

  ['payment_authorized', 'pending_provider', 'system'],
  ['payment_authorized', 'pending_provider', 'admin'],
  ['payment_authorized', 'cancelled_by_client', 'client'],
  ['payment_authorized', 'cancelled_by_client', 'admin'],
  ['payment_authorized', 'cancelled_by_admin', 'admin'],
  ['payment_authorized', 'expired', 'system'],
  ['payment_authorized', 'expired', 'admin'],
  ['payment_authorized', 'unassigned', 'system'],
  ['payment_authorized', 'unassigned', 'admin'],

  ['pending_provider', 'accepted', 'provider'],
  ['pending_provider', 'accepted', 'admin'],
  ['pending_provider', 'unassigned', 'system'],
  ['pending_provider', 'unassigned', 'admin'],
  ['pending_provider', 'cancelled_by_client', 'client'],
  ['pending_provider', 'cancelled_by_client', 'admin'],
  ['pending_provider', 'cancelled_by_admin', 'admin'],
  ['pending_provider', 'expired', 'system'],
  ['pending_provider', 'expired', 'admin'],

  ['accepted', 'en_route', 'provider'],
  ['accepted', 'en_route', 'admin'],
  ['accepted', 'cancelled_by_client', 'client'],
  ['accepted', 'cancelled_by_client', 'admin'],
  ['accepted', 'cancelled_by_provider', 'provider'],
  ['accepted', 'cancelled_by_provider', 'admin'],
  ['accepted', 'cancelled_by_admin', 'admin'],

  ['en_route', 'in_progress', 'provider'],
  ['en_route', 'in_progress', 'admin'],
  ['en_route', 'cancelled_by_client', 'client'],
  ['en_route', 'cancelled_by_client', 'admin'],
  ['en_route', 'cancelled_by_provider', 'provider'],
  ['en_route', 'cancelled_by_provider', 'admin'],
  ['en_route', 'cancelled_by_admin', 'admin'],

  ['in_progress', 'completed', 'provider'],
  ['in_progress', 'completed', 'admin'],

  ['completed', 'disputed', 'client'],
  ['completed', 'disputed', 'admin'],
];

const ALLOWED = new Set(
  EXPECTED_TRANSITIONS.map(([from, to, actor]) => `${from}|${to}|${actor}`),
);

describe('BookingStateMachine', () => {
  const machine = new BookingStateMachine();

  describe('happy path RG-BOOK', () => {
    it.each([
      ['draft', 'payment_authorized', 'system'],
      ['payment_authorized', 'pending_provider', 'system'],
      ['pending_provider', 'accepted', 'provider'],
      ['accepted', 'en_route', 'provider'],
      ['en_route', 'in_progress', 'provider'],
      ['in_progress', 'completed', 'provider'],
    ] as const)('%s → %s par %s', (from, to, actor) => {
      expect(machine.canTransition(from, to, actor)).toBe(true);
    });
  });

  describe('annulations avant in_progress', () => {
    it.each([
      ['draft', 'cancelled_by_client', 'client'],
      ['payment_authorized', 'cancelled_by_client', 'client'],
      ['pending_provider', 'cancelled_by_client', 'client'],
      ['accepted', 'cancelled_by_client', 'client'],
      ['en_route', 'cancelled_by_client', 'client'],
      ['accepted', 'cancelled_by_provider', 'provider'],
      ['en_route', 'cancelled_by_provider', 'provider'],
      ['accepted', 'cancelled_by_admin', 'admin'],
    ] as const)('%s → %s par %s', (from, to, actor) => {
      expect(machine.canTransition(from, to, actor)).toBe(true);
    });

    it('refuse une annulation une fois in_progress', () => {
      expect(
        machine.canTransition('in_progress', 'cancelled_by_client', 'client'),
      ).toBe(false);
      expect(
        machine.canTransition(
          'in_progress',
          'cancelled_by_provider',
          'provider',
        ),
      ).toBe(false);
      expect(
        machine.canTransition('in_progress', 'cancelled_by_admin', 'admin'),
      ).toBe(false);
    });

    it('refuse cancelled_by_provider avant acceptation', () => {
      expect(
        machine.canTransition(
          'pending_provider',
          'cancelled_by_provider',
          'provider',
        ),
      ).toBe(false);
    });
  });

  describe('branches matching / timeout', () => {
    it('passe pending_provider → unassigned (RG-MATCH-05, système)', () => {
      expect(
        machine.canTransition('pending_provider', 'unassigned', 'system'),
      ).toBe(true);
    });

    it('passe payment_authorized → unassigned si aucun pro (RG-MATCH-05)', () => {
      expect(
        machine.canTransition('payment_authorized', 'unassigned', 'system'),
      ).toBe(true);
    });

    it('permet expired depuis draft / payment_authorized / pending_provider', () => {
      expect(machine.canTransition('draft', 'expired', 'system')).toBe(true);
      expect(
        machine.canTransition('payment_authorized', 'expired', 'system'),
      ).toBe(true);
      expect(
        machine.canTransition('pending_provider', 'expired', 'system'),
      ).toBe(true);
    });
  });

  describe('RG-BOOK-02 en_route seulement après accepted', () => {
    it('refuse en_route depuis pending_provider', () => {
      expect(
        machine.canTransition('pending_provider', 'en_route', 'provider'),
      ).toBe(false);
    });

    it('refuse en_route depuis draft', () => {
      expect(machine.canTransition('draft', 'en_route', 'provider')).toBe(
        false,
      );
    });
  });

  describe('RG-BOOK-01 pas de saut hors graphe', () => {
    it('refuse draft → completed même pour admin', () => {
      expect(machine.canTransition('draft', 'completed', 'admin')).toBe(false);
    });

    it('refuse accepted → completed (saut in_progress)', () => {
      expect(machine.canTransition('accepted', 'completed', 'provider')).toBe(
        false,
      );
    });

    it('refuse un acteur hors rôle (client qui accepte)', () => {
      expect(
        machine.canTransition('pending_provider', 'accepted', 'client'),
      ).toBe(false);
    });
  });

  describe('litige completed → disputed', () => {
    const completedAt = new Date('2026-09-13T10:00:00.000Z');

    it('autorise le client dans la fenêtre de 48 h', () => {
      expect(
        machine.canTransition('completed', 'disputed', 'client', {
          completedAt,
          now: new Date('2026-09-15T09:59:59.000Z'),
        }),
      ).toBe(true);
    });

    it('autorise encore à exactement 48 h', () => {
      expect(
        machine.canTransition('completed', 'disputed', 'client', {
          completedAt,
          now: new Date('2026-09-15T10:00:00.000Z'),
        }),
      ).toBe(true);
    });

    it('refuse le client après 48 h', () => {
      expect(
        machine.canTransition('completed', 'disputed', 'client', {
          completedAt,
          now: new Date('2026-09-15T10:00:01.000Z'),
        }),
      ).toBe(false);
    });

    it('autorise admin après 48 h (override)', () => {
      expect(
        machine.canTransition('completed', 'disputed', 'admin', {
          completedAt,
          now: new Date('2026-09-20T10:00:00.000Z'),
        }),
      ).toBe(true);
    });

    it('autorise le client si completedAt est absent', () => {
      expect(machine.canTransition('completed', 'disputed', 'client')).toBe(
        true,
      );
    });
  });

  describe('matrice exhaustive 13 × 13 × 4', () => {
    it('accepte uniquement les transitions listées (RG-BOOK-01)', () => {
      let checked = 0;

      for (const from of STATUSES) {
        for (const to of STATUSES) {
          for (const actor of ACTORS) {
            checked += 1;
            expect(machine.canTransition(from, to, actor)).toBe(
              ALLOWED.has(`${from}|${to}|${actor}`),
            );
          }
        }
      }

      expect(checked).toBe(13 * 13 * 4);
      expect(ALLOWED.size).toBe(EXPECTED_TRANSITIONS.length);
    });
  });

  describe('assertCanTransition', () => {
    it('ne lève rien sur une transition valide', () => {
      expect(() =>
        machine.assertCanTransition('accepted', 'en_route', 'provider'),
      ).not.toThrow();
    });

    it('lève BOOKING_INVALID_TRANSITION (409)', () => {
      try {
        machine.assertCanTransition('draft', 'completed', 'admin');
        throw new Error('expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).getStatus()).toBe(409);
        expect((error as ConflictException).getResponse()).toMatchObject({
          code: 'BOOKING_INVALID_TRANSITION',
          details: { from: 'draft', to: 'completed', actor: 'admin' },
        });
      }
    });

    it('lève BOOKING_DISPUTE_WINDOW_EXPIRED (409)', () => {
      try {
        machine.assertCanTransition('completed', 'disputed', 'client', {
          completedAt: new Date('2026-09-01T10:00:00.000Z'),
          now: new Date('2026-09-10T10:00:00.000Z'),
        });
        throw new Error('expected ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect((error as ConflictException).getResponse()).toMatchObject({
          code: 'BOOKING_DISPUTE_WINDOW_EXPIRED',
        });
      }
    });
  });

  describe('allowedTargets / isTerminal', () => {
    it('liste les cibles pro depuis accepted', () => {
      expect(machine.allowedTargets('accepted', 'provider')).toEqual([
        'en_route',
        'cancelled_by_provider',
      ]);
    });

    it('ne propose rien depuis un terminal', () => {
      expect(machine.allowedTargets('expired', 'system')).toEqual([]);
      expect(machine.allowedTargets('unassigned', 'client')).toEqual([]);
      expect(machine.allowedTargets('disputed', 'admin')).toEqual([]);
    });

    it('marque les statuts finaux', () => {
      expect(machine.isTerminal('completed')).toBe(false);
      expect(machine.isTerminal('cancelled_by_client')).toBe(true);
      expect(machine.isTerminal('expired')).toBe(true);
      expect(machine.isTerminal('unassigned')).toBe(true);
      expect(machine.isTerminal('disputed')).toBe(true);
    });
  });

  describe('buildHistoryEntry (T03)', () => {
    it('construit une ligne history après validation', () => {
      expect(
        machine.buildHistoryEntry('accepted', 'en_route', 'provider', {
          actorId: '11111111-1111-4111-8111-111111111111',
          reason: 'Pro en route',
        }),
      ).toEqual({
        fromStatus: 'accepted',
        toStatus: 'en_route',
        actorType: 'provider',
        actorId: '11111111-1111-4111-8111-111111111111',
        reason: 'Pro en route',
      });
    });

    it('autorise fromStatus null (création initiale)', () => {
      expect(
        machine.buildHistoryEntry(null, 'draft', 'system'),
      ).toEqual({
        fromStatus: null,
        toStatus: 'draft',
        actorType: 'system',
        actorId: undefined,
        reason: undefined,
      });
    });

    it('refuse une transition invalide avant de construire', () => {
      expect(() =>
        machine.buildHistoryEntry('draft', 'completed', 'system'),
      ).toThrow(ConflictException);
    });
  });
});
