import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Navbar({ user }) {
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-white">
                BoardGame Collection
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <>
                <Link
                  href="/add-game"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Add Game
                </Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="ml-4 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
