import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { firebaseEnabled } from "./firebase";
import { AuthProvider } from "./hooks/useAuth";
import AuthGate from "./components/AuthGate";
import App from "./App";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {firebaseEnabled ? (
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
