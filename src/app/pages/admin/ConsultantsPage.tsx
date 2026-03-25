import React, { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import Pagination from "../../components/Pagination";
import { UserPlus, Trash2, Mail, Lock, User as UserIcon, Eye, EyeOff, X, AlertTriangle, ShieldCheck } from "lucide-react";

const PER_PAGE = 6;

interface FormState {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  confirm: string;
}

const EMPTY_FORM: FormState = { nom: "", prenom: "", email: "", password: "", confirm: "" };

function ConsultantModal({
  onClose, onSubmit, error
}: {
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  error: string;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-gray-800" style={{ fontWeight: 700 }}>Créer un compte consultant</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-gray-400" />Nom</span>
              </label>
              <input type="text" value={form.nom} required onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Prénom</label>
              <input type="text" value={form.prenom} required onChange={e => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />Adresse email</span>
            </label>
            <input type="email" value={form.email} required onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="consultant@ecole.dz" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-gray-400" />Mot de passe</span>
            </label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password} required onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Confirmer le mot de passe</label>
            <input type="password" value={form.confirm} required onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>Annuler</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition text-sm" style={{ fontWeight: 600 }}>
              <UserPlus className="w-4 h-4" />Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      const data = await api.getConsultants();
      setConsultants(data);
    } catch (err) {
      setError("Erreur lors du chargement des consultants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const paginated = consultants.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCreate = async (form: FormState) => {
    setError("");
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit comporter au moins 6 caractères."); return; }

    try {
      await api.createConsultant(form.nom.trim(), form.prenom.trim(), form.email, form.password);
      setSuccess(`Compte consultant créé pour ${form.prenom} ${form.nom}`);
      setShowCreate(false);
      fetchConsultants();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création.");
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    try {
      await api.deleteConsultant(id);
      setConsultants(prev => prev.filter(c => c._id !== id));
      setSuccess(`Le consultant ${nom} a été supprimé.`);
      setConfirmDelete(null);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Gestion des consultants</h2>
          <p className="text-gray-500 text-sm">{consultants.length} consultant{consultants.length > 1 ? "s" : ""} enregistré{consultants.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition shadow-sm"
          style={{ fontWeight: 600 }}>
          <UserPlus className="w-4 h-4" /> Nouveau consultant
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm" style={{ fontWeight: 500 }}>{success}</p>
        </div>
      )}

      {showCreate && <ConsultantModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={error} />}

      {confirmDelete && (() => {
        const consultant = consultants.find(c => c._id === confirmDelete);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-gray-800" style={{ fontWeight: 700 }}>Supprimer ce consultant ?</h3>
                  <p className="text-gray-500 text-sm">{consultant?.prenom} {consultant?.nom}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>Annuler</button>
                <button onClick={() => handleDelete(confirmDelete, consultant?.nom)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition text-sm" style={{ fontWeight: 600 }}>Supprimer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      ) : consultants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-700 mb-1" style={{ fontWeight: 600 }}>Aucun consultant enregistré</p>
          <p className="text-gray-400 text-sm mb-5">Créez le premier compte consultant pour commencer.</p>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition text-sm" style={{ fontWeight: 600 }}>
            <UserPlus className="w-4 h-4" /> Créer un consultant
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(c => (
              <div key={c._id} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ fontWeight: 700, fontSize: "1rem" }}>
                      {c.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-800" style={{ fontWeight: 700 }}>{c.prenom} {c.nom}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />{c.email}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setConfirmDelete(c._id)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination total={consultants.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
