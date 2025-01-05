export default function GameCard({ game }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {game.image_url && (
        <img
          className="w-full h-48 object-cover"
          src={game.image_url}
          alt={game.title}
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{game.title}</h3>
        <p className="mt-1 text-gray-600">{game.description}</p>
        <div className="mt-2 text-sm text-gray-500">
          <p>
            Players: {game.min_players}-{game.max_players}
          </p>
          <p>Playing Time: {game.playing_time} minutes</p>
        </div>
      </div>
    </div>
  );
}
