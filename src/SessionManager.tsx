import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { PlayerHistoryDrawer } from "./components/PlayerHistoryDrawer";
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
    <>
      {/* Header */}
      <div className="bg-card border-b mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {showNewSession ? "New Session" : "Sessions"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
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
          <div className="mb-8">
            <div className="bg-card rounded-lg p-6 border">
              <form onSubmit={(e) => void handleCreateSession(e)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionName" className="text-foreground font-medium">
                    Session Name
                  </Label>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground font-medium">
                      Players ({playerNames.filter(name => name.trim().length > 0).length} added)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPlayerField}
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
                            className="flex-1"
                            data-player-index={index}
                          />
                          {playerNames.length > 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removePlayerField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {index === 0 && (
                          <p className="text-xs text-muted-foreground ml-1">
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
                    <Label className="text-foreground font-medium">
                      Game Passcode
                    </Label>
                    
                    {/* Passcode Options */}
                    <div className="space-y-3">
                      {/* Auto-generate Option */}
                      <button
                        type="button"
                        className={`relative border rounded-lg p-4 cursor-pointer transition-all w-full text-left ${
                          !useCustomPasscode 
                            ? "border-primary bg-accent" 
                            : "border-border bg-card hover:bg-accent"
                        }`}
                        onClick={() => {
                          setUseCustomPasscode(false);
                          setCustomPasscode("");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            !useCustomPasscode 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground"
                          }`}>
                            {!useCustomPasscode && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">Auto-generate</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              A random 6-digit passcode will be created automatically
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Custom Option */}
                      <button
                        type="button"
                        className={`relative border rounded-lg p-4 cursor-pointer transition-all w-full text-left ${
                          useCustomPasscode 
                            ? "border-primary bg-accent" 
                            : "border-border bg-card hover:bg-accent"
                        }`}
                        onClick={() => setUseCustomPasscode(true)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            useCustomPasscode 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground"
                          }`}>
                            {useCustomPasscode && (
                              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Plus className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">Custom passcode</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Set your own memorable 6-digit passcode
                            </p>
                          </div>
                        </div>

                        {/* Custom Passcode Input */}
                        {useCustomPasscode && (
                          <div className="mt-4 pt-4 border-t border-border"
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
                                className="flex-1 font-mono text-lg tracking-wider text-center"
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
                                title="Generate random passcode"
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                            </div>
                            {customPasscode.length > 0 && customPasscode.length < 6 && (
                              <p className="text-xs text-muted-foreground mt-2">
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
                  className="w-full"
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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Play className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-foreground font-semibold">Quick Start</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-base">
              Start a game with 2 default players
            </p>
            <Button onClick={handleQuickStart} className="w-full">
              <Play className="h-5 w-5 mr-2" />
              Start Game Now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewSessionName(generateSessionName());
                setShowNewSession(true);
              }}
              className="w-full"
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
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <ClockCounterClockwise className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Recent Sessions</h2>
          </div>
          <div className="bg-card rounded-lg p-6 border">
            <div className="space-y-3">
              {sessions.filter(s => !s.isActive).slice(0, 3).map((session) => (
                <SessionHistorySheet key={session._id} session={session} />
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
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
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">{session.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(session._creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Eye className="h-5 w-5 text-muted-foreground" />
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
