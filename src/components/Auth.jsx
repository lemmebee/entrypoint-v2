import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const { signin, signup, signinGoogle } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await signin(email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

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
        Sign in with Google
      </button>

      <div className="auth-divider"><span>or</span></div>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          minLength={6}
          required
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "..." : isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <button
        className="auth-toggle"
        onClick={() => {
          setIsSignup(!isSignup);
          setError("");
        }}
      >
        {isSignup ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </div>
  );
}
