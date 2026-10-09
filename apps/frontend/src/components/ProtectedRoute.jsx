import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route wrapper that checks for authentication and optional role restrictions.
 */
const ProtectedRoute = ({ component: Component, adminOnly, allowedRoles, ...rest }) => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isAuthenticated) return <Redirect to="/auth/login" />;
        if (adminOnly && role !== "admin") return <Redirect to="/" />;
        if (allowedRoles && !allowedRoles.includes(role)) return <Redirect to="/" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
