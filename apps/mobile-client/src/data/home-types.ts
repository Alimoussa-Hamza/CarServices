export type HomeOffer = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
  description: string;
};

export type HomeBookingSummary = {
  id: string;
  reference: string;
  status: string;
  offerName: string;
  scheduledAt: string;
  totalCents: number;
};
