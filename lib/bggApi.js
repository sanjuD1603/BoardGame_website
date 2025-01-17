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
  console.log("Searching for:", query);
  try {
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(
        query,
      )}&type=boardgame`,
    );
    const xml = await response.text();
    console.log("Search XML:", xml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
    });

    const result = parser.parse(xml);
    console.log("Parsed search result:", result);

    // Extract the items array correctly
    const items = result.items.item || [];
    const matches = Array.isArray(items) ? items : [items];

    return {
      matches: matches.map((item) => ({
        id: item["@_id"],
        name: item.name["@_value"],
        year: item.yearpublished?.["@_value"] || "",
      })),
    };
  } catch (error) {
    console.error("Search error:", error);
    return { error: "Failed to search for games" };
  }
}

export async function getGameDetails(gameId) {
  try {
    // Function to check if the response contains an error
    const hasError = (result) => {
      return result?.items?.item?.error || false;
    };

    // Function to fetch game details with retry logic
    const fetchDetails = async () => {
      console.log("Fetching details for gameId:", gameId);
      const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`;
      console.log("Request URL:", url);
      const response = await retry(
        () => fetch(url),
        3,
        3000, // Increased delay to 3 seconds
      );
      const xml = await response.text();
      console.log("Details XML:", xml);
      return parser.parse(xml);
    };

    // Initial delay before first fetch (BGG needs time to process)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initial fetch
    let detailsResult = await fetchDetails();

    // If we get an error, wait and retry up to 5 times with longer delays
    let retries = 5;
    while (hasError(detailsResult) && retries > 0) {
      console.log(
        `Waiting for BGG to process request... (${retries} retries left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
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
