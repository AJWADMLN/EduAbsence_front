import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import Pagination from "../../components/Pagination";
import type { Enseignant } from "../../context/AppContext";
import { BookOpen, Search, Building2, Hash, History, ArrowLeft, Clock, Calendar } from "lucide-react";

const PER_PAGE = 8;

// ── Historique Modal ───────────────────────────────────────────────────────────
function HistoriqueModal({ enseignant, onClose }: { enseignant: Enseignant; onClose: () => void }) {
  const { absences, etablissements } = useApp();
  const eta = etablissements.find(e => e.id === enseignant.etaId);

  const ensAbs = absences
    .filter(a => a.enseignantPpr === enseignant.ppr)
    .sort((a, b) => b.dateAbsence.localeCompare(a.dateAbsence));

  const joursMap: Record<string, { heuresTotal: number; quarts: { quart?: string; periode: number }[] }> = {};
  ensAbs.forEach(a => {
    if (!joursMap[a.dateAbsence]) joursMap[a.dateAbsence] = { heuresTotal: 0, quarts: [] };
    joursMap[a.dateAbsence].heuresTotal += a.periode;
    joursMap[a.dateAbsence].quarts.push({ quart: a.quart, periode: a.periode });
  });

  const jours = Object.entries(joursMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ date, ...data }));

  const isMasc = enseignant.sexe === "Masculin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden my-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isMasc ? "bg-blue-400/30" : "bg-pink-300/30"}`} style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>
                {enseignant.prenom.charAt(0)}{enseignant.nom.charAt(0)}
              </div>
              <div>
                <p className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>{enseignant.prenom} {enseignant.nom}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {enseignant.matiere && <span className="text-blue-100 text-xs">{enseignant.matiere}</span>}
                  <span className="text-blue-200 text-xs">·</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isMasc ? "bg-blue-400/30 text-blue-100" : "bg-pink-300/30 text-pink-100"}`} style={{ fontWeight: 500 }}>
                    {isMasc ? "👨" : "👩"} {enseignant.sexe}
                  </span>
                  <span className="text-blue-200 text-xs">·</span>
                  <span className="text-blue-100 text-xs flex items-center gap-1"><Hash className="w-3 h-3" />{enseignant.ppr}</span>
                </div>
              </div>
            </div>
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full" style={{ fontWeight: 600 }}>
              {jours.length} jour{jours.length > 1 ? "s" : ""} d'absence
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2.5 mb-5">
            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-blue-800 text-sm" style={{ fontWeight: 500 }}>{eta?.nom || `Établissement #${enseignant.etaId}`}</span>
            <span className="ml-auto text-xs text-blue-500">{enseignant.cycle}</span>
          </div>

          {enseignant.totalHeureAbsences > 0 && (
            <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-2.5 mb-5">
              <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-800 text-sm" style={{ fontWeight: 600 }}>{enseignant.totalHeureAbsences}h d'absences cumulées</span>
            </div>
          )}

          {jours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mb-3 text-gray-300" />
              <p style={{ fontWeight: 500 }} className="text-gray-500">Aucune absence enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {jours.map(({ date, heuresTotal, quarts }) => (
                <div key={date} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition">
                  <div className="flex-shrink-0 text-center w-16">
                    <p className="text-xs text-gray-400 uppercase" style={{ fontWeight: 600 }}>{new Date(date).toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                    <p className="text-gray-800 text-lg leading-none" style={{ fontWeight: 800 }}>{new Date(date).getDate()}</p>
                    <p className="text-xs text-gray-500" style={{ fontWeight: 500 }}>{new Date(date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 flex flex-wrap gap-2">
                    {quarts.map((q, i) => {
                      const isMatin = q.quart === "matin";
                      return (
                        <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl ${isMatin ? "bg-amber-100 text-amber-700" : q.quart === "soir" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`} style={{ fontWeight: 500 }}>
                          <Clock className="w-3 h-3" />
                          {q.quart ? (isMatin ? "🌅 Matin" : "🌆 Soir") : "—"} · {q.periode}h
                        </span>
                      );
                    })}
                    <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100" style={{ fontWeight: 500 }}>Irrégulière</span>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-blue-700" style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{heuresTotal}h</p>
                    <p className="text-xs text-gray-400">total</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={onClose} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm" style={{ fontWeight: 500 }}>
              <ArrowLeft className="w-4 h-4" />Fermer
            </button>
            {jours.length > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-blue-700 text-sm" style={{ fontWeight: 700 }}>{jours.reduce((s, j) => s + j.heuresTotal, 0)}h</span>
                <span className="text-blue-500 text-xs">total absences</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function DirecteurEnseignants() {
  const { enseignants, absences, currentUser, etablissements } = useApp();
  const [search,     setSearch]     = useState("");
  const [histTarget, setHistTarget] = useState<Enseignant | null>(null);
  const [page,       setPage]       = useState(1);

  const eta        = etablissements.find(e => e.id === currentUser?.etaId);
  const myTeachers = enseignants.filter(e => e.etaId === currentUser?.etaId);

  const filtered = myTeachers.filter(e =>
    `${e.nom} ${e.prenom} ${e.matiere || ""} ${e.ppr}`.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const joursCount = (ppr: number) =>
    new Set(absences.filter(a => a.enseignantPpr === ppr).map(a => a.dateAbsence)).size;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Mes enseignants</h2>
        <p className="text-gray-500 text-sm">
          {myTeachers.length} enseignant{myTeachers.length > 1 ? "s" : ""} dans votre établissement
          {eta && <span className="ml-1 text-blue-600">— {eta.nom}</span>}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, matière, PPR…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3"><BookOpen className="w-7 h-7" /></div>
            <p style={{ fontWeight: 500 }}>Aucun enseignant trouvé</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Enseignant</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>PPR</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Matière</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Cycle</th>
                    <th className="text-left text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Total absences</th>
                    <th className="text-right text-xs text-gray-500 px-5 py-3" style={{ fontWeight: 600 }}>Historique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(e => {
                    const jours = joursCount(e.ppr);
                    return (
                      <tr key={e.ppr} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${e.sexe === "Féminin" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`} style={{ fontWeight: 700 }}>
                              {e.prenom.charAt(0)}{e.nom.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{e.prenom} {e.nom}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${e.sexe === "Féminin" ? "bg-pink-50 text-pink-600" : "bg-blue-50 text-blue-600"}`} style={{ fontWeight: 500 }}>
                                {e.sexe === "Féminin" ? "👩" : "👨"} {e.sexe}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full w-fit" style={{ fontWeight: 600 }}>
                            <Hash className="w-3 h-3 text-blue-400" />{e.ppr || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full" style={{ fontWeight: 500 }}>{e.matiere || "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${e.cycle === "Primaire" ? "bg-green-100 text-green-700" : e.cycle === "Collège" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`} style={{ fontWeight: 500 }}>
                            {e.cycle === "Primaire" ? "🏫" : e.cycle === "Collège" ? "📚" : "🎓"} {e.cycle}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-sm px-2.5 py-1 rounded-full w-fit ${e.totalHeureAbsences === 0 ? "bg-green-100 text-green-700" : e.totalHeureAbsences <= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`} style={{ fontWeight: 600 }}>
                              {e.totalHeureAbsences}h
                            </span>
                            {jours > 0 && <span className="text-xs text-gray-400">{jours} jour{jours > 1 ? "s" : ""} absent{jours > 1 ? "s" : ""}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <button onClick={() => setHistTarget(e)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition text-xs"
                              style={{ fontWeight: 600 }} title="Voir l'historique des absences">
                              <History className="w-3.5 h-3.5" />Historique
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(e => {
                const jours = joursCount(e.ppr);
                return (
                  <div key={e.ppr} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${e.sexe === "Féminin" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`} style={{ fontWeight: 700 }}>
                          {e.prenom.charAt(0)}{e.nom.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }} className="text-gray-800">{e.prenom} {e.nom}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {e.matiere && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{e.matiere}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setHistTarget(e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition text-xs"
                        style={{ fontWeight: 600 }}>
                        <History className="w-3.5 h-3.5" />Historique
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                        <Hash className="w-3 h-3" />PPR : {e.ppr || "—"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${e.totalHeureAbsences === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`} style={{ fontWeight: 600 }}>
                        {e.totalHeureAbsences}h abs.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-4">
              <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {histTarget && (
        <HistoriqueModal enseignant={histTarget} onClose={() => setHistTarget(null)} />
      )}
    </div>
  );
}
