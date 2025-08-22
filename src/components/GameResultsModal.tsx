import { useState, useEffect } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button } from "./ui/button";
import { Trophy, Crown, Medal, ArrowRight } from "@phosphor-icons/react";

interface Player {
  id: string;
  name: string;
}

interface GameResult {
  player: Player;
  points: number;
  totalPoints: number;
}

interface GameResultsModalProps {
  gameNumber: number;
  results: GameResult[];
  onContinue: () => void;
}

export const GameResultsModal = NiceModal.create(({
  gameNumber,
  results,
  onContinue,
}: GameResultsModalProps) => {
  const modal = useModal();
  const [countdown, setCountdown] = useState(5);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(true);

  // Sort results by points (highest first for this game)
  const sortedResults = [...results].sort((a, b) => b.points - a.points);
  
  // Sort by total points for overall ranking (lowest total first - typical for scoring games)
  const overallRanking = [...results].sort((a, b) => a.totalPoints - b.totalPoints);

  useEffect(() => {
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
  }, [countdown, isAutoAdvancing]);

  const handleContinue = () => {
    onContinue();
    modal.hide();
  };

  const handleStopAutoAdvance = () => {
    setIsAutoAdvancing(false);
    setCountdown(0);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{index + 1}</div>;
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

  // Don't render if modal is not visible
  if (!modal.visible) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop for closing
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleStopAutoAdvance}
      style={{ touchAction: 'none' }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content container */}
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Game {gameNumber} Complete!</h2>
          <p className="text-gray-600">Here's how everyone scored</p>
        </div>

        {/* Game Results */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">This Game Results</h3>
          {sortedResults.map((result, index) => {
            const avatar = getPlayerAvatar(result.player.name);
            return (
              <div
                key={result.player.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                  index === 0 
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200" 
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatar.color}`}>
                    {avatar.initials}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{result.player.name}</div>
                  <div className="text-xs text-gray-500">Total: {result.totalPoints}</div>
                </div>
                <div className={`text-xl font-bold ${
                  result.points > 0 ? "text-green-600" : result.points < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {result.points > 0 ? "+" : ""}{result.points}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Leaderboard */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Leaderboard</h3>
          <div className="space-y-2">
            {overallRanking.slice(0, 3).map((result, index) => {
              const avatar = getPlayerAvatar(result.player.name);
              return (
                <div key={result.player.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index)}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatar.color}`}>
                      {avatar.initials}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{result.player.name}</span>
                  </div>
                  <div className="font-bold text-gray-900">{result.totalPoints}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 h-12 text-base font-medium"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Continue to Game {gameNumber + 1}
          </Button>
          
          {isAutoAdvancing && countdown > 0 && (
            <Button
              variant="outline"
              onClick={handleStopAutoAdvance}
              className="w-full h-10 text-sm border-gray-200 hover:bg-gray-50"
            >
              Auto-advancing in {countdown}s (tap to stop)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
