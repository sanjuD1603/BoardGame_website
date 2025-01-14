import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser();

export async function searchBoardGame(query) {
  try {
    // First, search for the game
    const searchResponse = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
        query,
      )}&type=boardgame`,
    );
    const searchXml = await searchResponse.text();
    const searchResult = parser.parse(searchXml);

    if (!searchResult.items?.item?.[0]?.id) {
      return { error: "No games found" };
    }

    // Get detailed info for the first game found
    const gameId = searchResult.items.item[0].id;
    const detailsResponse = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`,
    );
    const detailsXml = await detailsResponse.text();
    const detailsResult = parser.parse(detailsXml);

    const game = detailsResult.items.item;

    return {
      data: {
        title:
          game.name.find((n) => n["@_type"] === "primary")?.["@_value"] || "",
        description: game.description || "",
        image_url: game.image || game.thumbnail || "",
        min_players: game.minplayers?.["@_value"] || "",
        max_players: game.maxplayers?.["@_value"] || "",
        playing_time: game.playingtime?.["@_value"] || "",
      },
    };
  } catch (error) {
    console.error("BGG API Error:", error);
    return { error: "Failed to fetch game data" };
  }
}
