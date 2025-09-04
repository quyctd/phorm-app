import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import NiceModal from "@ebay/nice-modal-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Avatar } from "./components/ui/avatar";
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

  const selectedPlayers = useMemo(() => 
    allPlayers.filter(player => selectedPlayerIds.includes(player.id)),
    [allPlayers, selectedPlayerIds]
  );


  // Get player's game history
  const getPlayerGameHistory = (playerId: string) => {
    return games.map(game => ({
      gameNumber: game.gameNumber,
      points: game.points[playerId] || 0,
      gameId: game._id,
      autoCalculated: game.autoCalculated
    })).filter(game => game.points !== 0 || Object.keys(games.find(g => g._id === game.gameId)?.points || {}).includes(playerId));
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

  // Auto-select newly added players (only when allPlayers changes, not when selectedPlayerIds changes)
  useEffect(() => {
    if (isInitialized && activeSession) {
      const currentPlayerIds = allPlayers.map(p => p.id);
      
      setSelectedPlayerIds(prev => {
        const newPlayerIds = currentPlayerIds.filter(id => !prev.includes(id));
        
        if (newPlayerIds.length > 0) {
          const updatedSelection = [...prev, ...newPlayerIds];
          
          // Save to localStorage
          const storageKey = `selectedPlayers_${activeSession._id}`;
          localStorage.setItem(storageKey, JSON.stringify(updatedSelection));
          
          return updatedSelection;
        }
        
        return prev;
      });
    }
  }, [allPlayers, isInitialized, activeSession]);

  // Functions moved here to ensure all hooks are called before conditional returns
  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      const wasSelected = prev.includes(playerId);
      let newSelection: string[];
      
      if (wasSelected) {
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

  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Modern Header - No Session */}
        <div className="bg-card border-b p-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack} 
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Game Session</h1>
              </div>
              <p className="text-muted-foreground text-base">
                No active session found
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-muted">
                <span className="text-sm font-medium text-muted-foreground">Inactive</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-2 border-dashed bg-muted/50">
          <CardContent className="text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-xl">No Active Session</h3>
              <p className="text-muted-foreground text-base">
                Start a new session to begin tracking points
              </p>
            </div>
            <Button onClick={onBack} className="w-full">
              <Play className="h-5 w-5 mr-2" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-card border-b mb-6">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
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
                  <h1 className="text-xl font-bold text-foreground">{activeSession?.name || "Loading..."}</h1>
                  <p className="text-sm text-muted-foreground">Game Session</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
                Game {games.length + 1}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <DotsThreeVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void handleShare()} className="cursor-pointer">
                    <ShareNetwork className="h-4 w-4 mr-2" />
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
                    <Gear className="h-4 w-4 mr-2" />
                    Game Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // We'll trigger the alert dialog programmatically
                      document.getElementById('end-session-trigger')?.click();
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
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
      <div className="px-6 pb-8">
                {/* Current Leaderboard Section - Only show when there are games */}
        {games.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Current Standings</h2>
              </div>
              <PlayerHistoryDrawer
                trigger={
                  <Button variant="outline" size="sm" className="text-xs">
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
            <div className="bg-card rounded-lg p-4 border">
              <div className="space-y-3">
                {finalResults.slice(0, 5).map((result, index) => {
                  const isTopThree = index < 3;
                  
                  // Special styling for top 3
                  const getPositionStyling = () => {
                    switch (index) {
                      case 0: // 1st place - Gold
                        return {
                          container: "bg-primary/10 border-2 border-primary",
                          badge: "bg-primary text-primary-foreground",
                          icon: <CrownSimple className="h-4 w-4" weight="fill" />,
                          nameColor: "text-foreground font-bold",
                          pointsColor: "text-foreground font-extrabold",
                          status: "🏆 Champion"
                        };
                      case 1: // 2nd place - Silver  
                        return {
                          container: "bg-secondary/10 border-2 border-secondary",
                          badge: "bg-secondary text-secondary-foreground",
                          icon: <Medal className="h-4 w-4" weight="fill" />,
                          nameColor: "text-foreground font-semibold",
                          pointsColor: "text-foreground font-bold",
                          status: `${Math.abs(result.total - finalResults[0].total)} behind`
                        };
                      default: // 4th, 5th place
                        return {
                          container: "bg-muted/50 border border-border",
                          badge: "bg-muted text-muted-foreground",
                          icon: null,
                          nameColor: "text-foreground",
                          pointsColor: "text-foreground",
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
                        <Avatar 
                          name={result.player.name} 
                          size="lg"
                          className={isTopThree ? 'shadow-md' : ''}
                        />
                      </div>
                      <div className="flex-1">
                        <div className={styling.nameColor}>
                          {result.player.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                    <span className="text-xs text-muted-foreground">
                      +{finalResults.length - 5} more player{finalResults.length - 5 !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact Player Selection */}
        <div className="mb-4">
          <div className="bg-card rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Players</span>
                <Badge variant="secondary" className="text-xs">
              {selectedPlayers.length}/{allPlayers.length}
            </Badge>
          </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openAddPlayerModal}
                className="h-7 px-2 text-xs"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            
            {/* Compact horizontal scrollable player list */}
            <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {allPlayers.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-accent border-primary"
                      : "hover:bg-accent border-border"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePlayerSelection(player.id);
                  }}
                >
                    <Avatar 
                      name={player.name} 
                      size="sm"
                    />
                    <span className={`text-xs font-medium whitespace-nowrap ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {player.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Point Entry Section */}
        <div className="bg-card rounded-lg p-6 border mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isAddingGame ? (
                  <span className="text-primary">Saving Game {games.length + 1}...</span>
                ) : (
                  `Game ${games.length + 1} Points`
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-calc</span>
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                disabled={isAddingGame}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-xs text-muted-foreground mb-4">
              💡 Leave one player empty to auto-calculate
            </p>
          )}
          <form onSubmit={(e) => void handleAddGame(e)} className="space-y-4">
            {/* Compact Grid Layout - 2 columns on larger screens */}
            <div className="grid grid-cols-1 gap-2">
              {selectedPlayers.map((player) => {
                const pointValue = newGamePoints[player.id] || (autoCalculate ? "auto" : "0");
                const isAutoValue = pointValue === "auto";
                
                return (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() => openKeypad(player.id)}
                    disabled={isAddingGame}
                    className="h-16 p-3 border-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary active:scale-[0.98] transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex items-center justify-between w-full">
                      {/* Player avatar - left side */}
                      <div className="flex items-center gap-2 mr-2">
                        <Avatar 
                          name={player.name} 
                          size="sm"
                        />
                      </div>
                      {/* Player name - left side */}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm text-foreground truncate">
                          {player.name}
                </div>
                        <div className="text-xs text-muted-foreground">
                          tap to enter
                        </div>
                      </div>
                      
                      {/* Points display - right side */}
                      <div className="flex flex-col items-end">
                        <div className={`
                          text-xl font-bold 
                          ${isAutoValue ? "text-primary" : "text-primary"}
                          group-hover:scale-110 transition-transform
                        `}>
                          {isAutoValue ? "auto" : pointValue}
                        </div>
                        {!isAutoValue && (
                          <div className="text-xs text-muted-foreground">
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
              className="w-full"
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
    </>
  );
}
