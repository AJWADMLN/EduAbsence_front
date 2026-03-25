# Product Requirements Document (PRD) Global

## Projet : EduAbsence — Système de Gestion des Absences des Enseignants (Frontend & Backend)

**Version Globale :** 2.0.0  
**Date :** Mars 2026  
**Type:** API RESTful Node.js + Application Frontend React (Vite + TypeScript)  
**Base de données :** MongoDB Atlas (`EduAbsenceCluster`)  
**Statut:** En production

---

# Partie I : Documentation Frontend (Interface Utilisateur)

## 1. Vue d'ensemble du produit

**EduAbsence** est une application web de gestion des absences des enseignants dans le secteur de l'éducation marocain. Elle permet à deux familles d'acteurs — l'administration centrale et les directeurs d'établissements scolaires — de suivre, déclarer et analyser les absences irrégulières du personnel enseignant.

L'application est entièrement en français, couvre les trois cycles : **Primaire**, **Collège** et **Lycée**, et consomme `GestionAbsenceAPI` via JWT.

---

## 2. Contexte & Problématique

### Problème actuel
Les établissements gèrent les absences manuellement (papier, tableurs), ce qui entraîne un manque de traçabilité, une impossibilité d'analyser les tendances, et un cloisonnement des données.

### Solution apportée
EduAbsence centralise la déclaration et le suivi en temps réel via :
- Un accès différencié selon le rôle (Admin Principal, Consultant, Directeur)
- Des statistiques visuelles interactives
- Un historique complet par enseignant, établissement et période

---

## 3. Objectifs du produit

| #  | Objectif | Priorité |
|----|----------|----------|
| O1 | Permettre aux directeurs de déclarer rapidement une absence irrégulière | Critique |
| O2 | Offrir à l'administration centrale une vision globale des absences | Critique |
| O3 | Gérer les entités (établissements, directeurs, enseignants, consultants) via une interface paginée | Haute |
| O4 | Fournir des statistiques interactives avec filtres temporels | Haute |
| O5 | Protéger les données par rôle (isolation directeur ↔ établissement) | Critique |
| O6 | Expérience responsive (mobile + desktop) | Haute |

---

## 4. Utilisateurs cibles (Personas)

### 4.1 Administrateur Principal
- **Accès :** Vision globale. CRUD complet sur toutes les entités.
- **Exclusif :** Gestion des consultants, modification du propre profil.

### 4.2 Consultant
- **Accès :** Vision globale en **lecture seule**. Peut consulter mais pas créer/modifier/supprimer.

### 4.3 Directeur d'établissement
- **Accès :** Limité strictement à son établissement (`etaId` du JWT).
- **Capacités :** Déclarer et gérer les absences de ses enseignants.

---

## 5. Architecture technique

### 5.1 Routing (React Router v7 — Browser Router)

```
/ → redirect vers /login

/login          — Page de connexion (unifiée)
/signup         — Page d'inscription (crée un compte consultant non-validé)

/admin                          — Dashboard Admin Principal & Consultant
/admin/enseignants              — Gestion enseignants (Paginée : 6/page)
/admin/directeurs               — Gestion directeurs  (Paginée : 6/page)
/admin/etablissements           — Gestion établissements (Paginée : 6/page)
/admin/statistiques             — Stats globales (graphiques)
/admin/consultants              — Gestion consultants (Admin Principal uniquement)
/admin/informations-personnelles — Modifier son propre profil (Admin Principal uniquement)

/directeur                     — Dashboard Directeur
/directeur/enseignants         — Liste des enseignants de l'établissement
/directeur/declarer-absence    — Formulaire déclaration d'absence
/directeur/gestion-absences    — Gérer les absences déclarées
/directeur/statistiques        — Stats de l'établissement
```

### 5.2 Gestion d'état (Context API)
- Contexte global unique : `AppContext` (via `AppProvider`)
- Intégration API via `src/lib/api.ts`

