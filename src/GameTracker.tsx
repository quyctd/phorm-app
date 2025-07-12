import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Settings, Users, Play, Plus } from "lucide-react";
import { PlayerManager } from "./PlayerManager";
import { SessionManager } from "./SessionManager";
import { GameSession } from "./GameSession";

type AppState = "home" | "players" | "sessions" | "game";

export function GameTracker() {
  const [currentState, setCurrentState] = useState<AppState>("home");
  const activeSession = useQuery(api.sessions.getActive);
  const players = useQuery(api.players.list) || [];

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
    />;
  }

  // Home screen - main dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Game Tracker</h1>
        <p className="text-muted-foreground text-sm">Track points across multiple games</p>
      </div>

      {/* Active Session Card */}
      {activeSession && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {activeSession.name}
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {activeSession.players.length} players • Ready to play
            </p>
            <Button
              onClick={() => setCurrentState("game")}
              className="w-full"
              size="lg"
            >
              Continue Game
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4">
        <Card className="cursor-pointer card-hover" onClick={() => setCurrentState("players")}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Manage Players</h3>
              <p className="text-sm text-muted-foreground">
                {players.length} player{players.length !== 1 ? 's' : ''} added
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer card-hover" onClick={() => setCurrentState("sessions")}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Start New Session</h3>
              <p className="text-sm text-muted-foreground">
                Create a new game session
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      {!activeSession && players.length >= 2 && (
        <Card className="border-dashed">
          <CardContent className="text-center p-6 space-y-3">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Ready to play?</h3>
              <p className="text-sm text-muted-foreground">
                You have {players.length} players ready
              </p>
            </div>
            <Button
              onClick={() => setCurrentState("sessions")}
              variant="outline"
              className="w-full"
            >
              Start Quick Game
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {players.length < 2 && (
        <Card className="border-dashed">
          <CardContent className="text-center p-6 space-y-3">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Get Started</h3>
              <p className="text-sm text-muted-foreground">
                Add at least 2 players to begin tracking games
              </p>
            </div>
            <Button
              onClick={() => setCurrentState("players")}
              variant="outline"
              className="w-full"
            >
              Add Players
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
