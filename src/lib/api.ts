import type { Enseignant, Absence, Etablissement } from "../app/context/AppContext";

const API_URL = "http://localhost:5000/api";

// ── Response interfaces matching backend shapes ────────────────────────────────

export interface AuthResponse {
  token: string;
  role: "consultant" | "admin principal" | "directeur";
}

export interface EtablissementDirecteurResponse {
  id: number;
  nom: string;
  cycle: string;
  adresse: string;
  stats: {
    totalEnseignants: number;
    totalHeuresIrregs: number;
  };
}

export interface AbsencesByEnseignantResponse {
  enseignant: { ppr: number; nom: string; prenom: string };
  totalHeures: number;
  absences: Array<{
    id: number;
    dateAbsence: string;
    periode: number;
    heureDebut: string;
    heureFin: string;
  }>;
}

export interface AdminStatsResponse {
  byCycle: Record<string, number>;
  bySexe:  Record<string, number>;
  byEta:   Record<string, number>;
}

export interface DirecteurStatsResponse {
  bySexe:             Record<string, number>;
  heuresParEnseignant: Record<string, number>;
}

export interface TopAbsentItem {
  rank: number;
  ppr: number;
  nom: string;
  prenom: string;
  sexe: string;
  etablissement: string | null;
  totalHeureAbsences: number;
}

export interface AbsencesAujourdhuiResponse {
  date: string;
  total: number;
  absents: Array<{
    ppr: number;
    nom: string;
    prenom: string;
    sexe: string;
    etablissement?: string | null;
    periode: number;
    heureDebut?: string;
    heureFin?: string;
  }>;
}

export interface AbsencesAujourdhuiDirecteurResponse extends AbsencesAujourdhuiResponse {
  etablissement: string | null;
}

export interface ParPeriodeResponse {
  etaId: number;
  etablissement: string | null;
  periode: {
    matin: { totalAbsences: number; totalHeures: number };
    soir:  { totalAbsences: number; totalHeures: number };
  };
}

export interface ParMoisItem {
  mois: string;
  totalAbsences: number;
  totalHeures: number;
}

export interface ParMoisResponse {
  year: number;
  data: ParMoisItem[];
}

