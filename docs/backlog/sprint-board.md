# Board Sprints — CARSERVICE (vue Jira)

> Vue Kanban par sprint · détail : [backlog-jira.md](../backlog-jira.md)

---

## S0 — Fondations (Semaine 1–2)

| To Do | In Progress | Done |
|-------|-------------|------|
| CS-M00-S01 Monorepo | | |
| CS-M00-S02 Docker | | |
| CS-M00-S03 CI | | |
| CS-M00-S04 Staging | | |
| CS-M00-S06 .env.example | | |

**Goal :** `pnpm dev` fonctionne · CI green · staging API up

---

## S1 — Packages & DB auth (Semaine 3–4)

| Stories |
|---------|
| CS-M01-S01 shared-types |
| CS-M01-S02 api-client |
| CS-M01-S03 ui-tokens |
| CS-M02-S01 Prisma users |
| CS-M00-S05 Sentry |

**Goal :** packages publiés workspace · schema users migré

---

## S2 — Auth OTP + Catalog schema (Semaine 5–6)

| Stories |
|---------|
| CS-M02-S02 OTP send |
| CS-M02-S03 OTP verify JWT |
| CS-M02-S04 refresh logout |
| CS-M02-S05 guards |
| CS-M03-S01 catalog schema |
| CS-M03-S02 zones PostGIS |

**Goal :** login OTP Postman OK · catalog tables exist

---

## S3 — Catalog API + KYC start (Semaine 7–8)

| Stories |
|---------|
| CS-M03-S03 à S07 catalog+zones+seed |
| CS-M04-S01 profil pro |

**Goal :** GET offers Lyon · quote prix · zone check · seed data

---

## S4 — KYC + Bookings schema (Semaine 9–10)

| Stories |
|---------|
| CS-M04-S02 à S08 KYC complet |
| CS-M05-S01 bookings schema |

**Goal :** pro submit KYC · admin approve API

---

## S5 — Bookings core + Stripe (Semaine 11–12)

| Stories |
|---------|
| CS-M05-S02 state machine |
| CS-M05-S03 create booking |
| CS-M05-S04 matching |
| CS-M05-S05 accept decline |
| CS-M05-S10 slots |
| CS-M06-S01 à S03 payments |

**Goal :** booking end-to-end API sans mobile

---

## S6 — Lifecycle + Media + Mobile start (Semaine 13–14)

| Stories |
|---------|
| CS-M05-S06 à S08 lifecycle cancel |
| CS-M06-S04 webhooks |
| CS-M07 media |
| CS-M11-S01 S02 mobile client setup auth |

**Goal :** pro complete booking API · photos upload · mobile login

---

## S7 — Notif + Admin API + Mobile home (Semaine 15–16)

| Stories |
|---------|
| CS-M08 reviews disputes |
| CS-M09 notifications |
| CS-M10 admin API |
| CS-M11-S03 home |
| CS-M12-S01 S02 pro setup |

---

## S8 — Mobile booking + Admin web (Semaine 17–18)

| Stories |
|---------|
| CS-M11-S04 à S07 booking flow suivi |
| CS-M12-S03 KYC wizard |
| CS-M13-S01 admin setup |

---

## S9 — Pro missions + Admin CRUD (Semaine 19–20)

| Stories |
|---------|
| CS-M12-S04 à S06 missions |
| CS-M13-S02 à S04 dashboard KYC catalog |

---

## S10 — Pro execute + Admin zones (Semaine 21–22)

| Stories |
|---------|
| CS-M12-S07 à S11 execute push |
| CS-M13-S05 à S08 zones settings |
| CS-M14-S01 API collection |

---

## S11 — QA staging (Semaine 23–24)

| Stories |
|---------|
| CS-M14-S02 E2E tests |
| CS-M14-S03 EAS builds |
| CS-M14-S04 prod deploy |

---

## S12 — Launch (Semaine 25–26)

| Stories |
|---------|
| CS-M14-S05 store submission |
| CS-M14-S06 runbook |

**Goal :** 🚀 Soft launch Lyon

---

## Colonnes Jira recommandées

```
Backlog → Ready → In Progress → In Review → QA Staging → Done
```

## Labels Jira

`M00`…`M14` · `backend` · `mobile-client` · `mobile-pro` · `admin` · `infra` · `shared` · `P0` · `P1`
