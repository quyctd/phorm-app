import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";
import { Plus, Trophy, Lock } from "@phosphor-icons/react";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";
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
    <div
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-card border-b mb-6">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('app.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Welcome Message */}
          <div className="bg-primary rounded-xl p-4 text-primary-foreground">
            <p className="font-semibold">{t('home.readyToStart')}</p>
            <p className="text-sm opacity-90">{t('home.createSession')}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('home.quickActions')}</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Start New Session */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={handleStartNewSession}
                className="bg-card rounded-lg p-6 border hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{t('home.newGame.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('home.newGame.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Join Game */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={() => setShowJoinModal(true)}
                className="bg-card rounded-lg p-6 border hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                    <Lock className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{t('home.joinGame.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('home.joinGame.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* View History */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                onClick={handleViewSessionHistory}
                className="bg-card rounded-lg p-6 border hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{t('home.history.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('home.history.description')}
                    </p>
                  </div>
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
    </div>
  );
}
