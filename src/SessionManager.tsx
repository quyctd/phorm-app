import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { PlayerHistoryDrawer } from "./components/PlayerHistoryDrawer";
import { ArrowLeft, Play, Plus, Trophy, Eye, ClockCounterClockwise, X, UserPlus, Share } from "@phosphor-icons/react";
import type { Id } from "../convex/_generated/dataModel";

interface SessionManagerProps {
  onBack: () => void;
  onNavigateToGame?: () => void;
  initialView?: "history" | "new-session";
}

export function SessionManager({ onBack, onNavigateToGame, initialView = "history" }: SessionManagerProps) {
  const [newSessionName, setNewSessionName] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [showNewSession, setShowNewSession] = useState(initialView === "new-session");
  const [isPublic, setIsPublic] = useState(false);

  const sessions = useQuery(api.sessions.list) || [];
  const activeSession = useQuery(api.sessions.getActive);

  const createSession = useMutation(api.sessions.create);

  const addPlayerField = () => {
    setPlayerNames([...playerNames, ""]);
  };

  const removePlayerField = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    // Filter out empty player names and validate
    const validPlayerNames = playerNames.filter(name => name.trim());

    if (validPlayerNames.length < 2) {
      toast.error("Please add at least 2 players");
      return;
    }

    try {
      await createSession({
        name: newSessionName.trim(),
        playerNames: validPlayerNames,
        isPublic,
      });
      setNewSessionName("");
      setPlayerNames(["", ""]);
      setIsPublic(false);
      setShowNewSession(false);
      toast.success("Session started successfully");
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleQuickStart = () => {
    setPlayerNames(["Player 1", "Player 2"]);
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
                  <p className="text-sm opacity-90">{activeSession.players?.length || 0} players • Game in progress</p>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 font-medium">
                      Players ({playerNames.filter(name => name.trim()).length} added)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPlayerField}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Player
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {playerNames.map((name, index) => (
                      <div key={index.toString()} className="flex items-center gap-3">
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => updatePlayerName(index, e.target.value)}
                          placeholder={`Player ${index + 1} name`}
                          className="flex-1 border-gray-200 rounded-xl h-12"
                        />
                        {playerNames.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removePlayerField(index)}
                            className="w-12 h-12 border-gray-200 hover:bg-red-50 hover:border-red-200"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">
                    Session Settings
                  </Label>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="isPublic" className="font-medium text-gray-900 cursor-pointer">
                        Allow sharing
                      </label>
                      <p className="text-sm text-gray-500">
                        Generate a shareable link to allow others to manage the game points.
                      </p>
                    </div>
                    <Share className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!newSessionName.trim() || playerNames.filter(name => name.trim()).length < 2}
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
      {!activeSession && !showNewSession && (
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
              Start a game with 2 default players
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
    _id: string;
    name: string;
    _creationTime: number;
    isActive: boolean;
    players?: Array<{ id: string; name: string; }>;
  };
}
function SessionHistorySheet({ session }: SessionHistorySheetProps) {
  const sessionResults = useQuery(
    api.sessions.getResults,
    { sessionId: session._id as Id<'sessions'> }
  );

  // Get player's game history
  const getPlayerGameHistory = (playerId: string) => {
    if (!sessionResults?.games) return [];
    return sessionResults.games.map(game => ({
      gameNumber: game.gameNumber,
      points: game.points[playerId] || 0,
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
