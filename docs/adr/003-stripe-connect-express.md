# ADR-003 — Stripe Connect Express

## Statut
Accepté

## Contexte
Marketplace : encaissement client, commission plateforme, versement pro. Obligation conformité KYC paiement EU.

## Options considérées
1. **Stripe Connect Express**
2. **Mangopay**
3. **Wallet interne + virements manuels**

## Décision
**Stripe Connect Express** avec PaymentIntent manual capture (pre-auth à booking, capture à clôture).

## Conséquences
### Positives
- Standard industrie, SDK mobile mature
- Onboarding pro via Account Links
- Webhooks riches

### Négatives
- Fees Stripe (~1.5% + 0.25€)
- Dépendance fournisseur US (avec entité EU)

## Références
- [Guide intégrations](../guides/guide-integrations.md)
- [RG-PAY](../regles-de-gestion.md#6-paiement--rg-pay)
