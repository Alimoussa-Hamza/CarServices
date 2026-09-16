const BOOKING_STATUS_FR: Record<string, string> = {
  draft: 'Brouillon',
  payment_authorized: 'Paiement confirmé',
  pending_provider: "Recherche d'un professionnel…",
  accepted: 'Pro confirmé',
  en_route: 'En route',
  arrived: 'Arrivé',
  in_progress: 'Lavage en cours',
  completed: 'Terminé',
  cancelled_by_client: 'Annulé',
  cancelled_by_provider: 'Annulé',
  cancelled_by_admin: 'Annulé',
  expired: 'Expiré',
  unassigned: 'Non assigné',
  disputed: 'Litige',
};

export function formatBookingStatus(status: string): string {
  return BOOKING_STATUS_FR[status] ?? status;
}
