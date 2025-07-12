import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Trophy, ClockCounterClockwise, CaretRight, Trash } from "@phosphor-icons/react";
import type { Id } from "../../convex/_generated/dataModel";

interface Player {
  _id: Id<"players">;
  name: string;
  isDeleted?: boolean;
}

interface GameData {
  gameNumber: number;
  points: number;
  gameId: Id<"games">;
  autoCalculated: boolean;
}

interface PlayerResult {
  player: Player;
  total: number;
}

interface PlayerHistoryDrawerProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  results: PlayerResult[];
  getPlayerGameHistory: (playerId: string) => GameData[];
  onRemoveGame?: (gameId: Id<"games">) => void;
  showRemoveButtons?: boolean;
}

export function PlayerHistoryDrawer({
  trigger,
  title,
  description,
  results,
  getPlayerGameHistory,
  onRemoveGame,
  showRemoveButtons = false,
}: PlayerHistoryDrawerProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

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

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 justify-center">
            <Trophy className="h-5 w-5" />
            {title}
          </DrawerTitle>
          <DrawerDescription className="text-center">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-2 overflow-y-auto flex-1">
          {results.length > 0 ? (
            results.map(({ player, total }, index) => {
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
                        <span className={`font-semibold text-sm ${player.isDeleted ? 'text-gray-500 italic' : ''}`}>
                          {player.name}
                        </span>
                        {player.isDeleted && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            Deleted
                          </Badge>
                        )}
                        {index === 0 && total > 0 && !player.isDeleted && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Last
                          </Badge>
                        )}
                      </div>
                      {playerHistory.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {playerHistory.length} game{playerHistory.length !== 1 ? 's' : ''} played
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${index === 0 && total > 0 ? "text-destructive" : ""}`}>
                        {total > 0 ? "+" : ""}{total}
                      </span>
                      <CaretRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </div>
                  </div>

                  {/* Expanded Game History */}
                  {isExpanded && playerHistory.length > 0 && (
                    <div className="ml-6 space-y-1 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockCounterClockwise className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Game History</span>
                      </div>
                      {playerHistory.map((gameData) => (
                        <div key={gameData.gameId} className="flex items-center justify-between py-1 px-2 rounded bg-muted/10">
                          <span className="text-xs text-muted-foreground">Game {gameData.gameNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${gameData.points > 0 ? "text-destructive" : ""}`}>
                              {gameData.points > 0 ? "+" : ""}{gameData.points}
                            </span>
                            {showRemoveButtons && onRemoveGame && (
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveGame(gameData.gameId);
                                }}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show message when no games played yet */}
                  {isExpanded && playerHistory.length === 0 && (
                    <div className="ml-6 py-2">
                      <span className="text-xs text-muted-foreground italic">No games played yet</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-sm text-gray-400 italic py-8">No results available.</div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
