import React from "react";
import AdminStatsCharts from "../../components/AdminStatsCharts";

export default function AdminStats() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-gray-900" style={{ fontWeight: 700 }}>Statistiques des absences</h2>
        <p className="text-gray-500 text-sm">Vue d'ensemble analytique des absences du corps enseignant</p>
      </div>
      <AdminStatsCharts />
    </div>
  );
}
