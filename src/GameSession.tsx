import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import { ArrowLeft, Trophy, Plus, Trash2, Target, History, StopCircle, Users, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

interface GameSessionProps {
  onBack: () => void;
}

export function GameSession({ onBack }: GameSessionProps) {
  const activeSession = useQuery(api.sessions.getActive);
  const games = useQuery(
    api.games.listBySession,
    activeSession ? { sessionId: activeSession._id } : "skip"
  ) || [];
  const totals = useQuery(
    api.games.getTotals,
    activeSession ? { sessionId: activeSession._id } : "skip"
  ) || {};

  const addGame = useMutation(api.games.addGame);
  const updateGame = useMutation(api.games.updateGame);
  const removeGame = useMutation(api.games.removeGame);
  const endSession = useMutation(api.sessions.end);

  const [newGamePoints, setNewGamePoints] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [excludedPlayerId, setExcludedPlayerId] = useState<string>("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());


  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Game Session</h1>
        </div>

        <Card className="border-dashed">
          <CardContent className="text-center p-8 space-y-4">
            <div className="p-4 bg-muted rounded-full w-fit mx-auto">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No Active Session</h3>
              <p className="text-muted-foreground">
                Start a new session to begin tracking points
              </p>
            </div>
            <Button onClick={onBack} className="w-full">
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allPlayers = useMemo(() =>
    activeSession.players.filter((p): p is NonNullable<typeof p> => p !== null),
    [activeSession.players]
  );

  // Initialize selected players only once when component mounts
  useEffect(() => {
    if (!isInitialized && allPlayers.length > 0 && activeSession) {
      // Try to load previously selected players from localStorage
      const storageKey = `selectedPlayers_${activeSession._id}`;
      const savedSelection = localStorage.getItem(storageKey);

      if (savedSelection) {
        try {
          const parsedSelection = JSON.parse(savedSelection);
          // Validate that saved players still exist in current session
          const validPlayerIds = parsedSelection.filter((id: string) =>
            allPlayers.some(p => p._id === id)
          );

          if (validPlayerIds.length >= 2) {
            setSelectedPlayerIds(validPlayerIds);
          } else {
            // If saved selection is invalid, fall back to all players
            setSelectedPlayerIds(allPlayers.map(p => p._id));
          }
        } catch {
          // If parsing fails, fall back to all players
          setSelectedPlayerIds(allPlayers.map(p => p._id));
        }
      } else {
        // No saved selection, start with all players
        setSelectedPlayerIds(allPlayers.map(p => p._id));
      }

      setIsInitialized(true);
    }
  }, [isInitialized, allPlayers, activeSession]);

  const selectedPlayers = allPlayers.filter(player => selectedPlayerIds.includes(player._id));

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

  // Toggle player expansion in leaderboard
  const togglePlayerExpansion = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  // Get player's game history
  const getPlayerGameHistory = (playerId: string) => {
    return games.map(game => ({
      gameNumber: game.gameNumber,
      points: game.points[playerId] || 0,
      gameId: game._id,
      autoCalculated: game.autoCalculated
    })).filter(game => game.points !== 0 || Object.keys(games.find(g => g._id === game.gameId)?.points || {}).includes(playerId));
  };



  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      let newSelection: string[];
      if (prev.includes(playerId)) {
        // Don't allow deselecting if it would leave less than 2 players
        if (prev.length <= 2) {
          toast.error("At least 2 players are required for a game");
          return prev;
        }
        newSelection = prev.filter(id => id !== playerId);
      } else {
        newSelection = [...prev, playerId];
      }

      // Save to localStorage whenever selection changes
      if (activeSession) {
        const storageKey = `selectedPlayers_${activeSession._id}`;
        localStorage.setItem(storageKey, JSON.stringify(newSelection));
      }

      return newSelection;
    });
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlayers.length < 2) {
      toast.error("Please select at least 2 players for the game");
      return;
    }

    const points: Record<string, number> = {};
    let totalEntered = 0;
    let enteredCount = 0;
    const playersWithoutPoints: string[] = [];

    // Process entered points for selected players
    for (const player of selectedPlayers) {
      const pointStr = newGamePoints[player._id] || "";

      if (pointStr.trim() !== "") {
        const point = Number.parseFloat(pointStr);
        if (!Number.isNaN(point)) {
          points[player._id] = point;
          totalEntered += point;
          enteredCount++;
        } else {
          toast.error(`Invalid number entered for ${player.name}: "${pointStr}"`);
          return;
        }
      } else {
        playersWithoutPoints.push(player._id);
      }
    }

    // Handle auto-calculation
    if (autoCalculate) {
      if (playersWithoutPoints.length === 1) {
        // Perfect! Auto-calculate the one missing player
        const autoCalcPlayerId = playersWithoutPoints[0];
        points[autoCalcPlayerId] = -totalEntered;
        enteredCount++;
      } else if (playersWithoutPoints.length === 0) {
        toast.error("When auto-calculate is enabled, leave one player's points empty to auto-calculate");
        return;
      } else {
        toast.error(`When auto-calculate is enabled, enter points for exactly ${selectedPlayers.length - 1} players (leave 1 empty)`);
        return;
      }
    } else {
      // Manual mode - need all players
      if (enteredCount !== selectedPlayers.length) {
        toast.error("Please enter points for all selected players or enable auto-calculation");
        return;
      }
    }

    // Final validation
    if (Object.keys(points).length !== selectedPlayers.length) {
      console.error("Validation failed:", {
        pointsKeys: Object.keys(points),
        pointsLength: Object.keys(points).length,
        selectedPlayersLength: selectedPlayers.length,
        selectedPlayers: selectedPlayers.map(p => p.name),
        points
      });
      toast.error("Something went wrong with point calculation");
      return;
    }

    console.log("Adding game with points:", points);

    try {
      console.log("About to add game with:", {
        sessionId: activeSession._id,
        points,
        autoCalculated: autoCalculate,
        selectedPlayers: selectedPlayers.map(p => ({ id: p._id, name: p.name }))
      });

      const result = await addGame({
        sessionId: activeSession._id,
        points,
        autoCalculated: autoCalculate,
      });

      console.log("Game added successfully, result:", result);

      // Reset form state
      setNewGamePoints({});

      // Keep the same players selected for the next game
      // (selectedPlayerIds stays the same)

      toast.success("Game added successfully");
    } catch (error) {
      console.error("Error adding game:", error);
      // Log the full error details for debugging
      console.error("Error details:", {
        error,
        points,
        selectedPlayers: selectedPlayers.map(p => ({ id: p._id, name: p.name })),
        autoCalculate
      });
      toast.error(`Failed to add game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  const handleRemoveGame = async (gameId: Id<"games">) => {
    try {
      await removeGame({ gameId });
      toast.success("Game removed");
    } catch (error) {
      toast.error("Failed to remove game");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await endSession({ sessionId: activeSession._id });

      // Clean up localStorage for this session
      const storageKey = `selectedPlayers_${activeSession._id}`;
      localStorage.removeItem(storageKey);

      toast.success("Session ended");
      onBack(); // Navigate back to home
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  // Calculate final results sorted by points (lowest first) - for all players in session
  const finalResults = allPlayers
    .map((player) => ({
      player,
      total: totals[player._id] || 0,
    }))
    .sort((a, b) => a.total - b.total);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{activeSession.name}</h1>
            <p className="text-xs text-muted-foreground">
              Game {games.length + 1} • {selectedPlayers.length}/{allPlayers.length} players
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trophy className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Leaderboard & History
                </SheetTitle>
                <SheetDescription>
                  Current standings and game-by-game breakdown
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {finalResults.map(({ player, total }, index) => {
                  const avatar = getPlayerAvatar(player.name);
                  const isExpanded = expandedPlayers.has(player._id);
                  const playerHistory = getPlayerGameHistory(player._id);

                  return (
                    <div key={player._id} className="space-y-2">
                      {/* Player Summary Row */}
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === 0 && total > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted/20 hover:bg-muted/30"
                        }`}
                        onClick={() => togglePlayerExpansion(player._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            togglePlayerExpansion(player._id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={expandedPlayers.has(player._id)}
                        aria-label={`Toggle details for ${player.name}`}
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
                          {playerHistory.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {playerHistory.length} game{playerHistory.length !== 1 ? 's' : ''} played
                            </p>
                          )}
                        </div>
                        <span className={`text-lg font-bold ${
                          total < 0 ? "text-green-600" : total > 0 ? "text-destructive" : "text-muted-foreground"
                        }`}>
                          {total > 0 ? "+" : ""}{total}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`} />
                      </div>

                      {/* Expanded Game History */}
                      {isExpanded && playerHistory.length > 0 && (
                        <div className="ml-6 space-y-1 pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <History className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Game History</span>
                          </div>
                          {playerHistory.map((gameData) => (
                            <div
                              key={gameData.gameId}
                              className="flex items-center justify-between p-2 bg-muted/30 rounded border text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Game {gameData.gameNumber}</span>
                                {gameData.autoCalculated && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    Auto
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${
                                  gameData.points < 0 ? "text-green-600" :
                                  gameData.points > 0 ? "text-destructive" : "text-muted-foreground"
                                }`}>
                                  {gameData.points > 0 ? "+" : ""}{gameData.points}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGame(gameData.gameId);
                                  }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No games played message */}
                      {isExpanded && playerHistory.length === 0 && (
                        <div className="ml-6 p-2 text-xs text-muted-foreground italic">
                          No games played yet
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <StopCircle className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end "{activeSession.name}". All data will be saved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEndSession}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  End Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Always Visible Player Selection with Avatars */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium text-sm">Select Players</span>
            <Badge variant="secondary" className="text-xs">
              {selectedPlayers.length}/{allPlayers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            {allPlayers.map((player) => {
              const avatar = getPlayerAvatar(player.name);
              const isSelected = selectedPlayerIds.includes(player._id);
              return (
                <div
                  key={player._id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 scale-105"
                      : "hover:bg-muted/50 hover:scale-102"
                  }`}
                  onClick={() => togglePlayerSelection(player._id)}
                >
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatar.color} ${
                    isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}>
                    {avatar.initials}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className={`font-medium text-xs text-center leading-tight ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {player.name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Point Entry - Prominent */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Game {games.length + 1} Points
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-calc</span>
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="rounded border-input"
              />
            </div>
          </div>
          {autoCalculate && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 Leave one player empty to auto-calculate
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGame} className="space-y-4">
            {/* Points input grid - Large and prominent */}
            <div className="grid gap-4">
              {selectedPlayers.map((player) => (
                <div key={player._id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium text-base">{player.name}</Label>
                  </div>
                  <Input
                    type="number"
                    step="any"
                    value={newGamePoints[player._id] || ""}
                    onChange={(e) =>
                      setNewGamePoints(prev => ({
                        ...prev,
                        [player._id]: e.target.value
                      }))
                    }
                    className="w-24 text-center text-lg font-medium"
                    placeholder={autoCalculate ? "auto" : "0"}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Game {games.length + 1}
            </Button>
          </form>
        </CardContent>
      </Card>


    </div>
  );
}
