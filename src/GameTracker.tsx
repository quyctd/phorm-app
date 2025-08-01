import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Button } from "./components/ui/button";
import { Plus, Trophy } from "@phosphor-icons/react";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";
import { PullToRefresh } from "./components/PullToRefresh";
import { useConvexRefresh } from "./hooks/useConvexRefresh";
import { toast } from "sonner";

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

type AppState = "home" | "sessions" | "game";
type SessionView = "history" | "new-session";

export function GameTracker() {
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [sessionView, setSessionView] = useState<SessionView>("history");
  const activeSession = useQuery(api.sessions.getActive);
  const joinSession = useMutation(api.sessions.join);
  const { refreshData } = useConvexRefresh();

  // Loading states
  const isLoadingSession = activeSession === undefined;

  // Handle shared session links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    if (sessionId && !activeSession && !isLoadingSession) {
      // Try to join the shared session
      joinSession({ sessionId: sessionId as Id<"sessions"> })
        .then(() => {
          toast.success("Joined shared session!");
          setCurrentState("game");
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error("Failed to join session:", error);
          toast.error("Failed to join session. It may have ended or doesn't exist.");
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [activeSession, isLoadingSession, joinSession]);

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
    <PullToRefresh
      onRefresh={refreshData}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
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
            {isLoadingSession ? (
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : activeSession && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Active Session</p>
                <p className="text-xs text-gray-500">Game in Progress</p>
              </div>
            )}
          </div>

          {/* Status Banner */}
          {isLoadingSession ? (
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ) : activeSession ? (
            <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{activeSession.name}</p>
                  <p className="text-sm opacity-90">{activeSession.players?.length || 0} players • Game in progress</p>
                </div>
                <Button
                  onClick={() => setCurrentState("game")}
                  className="bg-white text-green-600 hover:bg-gray-50 font-medium px-4 py-2 border-0"
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-xl p-4 text-white">
              <p className="font-semibold">Ready to start a new game!</p>
              <p className="text-sm opacity-90">Create a session with your players</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Quick Actions Grid */}
        {isLoadingSession ? (
          <div className="mb-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 gap-4">
              {/* Skeleton Action Cards */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Start New Session */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              {!activeSession && (<div
                onClick={handleStartNewSession}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 group-hover:from-green-400/30 group-hover:to-emerald-500/30 transition-all duration-200" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">New Game</h3>
                  <p className="text-gray-600 text-sm">
                    Create a new game session with your players
                  </p>
                </div>
              </div>)}

              {/* View History */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={handleViewSessionHistory}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 group-hover:from-blue-400/30 group-hover:to-purple-500/30 transition-all duration-200" />
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
      </div>
    </PullToRefresh>
  );
}
