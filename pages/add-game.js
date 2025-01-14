import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import { searchBoardGame } from "../lib/bggApi";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "@_value",
  ignoreDeclaration: true,
  removeNSPrefix: true,
});

async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

async function getGameDetails(gameId) {
  try {
    const detailsResponse = await retry(() =>
      fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`),
    );
    const detailsXml = await detailsResponse.text();
    console.log("Details XML:", detailsXml); // Debug log
    const detailsResult = parser.parse(detailsXml);
    console.log("Parsed details:", detailsResult); // Debug log

    // Handle both single item and array responses
    const game = Array.isArray(detailsResult.items.item)
      ? detailsResult.items.item[0]
      : detailsResult.items.item;

    if (!game) {
      throw new Error("No game details found");
    }

    // Handle different name formats
    let title = "";
    if (Array.isArray(game.name)) {
      const primaryName = game.name.find((n) => n["@_type"] === "primary");
      title = primaryName ? primaryName["@_value"] : game.name[0]["@_value"];
    } else if (game.name) {
      title = game.name["@_value"];
    }

    // Clean up description - remove HTML tags if present
    let description = game.description || "";
    description = description.replace(/<[^>]*>/g, "");

    return {
      data: {
        title: title || "",
        description: description,
        image_url: game.image || game.thumbnail || "",
        player_count: `${game.minplayers?.["@_value"] || "1"}-${game.maxplayers?.["@_value"] || "1"}`,
        playing_time: game.playingtime?.["@_value"] || "30",
        owner: "",
      },
    };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game details" };
  }
}

export default function AddGame({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [gameData, setGameData] = useState({
    title: "",
    description: "",
    image_url: "",
    player_count: "",
    playing_time: "",
    owner: "",
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
      const { matches, error } = await searchBoardGame(searchQuery);

      if (error) {
        alert(error);
        return;
      }

      setSearchResults(matches || []);
    } catch (error) {
      alert("Error searching for game");
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectGame = async (gameId) => {
    try {
      setSearching(true);
      const { data, error } = await getGameDetails(gameId);

      if (error) {
        throw new Error(error);
      }

      if (data) {
        console.log("Setting game data:", data); // Debug log
        setGameData({
          title: data.title || "",
          description: data.description || "",
          image_url: data.image_url || "",
          player_count: data.player_count || "2-4",
          playing_time: data.playing_time || "30",
          owner: "",
        });
      }
      setSearchResults([]); // Clear search results after selection
    } catch (error) {
      alert("Error fetching game details");
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
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Search BoardGameGeek</h2>
        <div className="flex flex-col gap-2">
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
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {searching ? "Searching..." : "Search BGG"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-md shadow-lg border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {searchResults.map((game) => (
                  <li
                    key={game.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectGame(game.id)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{game.name}</span>
                      <span className="text-gray-500">{game.year}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Player Count (e.g., 2-4)
            </label>
            <input
              type="text"
              name="player_count"
              value={gameData.player_count}
              onChange={handleChange}
              required
              placeholder="e.g., 2-4"
              pattern="\d+-\d+"
              title="Please use format: min-max (e.g., 2-4)"
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
