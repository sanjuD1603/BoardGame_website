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
    const detailsResponse = await retry(() =>
      fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`),
    );
    const detailsXml = await detailsResponse.text();
    const detailsResult = parser.parse(detailsXml);
    const game = detailsResult.items.item;

    return {
      data: {
        title: Array.isArray(game.name)
          ? game.name.find((n) => n["@_type"] === "primary")?.["@_value"] ||
            game.name[0]["@_value"] ||
            ""
          : game.name["@_value"] || "",
        description: game.description || "",
        image_url: game.image || game.thumbnail || "",
        min_players: game.minplayers?.["@_value"] || "",
        max_players: game.maxplayers?.["@_value"] || "",
        playing_time: game.playingtime?.["@_value"] || "",
        owner: "",
      },
    };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game details" };
  }
}
