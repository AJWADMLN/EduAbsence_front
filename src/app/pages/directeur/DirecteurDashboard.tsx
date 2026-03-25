import React from "react";
import { useApp } from "../../context/AppContext";
import { AlertCircle, CheckCircle, Hash, Building2, Clock } from "lucide-react";
import Pagination from "../../components/Pagination";

const DECL_PER_PAGE = 5;

export default function DirecteurDashboard() {
  const { enseignants, absences, currentUser, etablissements } = useApp();

  // Resolve the directeur's etablissement
  const eta = etablissements.find(e => e.id === currentUser?.etaId);

  // Scope absences + teachers to this establishment
  const myTeachers = enseignants.filter(e => e.etaId === currentUser?.etaId);
  const myPprs     = new Set(myTeachers.map(e => e.ppr));
  const myAbsences = absences.filter(a => myPprs.has(a.enseignantPpr));

  const today      = new Date().toISOString().split("T")[0];
  const todayAbs   = myAbsences.filter(a => a.dateAbsence === today);

  const recentAbs = [...myAbsences].sort((a, b) => b.dateAbsence.localeCompare(a.dateAbsence));

  const [declPage, setDeclPage] = React.useState(1);
  const paginatedDecl = recentAbs.slice((declPage - 1) * DECL_PER_PAGE, declPage * DECL_PER_PAGE);

  const totalHeures = myAbsences.reduce((s, a) => s + (a.periode ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* Bandeau établissement */}
      {eta && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-blue-900 text-sm" style={{ fontWeight: 700 }}>{eta.nom}</p>
            <p className="text-blue-600 text-xs">
              {myTeachers.length} enseignant{myTeachers.length > 1 ? "s" : ""} —{" "}
              {totalHeures}h d'absences irrégulières enregistrées
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <DashCard icon="👩‍🏫" label="Mes enseignants"  value={myTeachers.length}  color="blue"   />
        <DashCard icon="📋"    label="Total absences"   value={myAbsences.length}  color="indigo" />
        <DashCard icon="🔴"    label="Aujourd'hui"      value={todayAbs.length}    color="red"    />
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Absents aujourd'hui */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Absents aujourd'hui</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full ${todayAbs.length === 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`} style={{ fontWeight: 600 }}>
              {todayAbs.length}
            </span>
          </div>
          {todayAbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
              <p className="text-sm text-green-600" style={{ fontWeight: 500 }}>Aucune absence aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAbs.map(a => {
                const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm flex-shrink-0" style={{ fontWeight: 700 }}>
                      {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{e?.prenom} {e?.nom}</p>
                        {e?.ppr && <PprBadge ppr={e.ppr} />}
                      </div>
                      <p className="text-xs text-gray-500">{e?.matiere}</p>
                      {e?.sexe && <SexeBadge sexe={e.sexe} />}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <QuartBadge quart={a.quart} periode={a.periode} />
                      <IrreguBadge />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historique des absences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Dernières absences déclarées</h3>
          {recentAbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p className="text-sm">Aucune absence enregistrée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Enseignant</th>
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>PPR</th>
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Matière</th>
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Sexe</th>
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Date</th>
                    <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Quart</th>
                    <th className="pb-2"      style={{ fontWeight: 500 }}>Heures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedDecl.map(a => {
                    const e = myTeachers.find(en => en.ppr === a.enseignantPpr);
                    return (
                      <tr key={a.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
                              {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{e?.prenom} {e?.nom}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {e?.ppr ? <PprBadge ppr={e.ppr} /> : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-600">{e?.matiere || "—"}</td>
                        <td className="py-3 pr-4">
                          {e?.sexe ? <SexeBadge sexe={e.sexe} /> : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(a.dateAbsence).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 pr-4">
                          <QuartBadge quart={a.quart} periode={a.periode} />
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap" style={{ fontWeight: 700 }}>
                            <Clock className="w-3 h-3" />{a.periode}h
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {recentAbs.length > DECL_PER_PAGE && (
            <div className="px-1 pb-1">
              <Pagination total={recentAbs.length} page={declPage} perPage={DECL_PER_PAGE} onChange={setDeclPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Badges ─────────────────────────────────────────────────────────────────────

function PprBadge({ ppr }: { ppr: number | string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200" style={{ fontWeight: 600 }}>
      <Hash className="w-3 h-3 text-blue-400" />{ppr}
    </span>
  );
}

function SexeBadge({ sexe }: { sexe: string }) {
  const isMasc = sexe === "Masculin";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-0.5 ${isMasc ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`} style={{ fontWeight: 500 }}>
      {isMasc ? "👨" : "👩"} {sexe}
    </span>
  );
}

function QuartBadge({ quart, periode }: { quart?: string; periode: number }) {
  const isMatin = quart === "matin";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
      isMatin ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
    }`} style={{ fontWeight: 500 }}>
      <Clock className="w-3 h-3" />
      {quart ? (isMatin ? "🌅 Matin" : "🌆 Soir") : "—"} · {periode}h
    </span>
  );
}

function IrreguBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap" style={{ fontWeight: 500 }}>
      Irrégulière
    </span>
  );
}

function DashCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue:   "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    amber:  "from-amber-500 to-amber-600",
    red:    "from-red-500 to-red-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.blue} rounded-2xl p-5 text-white shadow-sm`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      <p className="text-white/80 text-sm mt-1" style={{ fontWeight: 500 }}>{label}</p>
    </div>
  );
}
