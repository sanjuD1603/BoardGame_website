import React, { useState } from "react";

const GameFilters = ({ filters, setFilters, owners }) => {
  // State for temporary filters before applying
  const [tempFilters, setTempFilters] = useState({
    owner: "",
    playerCount: "",
    playingTime: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setTempFilters({
      owner: "",
      playerCount: "",
      playingTime: "",
    });
    setFilters({
      owner: "",
      playerCount: "",
      playingTime: "",
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  // Display active filters
  const getActiveFiltersDisplay = () => {
    const activeFilters = [];
    if (filters.owner) activeFilters.push(`Owner: ${filters.owner}`);
    if (filters.playerCount)
      activeFilters.push(`Players: ${filters.playerCount}`);
    if (filters.playingTime) activeFilters.push(`Time: ${filters.playingTime}`);
    return activeFilters;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      {/* Active Filters Display */}
      {getActiveFiltersDisplay().length > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {getActiveFiltersDisplay().map((filter, index) => (
              <span
                key={index}
                className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Owner</label>
          <select
            name="owner"
            value={tempFilters.owner}
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
            value={tempFilters.playerCount}
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
            value={tempFilters.playingTime}
            onChange={handleFilterChange}
            className="w-full bg-gray-700 rounded-md px-3 py-2 text-white"
          >
            <option value="">Any Length</option>
            <option value="short">Quick (&lt;= 30min)</option>
            <option value="medium">Medium (30-60min)</option>
            <option value="long">Long (&gt; 60min)</option>
          </select>
        </div>

        <div className="flex gap-2 flex-1 min-w-[200px] self-end">
          <button
            onClick={clearFilters}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md transition-colors"
          >
            Clear
          </button>
          <button
            onClick={applyFilters}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-md transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameFilters;
