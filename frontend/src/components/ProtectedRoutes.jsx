import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div></div>; // Or a proper loading spinner
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoutes;
