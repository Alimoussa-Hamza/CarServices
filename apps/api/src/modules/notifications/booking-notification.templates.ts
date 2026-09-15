export type BookingNotificationVars = {
  reference: string;
  slotLabel?: string;
  addressLabel?: string;
};

export type BookingNotificationTemplateId =
  | 'booking_confirmed'
  | 'provider_assigned'
  | 'booking_completed'
  | 'provider_new_mission';

export type BookingNotificationChannel = 'email' | 'sms';

type TemplateDefinition = {
  channels: readonly BookingNotificationChannel[];
  email?: {
    subject: (vars: BookingNotificationVars) => string;
    html: (vars: BookingNotificationVars) => string;
    text: (vars: BookingNotificationVars) => string;
  };
  sms?: (vars: BookingNotificationVars) => string;
};

export const BOOKING_NOTIFICATION_TEMPLATES: Record<
  BookingNotificationTemplateId,
  TemplateDefinition
> = {
  booking_confirmed: {
    channels: ['email'],
    email: {
      subject: (vars) => `Réservation confirmée ${vars.reference}`,
      html: (vars) =>
        `<p>Votre réservation <strong>${vars.reference}</strong> est confirmée.</p>` +
        (vars.slotLabel ? `<p>Créneau : ${vars.slotLabel}</p>` : ''),
      text: (vars) =>
        `Votre réservation ${vars.reference} est confirmée.` +
        (vars.slotLabel ? ` Créneau : ${vars.slotLabel}.` : ''),
    },
  },
  provider_assigned: {
    channels: ['email', 'sms'],
    email: {
      subject: (vars) => `Prestataire trouvé — ${vars.reference}`,
      html: (vars) =>
        `<p>Un prestataire a accepté votre mission <strong>${vars.reference}</strong>.</p>`,
      text: (vars) =>
        `Un prestataire a accepté votre mission ${vars.reference}.`,
    },
    sms: (vars) =>
      `CARSERVICE — un pro a accepté ${vars.reference}. Suivez la mission dans l’app.`,
  },
  booking_completed: {
    channels: ['email'],
    email: {
      subject: (vars) => `Mission terminée ${vars.reference}`,
      html: (vars) =>
        `<p>Votre mission <strong>${vars.reference}</strong> est terminée. Merci d’avoir choisi CARSERVICE.</p>`,
      text: (vars) =>
        `Votre mission ${vars.reference} est terminée. Merci d’avoir choisi CARSERVICE.`,
    },
  },
  provider_new_mission: {
    channels: ['sms'],
    sms: (vars) =>
      `CARSERVICE — nouvelle mission ${vars.reference}` +
      (vars.slotLabel ? ` (${vars.slotLabel})` : '') +
      '. Ouvrez l’app pour répondre.',
  },
};

export function renderBookingEmail(
  templateId: BookingNotificationTemplateId,
  vars: BookingNotificationVars,
) {
  const template = BOOKING_NOTIFICATION_TEMPLATES[templateId].email;
  if (!template) {
    return null;
  }
  return {
    subject: template.subject(vars),
    html: template.html(vars),
    text: template.text(vars),
  };
}

export function renderBookingSms(
  templateId: BookingNotificationTemplateId,
  vars: BookingNotificationVars,
) {
  const template = BOOKING_NOTIFICATION_TEMPLATES[templateId].sms;
  if (!template) {
    return null;
  }
  return template(vars);
}
