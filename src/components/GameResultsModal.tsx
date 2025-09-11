import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Trophy, Crown, Medal, ArrowRight } from "@phosphor-icons/react/dist/ssr";

interface Player {
  id: string;
  name: string;
}

interface GameResult {
  player: Player;
  points: number;
  totalPoints: number;
}

interface GameResultsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gameNumber: number;
  results: GameResult[];
  onContinue: () => void;
}

export function GameResultsDrawer({
  isOpen,
  onOpenChange,
  gameNumber,
  results,
  onContinue,
}: GameResultsDrawerProps) {
  const [countdown, setCountdown] = useState(5);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);

  // Sort results by points (highest first for this game)
  const sortedResults = [...results].sort((a, b) => b.points - a.points);

  // Sort by total points for overall ranking (lowest total first - typical for scoring games)
  const overallRanking = [...results].sort((a, b) => a.totalPoints - b.totalPoints);

  const handleContinue = useCallback(() => {
    onContinue();
    onOpenChange(false);
  }, [onContinue, onOpenChange]);

  const handleStopAutoAdvance = useCallback(() => {
    setIsAutoAdvancing(false);
    setCountdown(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when drawer closes
      setCountdown(5);
      setIsAutoAdvancing(true);
      return;
    }

    if (!isAutoAdvancing || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isAutoAdvancing, isOpen, handleContinue]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{index + 1}</div>;
    }
  };

  const getPlayerAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const colorIndex = name.length % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 justify-center">
            <Trophy className="h-5 w-5" />
            Game {gameNumber} Complete!
          </DrawerTitle>
          <DrawerDescription className="text-center">
            Here's how everyone scored
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="px-4 space-y-6 overflow-y-auto flex-1">
          {/* Game Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">This Game Results</h3>
            {sortedResults.map((result, index) => {
              const avatar = getPlayerAvatar(result.player.name);
              return (
                <div
                  key={result.player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    index === 0
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatar.color}`}>
                      {avatar.initials}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{result.player.name}</div>
                    <div className="text-xs text-muted-foreground">Total: {result.totalPoints}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      result.points > 0 ? "text-green-600" : result.points < 0 ? "text-red-600" : "text-muted-foreground"
                    }`}>
                      {result.points > 0 ? "+" : ""}{result.points}
                    </span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Winner
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Leaderboard */}
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Current Leaderboard</h3>
            <div className="space-y-2">
              {overallRanking.slice(0, 3).map((result, index) => {
                const avatar = getPlayerAvatar(result.player.name);
                return (
                  <div key={result.player.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatar.color}`}>
                        {avatar.initials}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{result.player.name}</span>
                    </div>
                    <div className="font-bold">{result.totalPoints}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="px-4 pb-4 pt-2 border-t bg-background">
          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full h-12 text-base font-medium"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Continue to Game {gameNumber + 1}
            </Button>

            {isAutoAdvancing && countdown > 0 && (
              <Button
                variant="outline"
                onClick={handleStopAutoAdvance}
                className="w-full h-10 text-sm"
              >
                Auto-advancing in {countdown}s (tap to stop)
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
