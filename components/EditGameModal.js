import React, { useState } from "react";
import { supabase } from "../lib/supabase";

const EditGameModal = ({ game, isOpen, onClose, onUpdate }) => {
  const [editedGame, setEditedGame] = useState({
    owner: game.owner,
    player_count: game.player_count,
    playing_time: game.playing_time,
    tags: game.tags || [],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("games")
        .update({
          owner: editedGame.owner,
          player_count: editedGame.player_count,
          playing_time: editedGame.playing_time,
          tags: editedGame.tags,
        })
        .eq("id", game.id);

      if (error) throw error;
      onUpdate(editedGame);
      onClose();
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Edit {game.title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Owner</label>
            <input
              type="text"
              value={editedGame.owner}
              onChange={(e) =>
                setEditedGame((prev) => ({ ...prev, owner: e.target.value }))
              }
              className="w-full bg-gray-700 rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Player Count
            </label>
            <input
              type="text"
              value={editedGame.player_count}
              onChange={(e) =>
                setEditedGame((prev) => ({
                  ...prev,
                  player_count: e.target.value,
                }))
              }
              className="w-full bg-gray-700 rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Playing Time (minutes)
            </label>
            <input
              type="number"
              value={editedGame.playing_time}
              onChange={(e) =>
                setEditedGame((prev) => ({
                  ...prev,
                  playing_time: e.target.value,
                }))
              }
              className="w-full bg-gray-700 rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedGame.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-indigo-600 text-white px-2 py-1 rounded-md text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      setEditedGame((prev) => ({
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
                .filter((tag) => !editedGame.tags.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setEditedGame((prev) => ({
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

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGameModal;