### 5.3 Layout
- Sidebar fixe (desktop) + Overlay mobile avec bouton hamburger
- Section **"Gestion des consultants"** et **"Informations personnelles"** visibles uniquement pour l'Admin Principal

---

## 6. Modèles de données (côté frontend)

### 6.1 Admin / Consultant
```typescript
interface Admin {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: "consultant" | "admin principal";
  validate: boolean;
}
```

### 6.2 Directeur
```typescript
interface Directeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "directeur";
  etaId: number;
}
```

### 6.3 Etablissement
```typescript
interface Etablissement {
  id: number;
  nom: string;
  cycle: "Primaire" | "Collège" | "Lycée";
  adresse: string;
}
```

### 6.4 Enseignant
```typescript
interface Enseignant {
  ppr: number;
  nom: string;
  prenom: string;
  sexe: "Masculin" | "Féminin";
  etaId: number;
  cycle?: "Primaire" | "Collège" | "Lycée";
  matiere?: string;
  totalHeureAbsences: number;
}
```

### 6.5 Absence
```typescript
interface Absence {
  id: number;
  dateAbsence: string;         // format "YYYY-MM-DD"
  enseignantPpr: number;
  etaId: number;
  periode: number;             // 1 à 4 (heures)
  heureDebut?: string;         // ex. "09:00" ou "15:00"
  quart?: "matin" | "soir";
}
```

---

## 7. Système d'authentification & Routes protégées

### 7.1 Connexion Unifiée
- Un seul endpoint : `POST /api/auth/login`
- Réponse : `{ token, role }` → stocké dans `localStorage` / contexte.
- Rôles retournés : `"admin principal"` | `"consultant"` | `"directeur"`.

### 7.2 Inscription (Signup)
- Page `/signup` permettant de créer un compte **consultant** avec `validate: false`.
- Le compte reste inactif jusqu'à validation manuelle par l'Admin Principal.

### 7.3 ProtectedRoute
- Composant `ProtectedRoute` wrappant chaque route privée.
- Redirige vers `/login` si non authentifié.
- Redirige vers `/admin` ou `/directeur` si le rôle ne correspond pas.
- Les routes `admin/*` sont accessibles aux rôles `"consultant"` et `"admin principal"`.

---

## 8. Fonctionnalités — Rôles Admin (Principal & Consultant)

### 8.1 Dashboard (`/admin`)
- KPI Cards : Enseignants, Directeurs, Établissements, Absences (ce mois).
- Section **"Absents aujourd'hui"** et **"Top 3 enseignants les plus absents"**.
- Un **Consultant** voit les mêmes pages mais sans boutons d'action (création/modification/suppression masqués).

### 8.2 Gestion des Enseignants (`/admin/enseignants`)
- Tableau paginé (6 éléments/page).
- **Admin Principal** : CRUD complet (créer, modifier, supprimer).
- **Consultant** : lecture seule.
- Filtrage/recherche et affichage des statistiques par enseignant.

### 8.3 Gestion des Directeurs (`/admin/directeurs`)
- Tableau paginé (6 éléments/page).
- **Admin Principal** : CRUD complet (avec vue détaillée directeur + établissement + enseignants).
- **Consultant** : lecture seule.

### 8.4 Gestion des Établissements (`/admin/etablissements`)
- Tableau paginé (6 éléments/page).
- **Admin Principal** : CRUD complet.
- **Consultant** : lecture seule.

### 8.5 Gestion des Consultants (`/admin/consultants`) — Admin Principal uniquement
- Créer un compte consultant (actif immédiatement grâce à `validate: true`).
- Supprimer un compte consultant.
- Lister tous les consultants.

### 8.6 Statistiques (`/admin/statistiques`)
- Graphiques globaux avec filtres temporels.
- Données : absences par cycle, par sexe, par établissement, par mois.

