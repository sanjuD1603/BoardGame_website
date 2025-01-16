import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "../styles/globals.css";
import Navbar from "../components/Navbar";

// Development server configuration
export const devConfig = {
  baseURL: process.env.NEXT_PUBLIC_DEV_URL || "http://localhost:3000",
  apiURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
};

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    owner: "",
    playerCount: "",
    playingTime: "",
    // We'll add gameType later
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 dark">
      <Navbar user={user} />
      <Component {...pageProps} user={user} />
    </div>
  );
}

export default MyApp;
