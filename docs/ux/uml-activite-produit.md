# UML — diagrammes d’activité (produit CarWash)

> **Sujet :** l’application telle que le **cahier des charges** la décrit (`C00–C14` / `P00–P09` / `A01–A09`), pas le repo d’aujourd’hui.  
> **Notation :** UML Activity — début, actions, décisions, couloirs (swimlanes), fin.  
> **Couleur :** **FAIT** (bleu) = déjà livré dans une app utilisable · **A FAIRE** (orange) = pas encore dans l’app.  
> PlantUML : [`uml-activite-produit.puml`](uml-activite-produit.puml).  
> **Catalogue de toutes les actions** (clic, toggle, notif, permission) : [`uml-activite-actions.md`](uml-activite-actions.md).

Hors MVP (phase 2+, **non dessinés**) : chat, devis, flottes, multi-pays, lavage à l’eau.

---

## Inventaire écrans — FAIT / A FAIRE

| ID | Écran (cahier) | Acteur | Produit |
|----|----------------|--------|---------|
| C00 | Splash | Claire | **FAIT** |
| C01 | Auth OTP + CGU | Claire | **FAIT** (SMS Twilio FR = A FAIRE) |
| C02 | Onboarding prénom / véhicule / adresse | Claire | **A FAIRE** |
| C03 | Home + CTA Réserver | Claire | **FAIT** |
| C04 | Catalogue formules | Claire | **FAIT** |
| C05 | Config véhicule / options / prix live | Claire | **FAIT** |
| C06 | Adresse Places + hors zone | Claire | **FAIT** |
| C07 | Créneau | Claire | **FAIT** |
| C08 | Récap / Payer pre-auth | Claire | **FAIT** |
| C09 | Confirmation Recherche pro | Claire | **FAIT** |
| C10 | Suivi timeline + annuler | Claire | **FAIT** (ouvrir litige in-app = A FAIRE) |
| C11 | Avis 72 h | Claire | **FAIT** |
| C12 | Mes réservations | Claire | **FAIT** |
| C13 | Profil / adresses | Claire | **FAIT** (suppression RGPD = A FAIRE) |
| C14 | Support / FAQ / litige 48 h | Claire | **A FAIRE** |
| P00 | Auth pro | Marc | **A FAIRE** |
| P01 | KYC wizard 7 steps | Marc | **A FAIRE** |
| P02 | Missions 3 onglets | Marc | **A FAIRE** |
| P03 | Détail quartier + Accepter | Marc | **A FAIRE** |
| P04 | Adresse / En route / Arrivé | Marc | **A FAIRE** |
| P05 | Photos 2+2 + checklist | Marc | **A FAIRE** |
| P06 | Clôture net | Marc | **A FAIRE** |
| P07 | Planning | Marc | **A FAIRE** |
| P08 | Gains | Marc | **A FAIRE** |
| P09 | Profil + notifs / son | Marc | **A FAIRE** |
| — | Stripe Connect in-app | Marc | **A FAIRE** |
| A01 | Login | Ops | **FAIT** (2FA = A FAIRE) |
| A02 | Dashboard KPIs | Ops | **FAIT** |
| A03 | File KYC | Ops | **FAIT** |
| A04 | Catalogue | Ops | **FAIT** |
| A05 | Zones + coeff | Ops | **FAIT** (éditeur polygone = A FAIRE) |
| A06 | Bookings + refund | Ops | **FAIT** (reassign / force cancel = A FAIRE) |
| A07 | Litiges | Ops | **FAIT** |
| A08 | Modérer avis | Ops | **A FAIRE** |
| A09 | Config plateforme | Ops | **FAIT** (flag `wash` UI = A FAIRE) |
| — | Matching T1/T2 + capture | Plateforme | **FAIT** (API ; Marc n’a pas d’UI) |

---

## 0. Golden path — 4 couloirs (UML)

