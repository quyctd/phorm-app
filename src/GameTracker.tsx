import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";
import { Plus, Trophy, Lock } from "@phosphor-icons/react";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";
import { PullToRefresh } from "./components/PullToRefresh";
import { useConvexRefresh } from "./hooks/useConvexRefresh";
import { JoinGameModal } from "./components/JoinGameModal";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

type AppState = "home" | "sessions" | "game";
type SessionView = "history" | "new-session";

export function GameTracker() {
  const { t } = useTranslation();
  const [currentState, setCurrentState] = useState<AppState>("home");
  const [sessionView, setSessionView] = useState<SessionView>("history");
  const [activeSessionId, setActiveSessionId] = useState<Id<"sessions"> | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const { refreshData } = useConvexRefresh();

  const handleJoinSuccess = (sessionId: Id<"sessions">) => {
    setActiveSessionId(sessionId);
    setCurrentState("game");
  };

  const handleStartNewSession = () => {
    setSessionView("new-session");
    setCurrentState("sessions");
  };

  const handleViewSessionHistory = () => {
    setSessionView("history");
    setCurrentState("sessions");
  };

  // Show game session if we have a selected session and user navigates to game
  if (currentState === "game" && activeSessionId) {
    return <GameSession 
      sessionId={activeSessionId}
      onBack={() => {
        setCurrentState("home");
        setActiveSessionId(null);
      }} 
    />;
  }

  // Show session management
  if (currentState === "sessions") {
    return <SessionManager
      onBack={() => setCurrentState("home")}
      onNavigateToGame={(sessionId) => {
        setActiveSessionId(sessionId);
        setCurrentState("game");
      }}
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
                <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
                <p className="text-sm text-gray-600">{t('app.subtitle')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-xl p-4 text-white">
            <p className="font-semibold">{t('home.readyToStart')}</p>
            <p className="text-sm opacity-90">{t('home.createSession')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quickActions')}</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Start New Session */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={handleStartNewSession}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 group-hover:from-green-400/30 group-hover:to-emerald-500/30 transition-all duration-200" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{t('home.newGame.title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.newGame.description')}
                  </p>
                </div>
              </div>

              {/* Join Game */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={() => setShowJoinModal(true)}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-300 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 group-hover:from-purple-400/30 group-hover:to-indigo-500/30 transition-all duration-200" />
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{t('home.joinGame.title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.joinGame.description')}
                  </p>
                </div>
              </div>

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
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{t('home.history.title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.history.description')}
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Join Game Modal */}
      <JoinGameModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </PullToRefresh>
  );
}
