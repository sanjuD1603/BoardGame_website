import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
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

export async function searchBoardGame(query) {
  try {
    console.log("Searching for:", query);
    // First, search for the game
    const searchResponse = await retry(() =>
      fetch(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
          query,
        )}&type=boardgame`,
      ),
    );
    const searchXml = await searchResponse.text();
    console.log("Search XML:", searchXml);
    const searchResult = parser.parse(searchXml);
    console.log("Parsed search result:", searchResult);

    // Get all matching items
    let searchItems = searchResult.items.item;
    if (!searchItems) {
      return { error: "No games found" };
    }

    // Convert to array if single item
    if (!Array.isArray(searchItems)) {
      searchItems = [searchItems];
    }

    // Get the first 5 matches
    const matches = searchItems.slice(0, 5).map((item) => ({
      id: item.id,
      name:
        item.name?.["@_value"] ||
        (Array.isArray(item.name) ? item.name[0]["@_value"] : "Unknown"),
      year: item.yearpublished?.["@_value"] || "N/A",
    }));

    return { matches };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game data" };
  }
}

export async function getGameDetails(gameId) {
  try {
    // Function to check if the response contains an error
    const hasError = (result) => {
      return result?.items?.item?.error || false;
    };

    // Function to fetch game details
    const fetchDetails = async () => {
      const response = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`,
      );
      const xml = await response.text();
      console.log("Details XML:", xml);
      return parser.parse(xml);
    };

    // Initial fetch
    let detailsResult = await fetchDetails();

    // If we get an error, wait and retry up to 3 times
    let retries = 3;
    while (hasError(detailsResult) && retries > 0) {
      console.log("Waiting for BGG to process request...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      detailsResult = await fetchDetails();
      retries--;
    }

    // If we still have an error after retries, throw an error
    if (hasError(detailsResult)) {
      throw new Error("Failed to get game details after retries");
    }

    const game = Array.isArray(detailsResult.items.item)
      ? detailsResult.items.item[0]
      : detailsResult.items.item;

    if (!game) {
      throw new Error("No game details found");
    }

    // Get the player count range
    const minPlayers = game.minplayers?.["@_value"] || "1";
    const maxPlayers = game.maxplayers?.["@_value"] || "1";
    const playerCount = `${minPlayers}-${maxPlayers}`;

    return {
      data: {
        title: Array.isArray(game.name)
          ? game.name.find((n) => n["@_type"] === "primary")?.["@_value"] ||
            game.name[0]["@_value"] ||
            ""
          : game.name["@_value"] || "",
        description: game.description || "",
        image_url: game.image || game.thumbnail || "",
        player_count: playerCount,
        playing_time: game.playingtime?.["@_value"] || "30",
        owner: "",
      },
    };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game details" };
  }
}
