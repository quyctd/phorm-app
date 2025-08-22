import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { PullToRefresh } from "./components/PullToRefresh";
import { useConvexRefresh } from "./hooks/useConvexRefresh";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
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
import { GameKeypad } from "./components/GameKeypad";
import { AddPlayerModal } from "./components/AddPlayerModal";
import { GameResultsModal } from "./components/GameResultsModal";
import { GameSettingsModal } from "./components/GameSettingsModal";
import { ArrowLeft, Trophy, Plus, Target, Users, Play, Pause, ShareNetwork, DotsThreeVertical, UserPlus, CrownSimple, Medal, Gear } from "@phosphor-icons/react";

interface GameSessionProps {
  sessionId: Id<"sessions">;
  onBack: () => void;
}

export function GameSession({ sessionId, onBack }: GameSessionProps) {
  const activeSession = useQuery(api.sessions.get, { sessionId });
  const games = useQuery(
    api.games.listBySession,
    { sessionId }
  ) || [];
  const totals = useQuery(
    api.games.getTotals,
    { sessionId }
  ) || {};
  const { refreshData } = useConvexRefresh();

  const addGame = useMutation(api.games.addGame);
  const removeGame = useMutation(api.games.removeGame);
  const endSession = useMutation(api.sessions.end);
  const addPlayer = useMutation(api.sessions.addPlayer);

  const [newGamePoints, setNewGamePoints] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);


  const allPlayers = useMemo(() =>
    activeSession ? activeSession.players : [],
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
            allPlayers.some(p => p.id === id)
          );

          if (validPlayerIds.length >= 2) {
            setSelectedPlayerIds(validPlayerIds);
          } else {
            // If saved selection is invalid, fall back to all players
            setSelectedPlayerIds(allPlayers.map(p => p.id));
          }
        } catch {
          // If parsing fails, fall back to all players
          setSelectedPlayerIds(allPlayers.map(p => p.id));
        }
      } else {
        // No saved selection, start with all players
        setSelectedPlayerIds(allPlayers.map(p => p.id));
      }

      setIsInitialized(true);
    }
  }, [isInitialized, allPlayers, activeSession]);

  // Auto-select newly added players
  useEffect(() => {
    if (isInitialized && activeSession) {
      const currentPlayerIds = allPlayers.map(p => p.id);
      const newPlayerIds = currentPlayerIds.filter(id => !selectedPlayerIds.includes(id));
      
      if (newPlayerIds.length > 0) {
        const updatedSelection = [...selectedPlayerIds, ...newPlayerIds];
        setSelectedPlayerIds(updatedSelection);
        
        // Save to localStorage
        const storageKey = `selectedPlayers_${activeSession._id}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedSelection));
      }
    }
  }, [allPlayers, selectedPlayerIds, isInitialized, activeSession]);

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

  const selectedPlayers = allPlayers.filter(player => selectedPlayerIds.includes(player.id));

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

    if (isAddingGame) return; // Prevent double submission

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
      const pointStr = newGamePoints[player.id] || "";

      if (pointStr.trim() !== "") {
        const point = Number.parseFloat(pointStr);
        if (!Number.isNaN(point)) {
          points[player.id] = point;
          totalEntered += point;
          enteredCount++;
        } else {
          toast.error(`Invalid number entered for ${player.name}: "${pointStr}"`);
          return;
        }
      } else {
        playersWithoutPoints.push(player.id);
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

    const currentGameNumber = games.length + 1;
    
    setIsAddingGame(true);

    try {
      await addGame({
        sessionId,
        points,
        autoCalculated: autoCalculate,
      });

      // Prepare results for the modal
      const results = selectedPlayers.map(player => ({
        player,
        points: points[player.id],
        totalPoints: (totals[player.id] || 0) + points[player.id]
      }));

      // Clear the form
      setNewGamePoints({});

      // Show game results modal
      NiceModal.show(GameResultsModal, {
        gameNumber: currentGameNumber,
        results,
        onContinue: () => {
          // Modal handles its own closing
          // Form is already cleared above
        }
      });
    } catch (error) {
      console.error("Error adding game:", error);
      toast.error("Failed to add game. Please try again.");
    } finally {
      setIsAddingGame(false);
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
    try {
      await endSession({ sessionId });
      toast.success("Session ended successfully!");
      onBack();
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const handleShare = async () => {
    if (!activeSession) return;

    const shareText = `Join my game "${activeSession.name}"!\n\nPasscode: ${activeSession.passcode}\n\nOpen Phorm and use the passcode to join the game.`;

    try {
      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `Join "${activeSession.name}" Game Session`,
          text: shareText,
        });
        toast.success("Game passcode shared successfully!");
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success("Game passcode copied to clipboard!");
      }
    } catch (error) {
      // Final fallback: Show the passcode in a toast
      toast.info(`Share this passcode: ${activeSession.passcode}`, {
        duration: 10000,
      });
    }
  };

  // Calculate final results sorted by points (lowest first) - for all players in session
  const finalResults = allPlayers
    .map((player) => ({
      player,
      total: totals[player.id] || 0,
    }))
    .sort((a, b) => a.total - b.total);

  // Validation: Check if enough points are inputted
  const hasEnoughPointsInputted = useMemo(() => {
    if (selectedPlayers.length === 0) return false;
    
    const inputtedCount = selectedPlayers.filter(player => {
      const points = newGamePoints[player.id];
      return points && points.trim() !== "" && points !== "0";
    }).length;
    
    if (autoCalculate) {
      // With auto-calculate, need at least (total players - 1) inputs
      return inputtedCount >= selectedPlayers.length - 1;
    }
    
    // Without auto-calculate, need all players to have input
    return inputtedCount === selectedPlayers.length;
  }, [selectedPlayers, newGamePoints, autoCalculate]);

  // Open keypad using NiceModal
  const openKeypad = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    NiceModal.show(GameKeypad, {
      playerName: player.name,
      initialValue: newGamePoints[playerId] || "",
      onConfirm: (value: string) => {
        setNewGamePoints(prev => ({
          ...prev,
          [playerId]: value
        }));
      }
    });
  };

  // Handle adding a new player
  const handleAddPlayer = async (playerName: string) => {
    try {
      await addPlayer({
        sessionId,
        playerName
      });
      
      toast.success(`${playerName} has been added to the session!`);
    } catch (error) {
      console.error("Error adding player:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add player. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Open add player modal
  const openAddPlayerModal = () => {
    NiceModal.show(AddPlayerModal, {
      existingPlayerNames: allPlayers.map(p => p.name),
      onConfirm: handleAddPlayer
    });
  };

  return (
    <PullToRefresh
      onRefresh={refreshData}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-b-lg mb-6 animate-fade-in">
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
                  <h1 className="text-xl font-bold text-gray-900">{activeSession?.name || "Loading..."}</h1>
                  <p className="text-sm text-gray-600">Game Session</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out">
                Game {games.length + 1}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                    <DotsThreeVertical className="h-5 w-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void handleShare()} className="cursor-pointer">
                    <ShareNetwork className="h-4 w-4 mr-2 text-green-600" />
                    Share Session
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      if (activeSession) {
                        NiceModal.show(GameSettingsModal, {
                          sessionId,
                          sessionName: activeSession.name,
                          currentPasscode: activeSession.passcode
                        });
                      }
                    }} 
                    className="cursor-pointer"
                  >
                    <Gear className="h-4 w-4 mr-2 text-blue-600" />
                    Game Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // We'll trigger the alert dialog programmatically
                      document.getElementById('end-session-trigger')?.click();
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    End Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Hidden AlertDialog trigger */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" id="end-session-trigger" className="hidden" aria-label="End session trigger" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end "{activeSession?.name || 'this session'}". All data will be saved.
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
      <div className="px-6 pb-8 animate-fade-in">
        {/* Current Leaderboard Section - Always rendered to prevent layout shifts */}
        <div className="mb-6">
          {games.length > 0 ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Current Standings</h2>
                </div>
                <PlayerHistoryDrawer
                  trigger={
                    <Button variant="outline" size="sm" className="border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  }
                  title="Leaderboard & History"
                  description="Current standings and game-by-game breakdown"
                  results={finalResults}
                  getPlayerGameHistory={getPlayerGameHistory}
                  onRemoveGame={(gameId) => void handleRemoveGame(gameId)}
                  showRemoveButtons={true}
                />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="space-y-3">
                  {finalResults.slice(0, 5).map((result, index) => {
                    const avatar = getPlayerAvatar(result.player.name);
                    const isTopThree = index < 3;
                    
                    // Special styling for top 3
                    const getPositionStyling = () => {
                      switch (index) {
                        case 0: // 1st place - Gold
                          return {
                            container: "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-2 border-yellow-300 shadow-md transform scale-[1.02]",
                            badge: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg",
                            icon: <CrownSimple className="h-4 w-4" weight="fill" />,
                            nameColor: "text-yellow-900 font-bold",
                            pointsColor: "text-yellow-700 font-extrabold",
                            status: "🏆 Champion"
                          };
                        case 1: // 2nd place - Silver  
                          return {
                            container: "bg-gradient-to-r from-gray-50 via-slate-50 to-gray-100 border-2 border-gray-300 shadow-sm",
                            badge: "bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md",
                            icon: <Medal className="h-4 w-4" weight="fill" />,
                            nameColor: "text-gray-900 font-semibold",
                            pointsColor: "text-gray-700 font-bold",
                            status: `${Math.abs(result.total - finalResults[0].total)} behind`
                          };
                        default: // 4th, 5th place
                          return {
                            container: "bg-gray-50 border border-gray-100",
                            badge: "bg-gray-200 text-gray-600",
                            icon: null,
                            nameColor: "text-gray-900",
                            pointsColor: "text-gray-700",
                            status: `${Math.abs(result.total - finalResults[0].total)} behind leader`
                          };
                      }
                    };

                    const styling = getPositionStyling();

                    return (
                      <div
                        key={result.player.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${styling.container}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${styling.badge} ${isTopThree ? 'shadow-lg' : ''}`}>
                            {styling.icon || (index + 1)}
                          </div>
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatar.color} ${isTopThree ? 'shadow-md' : ''}`}>
                            {avatar.initials}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className={styling.nameColor}>
                            {result.player.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {styling.status}
                          </div>
                        </div>
                        <div className={`text-xl ${styling.pointsColor}`}>
                          {result.total}
                        </div>
                      </div>
                    );
                  })}
                  {finalResults.length > 5 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        +{finalResults.length - 5} more player{finalResults.length - 5 !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Placeholder to maintain layout stability
            <div className="opacity-0 pointer-events-none" aria-hidden="true">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
              <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="w-11 h-11 bg-gray-200 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                      </div>
                      <div className="h-6 w-8 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Player Selection */}
        <div className="mb-4 animate-slide-in">
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Players</span>
                <Badge className="text-xs bg-gray-100 text-gray-600">
              {selectedPlayers.length}/{allPlayers.length}
            </Badge>
          </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openAddPlayerModal}
                className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            {/* Compact horizontal scrollable player list */}
            <div className="flex gap-2 overflow-x-auto pb-1">
            {allPlayers.map((player) => {
              const avatar = getPlayerAvatar(player.name);
              const isSelected = selectedPlayerIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50 border-gray-200"
                  }`}
                  onClick={() => togglePlayerSelection(player.id)}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatar.color} ${
                      isSelected ? "ring-1 ring-blue-400" : ""
                  }`}>
                    {avatar.initials}
                  </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 transition-all duration-300 ease-in-out">
                {isAddingGame ? (
                  <span className="text-emerald-600">Saving Game {games.length + 1}...</span>
                ) : (
                  `Game ${games.length + 1} Points`
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Auto-calc</span>
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                disabled={isAddingGame}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  width: '16px',
                  height: '16px',
                  minWidth: '16px',
                  minHeight: '16px',
                  maxWidth: '16px',
                  maxHeight: '16px'
                }}
              />
            </div>
          </div>
          {autoCalculate && (
            <p className="text-xs text-gray-600 mb-4">
              💡 Leave one player empty to auto-calculate
            </p>
          )}
          <form onSubmit={(e) => void handleAddGame(e)} className="space-y-4">
            {/* Compact Grid Layout - 2 columns on larger screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedPlayers.map((player) => {
                const pointValue = newGamePoints[player.id] || (autoCalculate ? "auto" : "0");
                const isAutoValue = pointValue === "auto";
                
                return (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() => openKeypad(player.id)}
                    disabled={isAddingGame}
                    className={`
                      h-16 p-3 border-2 border-dashed transition-all duration-200 group border-blue-400 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-500
                      active:scale-[0.98] transform
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      {/* Player name - left side */}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {player.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          tap to enter
                        </div>
                      </div>
                      
                      {/* Points display - right side */}
                      <div className="flex flex-col items-end">
                        <div className={`
                          text-xl font-bold 
                          ${isAutoValue ? "text-blue-600" : "text-blue-700"}
                          group-hover:scale-110 transition-transform
                        `}>
                          {isAutoValue ? "auto" : pointValue}
                        </div>
                        {!isAutoValue && (
                          <div className="text-xs text-gray-500">
                            points
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            <Button
              type="submit"
              disabled={isAddingGame || !hasEnoughPointsInputted}
              className={`
                w-full border-0 transition-all duration-200 
                ${hasEnoughPointsInputted && !isAddingGame
                  ? "bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-600 hover:to-emerald-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              size="lg"
            >
              {isAddingGame ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding Game {games.length + 1}...
                </>
              ) : !hasEnoughPointsInputted ? (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  {autoCalculate 
                    ? `Enter ${selectedPlayers.length - 1} player${selectedPlayers.length - 1 !== 1 ? 's' : ''} points`
                    : `Enter all ${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''} points`
                  }
                </>
              ) : (
                <>
              <Plus className="h-5 w-5 mr-2" />
              Add Game {games.length + 1}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
