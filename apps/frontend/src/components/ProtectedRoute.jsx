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
        if (!isAuthenticated) {
          // Redirect to login page if not logged in
          return <Redirect to="/auth/login" />;
        }

        if (adminOnly && role !== "admin") {
          // Redirect to root if user is not authorized as admin
          return <Redirect to="/" />;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
          return <Redirect to="/" />;
        }

        // Render the component if permissions pass
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
