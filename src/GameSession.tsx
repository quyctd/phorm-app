import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
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
import { PlayerHistoryDrawer } from "./components/PlayerHistoryDrawer";
import { ArrowLeft, Trophy, Plus, Target, Stop, Users, Play, PauseIcon } from "@phosphor-icons/react";

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
  const removeGame = useMutation(api.games.removeGame);
  const endSession = useMutation(api.sessions.end);

  const [newGamePoints, setNewGamePoints] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);


  const allPlayers = useMemo(() =>
    activeSession ? activeSession.players.filter((p): p is NonNullable<typeof p> => p !== null) : [],
    [activeSession]
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

      setIsInitialized(true      );
    }
  }, [isInitialized, allPlayers, activeSession]);

  if (!activeSession) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Modern Header - No Session */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6 shadow-sm border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-slate-500/5" />
          <div className="relative flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack} 
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Game Session</h1>
              </div>
              <p className="text-gray-600 text-base font-medium">
                No active session found
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-gray-700">Inactive</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="app-card border-2 border-dashed border-gray-200 bg-gray-50">
          <CardContent className="text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto">
              <Target className="h-8 w-8 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 text-xl">No Active Session</h3>
              <p className="text-gray-600 text-base">
                Start a new session to begin tracking points
              </p>
            </div>
            <Button onClick={onBack} className="w-full app-button-secondary h-12 text-base font-medium">
              <Play className="h-5 w-5 mr-2" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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



  // Get player's game history
  const getPlayerGameHistory = (playerId: string) => {
    return games.map(game => ({
      gameNumber: game.gameNumber,
      points: game.points[playerId as Id<"players">] || 0,
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
        points
      });
      toast.error("Points validation failed. Please check your inputs.");
      return;
    }

    try {
      await addGame({
        sessionId: activeSession._id,
        points,
        autoCalculated: autoCalculate,
      });

      // Clear the form
      setNewGamePoints({});
      toast.success("Game added successfully!");
    } catch (error) {
      console.error("Error adding game:", error);
      toast.error("Failed to add game. Please try again.");
    }
  };

  const handleRemoveGame = async (gameId: Id<"games">) => {
    try {
      await removeGame({ gameId });
      toast.success("Game removed successfully!");
    } catch (error) {
      toast.error("Failed to remove game");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await endSession({ sessionId: activeSession._id });
      toast.success("Session ended successfully!");
      onBack();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-b-lg mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-15" />
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between mb-4">
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
                  <h1 className="text-xl font-bold text-gray-900">{activeSession.name}</h1>
                  <p className="text-sm text-gray-600">Game Session</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                Game {games.length + 1}
              </div>

              <PlayerHistoryDrawer
                trigger={
                  <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <Trophy className="h-5 w-5 text-gray-600" />
                  </Button>
                }
                title="Leaderboard & History"
                description="Current standings and game-by-game breakdown"
                results={finalResults}
                getPlayerGameHistory={getPlayerGameHistory}
                onRemoveGame={(gameId: Id<"games">) => void handleRemoveGame(gameId)}
                showRemoveButtons={true}
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-red-500">
                    <PauseIcon className="h-5 w-5" />
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
                      onClick={() => void handleEndSession()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      End Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Player Selection Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Select Players</h2>
            <Badge className="text-xs">
              {selectedPlayers.length}/{allPlayers.length}
            </Badge>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            {allPlayers.map((player) => {
              const avatar = getPlayerAvatar(player.name);
              const isSelected = selectedPlayerIds.includes(player._id);
              return (
                <button
                  key={player._id}
                  type="button"
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 scale-105"
                      : "hover:bg-gray-50 hover:scale-102 border-gray-200"
                  }`}
                  onClick={() => togglePlayerSelection(player._id)}
                >
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatar.color} ${
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
                  }`}>
                    {avatar.initials}
                  </div>
                  <span className={`font-medium text-xs text-center leading-tight ${
                    isSelected ? "text-blue-600" : "text-gray-600"
                  }`}>
                    {player.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Point Entry Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Game {games.length + 1} Points</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Auto-calc</span>
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
          </div>
          {autoCalculate && (
            <p className="text-xs text-gray-600 mb-4">
              💡 Leave one player empty to auto-calculate
            </p>
          )}
          <form onSubmit={(e) => void handleAddGame(e)} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-600 hover:to-emerald-600 text-white border-0 transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Game {games.length + 1}
            </Button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
