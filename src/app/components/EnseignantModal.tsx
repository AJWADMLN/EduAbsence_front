import React, { useState, useEffect } from "react";
import { X, Save, User, Building2, Hash } from "lucide-react";
import type { Enseignant, Sexe, Cycle } from "../context/AppContext";
import { useApp } from "../context/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Enseignant, "totalHeureAbsences">) => void;
  initial?: Enseignant | null;
}

const MATIERES = [
  "Mathématiques", "Physique", "Chimie", "Biologie",
  "Français", "Arabe", "Anglais", "Histoire", "Géographie",
  "Informatique", "Éducation physique", "Arts", "Philosophie"
];

const CYCLES: Cycle[] = ["Primaire", "Collège", "Lycée"];
const SEXES: Sexe[]   = ["Masculin", "Féminin"];

const CYCLE_LABEL: Record<Cycle, string> = {
  Primaire: "🏫 Écoles primaires",
  Collège:  "📚 CEM (Collège)",
  Lycée:    "🎓 Lycées",
};

export default function EnseignantModal({ open, onClose, onSave, initial }: Props) {
  const { etablissements } = useApp();

  const etablissementsByCycle: Record<Cycle, { id: number; nom: string }[]> = {
    Primaire: etablissements.filter(e => e.cycle === "Primaire"),
    Collège:  etablissements.filter(e => e.cycle === "Collège"),
    Lycée:    etablissements.filter(e => e.cycle === "Lycée"),
  };

  const [form, setForm] = useState({
    ppr:     0 as number,
    nom:     "",
    prenom:  "",
    sexe:    "Masculin" as Sexe,
    cycle:   "Lycée" as Cycle,
    etaId:   0,
    matiere: "Mathématiques",
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (initial) {
      setForm({
        ppr:     initial.ppr || 0,
        nom:     initial.nom,
        prenom:  initial.prenom,
        sexe:    initial.sexe || "Masculin",
        cycle:   initial.cycle || "Lycée",
        etaId:   initial.etaId || 0,
        matiere: initial.matiere || "Mathématiques",
      });
    } else {
      setForm({ ppr: 0, nom: "", prenom: "", sexe: "Masculin", cycle: "Lycée", etaId: 0, matiere: "Mathématiques" });
    }
    setErrors({});
  }, [initial, open]);

  const handleCycleChange = (c: Cycle) => {
    setForm(prev => ({ ...prev, cycle: c, etaId: 0 }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.ppr || form.ppr <= 0) e.ppr = "Champ requis";
    else if (!/^\d{4,10}$/.test(String(form.ppr))) e.ppr = "PPR invalide (4 à 10 chiffres)";
    if (!form.nom.trim())    e.nom    = "Champ requis";
    if (!form.prenom.trim()) e.prenom = "Champ requis";
    if (!form.etaId)         e.etaId  = "Champ requis";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, ppr: Number(form.ppr) });
    onClose();
  };

  if (!open) return null;

  const cycleEtabls = etablissementsByCycle[form.cycle];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
              {initial ? "Modifier l'enseignant" : "Ajouter un enseignant"}
            </h3>
            <p className="text-blue-100 text-sm">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={onClose} className="ml-auto text-blue-200 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {/* PPR */}
          <div>
            <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-blue-500" />
                PPR <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1" style={{ fontWeight: 400 }}>(Identifiant unique de l'enseignant)</span>
              </span>
            </label>
            <input
              type="number"
              value={form.ppr || ""}
              onChange={e => setForm({ ...form, ppr: Number(e.target.value) })}
              placeholder="Ex : 112233"
              min={1000}
              max={9999999999}
              className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${errors.ppr ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.ppr && <p className="text-red-500 text-xs mt-1">{errors.ppr}</p>}
          </div>

          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>Nom <span className="text-red-500">*</span></label>
              <input
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom de famille"
                className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${errors.nom ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>Prénom <span className="text-red-500">*</span></label>
              <input
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                placeholder="Prénom"
                className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${errors.prenom ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
            </div>
          </div>

          {/* Sexe */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Sexe <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {SEXES.map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, sexe: s })}
                  className={`py-2.5 px-4 rounded-lg border-2 text-sm transition ${
                    form.sexe === s
                      ? s === "Masculin" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={{ fontWeight: form.sexe === s ? 600 : 400 }}>
                  {s === "Masculin" ? "👨 Masculin" : "👩 Féminin"}
                </button>
              ))}
            </div>
          </div>

          {/* Cycle */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Cycle scolaire <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {CYCLES.map(c => (
                <button key={c} type="button" onClick={() => handleCycleChange(c)}
                  className={`py-2.5 px-3 rounded-lg border-2 text-sm transition ${
                    form.cycle === c ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={{ fontWeight: form.cycle === c ? 600 : 400 }}>
                  {c === "Primaire" ? "🏫 Primaire" : c === "Collège" ? "📚 Collège" : "🎓 Lycée"}
                </button>
              ))}
            </div>
          </div>

          {/* Établissement (by etaId) */}
          <div>
            <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                Établissement <span className="text-red-500">*</span>
              </span>
              <span className="text-xs text-gray-400" style={{ fontWeight: 400 }}>
                {CYCLE_LABEL[form.cycle]} correspondant au cycle sélectionné
              </span>
            </label>
            <select
              value={form.etaId || ""}
              onChange={e => setForm({ ...form, etaId: Number(e.target.value) })}
              className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${errors.etaId ? "border-red-400" : "border-gray-200"}`}
            >
              <option value="">— Sélectionner un établissement —</option>
              {cycleEtabls.map(e => (
                <option key={e.id} value={e.id}>{e.nom}</option>
              ))}
            </select>
            {errors.etaId && <p className="text-red-500 text-xs mt-1">{errors.etaId}</p>}
          </div>

          {/* Matière */}
          <div>
            <label className="block text-sm text-gray-700 mb-1" style={{ fontWeight: 500 }}>Matière enseignée</label>
            <select
              value={form.matiere}
              onChange={e => setForm({ ...form, matiere: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {MATIERES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>
              Annuler
            </button>
            <button type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition text-sm" style={{ fontWeight: 600 }}>
              <Save className="w-4 h-4" />
              {initial ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}