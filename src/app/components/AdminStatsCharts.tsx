import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Calendar, X } from "lucide-react";
import { useApp } from "../context/AppContext";

// ─── Colors ───────────────────────────────────────────────────────────────────
const CYCLE_COLORS: Record<string, string> = {
  Primaire: "#10b981",
  Collège:  "#6366f1",
  Lycée:    "#8b5cf6",
};

const SEXE_COLORS: Record<string, string> = {
  Masculin: "#3b82f6",
  Féminin:  "#ec4899",
};

const ETABL_COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#10b981",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

// ─── Tooltip générique ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p style={{ fontWeight: 600 }} className="text-gray-800 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }}>
            {p.name}: <strong>{p.value}</strong> absence{p.value > 1 ? "s" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Pie inner label ──────────────────────────────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

const Empty = ({ height = 200 }: { height?: number }) => (
  <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
    Aucune donnée disponible
  </div>
);

// ─── Formate date ISO ─────────────────────────────────────────────────────────
const fmtLong = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminStatsCharts() {
  const { absences: allAbsences, enseignants, etablissements } = useApp();

  const today = new Date().toISOString().split("T")[0];

  // ── Filtre intervalle de dates (global) ────────────────────────────────────
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin,   setDateFin]   = useState("");
  const filtreActif = Boolean(dateDebut || dateFin);
  const resetDates  = () => { setDateDebut(""); setDateFin(""); };

  // ── Absences filtrées par intervalle de dates ──────────────────────────────
  const absences = allAbsences.filter(a => {
    if (dateDebut && a.dateAbsence < dateDebut) return false;
    if (dateFin   && a.dateAbsence > dateFin)   return false;
    return true;
  });

  const filteredAbsences   = absences;
  const filteredEnseignants = enseignants;

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalAbsences = filteredAbsences.length;
  const totalHeures   = filteredAbsences.reduce((s, a) => s + a.periode, 0);

  // ── 1. Absences par cycle ──────────────────────────────────────────────────
  const cycleData = (["Primaire", "Collège", "Lycée"] as const).map(cycle => {
    const pprs = filteredEnseignants.filter(e => e.cycle === cycle).map(e => e.ppr);
    return {
      name:     cycle,
      absences: filteredAbsences.filter(a => pprs.includes(a.enseignantPpr)).length,
      fill:     CYCLE_COLORS[cycle],
    };
  });

  // ── 2. Absences par sexe ───────────────────────────────────────────────────
  const sexeData = (["Masculin", "Féminin"] as const).map(sexe => {
    const pprs = filteredEnseignants.filter(e => e.sexe === sexe).map(e => e.ppr);
    return {
      name:  sexe,
      value: filteredAbsences.filter(a => pprs.includes(a.enseignantPpr)).length,
      fill:  SEXE_COLORS[sexe],
    };
  });

  // ── 3. Absences par établissement ──────────────────────────────────────────
  const etablMap: Record<string, number> = {};
  enseignants.forEach(e => {
    const etab = etablissements.find(et => et.id === e.etaId)?.nom;
    if (!etab) return;
    const count = absences.filter(a => a.enseignantPpr === e.ppr).length;
    if (count > 0) etablMap[etab] = (etablMap[etab] || 0) + count;
  });
  const etablData = Object.entries(etablMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, absCount]) => ({ name, absences: absCount }));

  return (
    <div className="space-y-6">

      {/* ── Filtre global : intervalle de dates ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-gray-700" style={{ fontWeight: 600 }}>
            Filtrer toutes les statistiques par intervalle de dates
          </span>
          {filtreActif && (
            <button
              onClick={resetDates}
              className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition"
              style={{ fontWeight: 600 }}
            >
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date début */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" style={{ fontWeight: 600 }}>📅 Date début</label>
            <input
              type="date"
              value={dateDebut}
              max={dateFin || today}
              onChange={e => { setDateDebut(e.target.value); if (dateFin && e.target.value > dateFin) setDateFin(e.target.value); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {/* Date fin */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500" style={{ fontWeight: 600 }}>📅 Date fin</label>
            <input
              type="date"
              value={dateFin}
              min={dateDebut || undefined}
              max={today}
              onChange={e => { setDateFin(e.target.value); if (dateDebut && e.target.value < dateDebut) setDateDebut(e.target.value); }}
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Résumé intervalle actif */}
        {filtreActif && (
          <div className="mt-3 flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
            <span className="text-xs text-blue-600" style={{ fontWeight: 500 }}>Intervalle actif :</span>
            {dateDebut && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full" style={{ fontWeight: 600 }}>
                {fmtLong(dateDebut)}
              </span>
            )}
            {dateDebut && dateFin && <span className="text-blue-400 text-xs">→</span>}
            {dateFin && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full" style={{ fontWeight: 600 }}>
                {fmtLong(dateFin)}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-1">
              — {totalAbsences} absence{totalAbsences > 1 ? "s" : ""} dans cette période
            </span>
          </div>
        )}
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total absences"   value={totalAbsences} color="blue" />
        <StatCard label="Total heures (h)" value={totalHeures}   color="indigo" subtitle="heures cumulées" />
        <StatCard
          label="Ce mois"
          value={filteredAbsences.filter(a =>
            a.dateAbsence.startsWith(new Date().toISOString().substring(0, 7))
          ).length}
          color="amber"
        />
        <StatCard
          label="Aujourd'hui"
          value={filteredAbsences.filter(a => a.dateAbsence === today).length}
          color="green"
        />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6">

        {/* ── Chart 1 : Absences par cycle ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Absences par cycle scolaire</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Répartition des absences selon le cycle (Primaire, Collège, Lycée)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cycleData.map(c => (
              <div key={c.name} className="rounded-xl p-4 flex items-center gap-4"
                style={{ backgroundColor: `${c.fill}15`, border: `1.5px solid ${c.fill}30` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${c.fill}25` }}>
                  {c.name === "Primaire" ? "🏫" : c.name === "Collège" ? "📚" : "🎓"}
                </div>
                <div>
                  <p className="text-xs" style={{ color: c.fill, fontWeight: 500 }}>{c.name}</p>
                  <p style={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1, color: c.fill }}>{c.absences}</p>
                  <p className="text-xs text-gray-500 mt-0.5">absence{c.absences > 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>

          {totalAbsences > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cycleData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} barSize={64}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="absences" name="Absences" radius={[8, 8, 0, 0]}>
                  {cycleData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        {/* ── Chart 2 : Absences par sexe ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Absences par sexe</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              Comparaison des absences entre enseignants masculins et féminins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              {totalAbsences > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={sexeData} cx="50%" cy="50%" innerRadius={55} outerRadius={105}
                      paddingAngle={4} dataKey="value" labelLine={false} label={renderPieLabel}>
                      {sexeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} absence(s)`, ""]} />
                    <Legend formatter={(value) => <span style={{ fontSize: "13px", fontWeight: 500 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty height={260} />}
            </div>
            <div className="space-y-4">
              {sexeData.map(s => {
                const total = sexeData.reduce((acc, x) => acc + x.value, 0);
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                const ensCount = filteredEnseignants.filter(e => e.sexe === s.name).length;
                return (
                  <div key={s.name} className="rounded-2xl p-4"
                    style={{ backgroundColor: `${s.fill}10`, border: `1.5px solid ${s.fill}25` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${s.fill}20` }}>
                          {s.name === "Masculin" ? "👨" : "👩"}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: s.fill }}>{s.name}</p>
                          <p className="text-xs text-gray-500">{ensCount} enseignant{ensCount > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ fontSize: "1.5rem", fontWeight: 700, color: s.fill, lineHeight: 1 }}>{s.value}</p>
                        <p className="text-xs text-gray-500">absence{s.value > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: s.fill }} />
                    </div>
                    <p className="text-xs text-right mt-1" style={{ color: s.fill, fontWeight: 500 }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Chart 3 : Absences par établissement ─────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Absences par établissement</h3>
            <p className="text-gray-500 text-sm mt-0.5">Nombre d'absences déclarées dans chaque établissement</p>
          </div>

          {etablData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ResponsiveContainer width="100%" height={Math.max(200, etablData.length * 52)}>
                <BarChart data={etablData} layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.length > 20 ? v.substring(0, 18) + "…" : v} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="absences" name="Absences" radius={[0, 6, 6, 0]}>
                    {etablData.map((item, i) => (
                      <Cell key={i} fill={ETABL_COLORS[i % ETABL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {etablData.map((item, i) => {
                  const maxVal = etablData[0]?.absences || 1;
                  const pct = Math.round((item.absences / maxVal) * 100);
                  const color = ETABL_COLORS[i % ETABL_COLORS.length];
                  return (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0"
                        style={{ backgroundColor: color, fontWeight: 700 }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate" style={{ fontWeight: 500 }}>{item.name}</p>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                      <span className="text-sm flex-shrink-0 px-2.5 py-1 rounded-full"
                        style={{ fontWeight: 700, backgroundColor: `${color}15`, color }}>
                        {item.absences}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <Empty />}
        </div>

      </div>
    </div>
  );
}