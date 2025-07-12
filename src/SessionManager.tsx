import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { PlayerHistoryDrawer } from "./components/PlayerHistoryDrawer";
import { ArrowLeft, Play, Plus, Trophy, Eye, ClockCounterClockwise, Check } from "@phosphor-icons/react";

interface SessionManagerProps {
  onBack: () => void;
  onNavigateToGame?: () => void;
  initialView?: "history" | "new-session";
}

export function SessionManager({ onBack, onNavigateToGame, initialView = "history" }: SessionManagerProps) {
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Id<"players">[]>([]);
  const [showNewSession, setShowNewSession] = useState(initialView === "new-session");

  const players = useQuery(api.players.list) || [];
  const sessions = useQuery(api.sessions.list) || [];
  const activeSession = useQuery(api.sessions.getActive);

  const createSession = useMutation(api.sessions.create);

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

  const handleQuickStart = () => {
    setSelectedPlayerIds(players.map(p => p._id));
    setNewSessionName(`Game ${new Date().toLocaleDateString()}`);
    setShowNewSession(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-b-lg mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-15" />
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                className="w-10 h-10 rounded-xl hover:bg-white/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {showNewSession ? "New Session" : "Sessions"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {showNewSession ? "Create a new game session" : "View session history"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          {activeSession && (
            <div className="mt-4 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{activeSession.name}</p>
                  <p className="text-sm opacity-90">{activeSession.players.length} players • Game in progress</p>
                </div>
                {onNavigateToGame && (
                  <Button
                    onClick={onNavigateToGame}
                    className="bg-white text-green-600 hover:bg-gray-50 font-medium px-4 py-2 border-0"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* New Session Form */}
        {showNewSession && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Session</h2>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <form onSubmit={(e) => void handleCreateSession(e)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionName" className="text-gray-700 font-medium">
                    Session Name
                  </Label>
                  <Input
                    id="sessionName"
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="Enter session name"
                    className="border-gray-200 rounded-xl h-12"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">
                    Select Players ({selectedPlayerIds.length} selected)
                  </Label>
                  <div className="grid gap-3">
                    {players.map((player) => {
                      const avatar = getPlayerAvatar(player.name);
                      return (
                        <button
                          key={player._id}
                          type="button"
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedPlayerIds.includes(player._id)
                              ? "bg-blue-50 border-blue-300"
                              : "hover:bg-gray-50 border-gray-200"
                          }`}
                          onClick={() => {
                            setSelectedPlayerIds(prev =>
                              prev.includes(player._id)
                                ? prev.filter(id => id !== player._id)
                                : [...prev, player._id]
                            );
                          }}
                        >
                          <div className={`size-10 rounded-full flex items-center justify-center ${avatar.color}`}>
                            <span className="text-white font-semibold text-sm">{avatar.initials}</span>
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-base text-gray-900">{player.name}</h3>
                          </div>
                          {selectedPlayerIds.includes(player._id) && (
                            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!newSessionName.trim() || selectedPlayerIds.length < 2}
                  className="w-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-600 hover:to-emerald-600 text-white border-0 transition-all duration-200 h-12 text-base font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Session
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Quick Start */}
      {!activeSession && players.length >= 2 && !showNewSession && (
        <Card className="app-card border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 font-semibold">Quick Start</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-base">
              Start a game with all {players.length} players
            </p>
            <Button onClick={handleQuickStart} className="w-full app-button-primary h-12 text-base font-medium">
              <Play className="h-5 w-5 mr-2" />
              Start Game Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewSession(true)}
              className="w-full app-button-secondary h-12 text-base font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Custom Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {!showNewSession && sessions.filter(s => !s.isActive).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mt-4 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 via-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
              <ClockCounterClockwise className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="space-y-3">
              {sessions.filter(s => !s.isActive).slice(0, 3).map((session) => (
                <SessionHistorySheet key={session._id} session={session} />
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

interface SessionHistorySheetProps {
  session: {
    _id: Id<"sessions">;
    name: string;
    _creationTime: number;
    isActive: boolean;
  };
}
function SessionHistorySheet({ session }: SessionHistorySheetProps) {
  const sessionResults = useQuery(
    api.sessions.getResults,
    { sessionId: session._id }
  );

  // Get player's game history
  const getPlayerGameHistory = (playerId: string) => {
    if (!sessionResults?.games) return [];
    return sessionResults.games.map(game => ({
      gameNumber: game.gameNumber,
      points: game.points[playerId as Id<"players">] || 0,
      gameId: game._id,
      autoCalculated: game.autoCalculated
    })).filter(game => game.points !== 0 || Object.keys(sessionResults.games.find(g => g._id === game.gameId)?.points || {}).includes(playerId));
  };

  return (
    <PlayerHistoryDrawer
      trigger={
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-gray-900">{session.name}</h3>
              <p className="text-sm text-gray-600">
                {new Date(session._creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Eye className="h-5 w-5 text-gray-400" />
        </div>
      }
      title={session.name}
      description="Final results and game-by-game breakdown"
      results={sessionResults?.results || []}
      getPlayerGameHistory={getPlayerGameHistory}
      showRemoveButtons={false}
    />
  );
}
