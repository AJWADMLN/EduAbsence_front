import React, { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { UserCheck, Clock, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ValiderAdmins() {
  const [unvalidatedAdmins, setUnvalidatedAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnvalidated = async () => {
    try {
      setLoading(true);
      const data = await api.getUnvalidatedAdmins();
      setUnvalidatedAdmins(data);
    } catch (err) {
      toast.error("Erreur lors du chargement des administrateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnvalidated();
  }, []);

  const handleValidate = async (id: string, nom: string) => {
    try {
      await api.validateAdmin(id);
      toast.success(`Le compte de l'administrateur ${nom} a été validé avec succès.`);
      setUnvalidatedAdmins(prev => prev.filter(admin => admin._id !== id));
    } catch (err) {
      toast.error("Erreur lors de la validation.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Valider Administrateurs</h2>
          <p className="text-gray-500 mt-1">Gérez les demandes de création de comptes administrateurs.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
          <ShieldCheck className="w-5 h-5" />
          Accès Principal
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">En attente de validation</h3>
              <p className="text-sm text-gray-500">{unvalidatedAdmins.length} demande(s)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : unvalidatedAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune demande en attente</h3>
              <p className="text-gray-500 max-w-sm">Tous les comptes administrateurs ont été traités.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Nom</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Prénom</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unvalidatedAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="px-6 py-4 font-medium text-gray-900">{admin.nom}</td>
                    <td className="px-6 py-4 text-gray-600">{admin.prenom}</td>
                    <td className="px-6 py-4 text-gray-500">{admin.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleValidate(admin._id, admin.nom)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium text-sm transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Approuver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