### 8.7 Informations Personnelles (`/admin/informations-personnelles`) — Admin Principal uniquement
- Modifier : nom, prénom, email, mot de passe.
- La modification d'email ou de mot de passe requiert la saisie de l'ancien mot de passe.

### 8.8 Export PDF
- Documents PDF avec footer affichant uniquement le numéro de page.

---

## 9. Fonctionnalités — Rôle Directeur

### 9.1 Dashboard (`/directeur`)
- KPI de son établissement : Mes enseignants, Mes absences déclarées, Absents aujourd'hui.
- Isolation totale des données : le directeur ne voit que les données de son `etaId`.

### 9.2 Mes Enseignants (`/directeur/enseignants`)
- Liste des enseignants de l'établissement.
- Accès au profil et à l'historique des absences de chaque enseignant.

### 9.3 Déclarer une Absence (`/directeur/declarer-absence`)
- Formulaire de déclaration : date, enseignant (PPR), période (1–4h), quart (matin/soir), heure de début.
- Validation : l'enseignant doit appartenir à l'établissement du directeur.

### 9.4 Gestion des Absences (`/directeur/gestion-absences`)
- Liste de toutes les absences de l'établissement.
- CRUD : modifier ou supprimer une absence.
- Mise à jour automatique de `totalHeureAbsences` de l'enseignant.

### 9.5 Statistiques (`/directeur/statistiques`)
- Stats de l'établissement : absences par sexe, heures par enseignant, répartition matin/soir.
- Filtres de période (date de début / date de fin).

---

## 10. Composants UI partagés

- **Modal de création/édition** — utilisée dans tous les modules CRUD
- **Composant de Pagination** — configuré à 6 éléments par page, réutilisable
- **Badges stylisés** — quart (Matin/Soir), sexe (Masculin/Féminin), cycle
- **ProtectedRoute** — composant de garde de navigation

---

## 11. Règles Métier

| Règle | Description |
|-------|-------------|
| R1 — Isolation Directeur | Un directeur accède uniquement aux données de son `etaId`. Toute absence est créée avec l'`etaId` du JWT. |
| R2 — Lecture seule Consultant | Les actions POST/PUT/DELETE sont masquées ou refusées pour le rôle `"consultant"`. |
| R3 — Mise à jour `totalHeureAbsences` | Automatique lors de chaque opération CRUD sur les absences. |
| R4 — Période | Valeur entière entre 1 et 4 heures. |
| R5 — Pagination | Toutes les listes principales affichent 6 éléments par page. |
| R6 — Compte consultant | Créé par l'Admin Principal avec `validate: true`. Un signup via `/signup` crée un compte avec `validate: false` (inactif). |

---

## 12. Structure des fichiers du projet

```
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   ├── context/
│   │   └── AppContext.tsx
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── EnseignantsPage.tsx
│   │   │   ├── DirecteursPage.tsx
│   │   │   ├── EtablissementsPage.tsx
│   │   │   ├── ConsultantsPage.tsx
│   │   │   ├── AdminStats.tsx
│   │   │   ├── ValiderAdmins.tsx
│   │   │   └── InformationsPersonnelles.tsx
│   │   └── directeur/
│   │       ├── DirecteurDashboard.tsx
│   │       ├── DirecteurEnseignants.tsx
│   │       ├── DeclarerAbsence.tsx
│   │       ├── DirecteurAbsences.tsx
│   │       └── DirecteurStats.tsx
│   └── hooks/
│       └── (hooks personnalisés)
└── lib/
    └── api.ts        ← Toutes les fonctions d'appel API
```

---

## 13. Stack Technique & Dépendances

| Composant | Technologie |
|-----------|-------------|
| UI Framework | React 18 + TypeScript |
| Bundler | Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Composants | Radix UI |
| HTTP | `fetch` natif via `src/lib/api.ts` |
| Auth | JWT en localStorage / Context |

---

## 14. Persistance des données

