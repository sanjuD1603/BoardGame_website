import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import GameCard from "../components/GameCard";
import SearchBar from "../components/SearchBar";
import GameFilters from "../components/GameFilters";

export default function Home({ user, filters, setFilters }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const loader = useRef(null);
  const GAMES_PER_PAGE = 12;

  // Extract unique owners from games
  const uniqueOwners = useMemo(() => {
    const owners = [...new Set(games.map((game) => game.owner))];
    return owners.filter((owner) => owner); // Remove empty values
  }, [games]);

  const fetchGames = useCallback(
    async (isNewSearch = false) => {
      if (isNewSearch) {
        setPage(0);
        setGames([]);
        setHasMore(true);
      }
      try {
        setLoading(true);
        let query = supabase.from("games").select("*", { count: "exact" });

        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`);
        }

        // Add pagination
        query = query
          .order("created_at", { ascending: false })
          .range(page * GAMES_PER_PAGE, (page + 1) * GAMES_PER_PAGE - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        // Apply filters to the data
        let filteredData = data || [];

        if (filters.owner) {
          filteredData = filteredData.filter(
            (game) => game.owner === filters.owner,
          );
        }

        if (filters.playerCount) {
          filteredData = filteredData.filter((game) => {
            const count = game.player_count;
            switch (filters.playerCount) {
              case "1":
                return count.includes("1");
              case "2":
                return count.includes("2");
              case "3-4":
                return count.includes("3") || count.includes("4");
              case "5+":
                return count.split("-").some((num) => parseInt(num) >= 5);
              default:
                return true;
            }
          });
        }

        if (filters.playingTime) {
          filteredData = filteredData.filter((game) => {
            const time = parseInt(game.playing_time);
            switch (filters.playingTime) {
              case "short":
                return time <= 30;
              case "medium":
                return time > 30 && time <= 60;
              case "long":
                return time > 60;
              default:
                return true;
            }
          });
        }

        const newGames = isNewSearch
          ? filteredData
          : [...games, ...filteredData];
        setGames(newGames);
        setHasMore(newGames.length < count);
        setInitialLoad(false);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filters, games, page],
  );

  useEffect(() => {
    fetchGames(true);
  }, [searchTerm, filters]); // Refresh when search or filters change

  // Infinite scroll observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    }, options);

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [hasMore, loading]);

  useEffect(() => {
    if (!initialLoad && page > 0) {
      fetchGames();
    }
  }, [page, fetchGames]);

  const handleDeleteGame = (deletedGameId) => {
    setGames(games.filter((game) => game.id !== deletedGameId));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="sticky top-0 z-10 bg-gray-900 pb-6 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-100 mb-8 text-center">
            Board Game Collection
          </h1>

          <div className="mb-6">
            <SearchBar onSearch={setSearchTerm} />
          </div>

          <GameFilters
            filters={filters}
            setFilters={setFilters}
            owners={uniqueOwners}
          />
        </div>

        {loading && initialLoad ? (
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

        {/* Infinite scroll loader */}
        {!initialLoad && hasMore && (
          <div ref={loader} className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
