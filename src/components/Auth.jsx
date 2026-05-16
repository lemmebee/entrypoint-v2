import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const { signinGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signinGoogle();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-subtitle">ENTRYPOINT V2</div>
        <h1 className="auth-title">Lock-In</h1>
      </div>

      <button className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
        {loading ? "..." : "Sign in with Google"}
      </button>

      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}
