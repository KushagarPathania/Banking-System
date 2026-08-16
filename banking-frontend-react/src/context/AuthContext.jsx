import React, { createContext, useContext, useEffect, useState } from "react";
import { api, storage } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedUser = storage.getUser();
    const savedToken = storage.getToken();
    if (savedUser && savedToken) setUser(savedUser);
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    storage.setToken(data.token);
    storage.setUser(data.user);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const data = await api.register(name, email, password);
    storage.setToken(data.token);
    storage.setUser(data.user);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // clear local state regardless of whether the network call succeeded
    }
    storage.clearToken();
    storage.clearUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
