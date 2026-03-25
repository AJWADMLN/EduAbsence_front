import React from "react";
import { Navigate } from "react-router";
import { useApp } from "../context/AppContext";
import type { Role } from "../context/AppContext";
import Layout from "./Layout";

interface Props {
  children: React.ReactNode;
  requiredRole: Role;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== requiredRole) {
    if (requiredRole === "consultant" && currentUser.role === "admin principal") {
      // Allow admin principal to access consultant routes
    } else {
      return <Navigate to={currentUser.role === "consultant" || currentUser.role === "admin principal" ? "/admin" : "/directeur"} replace />;
    }
  }

  return <Layout>{children}</Layout>;
}
