import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import type { Etablissement, Cycle } from "../../context/AppContext";
import Pagination from "../../components/Pagination";
import { Plus, Search, Edit2, Trash2, Building2, MapPin, X, AlertTriangle } from "lucide-react";

const PER_PAGE = 6;

// ── Modal pour Ajouter/Modifier Établissement ──────────────────────────────
function EtablissementModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Etablissement, "id">) => void;
  initial: Etablissement | null;
}) {
  const [nom, setNom]       = useState(initial?.nom || "");
  const [cycle, setCycle]   = useState<Cycle>(initial?.cycle || "Primaire");
  const [adresse, setAdresse] = useState(initial?.adresse || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), cycle, adresse: adresse.trim() });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
            {initial ? "Modifier l'établissement" : "Nouvel établissement"}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              Nom de l'établissement *
            </label>
            <input
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: École Ibn Badis"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Cycle */}
          <div>
            <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              Cycle *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Primaire", "Collège", "Lycée"] as Cycle[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm transition ${
                    cycle === c
                      ? c === "Primaire"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : c === "Collège"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {c === "Primaire" ? "🏫" : c === "Collège" ? "📚" : "🎓"} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              Adresse
            </label>
            <input
              value={adresse}
              onChange={e => setAdresse(e.target.value)}
              placeholder="Ex: Rue des Écoles, Alger"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm"
              style={{ fontWeight: 500 }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition text-sm"
              style={{ fontWeight: 600 }}
            >
              {initial ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function EtablissementsPage() {
  const { etablissements, addEtablissement, updateEtablissement, deleteEtablissement, currentUser } = useApp();
  const isConsultant = currentUser?.role === "consultant";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Etablissement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Etablissement | null>(null);
  const [page, setPage] = useState(1);

  const filtered = etablissements.filter(e =>
    `${e.nom} ${e.cycle} ${e.adresse}`.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSave = (data: Omit<Etablissement, "id">) => {
    if (editTarget) updateEtablissement(editTarget.id, data);
    else addEtablissement(data);
  };

  const handleEdit = (e: Etablissement) => {
    setEditTarget(e);
    setModalOpen(true);
  };
  const handleNew = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const handleDelete = () => {
    if (deleteTarget) {
      deleteEtablissement(deleteTarget.id);
      setDeleteTarget(null);
    }
  };
  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700 }}>
            Gestion des établissements
          </h2>
          <p className="text-gray-500 text-sm">
            {etablissements.length} établissement{etablissements.length > 1 ? "s" : ""} enregistré
            {etablissements.length > 1 ? "s" : ""}
          </p>
        </div>
        {!isConsultant && (
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition shadow-sm text-sm self-start sm:self-auto"
            style={{ fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" />
            Ajouter un établissement
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Rechercher par nom, cycle, adresse…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <p style={{ fontWeight: 500 }}>Aucun établissement trouvé</p>
            <p className="text-sm mt-1">Essayez une autre recherche ou ajoutez un nouvel établissement.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>
                      Établissement
                    </th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>
                      Cycle
                    </th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>
                      Adresse
                    </th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>
                      Téléphone
                    </th>
                    <th className="text-right text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                              e.cycle === "Primaire"
                                ? "bg-green-100 text-green-700"
                                : e.cycle === "Collège"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                            style={{ fontWeight: 700 }}
                          >
                            {e.cycle === "Primaire" ? "🏫" : e.cycle === "Collège" ? "📚" : "🎓"}
                          </div>
                          <div>
                            <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                              {e.nom}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            e.cycle === "Primaire"
                              ? "bg-green-100 text-green-700"
                              : e.cycle === "Collège"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {e.cycle}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {e.adresse || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {!isConsultant && (
                            <>
                              <button
                                onClick={() => handleEdit(e)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(e)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(e => (
                <div key={e.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          e.cycle === "Primaire"
                            ? "bg-green-100 text-green-700"
                            : e.cycle === "Collège"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {e.cycle === "Primaire" ? "🏫" : e.cycle === "Collège" ? "📚" : "🎓"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600 }} className="text-gray-800">
                          {e.nom}
                        </p>
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                            e.cycle === "Primaire"
                              ? "bg-green-100 text-green-700"
                              : e.cycle === "Collège"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {e.cycle}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!isConsultant && (
                        <>
                          <button
                            onClick={() => handleEdit(e)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {e.adresse && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {e.adresse}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 pb-4">
              <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <EtablissementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                Confirmer la suppression
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Voulez-vous vraiment supprimer <strong>{deleteTarget.nom}</strong> ? Cette action est
                irréversible.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
