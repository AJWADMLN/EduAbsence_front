import React, { useState } from "react";
import { api } from "../../../lib/api";
import { useApp } from "../../context/AppContext";
import { Shield, Key, Save, User as UserIcon, Mail } from "lucide-react";
import { toast } from "sonner";

export default function InformationsPersonnelles() {
  const { currentUser, setCurrentUser } = useApp();
  
  const [formData, setFormData] = useState({
    nom: currentUser?.nom || "",
    prenom: currentUser?.prenom || "",
    email: currentUser?.email || "",
    oldPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateAdminPrincipal(formData);
      
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          nom: formData.nom || currentUser.nom,
          prenom: formData.prenom || currentUser.prenom,
          email: formData.email || currentUser.email
        });
      }
      
      toast.success("Informations personnelles mises à jour avec succès.");
      setFormData(prev => ({ ...prev, oldPassword: "", newPassword: "" })); // Clear password fields
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Informations de Profil</h2>
          <p className="text-gray-500 mt-1">Gérez les paramètres de sécurité de votre compte principal.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
              {currentUser?.nom?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentUser?.nom} {currentUser?.prenom}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                  <Shield className="w-3 h-3" />
                  Admin Principal
                </span>
                <span className="text-sm text-gray-500">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" /> Nom
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 outline-none"
                placeholder="Votre nom"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" /> Prénom
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 outline-none"
                placeholder="Votre prénom"
              />
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 outline-none"
              placeholder="Votre email"
            />
          </div>

          <hr className="border-gray-100 my-6" />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Sécurité</h3>
            <p className="text-xs text-gray-500 pb-2">L'ancien mot de passe est obligatoire pour modifier l'email ou définir un nouveau mot de passe.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" /> Ancien Mot de passe
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 outline-none"
                  placeholder="Requis pour email/mot de passe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" /> Nouveau Mot de passe
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-gray-50/50 outline-none"
                  placeholder="Optionnel"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-600/20 active:bg-blue-800 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Sauvegarder les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
