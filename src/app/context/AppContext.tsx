import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../../lib/api";

export type Role   = "consultant" | "admin principal" | "directeur";
export type Sexe   = "Masculin" | "Féminin";
export type Cycle  = "Primaire" | "Collège" | "Lycée";
export type Quart  = "matin" | "soir";

// ── Entities — exactly matching backend MongoDB schemas ─────────────────────────

export interface User {
  id: string;           // string for frontend convenience (MongoDB _id or custom id as string)
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  etaId?: number;       // present in directeur JWT payload
}

export interface Enseignant {
  ppr: number;                // Number in backend — national identifier
  nom: string;
  prenom: string;
  sexe: Sexe;                 // "Masculin" | "Féminin"
  cycle: Cycle;               // auto-derived from establishment
  etaId: number;              // FK → Etablissement.id
  matiere?: string;           // subject taught
  totalHeureAbsences: number; // auto-maintained by backend
}

export interface Absence {
  id: number;                 // Number in backend — custom numeric id field
  dateAbsence: string;        // "YYYY-MM-DD"
  enseignantPpr: number;      // FK → Enseignant.ppr (Number)
  etaId: number;              // FK → Etablissement.id
  periode: number;            // 1–4 (hours)
  heureDebut?: string;        // "HH:MM", default "09:00"
  quart?: Quart;              // "matin" | "soir"
}

export interface Etablissement {
  id: number;
  nom: string;
  cycle: Cycle;
  adresse: string;
}

