import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./components/ui/button";
import { Users, Plus, Trophy } from "@phosphor-icons/react";
import { PlayerManager } from "./PlayerManager";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";

type AppState = "home" | "players" | "sessions" | "game";
type SessionView = "history" | "new-session";

export function GameTracker() {
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [sessionView, setSessionView] = useState<SessionView>("history");
  const activeSession = useQuery(api.sessions.getActive);
  const players = useQuery(api.players.list) || [];

  const handleStartNewSession = () => {
    setSessionView("new-session");
    setCurrentState("sessions");
  };

  const handleViewSessionHistory = () => {
    setSessionView("history");
    setCurrentState("sessions");
  };

  // Show game session if we have an active session and user navigates to game
  if (currentState === "game") {
    return <GameSession onBack={() => setCurrentState("home")} />;
  }

  // Show player management
  if (currentState === "players") {
    return <PlayerManager onBack={() => setCurrentState("home")} />;
  }

  // Show session management
  if (currentState === "sessions") {
    return <SessionManager
      onBack={() => setCurrentState("home")}
      onNavigateToGame={() => setCurrentState("game")}
      initialView={sessionView}
    />;
  }

  // Home screen - main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-b-lg mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-15" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Phorm</h1>
                <p className="text-sm text-gray-600">Game Score Tracker</p>
              </div>
            </div>
            {players.length >= 2 && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{players.length} Players</p>
                <p className="text-xs text-gray-500">
                  {activeSession ? "Game Active" : "Ready to Play"}
                </p>
              </div>
            )}
          </div>

          {/* Status Banner */}
          {activeSession ? (
            <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{activeSession.name}</p>
                  <p className="text-sm opacity-90">{activeSession.players.length} players • Game in progress</p>
                </div>
                <Button
                  onClick={() => setCurrentState("game")}
                  className="bg-white text-green-600 hover:bg-gray-50 font-medium px-4 py-2 border-0"
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : players.length >= 2 ? (
            <div className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-xl p-4 text-white">
              <p className="font-semibold">Ready to start a new game!</p>
              <p className="text-sm opacity-90">All players are set up and ready to go</p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 rounded-xl p-4 text-white">
              <p className="font-semibold">Welcome to Phorm!</p>
              <p className="text-sm opacity-90">Add players to get started with game tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Quick Actions Grid */}
        {!activeSession && players.length >= 2 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start New Session */}
              <div
                onClick={handleStartNewSession}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 group-hover:from-green-400/30 group-hover:to-emerald-500/30 transition-all duration-200"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">New Game</h3>
                  <p className="text-gray-600 text-sm">
                    Start a fresh session with {players.length} players
                  </p>
                </div>
              </div>

              {/* View History */}
              <div
                onClick={handleViewSessionHistory}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 group-hover:from-blue-400/30 group-hover:to-purple-500/30 transition-all duration-200"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">History</h3>
                  <p className="text-gray-600 text-sm">
                    Review past games and results
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players Section */}
        {players.length >= 2 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Players</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentState("players")}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                Add More
              </Button>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{players.length} Players Ready</p>
                  <p className="text-sm text-gray-600">
                    {players.slice(0, 3).map(p => p.name).join(", ")}
                    {players.length > 3 && ` +${players.length - 3} more`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started - First Time Setup */}
        {players.length === 0 && (
          <div className="text-center">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Phorm!</h3>
              <p className="text-gray-600 mb-6">
                Add your players to get started with game tracking
              </p>
              <Button
                onClick={() => setCurrentState("players")}
                className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 hover:from-blue-500 hover:via-indigo-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200"
              >
                <Users className="h-5 w-5 mr-2" />
                Add Your First Players
              </Button>
            </div>
          </div>
        )}

        {/* Need More Players */}
        {players.length === 1 && (
          <div className="text-center">
            <div className="bg-gradient-to-br from-amber-100/60 to-orange-100/60 rounded-2xl p-6 border border-amber-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Almost Ready!</h3>
              <p className="text-gray-600 mb-4">
                Add one more player to start tracking games
              </p>
              <Button
                onClick={() => setCurrentState("players")}
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 hover:from-amber-500 hover:via-orange-600 hover:to-red-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Player
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
