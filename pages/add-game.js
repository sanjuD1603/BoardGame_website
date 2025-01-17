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

const predefinedTags = [
  "Strategy",
  "Family",
  "Party",
  "Card Game",
  "Cooperative",
  "Deck Building",
  "Worker Placement",
  "Area Control",
  "Dice Rolling",
  "Educational",
  "Fantasy",
  "Sci-Fi",
  "Adventure",
];

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
    const hasError = (result) => {
      return result?.items?.item?.error || false;
    };

    const fetchDetails = async () => {
      console.log("Fetching details for gameId:", gameId); // Debug log
      const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`;
      console.log("API URL:", url); // Debug log
      const response = await fetch(url);
      const xml = await response.text();
      console.log("Details XML:", xml);
      return parser.parse(xml);
    };

    let detailsResult = await fetchDetails();

    let retries = 3;
    while (hasError(detailsResult) && retries > 0) {
      console.log("Waiting for BGG to process request...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      detailsResult = await fetchDetails();
      retries--;
    }

    if (hasError(detailsResult)) {
      throw new Error("Failed to get game details after retries");
    }

    const game = Array.isArray(detailsResult.items.item)
      ? detailsResult.items.item[0]
      : detailsResult.items.item;

    if (!game) {
      throw new Error("No game details found");
    }

    let title = "";
    if (Array.isArray(game.name)) {
      const primaryName = game.name.find((n) => n["@_type"] === "primary");
      title = primaryName ? primaryName["@_value"] : game.name[0]["@_value"];
    } else if (game.name) {
      title = game.name["@_value"];
    }

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
        tags: [],
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
    owner: user?.user_metadata?.full_name || user?.email || "",
    tags: [],
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

      console.log("Search results:", matches);
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
      console.log("Selected game ID:", gameId); // Debug log
      setSearching(true);
      const { data, error } = await getGameDetails(gameId);

      if (error) {
        throw new Error(error);
      }

      if (data) {
        console.log("Setting game data:", data);
        setGameData({
          title: data.title || "",
          description: data.description || "",
          image_url: data.image_url || "",
          player_count: data.player_count || "2-4",
          playing_time: data.playing_time || "30",
          owner: user?.user_metadata?.full_name || user?.email || "",
          tags: [],
        });
      }
      setSearchResults([]);
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
      const [minPlayers, maxPlayers] = gameData.player_count
        .split("-")
        .map((num) => parseInt(num, 10));

      const gameDataToSubmit = {
        title: gameData.title,
        description: gameData.description,
        image_url: gameData.image_url,
        min_players: minPlayers,
        max_players: maxPlayers,
        playing_time: parseInt(gameData.playing_time, 10),
        user_id: user.id,
        owner: gameData.owner.trim() || user.email,
        tags: gameData.tags,
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

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {gameData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-indigo-600 text-white px-2 py-1 rounded-md text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setGameData((prev) => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== index),
                    }));
                  }}
                  className="ml-2 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {predefinedTags
              .filter((tag) => !gameData.tags.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setGameData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, tag],
                    }));
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md text-sm"
                >
                  + {tag}
                </button>
              ))}
          </div>
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
