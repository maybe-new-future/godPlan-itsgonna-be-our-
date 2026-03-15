import React from "react";
import { Navigate } from "react-router-dom";
import { getRoleFromToken, isLoggedIn } from "../auth/auth";

export default function RequireCompany({
  children,
}: {
  children: React.ReactElement;
}) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  if (getRoleFromToken() !== "COMPANY")
    return <Navigate to="/jobs" replace />;

  return children;
}