Le lavage complet : Claire réserve → plateforme matche → Marc exécute → Ops tranche un litige s’il y en a.

```mermaid
flowchart TB
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  subgraph Claire
    c00[C00 Splash]
    c01[C01 Auth OTP]
    c02[C02 Onboarding skip]
    c03[C03 Home Réserver]
    wiz[C04–C07 Formule → Créneau]
    hors{En zone ?}
    lead[Hors zone + lead]
    c08[C08 Payer]
    payko[Paiement refusé]
    c09[C09 Recherche pro]
    una[Unassigned]
    c10[C10 Suivi]
    c11[C11 Avis]
    c14[C14 Litige]
  end

  subgraph Plateforme
    authz[Pre-auth Stripe]
    br[Broadcast top 8 T1 puis T2]
    lock[Lock exclusif]
    cap[Capture + commission]
  end

  subgraph Marc
    p02[P02 Carte quartier]
    p03{Accepter avant T2 ?}
    p04[P04 En route / Arrivé]
    p05[P05 Caméra 2+2]
  end

  subgraph Ops
    a07[A07 Trancher litige]
  end

  c00 --> c01 --> c02 --> c03 --> wiz --> hors
  hors -->|non| lead
  hors -->|oui| c08
  c08 --> authz
  authz -->|KO| payko
  authz -->|OK| br
  br --> p02 --> p03
  p03 -->|non / timeout| una
  p03 -->|oui| lock --> c10
  c10 --> p04 --> p05 --> cap --> c11 --> c14 --> a07

  c00:::fait
  c01:::fait
  c02:::todo
  c03:::fait
  wiz:::fait
  hors:::gate
  lead:::fait
  c08:::fait
  payko:::fait
  c09:::fait
  una:::fait
  c10:::fait
  c11:::fait
  c14:::todo
  authz:::fait
  br:::fait
  lock:::fait
  cap:::fait
  p02:::todo
  p03:::gate
  p04:::todo
  p05:::todo
  a07:::fait
```

---

## 1. Claire — activité UML

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  start(( )) --> splash[C00 Splash]
  splash --> sess{Session ?}
  sess -->|oui| home[C03 Home]
  sess -->|non| tel[C01 Téléphone / Envoyer le code]
  tel --> otpOk{OTP OK ?}
  otpOk -->|non| tel
  otpOk -->|oui| code[6 chiffres + CGU / Continuer]
  code --> codeOk{Code valide ?}
  codeOk -->|non| codeErr[Code incorrect.]
  codeErr --> code
  codeOk -->|oui| onboard[C02 Onboarding skippable]
  onboard --> home
  home --> flag{Flag wash ?}
  flag -->|off| soon[Bientôt disponible]
  flag -->|on| cta{Où clique-t-elle ?}
  cta -->|Réservations| c12[C12 Listes]
  cta -->|Profil| c13[C13 Profil]
  c13 --> c14[C14 Aide / litige]
  c13 --> rgpd[Supprimer le compte]
  cta -->|Réserver| cat[C04 Catalogue]
  cat --> cfg[C05 Config / Continuer]
  cfg --> adr[C06 Adresse / Continuer]
  adr --> zone{En zone ?}
  zone -->|non| hors[Hors zone + lead · pas Payer]
  hors --> adr
  zone -->|oui| crn[C07 Créneau / Continuer]
  crn --> pay[C08 Récap / Payer]
  pay --> card{Pre-auth ?}
  card -->|non| payErr[Paiement refusé]
  payErr --> pay
  card -->|oui| conf[C09 Recherche pro]
  conf --> wait{Accept avant T2 ?}
  wait -->|non| una[Unassigned / refund]
  wait -->|oui| suivi[C10 Pro confirmé → En cours]
  suivi --> go{Annuler avant en cours ?}
  go -->|oui| cancel[Annulé RG-CANCEL]
  go -->|non| fin[Terminé]
  fin --> avis{Avis < 72 h ?}
  avis -->|oui| c11[C11 Avis]
  avis -->|non| c12
  c11 --> c12
  suivi --> litige{Litige 48 h ?}
  litige -->|oui| c14

  splash:::fait
  sess:::gate
  tel:::fait
  otpOk:::gate
  code:::fait
  codeOk:::gate
  codeErr:::fait
  onboard:::todo
  home:::fait
  flag:::gate
  soon:::todo
  cta:::gate
  cat:::fait
  cfg:::fait
  adr:::fait
  zone:::gate
  hors:::fait
  crn:::fait
  pay:::fait
  card:::gate
  payErr:::fait
  conf:::fait
  wait:::gate
  una:::fait
  suivi:::fait
  go:::gate
  cancel:::fait
  fin:::fait
  avis:::gate
  c11:::fait
  c12:::fait
  c13:::fait
  c14:::todo
  rgpd:::todo
  litige:::gate
