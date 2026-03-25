import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Users, TrendingDown, AlertCircle, Building2, Hash } from "lucide-react";

export default function AdminDashboard() {
  const { enseignants, absences, users, etablissements } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().substring(0, 7);
  const todayAbs  = absences.filter(a => a.dateAbsence === today);
  const monthAbs  = absences.filter(a => a.dateAbsence.startsWith(thisMonth));

  const directeurs = users.filter(u => u.role === "directeur");

  const top3 = [...enseignants]
    .filter(e => e.totalHeureAbsences > 0)
    .sort((a, b) => b.totalHeureAbsences - a.totalHeureAbsences)
    .slice(0, 3);

  const recentAbs = [...absences]
    .sort((a, b) => b.dateAbsence.localeCompare(a.dateAbsence))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickCard icon={<Users />}        label="Enseignants"      value={enseignants.length}    color="blue"  />
        <QuickCard icon={<TrendingDown />} label="Directeurs"       value={directeurs.length}     color="red"   />
        <QuickCard icon={<Building2 />}    label="Établissements"   value={etablissements.length} color="green" />
        <QuickCard icon={<AlertCircle />}  label="Absences ce mois" value={monthAbs.length}        color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absents aujourd'hui */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800" style={{ fontWeight: 600 }}>Absents aujourd'hui</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
              {todayAbs.length}
            </span>
          </div>
          {todayAbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm">Aucune absence déclarée aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAbs.map(a => {
                const e = enseignants.find(en => en.ppr === a.enseignantPpr);
                const eta = etablissements.find(et => et.id === a.etaId);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm" style={{ fontWeight: 700 }}>
                      {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{e?.prenom} {e?.nom}</p>
                        {e?.ppr && <PprBadge ppr={e.ppr} />}
                      </div>
                      <p className="text-xs text-gray-500">{e?.matiere}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {e?.sexe && <SexeBadge sexe={e.sexe} />}
                        {eta && (
                          <p className="flex items-center gap-1 text-xs text-blue-600">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{eta.nom}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top absents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Enseignants les plus absents</h3>
          {top3.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {top3.map((e, i) => {
                const eta = etablissements.find(et => et.id === e.etaId);
                return (
                  <div key={e.ppr} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${["bg-yellow-400", "bg-gray-400", "bg-orange-400"][i]}`} style={{ fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{e.prenom} {e.nom}</p>
                        <PprBadge ppr={e.ppr} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{e.matiere}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {e.sexe && <SexeBadge sexe={e.sexe} />}
                        {eta && (
                          <p className="flex items-center gap-1 text-xs text-blue-600">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{eta.nom}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontWeight: 600 }}>
                      {e.totalHeureAbsences}h
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dernières absences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Dernières absences déclarées</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Enseignant</th>
                  <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>PPR</th>
                  <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Sexe</th>
                  <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Établissement</th>
                  <th className="pb-2 pr-4" style={{ fontWeight: 500 }}>Période (h)</th>
                  <th className="pb-2"      style={{ fontWeight: 500 }}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentAbs.map(a => {
                  const e   = enseignants.find(en => en.ppr === a.enseignantPpr);
                  const eta = etablissements.find(et => et.id === a.etaId);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs" style={{ fontWeight: 700 }}>
                            {e?.prenom?.charAt(0)}{e?.nom?.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{e?.prenom} {e?.nom}</span>
                            <p className="text-xs text-gray-400">{e?.matiere}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {e?.ppr ? <PprBadge ppr={e.ppr} /> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        {e?.sexe ? <SexeBadge sexe={e.sexe} /> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        {eta ? (
                          <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[130px]">{eta.nom}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-sm text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                          {a.periode}h
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-sm text-gray-600">
                        {new Date(a.dateAbsence).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue:   { bg: "from-blue-500 to-blue-600",     icon: "bg-blue-400/30"   },
    red:    { bg: "from-red-500 to-red-600",       icon: "bg-red-400/30"    },
    green:  { bg: "from-green-500 to-green-600",   icon: "bg-green-400/30"  },
    amber:  { bg: "from-amber-500 to-amber-600",   icon: "bg-amber-400/30"  },
    purple: { bg: "from-purple-500 to-purple-600", icon: "bg-purple-400/30" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 text-white shadow-sm`}>
      <div className={`w-9 h-9 ${c.icon} rounded-xl flex items-center justify-center mb-3 [&>svg]:w-5 [&>svg]:h-5`}>
        {icon}
      </div>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      <p className="text-white/80 text-sm mt-1" style={{ fontWeight: 500 }}>{label}</p>
    </div>
  );
}

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
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isMasc ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`} style={{ fontWeight: 500 }}>
      {isMasc ? "👨" : "👩"} {sexe}
    </span>
  );
}
