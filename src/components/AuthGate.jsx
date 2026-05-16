import { useAuth } from "../hooks/useAuth";
import Auth from "./Auth";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">loading...</div>;
  if (!user) return <Auth />;
  return children;
}