```

---

## 2. Marc — activité UML (graphe entier **A FAIRE**)

```mermaid
flowchart TD
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  start(( )) --> pauth[P00 Auth OTP]
  pauth --> pcode{Code OK ?}
  pcode -->|non| pauth
  pcode -->|oui| notif[Autoriser notifs]
  notif --> kyc[P01 KYC 7 steps]
  kyc --> kycOk{Dossier valide ?}
  kycOk -->|non| kyc
  kycOk -->|oui| pend[Pending 0 mission]
  pend --> adm{Ops a tranché ?}
  adm -->|refuse| rej[Motif / Corriger]
  rej --> kyc
  adm -->|approuve| conn[Activer virements Connect]
  conn --> ch{charges_enabled ?}
  ch -->|non| conn
  ch -->|oui| p02[P02 Nouvelles / À venir / En cours]
  p02 --> p07[P07 Planning]
  p02 --> p08[P08 Gains]
  p02 --> p09[P09 Profil + son]
  p02 --> tap{Tap carte ou notif ?}
  tap --> p03[P03 Quartier + net]
  p03 --> acc{Accepter ?}
  acc -->|Refuser| p02
  acc -->|Accepter| lock{Encore dispo ?}
  lock -->|non| taken[Déjà prise]
  taken --> p02
  lock -->|oui| p04[P04 Adresse Maps / En route / Arrivé]
  p04 --> p05[P05 Caméra 2+2]
  p05 --> term{Terminer ?}
  term -->|photos KO| p05
  term -->|OK| p06[P06 Clôture net]

  pauth:::todo
  pcode:::gate
  notif:::todo
  kyc:::todo
  kycOk:::gate
  pend:::todo
  adm:::gate
  rej:::todo
  conn:::todo
  ch:::gate
  p02:::todo
  tap:::gate
  p03:::todo
  acc:::gate
  lock:::gate
  taken:::todo
  p04:::todo
  p05:::todo
  term:::gate
  p06:::todo
  p07:::todo
  p08:::todo
  p09:::todo
```

*(Socle Expo existe : ce n’est pas un parcours. Tout Marc = A FAIRE.)*

---

## 3. Ops — activité UML

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  start(( )) --> login[A01 Login]
  login --> tfa[2FA]
  login --> ok{Auth OK ?}
  ok -->|non| login
  ok -->|oui| dash[A02 Dashboard]
  dash --> kyc[A03 File KYC]
  kyc --> kdec{Approuver ?}
  kdec -->|oui| kappr[Pro eligible]
  kdec -->|motif court| kyc
  kdec -->|Refuser + motif| krej[Pro corrige]
  dash --> cat[A04 Catalogue]
  dash --> zon[A05 Zones coeff]
  zon --> map[Éditeur polygone]
  dash --> book[A06 Bookings]
  book --> ref{Rembourser ?}
  ref -->|oui| refok[Annulé admin]
  book --> reas[Reassign]
  book --> fcan[Force cancel]
  dash --> dis[A07 Litiges]
  dis --> split{Split ?}
  split -->|sans notes| dis
  split -->|OK| disok[Tranché]
  dash --> rev[A08 Masquer avis / ban]
  dash --> cfg[A09 Config]
  cfg --> flag[Feature flag wash]

  login:::fait
  tfa:::todo
  ok:::gate
  dash:::fait
  kyc:::fait
  kdec:::gate
  kappr:::fait
  krej:::fait
  cat:::fait
  zon:::fait
  map:::todo
  book:::fait
  ref:::gate
  refok:::fait
  reas:::todo
  fcan:::todo
  dis:::fait
  split:::gate
  disok:::fait
  rev:::todo
  cfg:::fait
  flag:::todo
```

