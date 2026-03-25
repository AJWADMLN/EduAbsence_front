import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { useApp } from "../context/AppContext";
import {
  BookOpen, Users, BarChart2, LogOut, Menu, X,
  ClipboardList, Home, Bell, Building2, UserCog
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, logout, absences, etablissements, loadAbsences, loadEnseignants, loadEtablissements, loadUsers } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadAbsences();
      loadEnseignants();
      loadEtablissements();
      if (currentUser.role === "consultant" || currentUser.role === "admin principal") loadUsers();
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = currentUser?.role === "consultant" || currentUser?.role === "admin principal";
  const isAdminPrincipal = currentUser?.role === "admin principal";

  const adminLinks = [
    { to: "/admin", label: "Tableau de bord", icon: Home, end: true },
    { to: "/admin/enseignants", label: "Enseignants", icon: Users },
    { to: "/admin/directeurs", label: "Directeurs", icon: UserCog },
    ...(isAdminPrincipal ? [
      { to: "/admin/consultants", label: "Consultants", icon: Users }
    ] : []),
    { to: "/admin/etablissements", label: "Établissements", icon: Building2 },
    { to: "/admin/statistiques", label: "Statistiques", icon: BarChart2 },
    ...(isAdminPrincipal ? [
      { to: "/admin/informations-personnelles", label: "Informations personnelles", icon: UserCog }
    ] : []),
  ];

  const dirLinks = [
    { to: "/directeur",                    label: "Tableau de bord",   icon: Home,          end: true },
    { to: "/directeur/enseignants",        label: "Mes enseignants",   icon: Users                   },
    { to: "/directeur/declarer-absence",   label: "Déclarer Absence",  icon: ClipboardList           },
    { to: "/directeur/gestion-absences",   label: "Gérer les absences", icon: Bell                   },
    { to: "/directeur/statistiques",       label: "Statistiques",      icon: BarChart2               },
  ];

  const links = isAdmin ? adminLinks : dirLinks;
  const todayAbsences = absences.filter(a => a.dateAbsence === new Date().toISOString().split("T")[0]).length;

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-gradient-to-b from-blue-700 to-blue-900 text-white ${mobile ? "w-72" : "w-64"}`}>
      {/* Logo */}
      <div className="flex flex-col items-center px-6 py-4 border-b border-blue-600/50 gap-3">
        {/* Ministry of Education header */}
        <div style={{ background: "white", borderRadius: "8px", padding: "4px 8px", display: "inline-flex" }}>
          <img
            src="/en-tete.png"
            alt="Logo"
            style={{ height: "36px", width: "auto" }}
          />
        </div>
        {/* Original EduAbsence logo */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>EduAbsence</p>
            <p className="text-blue-200" style={{ fontSize: "0.75rem" }}>
              {isAdminPrincipal ? "Admin Principal" : isAdmin ? "Administrateur" : "Directeur"}
            </p>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-blue-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 bg-blue-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm flex-shrink-0" style={{ fontWeight: 700 }}>
            {currentUser?.nom.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm truncate" style={{ fontWeight: 600 }}>{currentUser?.nom}</p>
            <p className="text-blue-300 truncate" style={{ fontSize: "0.75rem" }}>{currentUser?.email}</p>
            {!isAdmin && currentUser?.etaId && (() => {
              const eta = etablissements.find(e => e.id === currentUser.etaId);
              return eta ? (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-blue-300 flex-shrink-0" />
                  <p className="text-blue-200 truncate" style={{ fontSize: "0.7rem", fontWeight: 500 }}>
                    {eta.nom}
                  </p>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-blue-300"}`} />
                <span style={{ fontWeight: isActive ? 600 : 400 }}>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-blue-200 hover:bg-white/10 hover:text-white transition text-sm"
        >
          <LogOut className="w-5 h-5 text-blue-300" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0 shadow-xl">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex flex-col shadow-xl">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-gray-900" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                Bienvenue, {currentUser?.nom}
              </h1>
              <p className="text-gray-500 text-sm">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {todayAbsences > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700" style={{ fontWeight: 500 }}>
                  {todayAbsences} absence{todayAbsences > 1 ? "s" : ""} aujourd'hui
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}