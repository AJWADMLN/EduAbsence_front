import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { useApp } from "../context/AppContext";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];
const QUART_COLORS: Record<string, string> = {
  "matin": "#f59e0b",
  "soir":  "#6366f1",
};

export default function StatsCharts() {
  const { absences, enseignants } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().substring(0, 7);

  // Absences par enseignant (counted by totalHeureAbsences from backend)
  const absParEnseignant = enseignants
    .map(e => ({
      name: `${e.prenom.charAt(0)}. ${e.nom}`,
      heures: e.totalHeureAbsences,
    }))
    .filter(e => e.heures > 0)
    .sort((a, b) => b.heures - a.heures);

  // Absences par quart
  const quartData = (["matin", "soir"] as const).map(q => ({
    name: q === "matin" ? "🌅 Matin" : "🌆 Soir",
    value: absences.filter(a => a.quart === q).length,
    fill: QUART_COLORS[q],
  }));

  // Absences par mois
  const moisLabels: Record<string, string> = {
    "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Juin",
    "07": "Juil", "08": "Août", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc"
  };
  const absParMois = absences.reduce<Record<string, number>>((acc, a) => {
    const month = a.dateAbsence.substring(5, 7);
    acc[month] = (acc[month] || 0) + a.periode;
    return acc;
  }, {});
  const moisData = Object.entries(absParMois)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => ({ name: moisLabels[m] || m, heures: v }));

  // Stats globales
  const totalAbsences  = absences.length;
  const totalHeures    = absences.reduce((s, a) => s + a.periode, 0);
  const enseignantsAbsents = new Set(absences.map(a => a.enseignantPpr)).size;
  const matiereStats   = enseignants.reduce<Record<string, number>>((acc, e) => {
    if (e.totalHeureAbsences > 0 && e.matiere) {
      acc[e.matiere] = (acc[e.matiere] || 0) + e.totalHeureAbsences;
    }
    return acc;
  }, {});

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
          <p style={{ fontWeight: 600 }} className="text-gray-800">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total absences"       value={totalAbsences}      color="blue"  />
        <StatCard label="Total heures"         value={totalHeures}        color="red"   subtitle="heures cumulées" />
        <StatCard label="Enseignants absents"  value={enseignantsAbsents} color="amber" subtitle={`sur ${enseignants.length}`} />
        <StatCard label="Ce mois (absences)"   value={absences.filter(a => a.dateAbsence.startsWith(thisMonth)).length} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - heures par enseignant */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Heures d'absence par enseignant</h3>
          {absParEnseignant.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={absParEnseignant} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="heures" name="Heures" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>

        {/* Pie chart - quart matin/soir */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Répartition Matin / Soir</h3>
          {quartData.some(q => q.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={quartData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={95}
                  paddingAngle={3} dataKey="value"
                >
                  {quartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} absence(s)`, ""]} />
                <Legend formatter={(value) => <span style={{ fontSize: "13px" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400 text-sm">Aucune donnée</div>
          )}
        </div>

        {/* Line chart - évolution mensuelle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Évolution mensuelle (heures)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={moisData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} unit="h" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="heures" name="Heures" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart - absences par matière */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-800 mb-4" style={{ fontWeight: 600 }}>Heures d'absence par matière</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={Object.entries(matiereStats).map(([name, v]) => ({ name, heures: v }))}
              margin={{ top: 5, right: 10, left: -20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} unit="h" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="heures" name="Heures" radius={[4, 4, 0, 0]}>
                {Object.entries(matiereStats).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, subtitle }: { label: string; value: number; color: string; subtitle?: string }) {
  const colorMap: Record<string, { bg: string; text: string; num: string }> = {
    blue:  { bg: "bg-blue-50",    text: "text-blue-600",    num: "text-blue-700" },
    red:   { bg: "bg-red-50",     text: "text-red-600",     num: "text-red-700" },
    amber: { bg: "bg-amber-50",   text: "text-amber-600",   num: "text-amber-700" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", num: "text-emerald-700" },
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
