import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import { searchBoardGame } from "../lib/bggApi";

export default function AddGame({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gameData, setGameData] = useState({
    title: "",
    description: "",
    image_url: "",
    min_players: "",
    max_players: "",
    playing_time: "",
    owner: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGameData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const { data, error } = await searchBoardGame(searchQuery);
      
      if (error) {
        alert(error);
        return;
      }

      setGameData(data);
    } catch (error) {
      alert('Error searching for game');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to add a game");
      return;
    }

    try {
      setLoading(true);
      const gameDataToSubmit = {
        ...gameData,
        user_id: user.id,
        owner: gameData.owner.trim() || user.email,
      };

      const { error } = await supabase.from("games").insert([gameDataToSubmit]);

      if (error) throw error;
      router.push("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Board Game</h1>
      
      {/* BGG Search Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Search BoardGameGeek</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter game name to search..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {searching ? "Searching..." : "Search BGG"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Search BoardGameGeek to auto-fill game details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={gameData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={gameData.description}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={gameData.image_url}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Players
            </label>
            <input
              type="number"
              name="min_players"
              value={gameData.min_players}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Players
            </label>
            <input
              type="number"
              name="max_players"
              value={gameData.max_players}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Playing Time (min)
            </label>
            <input
              type="number"
              name="playing_time"
              value={gameData.playing_time}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Owner Name
          </label>
          <input
            type="text"
            name="owner"
            value={gameData.owner}
            onChange={handleChange}
            placeholder="Enter owner's name (optional)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            If left empty, your email will be used as owner information
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? "Adding..." : "Add Game"}
        </button>
      </form>
    </div>
  );
}
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import { searchBoardGame } from "../lib/bggApi";

export default function AddGame({ user }) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameData, setGameData] = useState({
    title: "",
    description: "",
    image_url: "",
    min_players: "",
    max_players: "",
    playing_time: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to add a game");
      return;
    }

    try {
      setLoading(true);
      const gameDataToSubmit = {
        ...gameData,
        user_id: user.id,
        owner: gameData.owner.trim() || user.email, // Use owner input if provided, otherwise use email
      };

      const { error } = await supabase.from("games").insert([gameDataToSubmit]);

      if (error) throw error;
      router.push("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGameData((prev) => ({
      };
      
      const handleSearch = async (e) => {
        e.preventDefault();
        <h1 className="text-2xl font-bold mb-6">Add New Board Game</h1>
        
        {/* BGG Search Section */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Search BoardGameGeek</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter game name to search..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {searching ? "Searching..." : "Search BGG"}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Search BoardGameGeek to auto-fill game details
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
        if (!searchQuery.trim()) return;
      
        try {
          setSearching(true);
          const { data, error } = await searchBoardGame(searchQuery);
          
          if (error) {
            alert(error);
            return;
          }
      
          setGameData(data);
        } catch (error) {
          alert('Error searching for game');
          console.error(error);
        } finally {
          setSearching(false);
        }
      };
      
      return (
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Board Game</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={gameData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={gameData.description}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={gameData.image_url}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Players
            </label>
            <input
              type="number"
              name="min_players"
              value={gameData.min_players}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Players
            </label>
            <input
              type="number"
              name="max_players"
              value={gameData.max_players}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Playing Time (min)
            </label>
            <input
              type="number"
              name="playing_time"
              value={gameData.playing_time}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Owner Name
          </label>
          <input
            type="text"
            name="owner"
            value={gameData.owner}
            onChange={handleChange}
            placeholder="Enter owner's name (optional)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            If left empty, your email will be used as owner information
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? "Adding..." : "Add Game"}
        </button>
      </form>
    </div>
  );
}
