import { useState } from "react";
import { deleteGame } from "../lib/supabase";

export default function GameCard({ game, user, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this game?")) return;

    setIsDeleting(true);
    const { error } = await deleteGame(game.id, user.id);

    if (error) {
      alert("Error deleting game");
      console.error("Error deleting game:", error);
    } else {
      onDelete(game.id);
    }
    setIsDeleting(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden relative group">
      {game.image_url && (
        <img
          className="w-full h-48 object-cover"
          src={game.image_url}
          alt={game.title}
        />
      )}

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {user && user.id === game.user_id && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-400 hover:text-red-600 transition-colors duration-200 bg-gray-800 rounded-full"
            title="Delete game"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-100 mb-2">{game.title}</h3>
        <p className="text-gray-300 mb-2">{game.description}</p>
        <div className="text-sm text-gray-400">
          <p>
            Players: {game.min_players} - {game.max_players}
          </p>
          <p>Playing Time: {game.playing_time} minutes</p>
          <p className="mt-2 text-gray-500">
            Added by:{" "}
            {game.profiles?.username || game.profiles?.full_name || "Anonymous"}
          </p>
        </div>
      </div>
    </div>
  );
}