Backend Express.js avec MongoDB Atlas. Le frontend communique exclusivement avec `GestionAbsenceAPI` via `src/lib/api.ts`. Aucune persistance locale (localStorage) utilisée sauf pour le token JWT.

---

## 15. Exigences non fonctionnelles

- **Performance :** Pagination 6/page pour éviter les lourdes requêtes.
- **Sécurité :** Vérification côté backend pour tous les rôles. Isolation stricte par `etaId`.
- **Responsive :** Sidebar hamburger sur mobile.

---

## 16. Évolutions Futures (Backlog)

- Fonctionnalité de verrouillage/déverrouillage de journée par le Directeur.
- Validation des comptes admins en attente (endpoint dédié).
- Export Excel des rapports.
- Notifications Push/Email.
- Interface multi-langue (Arabe/Français).

---
---

# Partie II : Documentation Backend (GestionAbsenceAPI)

## 1. Vue d'ensemble

GestionAbsenceAPI est une API REST Node.js/Express (ESM) qui centralise le suivi des absences des enseignants dans plusieurs établissements scolaires. Elle utilise MongoDB Atlas (cluster `EduAbsenceCluster`) et un contrôle d'accès par rôles via JWT.

---

## 2. Buts & Objectifs

- Fournir une API sécurisée pour enregistrer les absences par période.
- Permettre aux directeurs de déclarer/modifier/supprimer des absences limitées à leur établissement.
- Permettre à l'Admin Principal de gérer toutes les entités et les comptes consultants.
- Offrir aux Consultants un accès global en lecture seule.
- Maintenir automatiquement `totalHeureAbsences` par enseignant.

---

## 3. Rôles Utilisateurs

| Rôle                | Valeur en base       | Description |
|---------------------|----------------------|-------------|
| **Admin Principal** | `"admin principal"`  | Super-utilisateur. Gère consultants, directeurs, enseignants, établissements. Modifie son propre profil. |
| **Consultant**      | `"consultant"`       | Accès en lecture seule sur toutes les ressources. |
| **Directeur**       | `"directeur"`        | Limité à son établissement via `etaId` (JWT). |

---

## 4. Entités & Modèles de Données

### 4.1 Admin (`AdminModel` → collection `users`)

| Champ      | Type    | Contraintes |
|------------|---------|-------------|
| `nom`      | String  | Requis |
| `prenom`   | String  | Requis |
| `email`    | String  | Requis, Unique |
| `password` | String  | Requis, haché bcrypt |
| `role`     | String  | Enum : `"consultant"` \| `"admin principal"` |
| `validate` | Boolean | Par défaut `false`. L'Admin Principal a `true`. |

### 4.2 Directeur (`DirecteurModel` → collection `directeurs`)

| Champ      | Type   | Contraintes |
|------------|--------|-------------|
| `id`       | Number | Requis, Unique (auto-incrémenté si absent) |
| `nom`      | String | Requis |
| `prenom`   | String | Requis |
| `email`    | String | Requis, Unique |
| `password` | String | Requis, haché bcrypt |
| `role`     | String | Fixe : `"directeur"` |
| `etaId`    | Number | Requis |

### 4.3 Etablissement (`EtaModel` → collection `etas`)

| Champ     | Type   | Contraintes |
|-----------|--------|-------------|
| `id`      | Number | Requis, Unique |
| `nom`     | String | Requis, Unique |
| `cycle`   | String | Requis — Enum : `"Primaire"` \| `"Collège"` \| `"Lycée"` |
| `adresse` | String | Requis |

### 4.4 Enseignant (`EnseignModel` → collection `enseignants`)

