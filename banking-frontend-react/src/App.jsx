import React from "react";
import { useAuth } from "./context/AuthContext.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) return null; // avoid a login-screen flash while localStorage is read

  return user ? <Dashboard /> : <AuthScreen />;
}
