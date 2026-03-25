import React from "react";
import DirecteurStatsCharts from "../../components/DirecteurStatsCharts";

export default function DirecteurStats() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Statistiques des absences</h2>
        <p className="text-gray-500 text-sm">Tableau de bord analytique des absences</p>
      </div>
      <DirecteurStatsCharts />
    </div>
  );
}