// ── Context interface ─────────────────────────────────────────────────────────

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, data: Partial<Omit<User, "id">>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  enseignants: Enseignant[];
  loadEnseignants: () => Promise<void>;
  addEnseignant: (e: Omit<Enseignant, "totalHeureAbsences">) => Promise<void>;
  updateEnseignant: (ppr: number, e: Partial<Enseignant>) => Promise<void>;
  deleteEnseignant: (ppr: number) => Promise<void>;
  absences: Absence[];
  loadAbsences: () => Promise<void>;
  addAbsence: (a: Omit<Absence, "id">) => Promise<void>;
  updateAbsence: (id: number, a: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: number) => Promise<void>;
  etablissements: Etablissement[];
  loadEtablissements: () => Promise<void>;
  addEtablissement: (e: Omit<Etablissement, "id">) => Promise<void>;
  updateEtablissement: (id: number | string, e: Partial<Etablissement>) => Promise<void>;
  deleteEtablissement: (id: number | string) => Promise<void>;
  loginUnified: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginDirecteur: (email: string, password: string) => Promise<void>;
  createConsultant: (nom: string, prenom: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

// Decode JWT payload to extract user info since backend returns only {token, role}
function decodeJWT(token: string): Partial<User> & { nom?: string; prenom?: string } {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: String(payload.id), role: payload.role, etaId: payload.etaId, nom: payload.nom, prenom: payload.prenom };
  } catch {
    return {};
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers]                 = useState<User[]>([]);
  const [enseignants, setEnseignants]     = useState<Enseignant[]>([]);
  const [absences, setAbsences]           = useState<Absence[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [isLoading, setIsLoading]         = useState(false);

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const loginUnified = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.loginUnified(email, password);
      const decoded = decodeJWT(res.token);
      
      const userPayload: User = {
        id: decoded.id || "",
        nom: decoded.nom || email.split("@")[0],
        prenom: decoded.prenom || "",
        email,
        role: res.role as Role,
      };

      if (res.role === "directeur") {
         userPayload.etaId = decoded.etaId;
      }
      
      setCurrentUser(userPayload);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      const decoded = decodeJWT(res.token);
      setCurrentUser({
        id: decoded.id || "",
        nom: email.split("@")[0],
        prenom: decoded.prenom || "",
        email,
        role: "consultant",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginDirecteur = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.loginDirecteur(email, password);
      const decoded = decodeJWT(res.token);
      setCurrentUser({
        id: decoded.id || "",
        nom: email.split("@")[0],
        prenom: decoded.prenom || "",
        email,
        role: "directeur",
        etaId: decoded.etaId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConsultant = async (nom: string, prenom: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.createConsultant(nom, prenom, email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setUsers([]);
    setEnseignants([]);
    setAbsences([]);
    setEtablissements([]);
  };

  // ── Users (Directeurs) ─────────────────────────────────────────────────────

  const loadUsers = async () => {
    const data = await api.getDirecteurs();
    // Map backend numeric id to string for frontend User.id
    setUsers((data as any[]).map(d => ({ ...d, id: String(d.id ?? d._id) })) as User[]);
  };

  const addUser = async (user: Omit<User, "id">) => {
    const res = await api.createDirecteur(user as any);
    const newUser = res.directeur || res;
    setUsers(prev => [...prev, { ...newUser as any, id: String((newUser as any).id ?? (newUser as any)._id) } as User]);
  };

  const updateUser = async (id: string, data: Partial<Omit<User, "id">>) => {
    const updated = await api.updateDirecteur(id, data as any);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } as User : u));
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...updated } as User : null);
  };

  const deleteUser = async (id: string) => {
    await api.deleteDirecteur(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ── Enseignants ────────────────────────────────────────────────────────────

  const loadEnseignants = async () => {
    const isAdminRole = currentUser?.role === "consultant" || currentUser?.role === "admin principal";
    const data = isAdminRole
      ? await api.getEnseignants()
      : await api.getEnseignantsDirecteur();
    setEnseignants(data as Enseignant[]);
  };

  const addEnseignant = async (e: Omit<Enseignant, "totalHeureAbsences">) => {
    const newE = await api.createEnseignant(e);
    setEnseignants(prev => [newE as Enseignant, ...prev]);
  };

  const updateEnseignant = async (ppr: number, e: Partial<Enseignant>) => {
    const updated = await api.updateEnseignant(ppr, e);
    setEnseignants(prev => prev.map(en => en.ppr === ppr ? { ...en, ...updated } as Enseignant : en));
  };

  const deleteEnseignant = async (ppr: number) => {
    await api.deleteEnseignant(ppr);
    setEnseignants(prev => prev.filter(en => en.ppr !== ppr));
  };

  // ── Absences ───────────────────────────────────────────────────────────────

  const loadAbsences = async () => {
    const isAdminRole = currentUser?.role === "consultant" || currentUser?.role === "admin principal";
    const data = isAdminRole
      ? await api.getAllAbsences()
      : await api.getAbsencesDirecteur();
    setAbsences(data as Absence[]);
  };

  const addAbsence = async (a: Omit<Absence, "id">) => {
    const newA = await api.createAbsence(a);
    setAbsences(prev => [newA as Absence, ...prev]);
    setEnseignants(prev => prev.map(e => 
      e.ppr === a.enseignantPpr 
        ? { ...e, totalHeureAbsences: (e.totalHeureAbsences || 0) + a.periode } 
        : e
    ));
  };

  const updateAbsence = async (id: number, a: Partial<Absence>) => {
    const oldA = absences.find(abs => abs.id === id);
    const updated = await api.updateAbsence(id, a);
    setAbsences(prev => prev.map(abs => abs.id === id ? { ...abs, ...updated } as Absence : abs));
    
    if (oldA) {
      const oldPeriode = oldA.periode;
      const newPeriode = (updated as Absence).periode ?? oldA.periode;
      const oldPpr = oldA.enseignantPpr;
      const newPpr = (updated as Absence).enseignantPpr ?? oldA.enseignantPpr;

      if (oldPpr === newPpr) {
        const diff = newPeriode - oldPeriode;
        if (diff !== 0) {
          setEnseignants(prev => prev.map(e => 
            e.ppr === oldPpr 
              ? { ...e, totalHeureAbsences: Math.max(0, (e.totalHeureAbsences || 0) + diff) } 
              : e
          ));
        }
      } else {
        setEnseignants(prev => prev.map(e => {
          if (e.ppr === oldPpr) return { ...e, totalHeureAbsences: Math.max(0, (e.totalHeureAbsences || 0) - oldPeriode) };
          if (e.ppr === newPpr) return { ...e, totalHeureAbsences: (e.totalHeureAbsences || 0) + newPeriode };
          return e;
        }));
      }
    }
  };

  const deleteAbsence = async (id: number) => {
    const oldA = absences.find(abs => abs.id === id);
    await api.deleteAbsence(id);
    setAbsences(prev => prev.filter(abs => abs.id !== id));
    
    if (oldA) {
      setEnseignants(prev => prev.map(e => 
        e.ppr === oldA.enseignantPpr 
          ? { ...e, totalHeureAbsences: Math.max(0, (e.totalHeureAbsences || 0) - oldA.periode) } 
          : e
      ));
    }
  };

  // ── Etablissements ─────────────────────────────────────────────────────────

  const loadEtablissements = async () => {
    const isAdminRole = currentUser?.role === "consultant" || currentUser?.role === "admin principal";
    if (isAdminRole) {
      const data = await api.getEtablissements();
      setEtablissements(data as Etablissement[]);
    } else {
      const data = await api.getEtablissementDirecteur();
      setEtablissements([{ id: data.id, nom: data.nom, cycle: data.cycle as Cycle, adresse: data.adresse }]);
    }
  };

  const addEtablissement = async (e: Omit<Etablissement, "id">) => {
    const newE = await api.createEtablissement(e);
    setEtablissements(prev => [...prev, newE as Etablissement]);
  };

  const updateEtablissement = async (id: number | string, e: Partial<Etablissement>) => {
    const updated = await api.updateEtablissement(String(id), e as any);
    setEtablissements(prev => prev.map(et => String(et.id) === String(id) ? { ...et, ...updated } as Etablissement : et));
  };

  const deleteEtablissement = async (id: number | string) => {
    await api.deleteEtablissement(String(id));
    setEtablissements(prev => prev.filter(et => String(et.id) !== String(id)));
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      users, addUser, updateUser, deleteUser, loadUsers,
      enseignants, loadEnseignants, addEnseignant, updateEnseignant, deleteEnseignant,
      absences, loadAbsences, addAbsence, updateAbsence, deleteAbsence,
      etablissements, loadEtablissements, addEtablissement, updateEtablissement, deleteEtablissement,
      loginUnified, login, loginDirecteur, createConsultant, logout, isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
