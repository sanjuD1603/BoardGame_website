import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Profile({ user }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [userGames, setUserGames] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    fetchUserProfile();
    fetchUserGames();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserGames(data || []);
    } catch (error) {
      console.error("Error fetching user games:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Profile Header */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profile Information
          </h3>
        </div>

        {/* Profile Content */}
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Username</h4>
              <p className="mt-1 text-sm text-gray-900">
                {userProfile?.username || "Not set"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
          </div>

          {/* Friends Section */}
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Friends</h4>
            <button
              onClick={() => alert("Coming soon!")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Friends
            </button>
            <div className="mt-4 text-sm text-gray-500">
              Friend functionality coming soon!
            </div>
          </div>

          {/* User's Games */}
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              My Games ({userGames.length})
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userGames.map((game) => (
                <div
                  key={game.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={game.image_url || "/placeholder-game.png"}
                      alt={game.title}
                      className="object-cover rounded-md"
                    />
                  </div>
                  <h5 className="font-medium text-gray-900">{game.title}</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    {game.min_players}-{game.max_players} players •{" "}
                    {game.playing_time} min
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
