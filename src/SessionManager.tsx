import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { PlayerHistoryDrawer } from "./components/PlayerHistoryDrawer";
import { PullToRefresh } from "./components/PullToRefresh";
import { useConvexRefresh } from "./hooks/useConvexRefresh";
import { ArrowLeft, Play, Plus, Trophy, Eye, ClockCounterClockwise, X, UserPlus, Share, Lock, Shuffle, Copy } from "@phosphor-icons/react";
import type { Id } from "../convex/_generated/dataModel";

interface SessionManagerProps {
  onBack: () => void;
  onNavigateToGame?: (sessionId: Id<"sessions">) => void;
  initialView?: "history" | "new-session";
}

export function SessionManager({ onBack, onNavigateToGame, initialView = "history" }: SessionManagerProps) {
  // Auto-fill session name with current date when creating new session
  const generateSessionName = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return `Game ${today.toLocaleDateString('en-US', options)}`;
  };

  const [newSessionName, setNewSessionName] = useState(initialView === "new-session" ? generateSessionName() : "");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [customPasscode, setCustomPasscode] = useState("");
  const [useCustomPasscode, setUseCustomPasscode] = useState(false);
  const [showNewSession, setShowNewSession] = useState(initialView === "new-session");

  const sessions = useQuery(api.sessions.list) || [];
  const activeSessions = useQuery(api.sessions.listActive) || [];
  const { refreshData } = useConvexRefresh();

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

  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const currentValue = (e.target as HTMLInputElement).value.trim();
      
      // If current field is not empty, move to next or add new
      if (currentValue) {
        // If this is the last input field, add a new one
        if (index === playerNames.length - 1) {
          setPlayerNames([...playerNames, ""]);
          // Focus will be set to the new input after it's rendered
          setTimeout(() => {
            const nextInput = document.querySelector(`input[data-player-index="${index + 1}"]`) as HTMLInputElement;
            if (nextInput) {
              nextInput.focus();
            }
          }, 0);
        } else {
          // Move focus to next existing input
          const nextInput = document.querySelector(`input[data-player-index="${index + 1}"]`) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }
      }
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    // Filter out empty player names and validate
    const validPlayerNames = playerNames
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (validPlayerNames.length < 2) {
      toast.error("Please add at least 2 players");
      return;
    }

    // Validate custom passcode if provided
    if (useCustomPasscode) {
      if (!customPasscode.trim()) {
        toast.error("Please enter a passcode or disable custom passcode");
        return;
      }
      if (!/^\d{6}$/.test(customPasscode.trim())) {
        toast.error("Passcode must be exactly 6 digits");
        return;
      }
    }

    try {
      const sessionId = await createSession({
        name: newSessionName.trim(),
        playerNames: validPlayerNames,
        passcode: useCustomPasscode ? customPasscode.trim() : undefined,
      });
      setNewSessionName("");
      setPlayerNames(["", ""]);
      setCustomPasscode("");
      setUseCustomPasscode(false);
      setShowNewSession(false);
      toast.success("Session started successfully");
      
      // Navigate to the game with the new session ID
      if (onNavigateToGame) {
        onNavigateToGame(sessionId);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create session";
      toast.error(errorMessage);
    }
  };

  const handleQuickStart = () => {
    setPlayerNames(["Player 1", "Player 2"]);
    setNewSessionName(`Game ${new Date().toLocaleDateString()}`);
    setCustomPasscode("");
    setUseCustomPasscode(false);
    setShowNewSession(true);
  };

  return (
    <PullToRefresh
      onRefresh={refreshData}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
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
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* New Session Form */}
        {showNewSession && (
          <div className="mb-8 animate-fade-in">
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
                      Players ({playerNames.filter(name => name.trim().length > 0).length} added)
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
                      <div key={index.toString()} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Input
                            type="text"
                            value={name}
                            onChange={(e) => updatePlayerName(index, e.target.value)}
                            onKeyDown={(e) => handlePlayerKeyDown(e, index)}
                            placeholder={`Player ${index + 1} name`}
                            className="flex-1 border-gray-200 rounded-xl h-12"
                            data-player-index={index}
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
                        {index === 0 && (
                          <p className="text-xs text-gray-500 ml-1">
                            💡 Press Enter to move to next player
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passcode Section */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">
                      Game Passcode
                    </Label>
                    
                    {/* Passcode Options */}
                    <div className="space-y-3">
                      {/* Auto-generate Option */}
                      <button
                        type="button"
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all w-full text-left ${
                          !useCustomPasscode 
                            ? "border-blue-300 bg-blue-50/50" 
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setUseCustomPasscode(false);
                          setCustomPasscode("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            !useCustomPasscode 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-gray-300"
                          }`}>
                            {!useCustomPasscode && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">Auto-generate</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              A random 6-digit passcode will be created automatically
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Custom Option */}
                      <button
                        type="button"
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all w-full text-left ${
                          useCustomPasscode 
                            ? "border-purple-300 bg-purple-50/50" 
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => setUseCustomPasscode(true)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            useCustomPasscode 
                              ? "border-purple-500 bg-purple-500" 
                              : "border-gray-300"
                          }`}>
                            {useCustomPasscode && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Plus className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-gray-900">Custom passcode</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Set your own memorable 6-digit passcode
                            </p>
                          </div>
                        </div>

                        {/* Custom Passcode Input */}
                        {useCustomPasscode && (
                          <div className="mt-4 pt-4 border-t border-purple-200 animate-fade-in"
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-3">
                              <Input
                                type="text"
                                value={customPasscode}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setCustomPasscode(value);
                                }}
                                placeholder="123456"
                                className="flex-1 border-purple-200 rounded-lg h-11 font-mono text-lg tracking-wider text-center focus:border-purple-400 focus:ring-purple-400"
                                maxLength={6}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const randomPasscode = Math.floor(100000 + Math.random() * 900000).toString();
                                  setCustomPasscode(randomPasscode);
                                }}
                                className="w-11 h-11 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                title="Generate random passcode"
                              >
                                <Shuffle className="h-4 w-4 text-purple-600" />
                              </Button>
                            </div>
                            {customPasscode.length > 0 && customPasscode.length < 6 && (
                              <p className="text-xs text-purple-600 mt-2">
                                Enter {6 - customPasscode.length} more digit{6 - customPasscode.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!newSessionName.trim() || playerNames.filter(name => name.trim().length > 0).length < 2 || (useCustomPasscode && customPasscode.length !== 6)}
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
      {!showNewSession && (
        <Card className="app-card border-0 animate-slide-in">
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
              onClick={() => {
                setNewSessionName(generateSessionName());
                setShowNewSession(true);
              }}
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
        <div className="animate-fade-in">
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
    </PullToRefresh>
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
