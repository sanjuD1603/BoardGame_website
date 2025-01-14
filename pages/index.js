import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import GameCard from "../components/GameCard";
import SearchBar from "../components/SearchBar";

export default function Home({ user }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGames();
  }, [searchTerm]); // Added searchTerm dependency to refresh when search changes

  async function fetchGames() {
    try {
      setLoading(true);
      let query = supabase.from("games").select("*");

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteGame = (deletedGameId) => {
    setGames(games.filter((game) => game.id !== deletedGameId));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-8 text-center">
          Board Game Collection
        </h1>

        <SearchBar onSearch={setSearchTerm} />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-xl">No board games found</p>
            <p className="mt-2">Try adjusting your search or add some games!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                user={user}
                onDelete={handleDeleteGame}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