// ── API Service ────────────────────────────────────────────────────────────────

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }

  getToken(): string | null {
    if (!this.token) this.token = localStorage.getItem("token");
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }

    // DELETE endpoints return 200 with { message } — return as-is
    const text = await response.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
  }

  // ============ AUTH ============

  /** Unified login — returns { token, role } */
  async loginUnified(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  /** Admin login — returns { token, role } */
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  /** Admin signup — returns { message } */
  // ============ CONSULTANT MANAGEMENT ============
  async getConsultants(): Promise<any[]> {
    return this.request<any[]>("/admin/consultants");
  }

  async deleteConsultant(id: string): Promise<void> {
    await this.request<void>(`/admin/consultant/${id}`, { method: "DELETE" });
  }

  async createConsultant(nom: string, prenom: string, email: string, password: string): Promise<void> {
    await this.request<any>("/admin/consultant", {
      method: "POST",
      body: JSON.stringify({ nom, prenom, email, password }),
    });
  }

  async updateAdminPrincipal(data: { nom?: string, prenom?: string, email?: string, oldPassword?: string, newPassword?: string }): Promise<void> {
    await this.request<void>("/admin/principal", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /** Directeur login — returns { token, role } with etaId in JWT */
  async loginDirecteur(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>("/directeur/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem("currentUser");
  }

  // ============ ADMIN: DIRECTEURS ============

  async getDirecteurs(): Promise<any[]> {
    return this.request<any[]>("/admin/directeurs");
  }

  async getDirecteurById(id: string): Promise<any> {
    return this.request<any>(`/admin/directeur/${id}`);
  }

  async createDirecteur(user: any): Promise<any> {
    return this.request<any>("/admin/directeur", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  async updateDirecteur(id: string, user: any): Promise<any> {
    return this.request<any>(`/admin/directeur/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  }

  async deleteDirecteur(id: string): Promise<void> {
    await this.request<void>(`/admin/directeur/${id}`, { method: "DELETE" });
  }

  // ============ ADMIN: ENSEIGNANTS ============

  async getEnseignants(): Promise<Enseignant[]> {
    return this.request<Enseignant[]>("/admin/enseignants");
  }

  async getEnseignantByPpr(ppr: number): Promise<Enseignant> {
    return this.request<Enseignant>(`/admin/enseignant/${ppr}`);
  }

  async createEnseignant(enseignant: Omit<Enseignant, "totalHeureAbsences">): Promise<Enseignant> {
    return this.request<Enseignant>("/admin/enseignant", {
      method: "POST",
      body: JSON.stringify(enseignant),
    });
  }

  async updateEnseignant(ppr: number, enseignant: Partial<Enseignant>): Promise<Enseignant> {
    return this.request<Enseignant>(`/admin/enseignant/${ppr}`, {
      method: "PUT",
      body: JSON.stringify(enseignant),
    });
  }

  async deleteEnseignant(ppr: number): Promise<void> {
    await this.request<void>(`/admin/enseignant/${ppr}`, { method: "DELETE" });
  }

  async getEnseignantsByEtablissement(etaId: number): Promise<Enseignant[]> {
    return this.request<Enseignant[]>(`/admin/enseignants/byEtablissement/${etaId}`);
  }

  // ============ ADMIN: ETABLISSEMENTS ============

  async getEtablissements(): Promise<Etablissement[]> {
    return this.request<Etablissement[]>("/admin/etablissements");
  }

  async getEtablissementById(id: number): Promise<Etablissement> {
    return this.request<Etablissement>(`/admin/etablissement/${id}`);
  }

  async createEtablissement(etablissement: Omit<Etablissement, "id">): Promise<Etablissement> {
    return this.request<Etablissement>("/admin/etablissement", {
      method: "POST",
      body: JSON.stringify(etablissement),
    });
  }

  async updateEtablissement(id: string, etablissement: Partial<Etablissement>): Promise<Etablissement> {
    return this.request<Etablissement>(`/admin/etablissement/${id}`, {
      method: "PUT",
      body: JSON.stringify(etablissement),
    });
  }

  async deleteEtablissement(id: string): Promise<void> {
    await this.request<void>(`/admin/etablissement/${id}`, { method: "DELETE" });
  }

  // ============ ADMIN: ABSENCES & STATS ============

  async getAllAbsences(): Promise<Absence[]> {
    return this.request<Absence[]>("/admin/absences");
  }

  /** GET /admin/statistiques?start=YYYY-MM-DD&end=YYYY-MM-DD */
  async getAdminStats(start?: string, end?: string): Promise<AdminStatsResponse> {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end)   params.set("end", end);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<AdminStatsResponse>(`/admin/statistiques${qs}`);
  }

  /** GET /admin/statistiques/top-absents?limit=3 */
  async getTopAbsents(limit = 3): Promise<TopAbsentItem[]> {
    return this.request<TopAbsentItem[]>(`/admin/statistiques/top-absents?limit=${limit}`);
  }

  /** GET /admin/statistiques/absences-aujourd-hui */
  async getAbsencesAujourdhui(): Promise<AbsencesAujourdhuiResponse> {
    return this.request<AbsencesAujourdhuiResponse>("/admin/statistiques/absences-aujourd-hui");
  }

  /** GET /admin/statistiques/par-mois?year=2026&etaId=&cycle= */
  async getStatistiquesParMois(year?: number, etaId?: number, cycle?: string): Promise<ParMoisResponse> {
    const params = new URLSearchParams();
    if (year)  params.set("year", String(year));
    if (etaId) params.set("etaId", String(etaId));
    if (cycle) params.set("cycle", cycle);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<ParMoisResponse>(`/admin/statistiques/par-mois${qs}`);
  }

  // ============ DIRECTEUR: ENSEIGNANTS ============

  async getEnseignantsDirecteur(): Promise<Enseignant[]> {
    return this.request<Enseignant[]>("/directeur/enseignants");
  }

  async getEnseignantByPprDirecteur(ppr: number): Promise<Enseignant> {
    return this.request<Enseignant>(`/directeur/enseignants/${ppr}`);
  }

  /** GET /directeur/enseignant/:ppr/absences?start=&end= */
  async getAbsencesByEnseignant(ppr: number, start?: string, end?: string): Promise<AbsencesByEnseignantResponse> {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end)   params.set("end", end);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<AbsencesByEnseignantResponse>(`/directeur/enseignant/${ppr}/absences${qs}`);
  }

  // ============ DIRECTEUR: ETABLISSEMENT ============

  /** GET /directeur/etablissement — returns full stats */
  async getEtablissementDirecteur(): Promise<EtablissementDirecteurResponse> {
    return this.request<EtablissementDirecteurResponse>("/directeur/etablissement");
  }

  // ============ DIRECTEUR: ABSENCES ============

  async getAbsencesDirecteur(): Promise<Absence[]> {
    return this.request<Absence[]>("/directeur/absences");
  }

  async createAbsence(absence: Omit<Absence, "id">): Promise<Absence> {
    return this.request<Absence>("/directeur/absence", {
      method: "POST",
      body: JSON.stringify(absence),
    });
  }

  async updateAbsence(id: number, absence: Partial<Absence>): Promise<Absence> {
    return this.request<Absence>(`/directeur/absence/${id}`, {
      method: "PUT",
      body: JSON.stringify(absence),
    });
  }

  async deleteAbsence(id: number): Promise<void> {
    await this.request<void>(`/directeur/absence/${id}`, { method: "DELETE" });
  }

  // ============ DIRECTEUR: STATS ============

  /** GET /directeur/statistiques?start=YYYY-MM-DD&end=YYYY-MM-DD */
  async getDirecteurStats(start?: string, end?: string): Promise<DirecteurStatsResponse> {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end)   params.set("end", end);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<DirecteurStatsResponse>(`/directeur/statistiques${qs}`);
  }

  /** GET /directeur/statistiques/par-periode?start=&end= */
  async getStatistiquesParPeriode(start?: string, end?: string): Promise<ParPeriodeResponse> {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end)   params.set("end", end);
    const qs = params.toString() ? `?${params}` : "";
    return this.request<ParPeriodeResponse>(`/directeur/statistiques/par-periode${qs}`);
  }

  /** GET /directeur/statistiques/absences-aujourd-hui */
  async getAbsencesAujourdhuiDirecteur(): Promise<AbsencesAujourdhuiDirecteurResponse> {
    return this.request<AbsencesAujourdhuiDirecteurResponse>("/directeur/statistiques/absences-aujourd-hui");
  }
}

export const api = new ApiService();
