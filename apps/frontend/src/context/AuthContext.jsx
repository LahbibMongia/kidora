import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(localStorage.getItem("token") || null);
  const [user, setUserState] = useState(null);
  const [role, setRoleState] = useState(localStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure _id exists if id is present
        if (parsedUser && !parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
        }
        setUserState(parsedUser);
      } catch (e) {
        console.error("Failed to parse user info from localStorage", e);
        // Clean up invalid session data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        setTokenState(null);
        setUserState(null);
        setRoleState(null);
      }
      setRoleState(storedRole);
    }
    setLoading(false);
  }, []);

  /**
   * Log in user by saving credentials in state and localStorage.
   */
  const login = (newToken, newUser, newRole) => {
    // Ensure _id is present on the user object
    const sanitizedUser = newUser ? { ...newUser } : null;
    if (sanitizedUser && !sanitizedUser._id && sanitizedUser.id) {
      sanitizedUser._id = sanitizedUser.id;
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(sanitizedUser));
    localStorage.setItem("role", newRole || "");
    
    setTokenState(newToken);
    setUserState(sanitizedUser);
    setRoleState(newRole || "");
  };

  /**
   * Log out user by clearing state and localStorage.
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    
    setTokenState(null);
    setUserState(null);
    setRoleState(null);
  };

  /**
   * Update the logged in user details dynamically.
   */
  const setUser = (updatedUser) => {
    // Ensure _id is present on the user object
    const sanitizedUser = updatedUser ? { ...updatedUser } : null;
    if (sanitizedUser && !sanitizedUser._id && sanitizedUser.id) {
      sanitizedUser._id = sanitizedUser.id;
    }

    localStorage.setItem("user", JSON.stringify(sanitizedUser));
    setUserState(sanitizedUser);
    if (sanitizedUser && sanitizedUser.role) {
      localStorage.setItem("role", sanitizedUser.role);
      setRoleState(sanitizedUser.role);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user, // Retained for backwards compatibility
        currentUser: user, // Exposing currentUser as requested
        token,
        role,
        isAuthenticated,
        login,
        logout,
        setUser,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};