import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppProvider } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EnseignantsPage from "./pages/admin/EnseignantsPage";
import AdminStats from "./pages/admin/AdminStats";
import DirecteursPage from "./pages/admin/DirecteursPage";
import EtablissementsPage from "./pages/admin/EtablissementsPage";
import ConsultantsPage from "./pages/admin/ConsultantsPage";
import InformationsPersonnelles from "./pages/admin/InformationsPersonnelles";
import DirecteurDashboard from "./pages/directeur/DirecteurDashboard";
import DirecteurEnseignants from "./pages/directeur/DirecteurEnseignants";
import DeclarerAbsence from "./pages/directeur/DeclarerAbsence";
import DirecteurAbsences from "./pages/directeur/DirecteurAbsences";
import DirecteurStats from "./pages/directeur/DirecteurStats";
import ProtectedRoute from "./components/ProtectedRoute";

// AppProvider est placé ici, DANS l'arbre du router, pour garantir
// que le contexte est disponible quel que soit le cycle de rendu/HMR.
function Root() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login",  element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      // Admin routes
      { path: "admin",                  element: <ProtectedRoute requiredRole="consultant"><AdminDashboard /></ProtectedRoute> },
      { path: "admin/enseignants",      element: <ProtectedRoute requiredRole="consultant"><EnseignantsPage /></ProtectedRoute> },
      { path: "admin/directeurs",       element: <ProtectedRoute requiredRole="consultant"><DirecteursPage /></ProtectedRoute> },
      { path: "admin/etablissements",   element: <ProtectedRoute requiredRole="consultant"><EtablissementsPage /></ProtectedRoute> },
      { path: "admin/statistiques",     element: <ProtectedRoute requiredRole="consultant"><AdminStats /></ProtectedRoute> },
      { path: "admin/consultants",   element: <ProtectedRoute requiredRole="admin principal"><ConsultantsPage /></ProtectedRoute> },
      { path: "admin/informations-personnelles", element: <ProtectedRoute requiredRole="admin principal"><InformationsPersonnelles /></ProtectedRoute> },
      // Directeur routes
      { path: "directeur",                       element: <ProtectedRoute requiredRole="directeur"><DirecteurDashboard /></ProtectedRoute> },
      { path: "directeur/enseignants",           element: <ProtectedRoute requiredRole="directeur"><DirecteurEnseignants /></ProtectedRoute> },
      { path: "directeur/declarer-absence",      element: <ProtectedRoute requiredRole="directeur"><DeclarerAbsence /></ProtectedRoute> },
      { path: "directeur/gestion-absences",      element: <ProtectedRoute requiredRole="directeur"><DirecteurAbsences /></ProtectedRoute> },
      { path: "directeur/statistiques",          element: <ProtectedRoute requiredRole="directeur"><DirecteurStats /></ProtectedRoute> },
    ],
  },
]);