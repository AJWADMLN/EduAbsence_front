# Product Requirements Document (PRD)
## EduAbsence — Système de Gestion des Absences des Enseignants

---

**Version :** 1.1  
**Date :** 13 mars 2026  
**Statut :** En développement actif  
**Auteur :** Équipe EduAbsence

---

## Table des matières

1. [Vue d'ensemble du produit](#1-vue-densemble-du-produit)
2. [Contexte & Problématique](#2-contexte--problématique)
3. [Objectifs du produit](#3-objectifs-du-produit)
4. [Utilisateurs cibles (Personas)](#4-utilisateurs-cibles-personas)
5. [Architecture technique](#5-architecture-technique)
6. [Structure des données (Data Models)](#6-structure-des-données-data-models)
7. [Système d'authentification & Routes protégées](#7-système-dauthentification--routes-protégées)
8. [Fonctionnalités — Rôles Admin](#8-fonctionnalités--rôles-admin)
9. [Fonctionnalités — Rôle Directeur](#9-fonctionnalités--rôle-directeur)
10. [Composants UI partagés](#10-composants-ui-partagés)
11. [Règles métier](#11-règles-métier)
12. [Structure des fichiers du projet](#12-structure-des-fichiers-du-projet)
13. [Stack technique & Dépendances](#13-stack-technique--dépendances)
14. [Persistance des données](#14-persistance-des-données)
15. [Exigences non fonctionnelles](#15-exigences-non-fonctionnelles)
16. [Évolutions futures (Backlog)](#16-évolutions-futures-backlog)

---

## 1. Vue d'ensemble du produit

**EduAbsence** est une application web de gestion des absences des enseignants dans le secteur de l'éducation. Elle permet à deux types d'acteurs (L'administration centrale et les directeurs d'établissements) de suivre, déclarer et analyser les absences irrégulières du personnel enseignant.

L'application est entièrement en français, conçue pour un contexte scolaire, et couvre les trois cycles d'enseignement : **Primaire**, **Collège** et **Lycée**.

---

## 2. Contexte & Problématique

### Problème actuel
Les établissements scolaires gèrent les absences des enseignants de manière manuelle ou via des outils non adaptés (feuilles papier, tableurs). Cela entraîne :
- Un manque de traçabilité des absences irrégulières
- Une impossibilité d'analyser les tendances et statistiques par établissement ou cycle
- Un cloisonnement des données entre les directeurs et l'administration centrale

### Solution apportée
EduAbsence centralise la déclaration et le suivi des absences en temps réel, avec :
- Un accès différencié selon le rôle (Admin Principal, Consultant, Directeur d'établissement)
- Des statistiques visuelles interactives pour la prise de décision
- Un historique complet par enseignant, par établissement et par période
- Une fonction de validation/verrouillage des jours pour garantir l'intégrité des données

---

## 3. Objectifs du produit

| # | Objectif | Priorité |
|---|----------|----------|
| O1 | Permettre aux directeurs de déclarer rapidement une absence irrégulière et de verrouiller la journée | Critique |
| O2 | Offrir à l'administration centrale une vision globale de toutes les absences | Critique |
| O3 | Gérer les entités maîtres (établissements, directeurs, enseignants) via une interface paginée | Haute |
| O4 | Fournir des statistiques interactives avec filtres temporels | Haute |
| O5 | Protéger les données par rôle (isolation directeur ↔ établissement) | Critique |
| O6 | Expérience responsive (mobile + desktop) | Haute |

---

## 4. Utilisateurs cibles (Personas)

### 4.1 Administrateur Principal
- **Profil :** Gestionnaire central du système d'éducation
- **Accès :** Vision globale de tous les établissements, absences, et utilisateurs
- **Capacités :** CRUD complet, validation des nouveaux comptes admins/consultants, déverrouillage des jours validés, modification de ses propres informations

### 4.2 Consultant
- **Profil :** Observateur central ou cadre éducatif
- **Accès :** Vision globale de tous les établissements et absences
- **Capacités :** Accès en lecture seule (read-only). Ne peut pas ajouter, modifier ou supprimer des entités (Enseignants, Directeurs, Établissements, etc.)

### 4.3 Directeur d'établissement
- **Profil :** Responsable d'un établissement scolaire spécifique
- **Accès :** Limité strictement à son établissement (enseignants, absences, stats)
- **Capacités :** Déclarer et gérer les absences des enseignants, valider/verrouiller la journée courante
- **Champ clé :** `etablissement` — lie le directeur à un établissement spécifique

---

## 5. Architecture technique

### 5.1 Routing (React Router v7 — Data Mode)
```
/ → redirect vers /login

/login          — Page de connexion (unifiée, sans comptes de démo)
/signup         — Page d'inscription (crée un compte administrateur non-validé par défaut)

/admin                    — Dashboard Admin Principal / Consultant
/admin/enseignants        — Liste enseignants (Paginée: 6/page)
/admin/directeurs         — Liste directeurs (Paginée: 6/page)
/admin/etablissements     — Liste établissements (Paginée: 6/page)
/admin/statistiques       — Stats globales
/admin/validation         — Validation des comptes admins (Réservé Admin Principal)
/admin/profil             — Modification des infos personnelles (Réservé Admin Principal)

/directeur                         — Dashboard Directeur
/directeur/enseignants             — Mes enseignants
/directeur/declarer-absence        — Déclarer absence
/directeur/gestion-absences        — Gérer absences (inclut bouton valider le jour)
/directeur/statistiques            — Stats établissement
```

### 5.2 Gestion d'état (Context API)
- Un seul contexte global : `AppContext`
- Intégration API via `/lib/api`

### 5.3 Layout
- Sidebar fixe (desktop) + Overlay mobile avec hamburger
- Section "Valider les Administrateurs" dynamique si l'utilisateur est Admin Principal

---

## 6. Structure des données (Data Models)

### 6.1 `UserModel` & `AdminModel`
```typescript
interface User {
  id: string;               
  nom: string;              
  prenom: string;
  email: string;            
  password: string;         
  role: "admin_principal" | "consultant" | "directeur";
  validated?: boolean;      // Utilisé pour contrôler l'accès des nouveaux "consultants/admins"
  etablissement?: string;   // Obligatoire pour les directeurs
}
```

---

## 7. Système d'authentification & Routes protégées

### 7.1 Authentification Unifiée
- Login centralisé via **une route unique** (`/api/auth/login`), éliminant les erreurs 404 lors des tentatives.
- Plus de section "Comptes de démonstration" sur la page de connexion.
- Les comptes `consultant` ou candidats administrateurs nouvellement créés ont par défaut `validated: false` et ne peuvent pas se connecter tant que l'Admin Principal ne les a pas approuvés.
- Session JWT persistée et gérée dynamiquement.

---

## 8. Fonctionnalités — Rôles Admin (Principal & Consultant)

### 8.1 Dashboard (`/admin`)
- KPI Cards : Enseignants, Directeurs, Établissements, Absences ce mois.
- Liste "Absents aujourd'hui" et "Top 3 absents".
- Un **Consultant** navigue sur les mêmes pages mais avec des boutons d'actions masqués ou désactivés (aucune édition possible).

### 8.2 Gestion des Entités (Enseignants, Directeurs, Établissements)
- **Pagination** stricte : Chaque liste affiche **6 éléments par page**.
- **Admin Principal** : Peut Effectuer un CRUD complet.
- **Consultant** : Se limite à la consultation et à la recherche.

### 8.3 Validation des Administrateurs & Profil Personnel
- L'Admin Principal possède une rubrique pour **Valider les Administrateurs** (Approuver ou Refuser l'accès de rôle).
- L'Admin Principal dispose d'une zone **Profil Personnel** permettant de modifier ses propres informations.

### 8.4 Exports & PDF
- Les documents PDF générés par le système ont un footer épuré affichant **uniquement le numéro de la page**, pour un rendu net et professionnel.

---

## 9. Fonctionnalités — Rôle Directeur

### 9.1 Dashboard & Déclarations (`/directeur`)
- KPI de son établissement (Mes enseignants, Mes déclarations, Absents aujourd'hui).
- Isolation totale des données : le directeur ne voit QUE ce qui se passe chez lui.

### 9.2 Validation / Verrouillage du Jour Courant
- Le directeur peut cliquer sur un bouton **"Valider la journée"** depuis la page de gestion des absences.
- Le verrouillage de la journée gèle l'ensemble du CRUD d'absence pour la date d'aujourd'hui, empêchant toute modification intempestive.
- En cas d'erreur de la part du directeur, un **Admin Principal** doit intervenir depuis l'administration centrale pour annuler la validation (Restituer l'accès).

---

## 10. Composants UI partagés

- Modal de création/édition
- **Pagination.tsx** réutilisable configuré sur 6 (perPage)
- Badges stylisés (Matin/Soir, Sexe, etc.)

---

## 11. Règles métier

### R1 — Type d'absence
Toutes les absences enregistrées sont classées comme **irrégulières**.

### R2 — Validation de Journée
Si une journée est **validée** par le directeur :
- Les données de cette journée sont figées.
- Impossible de créer, modifier, ou supprimer les absences de ce jour.
- Seule l'administration centrale (Admin Principal) peut la déverrouiller.

### R3 — Anti-doublon & Plages
Un enseignant ne peut pas s'absenter deux fois sur la même demi-journée (Matin/Soir).

### R4 — Isolation Directeur vs Global (Pagination)
Les vues liste (Enseignants, Établissements, Directeurs) imposent **visuellement** une pagination fixée à 6 items par page. L'isolation côté backend assure qu'un directeur ne voit que les données rattachées à l'ID de son établissement.

### R5 — Rôles Consultants
Les requêtes en modification (`POST/PUT/DELETE`) envoyées par un **Consultant** sont rejetées (Lecture Seule).

---

## 12. Structure des fichiers du projet
(Conforme à React Vite TS + Tailwind v4 + Radix)

## 13. Stack technique & Dépendances
- React 18, React Router v7
- Vite, Tailwind CSS 4, Radix UI

## 14. Persistance des données
Backend Express.js avec MongoDB. (Le frontend communique directement avec l'API, remplaçant la persistance locale localStorage utilisée initialement).

---

## 15. Exigences non fonctionnelles
- Performances : Pagination côté client/serveur pour naviguer facilement.
- Sécurité : Vérification `validated` pour les rôles admin.

## 16. Évolutions futures (Backlog)
- Export complet de rapports en Excel.
- Notifications Push/Email en cas de validation de journée ou d'absence.
- Interface multi-langue (Arabe/Français).

---
*Document généré en mars 2026 — EduAbsence v1.1*
