import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { ArrowLeft, Play, Plus, Users, Calendar, StopCircle, Trophy, Eye, History } from "lucide-react";

interface SessionManagerProps {
  onBack: () => void;
  onNavigateToGame?: () => void;
}

export function SessionManager({ onBack, onNavigateToGame }: SessionManagerProps) {
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<"players">[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<Id<"sessions"> | null>(null);

  const players = useQuery(api.players.list) || [];
  const sessions = useQuery(api.sessions.list) || [];
  const activeSession = useQuery(api.sessions.getActive);
  const sessionResults = useQuery(
    api.sessions.getResults,
    viewingSessionId ? { sessionId: viewingSessionId } : "skip"
  );

  const createSession = useMutation(api.sessions.create);
  const endSession = useMutation(api.sessions.end);

  // Generate avatar initials and colors
  const getPlayerAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    let playerIds = selectedPlayerIds;

    // If no players selected, use all players
    if (playerIds.length === 0) {
      playerIds = players.map(p => p._id);
    }

    if (playerIds.length < 2) {
      toast.error("Please select at least 2 players");
      return;
    }

    try {
      await createSession({
        name: newSessionName.trim(),
        playerIds,
      });
      setNewSessionName("");
      setSelectedPlayerIds([]);
      setShowNewSession(false);
      toast.success("Session started successfully");
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await endSession({ sessionId: activeSession._id });
      toast.success("Session ended");
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const togglePlayerSelection = (playerId: Id<"players">) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleQuickStart = () => {
    setSelectedPlayerIds(players.map(p => p._id));
    setNewSessionName(`Game ${new Date().toLocaleDateString()}`);
    setShowNewSession(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Start new games and manage sessions
          </p>
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {activeSession.name}
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {activeSession.players.map(p => p?.name).join(", ")}
            </div>
            <div className="flex gap-3">
              {onNavigateToGame && (
                <Button
                  onClick={onNavigateToGame}
                  className="flex-1"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Game
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleEndSession}
                className={onNavigateToGame ? "flex-1" : "w-full"}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Start */}
      {!activeSession && players.length >= 2 && !showNewSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Start a game with all {players.length} players
            </p>
            <Button onClick={handleQuickStart} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Game Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewSession(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Custom Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Session Form */}
      {!activeSession && showNewSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter session name"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Select Players ({selectedPlayerIds.length} selected)</Label>
                <div className="grid gap-2">
                  {players.map((player) => (
                    <div
                      key={player._id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPlayerIds.includes(player._id)
                          ? "bg-primary/5 border-primary/20"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => togglePlayerSelection(player._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player._id)}
                        onChange={() => togglePlayerSelection(player._id)}
                        className="rounded border-input"
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                  ))}
                </div>
                {selectedPlayerIds.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Leave empty to include all players
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Start Session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewSession(false);
                    setNewSessionName("");
                    setSelectedPlayerIds([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Not enough players */}
      {!activeSession && players.length < 2 && (
        <Card className="border-dashed">
          <CardContent className="text-center p-6 space-y-3">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Need More Players</h3>
              <p className="text-sm text-muted-foreground">
                Add at least 2 players to start a session
              </p>
            </div>
            <Button variant="outline" onClick={onBack} className="w-full">
              Add Players
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Sessions ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.name}</span>
                      {session.isActive && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.players.length} players • {new Date(session._creationTime).toLocaleDateString()}
                      {session.endedAt && ` • Ended ${new Date(session.endedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {!session.isActive && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSessionId(session._id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Results
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            {session.name} Results
                          </SheetTitle>
                          <SheetDescription>
                            Final standings and game summary
                          </SheetDescription>
                        </SheetHeader>
                        {sessionResults && (
                          <div className="mt-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                            {/* Session Summary */}
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Games</span>
                                <span className="font-medium">{sessionResults.totalGames}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Players</span>
                                <span className="font-medium">{sessionResults.session.players.length}</span>
                              </div>
                              {sessionResults.session.endedAt && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Ended</span>
                                  <span className="font-medium">{new Date(sessionResults.session.endedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {/* Final Results */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <Trophy className="h-4 w-4" />
                                Final Standings
                              </h4>
                              {sessionResults.results.map(({ player, total }, index) => {
                                const avatar = getPlayerAvatar(player.name);
                                return (
                                  <div
                                    key={player._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                      index === 0 && total > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted/20"
                                    }`}
                                  >
                                    <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatar.color}`}>
                                      {avatar.initials}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{player.name}</span>
                                        {index === 0 && total > 0 && (
                                          <Badge variant="destructive" className="text-xs px-1 py-0">
                                            Losing
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <span className={`text-lg font-bold ${
                                      total < 0 ? "text-green-600" : total > 0 ? "text-destructive" : "text-muted-foreground"
                                    }`}>
                                      {total > 0 ? "+" : ""}{total}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Game History */}
                            {sessionResults.games.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  <History className="h-4 w-4" />
                                  Game History
                                </h4>
                                <div className="space-y-2">
                                  {sessionResults.games.map((game) => (
                                    <div
                                      key={game._id}
                                      className="p-3 bg-muted/30 rounded border"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-sm">Game {game.gameNumber}</span>
                                        {game.autoCalculated && (
                                          <Badge variant="secondary" className="text-xs px-1 py-0">
                                            Auto
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 text-xs">
                                        {Object.entries(game.points).map(([playerId, points]) => {
                                          const player = sessionResults.session.players.find(p => p._id === playerId);
                                          if (!player) return null;
                                          return (
                                            <div key={playerId} className="flex justify-between">
                                              <span className="text-muted-foreground">{player.name}</span>
                                              <span className={`font-medium ${
                                                points < 0 ? "text-green-600" : points > 0 ? "text-destructive" : "text-muted-foreground"
                                              }`}>
                                                {points > 0 ? "+" : ""}{points}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
