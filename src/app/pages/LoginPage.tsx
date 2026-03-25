import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../context/AppContext";
import { BookOpen, Eye, EyeOff, LogIn, ShieldCheck, UserCog } from "lucide-react";

type LoginRole = "consultant" | "directeur";

export default function LoginPage() {
  const { currentUser, loginUnified, isLoading } = useApp();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "consultant" || currentUser.role === "admin principal") navigate("/admin");
      else navigate("/directeur");
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginUnified(form.email, form.password);
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect.");
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
          <h2 className="text-gray-800 mb-5" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Connexion</h2>

          {/* Role selector has been removed */}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg transition shadow-sm disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
              style={{ fontWeight: 600 }}
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline" style={{ fontWeight: 500 }}>
              S'inscrire
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