---

## 4. Plateforme — matching (invisible, **FAIT** API)

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  s(( )) --> pay[Pre-auth OK]
  pay --> br[Broadcast top 8]
  br --> t{Accept avant T1 30 min ?}
  t -->|oui| acc[Lock accepted]
  t -->|non| t1[Élargir rayon]
  t1 --> t2{Accept avant T2 ?}
  t2 -->|oui| acc
  t2 -->|non| un[unassigned]
  acc --> run[en_route → in_progress]
  run --> ph{2+2 photos ?}
  ph -->|non| run
  ph -->|oui| cap[completed · capture]

  pay:::fait
  br:::fait
  t:::gate
  acc:::fait
  t1:::fait
  t2:::gate
  un:::fait
  run:::fait
  ph:::gate
  cap:::fait
```

---

## 5. KYC — Marc × Ops

```mermaid
flowchart LR
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  p00[P00 Auth] --> p01[P01 Envoyer dossier]
  p01 --> sub[submitted · 0 mission]
  sub --> a03[A03 Viewer]
  a03 --> d{OK ?}
  d -->|Refuser| rej[Motif]
  rej --> p01
  d -->|Approuver| ok[approved]
  ok --> conn[Connect charges_enabled]
  conn --> match[Eligible matching]

  p00:::todo
  p01:::todo
  sub:::fait
  a03:::fait
  d:::gate
  rej:::fait
  ok:::fait
  conn:::todo
  match:::fait
```

---

## 6. Notifications — activité UML (RG-NOTIF)

Tap / permission / toggles. L’API envoie déjà (FAIT). L’app Marc + toggles fins = A FAIRE.

```mermaid
flowchart TB
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  permC[Claire : Activer notifications OS]
  permM[Marc : Autoriser / Plus tard]
  den[Permission refusée]
  set[Ouvrir les réglages]
  togC[C13 toggles Push / SMS / email]
  togM[P09b Nouvelles / Son / H-1 / Compte]

  permC --> osC{OS OK ?}
  osC -->|non| den --> set
  osC -->|oui| tokenC[Token Expo]
  permM --> osM{OS OK ?}
  osM -->|non| den
  osM -->|oui| tokenM[Token Expo]
  tokenC --> togC
  tokenM --> togM

  e1[Paiement OK] --> n1[Claire push + email]
  e2[Pro trouvé] --> n2[Claire push + SMS]
  e3[En route] --> n3[Claire push]
  e4[Terminé] --> n4[Claire push]
  e5[Annulation] --> n5[Claire + Marc push]
  e6[Nouvelle mission] --> n6[Marc push + SMS + 1 son]
  e7[Rappel H-1] --> n7[Marc push]
  e8[KYC ok/ko] --> n8[Marc push + email]
  e9[RC Pro J-30] --> n9[Marc push + email]
  e10[Unassigned] --> n10[Claire push]

  n1 --> tapC{Tap Claire ?}
  n2 --> tapC
  n3 --> tapC
  n4 --> tapC
  n10 --> tapC
  tapC --> C10[C09 / C10 / C11]

  n6 --> ctx{Où est Marc ?}
  ctx -->|app fermée| P03[P03 détail]
  ctx -->|onglet Missions| ban[Carte + bandeau 4 s]
  ctx -->|en mission P04/P05| sys[Notif système seule]
  n7 --> ctx
  togM -.->|Son off| mute[Pas de ping]
  togM -.->|Nouvelles off| skip[Pas de push mission]

  permC:::fait
  permM:::todo
  den:::todo
  set:::todo
  togC:::todo
  togM:::todo
  osC:::gate
  osM:::gate
  tokenC:::fait
  tokenM:::todo
  e1:::fait
  e2:::fait
  e3:::fait
  e4:::fait
  e5:::fait
  e6:::fait
  e7:::fait
  e8:::fait
  e9:::fait
  e10:::fait
  n1:::fait
  n2:::fait
  n3:::fait
  n4:::fait
  n5:::fait
  n6:::todo
  n7:::todo
  n8:::todo
  n9:::todo
  n10:::fait
  tapC:::gate
  C10:::fait
  ctx:::gate
  P03:::todo
  ban:::todo
  sys:::todo
  mute:::todo
  skip:::todo
