import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { PlayerManager } from "./PlayerManager";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";

export function GameTracker() {
  const [activeTab, setActiveTab] = useState<"players" | "sessions" | "game">("game");
  const activeSession = useQuery(api.sessions.getActive);

  // Auto-switch to game tab when session is active
  if (activeSession && activeTab !== "game") {
    setActiveTab("game");
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
        <button
          onClick={() => setActiveTab("players")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "players"
              ? "bg-primary text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Players
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "sessions"
              ? "bg-primary text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("game")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === "game"
              ? "bg-primary text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          } ${activeSession ? "ring-2 ring-green-400" : ""}`}
        >
          Game {activeSession && <span className="ml-1 text-xs">●</span>}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === "players" && <PlayerManager />}
        {activeTab === "sessions" && <SessionManager />}
        {activeTab === "game" && <GameSession />}
      </div>
    </div>
  );
}
