import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import type { User } from "../../context/AppContext";
import Pagination from "../../components/Pagination";
import {
  UserPlus, Trash2, Building2, Mail, Lock, User as UserIcon,
  Eye, EyeOff, X, AlertTriangle, ShieldCheck, Edit2, Unlock
} from "lucide-react";
import { useDayLock } from "../../hooks/useDayLock";

const PER_PAGE = 6;

interface FormState {
  nom:     string;
  prenom:  string;
  email:   string;
  password: string;
  confirm: string;
  etaId:   number;  // FK to Etablissement.id
}

const EMPTY_FORM: FormState = { nom: "", prenom: "", email: "", password: "", confirm: "", etaId: 0 };

// ── Modal ───────────────────────────────────────────────────────────────────────
function DirecteurModal({
  mode, initial, onClose, onSubmit, error, etablissements,
}: {
  mode:          "create" | "edit";
  initial?:      Partial<User>;
  onClose:       () => void;
  onSubmit:      (form: FormState) => void;
  error:         string;
  etablissements: { id: number; nom: string }[];
}) {
  const [form, setForm]     = useState<FormState>({
    nom:      initial?.nom     ?? "",
    prenom:   initial?.prenom  ?? "",
    email:    initial?.email   ?? "",
    password: "",
    confirm:  "",
    etaId:    initial?.etaId   ?? 0,
  });
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              {mode === "create" ? <UserPlus className="w-4 h-4 text-white" /> : <Edit2 className="w-4 h-4 text-white" />}
            </div>
            <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
              {mode === "create" ? "Créer un compte directeur" : `Modifier — ${initial?.nom}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-gray-400" />Nom</span>
              </label>
              <input type="text" value={form.nom} required
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                Prénom
              </label>
              <input type="text" value={form.prenom} required
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />Adresse email</span>
            </label>
            <input type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="directeur@ecole.dz"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          {/* Établissement (by etaId) */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                Établissement affilié <span className="text-red-500">*</span>
              </span>
            </label>
            <select value={form.etaId || ""}
              onChange={e => setForm({ ...form, etaId: Number(e.target.value) })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="">— Sélectionner l'établissement —</option>
              {etablissements.map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                {mode === "edit" ? "Nouveau mot de passe (laisser vide = inchangé)" : "Mot de passe"}
              </span>
            </label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password}
                required={mode === "create"}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={mode === "edit" ? "Laisser vide pour conserver l'actuel" : "••••••••"}
                className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {(mode === "create" || form.password) && (
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Confirmer le mot de passe</label>
              <input type="password" value={form.confirm}
                required={mode === "create" || !!form.password}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm"
              style={{ fontWeight: 500 }}>Annuler</button>
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition text-sm"
              style={{ fontWeight: 600 }}>
              {mode === "create" ? <><UserPlus className="w-4 h-4" />Créer</> : <><Edit2 className="w-4 h-4" />Enregistrer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function DirecteursPage() {
  const { users, addUser, updateUser, deleteUser, absences, etablissements, currentUser } = useApp();
  const { getLockedDates, unlockDate } = useDayLock();
  
  const isConsultant = currentUser?.role === "consultant";

  const directeurs = users.filter(u => u.role === "directeur");
  const ETABLISSEMENTS_LIST = etablissements;

  const [showCreate,     setShowCreate]     = useState(false);
  const [editTarget,     setEditTarget]     = useState<User | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState("");
  const [page,           setPage]           = useState(1);

  const paginated = directeurs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getEtaNom = (etaId?: number) =>
    etablissements.find(e => e.id === etaId)?.nom;

  const handleCreate = (form: FormState) => {
    setError("");
    if (form.password !== form.confirm)  { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password.length < 6)        { setError("Le mot de passe doit comporter au moins 6 caractères."); return; }
    if (!form.etaId)                     { setError("Veuillez sélectionner un établissement."); return; }

    addUser({
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email,
      password: form.password,
      role: "directeur",
      etaId: form.etaId
    } as any);
    
    setSuccess(`Compte directeur créé pour ${form.prenom} ${form.nom}`);
    setShowCreate(false);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleEdit = (form: FormState) => {
    if (!editTarget) return;
    setError("");
    if (form.password && form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password && form.password.length < 6) { setError("Le mot de passe doit comporter au moins 6 caractères."); return; }
    if (!form.etaId) { setError("Veuillez sélectionner un établissement."); return; }
    
    const updates: any = {
      nom:   form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email,
      etaId: form.etaId,
    };
    if (form.password) {
      updates.password = form.password;
    }
    
    updateUser(editTarget.id, updates);
    setSuccess(`Informations de ${form.prenom} ${form.nom} mises à jour.`);
    setEditTarget(null);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleDelete = (id: string) => { deleteUser(id); setConfirmDelete(null); };

  // Count absences scoped to this directeur's etaId
  const countAbsences = (dir: User) =>
    absences.filter(a => dir.etaId && a.etaId === dir.etaId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Gestion des directeurs</h2>
          <p className="text-gray-500 text-sm">{directeurs.length} directeur{directeurs.length > 1 ? "s" : ""} enregistré{directeurs.length > 1 ? "s" : ""}</p>
        </div>
        {!isConsultant && (
          <button onClick={() => { setShowCreate(true); setError(""); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm"
            style={{ fontWeight: 600 }}>
            <UserPlus className="w-4 h-4" /> Nouveau directeur
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm" style={{ fontWeight: 500 }}>{success}</p>
        </div>
      )}

      {showCreate && (
        <DirecteurModal mode="create" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={error} etablissements={ETABLISSEMENTS_LIST} />
      )}
      {editTarget && (
        <DirecteurModal mode="edit" initial={editTarget} onClose={() => { setEditTarget(null); setError(""); }} onSubmit={handleEdit} error={error} etablissements={ETABLISSEMENTS_LIST} />
      )}

      {confirmDelete && (() => {
        const dir = directeurs.find(d => d.id === confirmDelete);
        const eta = getEtaNom(dir?.etaId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-gray-800" style={{ fontWeight: 700 }}>Supprimer ce directeur ?</h3>
                  <p className="text-gray-500 text-sm">{dir?.nom}{eta ? ` — ${eta}` : ""}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm"
                  style={{ fontWeight: 500 }}>Annuler</button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition text-sm"
                  style={{ fontWeight: 600 }}>Supprimer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {directeurs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-700 mb-1" style={{ fontWeight: 600 }}>Aucun directeur enregistré</p>
          <p className="text-gray-400 text-sm mb-5">Créez le premier compte directeur pour commencer.</p>
          {!isConsultant && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition text-sm"
              style={{ fontWeight: 600 }}>
              <UserPlus className="w-4 h-4" /> Créer un directeur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(dir => {
              const nbAbsences = countAbsences(dir);
              const etaNom     = getEtaNom(dir.etaId);
              return (
                <div key={dir.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                        style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {dir.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-800" style={{ fontWeight: 700 }}>{dir.prenom} {dir.nom}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />{dir.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isConsultant && (
                        <>
                          <button onClick={() => { setEditTarget(dir); setError(""); }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition"
                            title="Modifier">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(dir.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                            title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {etaNom ? (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-blue-800 text-xs truncate" style={{ fontWeight: 600 }}>{etaNom}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-700 text-xs" style={{ fontWeight: 500 }}>Aucun établissement</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Absences de l'établissement</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700" style={{ fontWeight: 700 }}>
                      {nbAbsences}
                    </span>
                  </div>

                  {/* ── Dates verrouillées ── */}
                  {(() => {
                    const lockedDates = getLockedDates(dir.etaId);
                    if (lockedDates.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-700" style={{ fontWeight: 600 }}>Journées validées :</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {lockedDates.sort().map(d => (
                            <span key={d} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200" style={{ fontWeight: 500 }}>
                              🗓 {new Date(d + "T00:00:00").toLocaleDateString("fr-FR")}
                            </span>
                          ))}
                        </div>
                        {!isConsultant && (
                          <button
                            onClick={() => {
                              lockedDates.forEach(d => unlockDate(dir.etaId, d));
                              setSuccess(`Accès rétabli pour ${dir.prenom} ${dir.nom}.`);
                              setTimeout(() => setSuccess(""), 4000);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl transition text-xs mt-1"
                            style={{ fontWeight: 600 }}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Retourner l'accès
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
          <Pagination total={directeurs.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
