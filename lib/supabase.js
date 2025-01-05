import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jhrfcqdryffwflmfahjh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase Anon Key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("games")
      .select("count")
      .single();

    if (error) {
      console.error("Supabase connection error:", error);
    } else {
      console.log("Supabase connection successful");
    }
  } catch (err) {
    console.error("Failed to connect to Supabase:", err);
  }
};

testConnection();
