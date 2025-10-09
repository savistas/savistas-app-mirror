import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Exposer Supabase dans la console pour debug (en mode développement)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).supabase = supabase;
  console.log('🔧 Supabase client exposé dans window.supabase pour debug');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
