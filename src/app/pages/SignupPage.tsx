import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../context/AppContext";
import { BookOpen, Eye, EyeOff, UserPlus, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const { signup, isLoading } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }

    try {
      await signup(form.nom, form.prenom, form.email, form.password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* New logo: Ministry of Education header */}
          <div className="mb-4">
            <img
              src="/en-tete.png"
              alt="Logo Ministère de l'Éducation Nationale"
              className="mx-auto"
              style={{ maxWidth: "100%", height: "auto", maxHeight: "100px" }}
            />
          </div>
          {/* Original EduAbsence logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 700 }}>EduAbsence</h1>
          <p className="text-gray-500 mt-1">Gestion des absences des enseignants</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Créer un compte</h2>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-5">
            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700" style={{ fontWeight: 500 }}>
              Création de compte réservée aux <strong>administrateurs</strong>. Les comptes directeurs sont créés par un administrateur.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Votre nom"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  placeholder="Votre prénom"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Adresse email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition shadow-sm mt-2 disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              <UserPlus className="w-5 h-5" />
              {isLoading ? "Inscription..." : "Créer mon compte administrateur"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-blue-600 hover:underline" style={{ fontWeight: 500 }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
