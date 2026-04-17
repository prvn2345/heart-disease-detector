/**
 * AuthContext.jsx
 * Provides authentication state and helpers throughout the app.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/signup", { name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