| Champ                | Type   | Contraintes |
|----------------------|--------|-------------|
| `ppr`                | Number | Requis, Unique |
| `nom`                | String | Requis |
| `prenom`             | String | Requis |
| `sexe`               | String | Requis — Enum : `"Masculin"` \| `"Féminin"` |
| `etaId`              | Number | Requis |
| `cycle`              | String | Optionnel — Enum : `"Primaire"` \| `"Collège"` \| `"Lycée"` |
| `matiere`            | String | Optionnel |
| `totalHeureAbsences` | Number | Par défaut `0` — mis à jour automatiquement |

### 4.5 Absence (`AbsenceModel` → collection `absences`)

| Champ           | Type   | Contraintes |
|-----------------|--------|-------------|
| `id`            | Number | Requis, Unique (généré via `Date.now()` si absent) |
| `dateAbsence`   | Date   | Requis (sérialisée en `YYYY-MM-DD` en JSON) |
| `enseignantPpr` | Number | Requis |
| `etaId`         | Number | Requis |
| `periode`       | Number | Requis — 1 à 4 (heures) |
| `heureDebut`    | String | Par défaut `"09:00"`, `"15:00"` si soir |
| `quart`         | String | Optionnel — `"matin"` \| `"soir"` |

---

## 5. Authentification & Autorisation

| Mécanisme | Détail |
|-----------|--------|
| **Connexion Unifiée** | `POST /api/auth/login` — cherche dans `AdminModel` puis `DirecteurModel` |
| **JWT** | Signé `"secret"`, expire 1h. Payload : `{ id, role, nom, prenom, etaId? }` |
| **`validate`** | Le champ `validate: true` est requis pour la connexion d'un consultant |
| **`verifyToken`** | Vérifie le JWT dans `Authorization: Bearer <token>` |
| **`verifyRole`** | Vérifie `req.user.role` contre le(s) rôle(s) requis |
| **Isolation Directeur** | `etaId` du JWT filtre toutes les opérations |
| **Hachage** | `bcryptjs`, 10 salt rounds |

---

## 6. Référence des Endpoints de l'API

**Base URL :** `http://localhost:5000`  
**CORS :** `http://localhost:5173`, `http://127.0.0.1:5173`

### 6.1 Authentification

| Méthode | Endpoint          | Auth   | Réponse |
|---------|-------------------|--------|---------|
| POST    | `/api/auth/login` | Aucune | `{ token, role }` |

### 6.2 Routes Admin (`/api/admin`)

#### Consultants (Admin Principal uniquement)
| Méth. | Endpoint              | Description |
|-------|-----------------------|-------------|
| POST  | `/consultant`         | Créer un consultant |
| GET   | `/consultants`        | Lister les consultants |
| DELETE| `/consultant/:id`     | Supprimer un consultant |

#### Profil Admin Principal
| Méth. | Endpoint      | Description |
|-------|---------------|-------------|
| PUT   | `/principal`  | Modifier profil (requiert ancien mdp si email/mdp changé) |

#### Directeurs
| Méth.  | Endpoint                 | Accès          | Description |
|--------|--------------------------|----------------|-------------|
| POST   | `/directeur`             | admin principal | Créer |
| GET    | `/directeurs`            | consultant+    | Lister |
| GET    | `/directeur/:id`         | consultant+    | Un directeur |
| PUT    | `/directeur/:id`         | admin principal | Modifier |
| DELETE | `/directeur/:id`         | admin principal | Supprimer |
| GET    | `/directeur/:id/details` | consultant+    | Directeur + Etablissement + Enseignants |

#### Enseignants
| Méth.  | Endpoint                          | Accès          | Description |
|--------|-----------------------------------|----------------|-------------|
| GET    | `/enseignants`                    | consultant+    | Tous |
| GET    | `/enseignant/:ppr`                | consultant+    | Un enseignant |
| POST   | `/enseignant`                     | admin principal | Créer |
| PUT    | `/enseignant/:ppr`                | admin principal | Modifier |
| DELETE | `/enseignant/:ppr`                | admin principal | Supprimer |
| GET    | `/enseignants/byEtablissement/:etaId` | consultant+ | Par établissement |

