import { createContext, useContext, useEffect, useState } from "react";
import { api, session } from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const ended = () => {
      setUser(null);
      setNotice("Your session has ended. Please sign in again.");
    };
    window.addEventListener("session-ended", ended);
    if (session.get())
      api("/auth/me")
        .then((data) => setUser(data.user))
        .catch((error) => {
          if (error.status !== 401) setNotice(error.message);
        })
        .finally(() => setLoading(false));
    else setLoading(false);
    return () => window.removeEventListener("session-ended", ended);
  }, []);
  useEffect(() => {
    if (!user) return;
    let expiration;
    try {
      expiration =
        JSON.parse(
          atob(
            session
              .get()
              .split(".")[1]
              .replaceAll("-", "+")
              .replaceAll("_", "/"),
          ),
        ).exp * 1000;
    } catch {
      return;
    }
    const timer = setTimeout(
      () => {
        session.clear();
        window.dispatchEvent(new Event("session-ended"));
      },
      Math.max(0, expiration - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [user]);
  const authenticate = async (mode, body) => {
    const data = await api(`/auth/${mode}`, { method: "POST", body });
    session.set(data.accessToken);
    setUser(data.user);
    setNotice("");
    return data;
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    session.clear();
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, notice, authenticate, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