```

---

## 7. Toggles / activer–désactiver — activité UML

```mermaid
flowchart TD
  classDef fait fill:#E8F3FA,stroke:#0B4F8A,color:#0F172A
  classDef todo fill:#FFF4E5,stroke:#E67E22,color:#0F172A
  classDef gate fill:#FFFFFF,stroke:#5B6472,color:#0F172A

  c05[C05 Config]
  c05 --> veh[Radio véhicule]
  c05 --> dirt[Radio saleté]
  c05 --> opt{Toggle option}
  opt -->|on| plus[Prix + duration_delta]
  opt -->|off| moins[Retire du snapshot]
  c05 --> com[Commentaire 300]
  c05 --> ph[Photos préalable 0–5]
  c08[C08] --> cgv{CGV cochées ?}
  cgv -->|non| noPay[Payer grisé]
  cgv -->|oui| pay[Payer]

  p01[P01 KYC]
  p01 --> meth{Sans eau / Vapeur}
  meth -->|0| kycBlock[Continuer grisé]
  meth -->|≥1| kycOk[Continuer KYC]
  p01 --> cap[Toggles formules capabilities]
  p05[P05] --> chk{Case checklist}
  chk --> photos{2+2 photos}
  photos -->|non| termOff[Terminer grisé]
  photos -->|oui| termOn[Terminer]
  p07[P07] --> pause[Pause ponctuelle on/off]
  p07 --> block[Bloquer créneau]
  p09[P09] --> formules[Formules actives on/off]
  p09 --> notif[4 toggles notifs]

  a04[A04] --> cat{Catégorie / offre / option}
  cat -->|Désactiver| hide[Invisible au book]
  cat -->|Activer| show[Visible C04]
  a05[A05] --> zon{Zone active ?}
  zon -->|off| noBook[Hors zone]
  a09[A09] --> flag{Flag wash}
  flag -->|off| soon[Home sans CTA]

  c05:::fait
  veh:::fait
  dirt:::fait
  opt:::gate
  plus:::fait
  moins:::fait
  com:::todo
  ph:::todo
  c08:::fait
  cgv:::gate
  noPay:::todo
  pay:::fait
  p01:::todo
  meth:::gate
  kycBlock:::todo
  kycOk:::todo
  cap:::todo
  p05:::todo
  chk:::gate
  photos:::gate
  termOff:::todo
  termOn:::todo
  p07:::todo
  pause:::todo
  block:::todo
  p09:::todo
  formules:::todo
  notif:::todo
  a04:::fait
  cat:::gate
  hide:::fait
  show:::fait
  a05:::fait
  zon:::gate
  noBook:::fait
  a09:::fait
  flag:::gate
  soon:::todo
```

Catalogue de **toutes** les actions (clic, toggle, notif, permission) : [uml-activite-actions.md](uml-activite-actions.md). Clics condensés : [diagramme-activite.md](diagramme-activite.md). Canvas : à côté du chat.
