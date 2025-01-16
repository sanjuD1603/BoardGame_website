import React from "react";

const GameFilters = ({ filters, setFilters, owners }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      owner: "",
      playerCount: "",
      playingTime: "",
    });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Owner</label>
          <select
            name="owner"
            value={filters.owner}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 rounded-md px-3 py-2 text-white"
          >
            <option value="">All Owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Player Count</label>
          <select
            name="playerCount"
            value={filters.playerCount}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 rounded-md px-3 py-2 text-white"
          >
            <option value="">Any Players</option>
            <option value="1">1 Player</option>
            <option value="2">2 Players</option>
            <option value="3-4">3-4 Players</option>
            <option value="5+">5+ Players</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Playing Time</label>
          <select
            name="playingTime"
            value={filters.playingTime}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 rounded-md px-3 py-2 text-white"
          >
            <option value="">Any Length</option>
            <option value="short">Quick (&lt;= 30min)</option>
            <option value="medium">Medium (30-60min)</option>
            <option value="long">Long (&gt; 60min)</option>
          </select>
        </div>

        <div className="flex-1 min-w-[100px] self-end">
          <button
            onClick={clearFilters}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameFilters;