#### Etablissements
| Méth.  | Endpoint                              | Accès          | Description |
|--------|---------------------------------------|----------------|-------------|
| GET    | `/etablissements`                     | consultant+    | Tous |
| GET    | `/etablissement/:id`                  | consultant+    | Un établissement |
| POST   | `/etablissement`                      | admin principal | Créer |
| PUT    | `/etablissement/:id`                  | admin principal | Modifier |
| DELETE | `/etablissement/:id`                  | admin principal | Supprimer |
| GET    | `/etablissementWithEnseignants/:etaId`| consultant+    | Etablissement + enseignants |

#### Absences & Statistiques Admin
| Méth. | Endpoint                              | Description |
|-------|---------------------------------------|-------------|
| GET   | `/absences`                           | Toutes les absences |
| GET   | `/statistiques`                       | Stats globales — `?start=&end=` |
| GET   | `/statistiques/top-absents`           | Top absents — `?limit=` |
| GET   | `/statistiques/absences-aujourd-hui`  | Absences du jour |
| GET   | `/statistiques/par-mois`              | Par mois — `?year=&etaId=&cycle=` |

### 6.3 Routes Directeur (`/api/directeur`)

| Méth.  | Endpoint                             | Description |
|--------|--------------------------------------|-------------|
| POST   | `/login`                             | Connexion directeur (legacy) |
| GET    | `/etablissement`                     | Son établissement |
| GET    | `/enseignants`                       | Ses enseignants |
| GET    | `/enseignants/:ppr`                  | Un enseignant |
| GET    | `/absences`                          | Absences de son établissement |
| POST   | `/absence`                           | Déclarer une absence |
| PUT    | `/absence/:id`                       | Modifier une absence |
| DELETE | `/absence/:id`                       | Supprimer une absence |
| GET    | `/enseignant/:ppr/absences`          | Historique d'un enseignant — `?start=&end=` |
| GET    | `/statistiques`                      | Stats établissement — `?start=&end=` |
| GET    | `/statistiques/par-periode`          | Matin/Soir — `?start=&end=` |
| GET    | `/statistiques/absences-aujourd-hui` | Absents du jour |

---

## 7. Règles Métier

1. **Isolation Directeur :** Absences filtrées et créées avec l'`etaId` du JWT. L'enseignant doit appartenir au même établissement.
2. **`totalHeureAbsences` :** Mis à jour automatiquement à chaque création, modification ou suppression d'absence.
3. **Période :** Valeur entière 1–4. Toute valeur hors plage → HTTP 400.
4. **Heure de début :** `"09:00"` par défaut, `"15:00"` si `quart === "soir"`.
5. **`heureFin` calculée :** `heureDebut + periode` (en minutes), retournée dans les réponses détaillées.
6. **Restriction Consultant :** `verifyRole` bloque l'accès aux routes POST/PUT/DELETE.
7. **Seed Admin Principal :** Effectué via `src/seedAdminPrincipal.mjs` avec le compte `mlnedu2005@gmail.com`.

---

## 8. Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime   | Node.js (ESM — `.mjs`) |
| Framework | Express.js |
| Base de données | MongoDB Atlas (Mongoose v9) — `EduAbsenceCluster` |
| Auth      | `jsonwebtoken` (1h), `bcryptjs` (10 rounds) |
| Config    | `dotenv` — variables `DB` et `PORT` |
| CORS      | `http://localhost:5173`, `http://127.0.0.1:5173` |

---

## 9. Évolutions Futures

- Endpoint `/api/auth/signup` pour l'auto-inscription de consultants (avec `validate: false`).
- Fonctionnalité de verrouillage/déverrouillage de journée (Directeur valide, Admin déverrouille).
- Validation des comptes consultants en attente depuis le backend.
- Export PDF/Excel des statistiques.
- Notifications email (seuils d'absence, validation de compte).
- Support multilingue (i18n).
