# Guide Sécurité & Conformité — CARSERVICE

> **Phase :** pré-développement · RGPD, sécurité app, légal marketplace France

**Disclaimer :** ce document est un guide technique. Validation avocat / DPO requise avant production.

---

## 1. Données personnelles traitées

| Donnée | Finalité | Base légale | Rétention |
|--------|----------|-------------|-----------|
| Téléphone | Auth OTP | Contrat | Durée compte + 3 ans |
| Nom, prénom | Profil | Contrat | Idem |
| Adresse intervention | Booking | Contrat | 24 mois post booking |
| Géoloc | Matching, maps | Consentement | Session / booking |
| Photos véhicule | Qualité, litige | Contrat | 24 mois (RG-QUAL-01) |
| SIRET, IBAN pro | KYC, paiement | Contrat + obligation légale | Durée relation + comptable |
| RC Pro document | KYC | Intérêt légitime | Durée relation |
| IP, logs | Sécurité | Intérêt légitime | 12 mois |
| Avis | Marketplace | Contrat | Durée publication |

---

## 2. RGPD — obligations plateforme

| Obligation | Action |
|------------|--------|
| Information | Politique confidentialité claire in-app |
| Consentement | Géoloc, CGU, marketing opt-in séparé |
| Droit accès | Export JSON compte (API + admin) |
| Droit effacement | Anonymisation user, conservation bookings légaux |
| DPA | Avec Stripe, hébergeur, SMS, email |
| Registre traitements | Document interne |
| Violation données | Procédure notification CNIL 72h |
| Sous-traitants UE | Prioriser hébergement EU |

---

## 3. Documents légaux requis (MVP)

| Document | Statut | Responsable |
|----------|--------|-------------|
| CGU clients | 🔴 Brouillon avocat | Juridique |
| CGU pros / contrat plateforme | 🔴 | Juridique |
| Politique confidentialité | 🔴 | Juridique |
| Mentions légales | 🔴 | Juridique |
| Charte pros (lavage éco) | 🟡 | Ops + juridique |
| Politique cookies (admin web) | 🟡 | Juridique |

---

## 4. Sécurité application

### Auth
- OTP 6 chiffres, hash bcrypt/argon2 en DB
- JWT RS256 ou HS256 secret fort (> 256 bit)
- Refresh token rotation + revoke list Redis
- Rate limit : 5 OTP / 10 min / IP+phone

### API
- HTTPS TLS 1.2+ obligatoire
- Helmet headers (Nest)
- CORS whitelist strict
- Validation input Zod all endpoints
- SQL injection : Prisma parameterized
- IDOR : vérifier ownership booking (clientId/providerId)

### Paiements
- PCI DSS : Stripe Elements/PaymentSheet — **no PAN touch**
- Webhook signature Stripe obligatoire
- Idempotency keys POST booking

### Fichiers
- Buckets privés
- Presigned URLs TTL 15 min
- Scan antivirus phase 2 (ClamAV)

### Secrets
- Vault : Doppler / GitHub Secrets / Railway env
- Rotation JWT annuelle
- Stripe keys séparées test/live

---

## 5. Rôles & permissions (RBAC)

| Rôle | Accès |
|------|-------|
| `client` | Ses bookings, adresses, avis |
| `provider` | Missions assignées/disponibles, son KYC |
| `admin` | Tout admin API |

Guards Nest sur chaque route — tests IDOR obligatoires.

---

## 6. Marketplace France — points juridiques

| Sujet | Note |
|-------|------|
| Statut plateforme | Intermédiaire mise en relation — éviter requalification emploi |
| Pros | Indépendants (micro/SASU), pas salariés plateforme |
| Facturation | Pro facture client ou plateforme encaisse (modèle à trancher avocat) |
| TVA | Prestation lavage — consult comptable |
| Assurance RC Pro | Obligatoire pros (RG-KYC) |
| Lavage éco | Conformité rejet eaux — charte sans eau/vapeur |

---

## 7. App Store compliance

| Store | Exigence |
|-------|----------|
| Apple | Privacy nutrition labels, compte démo review, IAP N/A (Stripe externe OK services réels) |
| Google | Data safety form, permissions justifiées (camera, location) |

Permissions mobile : demander **in context** (caméra au moment photos, notif au KYC pro).

---

## 8. Incident response

1. Détect (Sentry / alert)
2. Contain (revoke tokens, disable endpoint)
3. Assess (PII impact?)
4. Notify (CNIL 72h if breach PII)
5. Fix + postmortem

Contact sécurité : `security@carservice.fr` (à créer)

---

## 9. Checklist sécurité pré-prod

- [ ] Pen test léger ou OWASP ZAP scan API
- [ ] Review IDOR endpoints booking/media
- [ ] Secrets pas dans repo (git-secrets scan)
- [ ] HTTPS enforced staging + prod
- [ ] Politique confidentialité publiée
- [ ] DPA Stripe signé
- [ ] Procédure effacement compte testée

---

→ [Règles gestion RG-SEC](../regles-de-gestion.md#11-rgpd--sécurité--rg-sec) · [Infra](guide-infra-devops.md)
