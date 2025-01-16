import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing Supabase URL");
if (!supabaseAnonKey) throw new Error("Missing Supabase Anon Key");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export const auth = {
  // Sign up with email and password
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get current user
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Password reset request
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Update password
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // OAuth sign in (Google, GitHub, etc.)
  signInWithProvider: async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },
};

// Game related functions
export const games = {
  // Delete game
  deleteGame: async (gameId, userId) => {
    const { error } = await supabase
      .from("games")
      .delete()
      .match({ id: gameId, user_id: userId });
    return { error };
  },

  // Add game
  addGame: async (gameData) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return { error: userError };

    const gameWithOwner = {
      ...gameData,
      owner: userData.user.email,
      user_id: userData.user.id,
    };

    const { data, error } = await supabase
      .from("games")
      .insert([gameWithOwner])
      .select();
    return { data, error };
  },

  // Get all games
  getAllGames: async () => {
    const { data, error } = await supabase
      .from("games")
      .select(
        `
        *,
        profiles:user_id (
          username,
          full_name,
          email
        )
      `,
      )
      .order("created_at", { ascending: false });
    return { data, error };
  },

  // Get user's games
  getUserGames: async (userId) => {
    const { data, error } = await supabase
      .from("games")
      .select(
        `
        *,
        profiles:user_id (
          username,
          full_name,
          email
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },
};

// Auth state change listener
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// Export deleteGame function for backward compatibility
export const deleteGame = async (gameId, userId) => {
  return games.deleteGame(gameId, userId);
};
