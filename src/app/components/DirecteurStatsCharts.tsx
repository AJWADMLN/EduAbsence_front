import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useApp } from "../context/AppContext";
import { Calendar, X } from "lucide-react";

const SEXE_COLORS: Record<string, string> = {
  Masculin: "#3b82f6",
  Féminin:  "#ec4899",
};

const ENS_COLORS = [
  "#3b82f6", "#ec4899", "#10b981", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (value === 0) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700 }}>{value}</text>
  );
};

function StatCard({ label, value, color, subtitle }: {
  label: string; value: number; color: string; subtitle?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; num: string }> = {
    blue:   { bg: "bg-blue-50",    text: "text-blue-600",    num: "text-blue-700" },
    red:    { bg: "bg-red-50",     text: "text-red-600",     num: "text-red-700" },
    amber:  { bg: "bg-amber-50",   text: "text-amber-600",   num: "text-amber-700" },
    green:  { bg: "bg-emerald-50", text: "text-emerald-600", num: "text-emerald-700" },
    indigo: { bg: "bg-indigo-50",  text: "text-indigo-600",  num: "text-indigo-700" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 border border-gray-100`}>
      <p className={`text-xs ${c.text} mb-1`} style={{ fontWeight: 500 }}>{label}</p>
      <p className={c.num} style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {subtitle && <p className={`text-xs ${c.text} mt-1`}>{subtitle}</p>}
    </div>
  );
}

const Empty = ({ height = 200, msg }: { height?: number; msg?: string }) => (
  <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
    {msg ?? "Aucune donnée disponible"}
  </div>
);

const fmtLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

export default function DirecteurStatsCharts() {
  const { absences: allAbsences, enseignants, currentUser } = useApp();

  const today = new Date().toISOString().split("T")[0];

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin,   setDateFin]   = useState("");
  const filtreActif = Boolean(dateDebut || dateFin);
  const resetDates  = () => { setDateDebut(""); setDateFin(""); };

  // Scope to directeur's establishment
  const myTeachers = enseignants.filter(e => e.etaId === currentUser?.etaId);
  const myPprs     = new Set(myTeachers.map(e => e.ppr));

  const absences = allAbsences.filter(a => {
    if (!myPprs.has(a.enseignantPpr)) return false;
    if (dateDebut && a.dateAbsence < dateDebut) return false;
    if (dateFin   && a.dateAbsence > dateFin)   return false;
    return true;
  });

  const totalAbsences = absences.length;
  const totalHeures   = absences.reduce((s, a) => s + a.periode, 0);

  // 1. By sex
  const sexeData = (["Masculin", "Féminin"] as const).map(sexe => {
    const pprs = myTeachers.filter(e => e.sexe === sexe).map(e => e.ppr);
    return {
      name:  sexe,
      value: absences.filter(a => pprs.includes(a.enseignantPpr)).length,
      fill:  SEXE_COLORS[sexe],
    };
  });

  // 2. Hours per teacher
  const ensData = myTeachers
    .map((e, i) => {
      const absArr = absences.filter(a => a.enseignantPpr === e.ppr);
      return {
        ppr:      e.ppr,
        name:     `${e.prenom.charAt(0)}. ${e.nom}`,
        fullName: `${e.prenom} ${e.nom}`,
        matiere:  e.matiere || "—",
        sexe:     e.sexe,
        heures:   absArr.reduce((s, a) => s + a.periode, 0),
        absences: absArr.length,
        color:    ENS_COLORS[i % ENS_COLORS.length],
      };
    })
    .filter(e => e.heures > 0)
    .sort((a, b) => b.heures - a.heures);

  return (
    <div className="space-y-6">

      {/* Filtre dates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-gray-700" style={{ fontWeight: 600 }}>Filtrer par intervalle de dates</span>
          {filtreActif && (
            <button onClick={resetDates}
              className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition"
              style={{ fontWeight: 600 }}>
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" style={{ fontWeight: 600 }}>📅 Date début</label>
            <input type="date" value={dateDebut} max={dateFin || today}
              onChange={e => { setDateDebut(e.target.value); if (dateFin && e.target.value > dateFin) setDateFin(e.target.value); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" style={{ fontWeight: 600 }}>📅 Date fin</label>
            <input type="date" value={dateFin} min={dateDebut || undefined} max={today}
              onChange={e => { setDateFin(e.target.value); if (dateDebut && e.target.value < dateDebut) setDateDebut(e.target.value); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {filtreActif && (
          <div className="mt-3 flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
            <span className="text-xs text-blue-600" style={{ fontWeight: 500 }}>Intervalle actif :</span>
            {dateDebut && <span className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full" style={{ fontWeight: 600 }}>{fmtLong(dateDebut)}</span>}
            {dateDebut && dateFin && <span className="text-blue-400 text-xs">→</span>}
            {dateFin && <span className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full" style={{ fontWeight: 600 }}>{fmtLong(dateFin)}</span>}
            <span className="text-xs text-gray-400 ml-1">— {totalAbsences} absence{totalAbsences > 1 ? "s" : ""} dans cette période</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total absences"    value={totalAbsences}                                                  color="blue"  />
        <StatCard label="Total heures (h)"  value={totalHeures}                                                    color="indigo" subtitle="heures cumulées" />
        <StatCard label="Enseignants abs." value={new Set(absences.map(a => a.enseignantPpr)).size}               color="red"   subtitle={`sur ${myTeachers.length}`} />
        <StatCard label="Ce mois"          value={absences.filter(a => a.dateAbsence.startsWith(new Date().toISOString().substring(0, 7))).length} color="amber" />
      </div>

      {/* Chart 1 : Par sexe */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-5">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Absences par sexe</h3>
          <p className="text-gray-500 text-sm mt-0.5">Répartition entre enseignants masculins et féminins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            {totalAbsences > 0 ? (
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={sexeData} cx="50%" cy="50%" innerRadius={60} outerRadius={108}
                    paddingAngle={4} dataKey="value" labelLine={false} label={renderPieLabel}>
                    {sexeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} absence(s)`, ""]} />
                  <Legend formatter={(value) => <span style={{ fontSize: "13px", fontWeight: 500 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty height={270} />}
          </div>

          <div className="space-y-4">
            {sexeData.map(s => {
              const total = sexeData.reduce((acc, x) => acc + x.value, 0);
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              const ensCount = myTeachers.filter(e => e.sexe === s.name).length;
              return (
                <div key={s.name} className="rounded-2xl p-5"
                  style={{ backgroundColor: `${s.fill}10`, border: `1.5px solid ${s.fill}25` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${s.fill}20` }}>
                        {s.name === "Masculin" ? "👨" : "👩"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: s.fill, fontSize: "1rem" }}>{s.name}</p>
                        <p className="text-xs text-gray-500">{ensCount} enseignant{ensCount > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: "2rem", fontWeight: 700, color: s.fill, lineHeight: 1 }}>{s.value}</p>
                      <p className="text-xs text-gray-500">absence{s.value > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: s.fill }} />
                  </div>
                  <p className="text-xs text-right mt-1.5" style={{ color: s.fill, fontWeight: 600 }}>{pct}% du total</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 2 : Heures par enseignant */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-5">
          <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Heures d'absence par enseignant</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            Total des heures d'absences irrégulières par enseignant
            {filtreActif && <span className="ml-1 text-blue-600">— sur l'intervalle sélectionné</span>}
          </p>
        </div>

        {ensData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ResponsiveContainer width="100%" height={Math.max(260, ensData.length * 56)}>
              <BarChart data={ensData} layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false}
                  axisLine={false} tickLine={false} unit="h" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }}
                  width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = ensData.find(e => e.name === payload[0]?.payload?.name);
                    return (
                      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm min-w-[190px]">
                        <p style={{ fontWeight: 700 }} className="text-gray-800">{d?.fullName}</p>
                        <p className="text-gray-500 text-xs">{d?.matiere} — {d?.sexe}</p>
                        <p style={{ color: d?.color, fontWeight: 600 }} className="mt-1">
                          {d?.heures}h d'absence ({d?.absences} période{(d?.absences ?? 0) > 1 ? "s" : ""})
                        </p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="heures" name="Heures" radius={[0, 6, 6, 0]}>
                  {ensData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {ensData.map((item, i) => {
                const maxVal = ensData[0]?.heures || 1;
                const pct = maxVal > 0 ? Math.round((item.heures / maxVal) * 100) : 0;
                return (
                  <div key={item.ppr} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: item.color, fontWeight: 700 }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gray-800 truncate" style={{ fontWeight: 600 }}>{item.fullName}</span>
                        <span className="text-xs" style={{ color: item.sexe === "Féminin" ? "#ec4899" : "#3b82f6" }}>
                          {item.sexe === "Féminin" ? "👩" : "👨"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.matiere}</p>
                      <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm w-10 h-8 rounded-full flex items-center justify-center"
                        style={{ fontWeight: 700, backgroundColor: `${item.color}15`, color: item.color }}>
                        {item.heures}h
                      </span>
                      <span className="text-xs text-gray-400">{item.absences} pér.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Empty msg={filtreActif ? "Aucune absence dans cet intervalle de dates" : "Aucune absence enregistrée"} />
        )}
      </div>

    </div>
  );
}
