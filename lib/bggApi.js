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

    // Handle both single item and array responses
    const firstItem = Array.isArray(searchResult.items.item)
      ? searchResult.items.item[0]
      : searchResult.items.item;

    if (!firstItem?.id) {
      return { error: "No games found" };
    }

    // Get detailed info for the first game found
    const gameId = firstItem.id;
    console.log("Found game ID:", gameId);

    // Add a small delay to prevent rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const detailsResponse = await retry(() =>
      fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`),
    );
    const detailsXml = await detailsResponse.text();
    console.log("Details XML:", detailsXml);
    const detailsResult = parser.parse(detailsXml);
    console.log("Parsed details:", detailsResult);

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
        owner: "", // Added empty owner field
      },
    };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game data" };
  }
}
