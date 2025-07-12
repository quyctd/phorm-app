import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function GameSession() {
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

  const [newGamePoints, setNewGamePoints] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [excludedPlayerId, setExcludedPlayerId] = useState<string>("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGamePoints, setEditGamePoints] = useState<Record<string, string>>({});
  const [editAutoCalculate, setEditAutoCalculate] = useState(true);
  const [editExcludedPlayerId, setEditExcludedPlayerId] = useState<string>("");

  if (!activeSession) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Session</h2>
        <p className="text-gray-600 mb-6">Start a new session to begin tracking points</p>
        <p className="text-sm text-gray-500">Go to the Sessions tab to create a new session</p>
      </div>
    );
  }

  const players = activeSession.players.filter((p): p is NonNullable<typeof p> => p !== null);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const points: Record<string, number> = {};
    let totalEntered = 0;
    let enteredCount = 0;

    // Process entered points
    players.forEach((player) => {
      const pointStr = newGamePoints[player._id] || "";
      if (pointStr.trim() !== "") {
        const point = parseFloat(pointStr);
        if (!isNaN(point)) {
          points[player._id] = point;
          totalEntered += point;
          enteredCount++;
        }
      }
    });

    // Auto-calculate if enabled and one player is excluded
    if (autoCalculate && excludedPlayerId && enteredCount === players.length - 1) {
      points[excludedPlayerId] = -totalEntered;
    }

    // Validate we have points for all players
    if (Object.keys(points).length !== players.length) {
      toast.error("Please enter points for all players or enable auto-calculation");
      return;
    }

    try {
      await addGame({
        sessionId: activeSession._id,
        points,
        autoCalculated: autoCalculate && excludedPlayerId !== "",
      });
      setNewGamePoints({});
      setExcludedPlayerId("");
      toast.success("Game added successfully");
    } catch (error) {
      toast.error("Failed to add game");
    }
  };

  const handleEditGame = (game: any) => {
    setEditingGameId(game._id);
    const editPoints: Record<string, string> = {};
    players.forEach((player) => {
      editPoints[player._id] = (game.points[player._id] || 0).toString();
    });
    setEditGamePoints(editPoints);
    setEditAutoCalculate(game.autoCalculated);
    
    // Find excluded player if auto-calculated
    if (game.autoCalculated) {
      const totalOthers = Object.entries(game.points)
        .filter(([playerId, points]) => (points as number) >= 0)
        .reduce((sum, [, points]) => sum + (points as number), 0);
      const excludedPlayer = Object.entries(game.points)
        .find(([, points]) => (points as number) === -totalOthers);
      setEditExcludedPlayerId(excludedPlayer ? excludedPlayer[0] : "");
    } else {
      setEditExcludedPlayerId("");
    }
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGameId) return;

    const points: Record<string, number> = {};
    let totalEntered = 0;
    let enteredCount = 0;

    // Process entered points
    players.forEach((player) => {
      const pointStr = editGamePoints[player._id] || "";
      if (pointStr.trim() !== "") {
        const point = parseFloat(pointStr);
        if (!isNaN(point)) {
          points[player._id] = point;
          totalEntered += point;
          enteredCount++;
        }
      }
    });

    // Auto-calculate if enabled and one player is excluded
    if (editAutoCalculate && editExcludedPlayerId && enteredCount === players.length - 1) {
      points[editExcludedPlayerId] = -totalEntered;
    }

    // Validate we have points for all players
    if (Object.keys(points).length !== players.length) {
      toast.error("Please enter points for all players or enable auto-calculation");
      return;
    }

    try {
      await updateGame({
        gameId: editingGameId as any,
        points,
        autoCalculated: editAutoCalculate && editExcludedPlayerId !== "",
      });
      setEditingGameId(null);
      setEditGamePoints({});
      setEditExcludedPlayerId("");
      toast.success("Game updated successfully");
    } catch (error) {
      toast.error("Failed to update game");
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    const confirmed = window.confirm("Are you sure you want to remove this game?");
    if (!confirmed) return;

    try {
      await removeGame({ gameId: gameId as any });
      toast.success("Game removed");
    } catch (error) {
      toast.error("Failed to remove game");
    }
  };

  // Calculate final results sorted by points (lowest first)
  const finalResults = players
    .map((player) => ({
      player,
      total: totals[player._id] || 0,
    }))
    .sort((a, b) => a.total - b.total);

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          {activeSession.name}
        </h2>
        <p className="text-blue-700">
          Game {games.length + 1} • {players.length} players
        </p>
      </div>

      {/* Current Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {finalResults.map(({ player, total }) => (
          <div
            key={player._id}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center"
          >
            <h3 className="font-semibold text-gray-900 mb-1">{player.name}</h3>
            <p className={`text-2xl font-bold ${
              total < 0 ? "text-green-600" : total > 0 ? "text-red-600" : "text-gray-600"
            }`}>
              {total > 0 ? "+" : ""}{total}
            </p>
          </div>
        ))}
      </div>

      {/* Add New Game */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Game Points</h3>
        
        <form onSubmit={handleAddGame} className="space-y-4">
          {/* Auto-calculate toggle */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => {
                  setAutoCalculate(e.target.checked);
                  if (!e.target.checked) {
                    setExcludedPlayerId("");
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-calculate one player's points
              </span>
            </label>
          </div>

          {/* Excluded player selection */}
          {autoCalculate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player to auto-calculate:
              </label>
              <select
                value={excludedPlayerId}
                onChange={(e) => setExcludedPlayerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required={autoCalculate}
              >
                <option value="">Select player...</option>
                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Points input */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map((player) => (
              <div key={player._id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {player.name}
                  {autoCalculate && excludedPlayerId === player._id && (
                    <span className="text-xs text-blue-600 ml-1">(auto)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newGamePoints[player._id] || ""}
                  onChange={(e) =>
                    setNewGamePoints(prev => ({
                      ...prev,
                      [player._id]: e.target.value
                    }))
                  }
                  disabled={autoCalculate && excludedPlayerId === player._id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
          >
            Add Game
          </button>
        </form>
      </div>

      {/* Game History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Game History ({games.length})
        </h3>
        
        {games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No games played yet</p>
            <p className="text-sm">Add your first game above</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {games.slice().reverse().map((game) => (
              <div key={game._id} className="bg-white border border-gray-200 rounded-lg p-4">
                {editingGameId === game._id ? (
                  <form onSubmit={handleUpdateGame} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Edit Game {game.gameNumber}</h4>
                      <button
                        type="button"
                        onClick={() => setEditingGameId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editAutoCalculate}
                          onChange={(e) => {
                            setEditAutoCalculate(e.target.checked);
                            if (!e.target.checked) {
                              setEditExcludedPlayerId("");
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Auto-calculate
                        </span>
                      </label>
                    </div>

                    {editAutoCalculate && (
                      <select
                        value={editExcludedPlayerId}
                        onChange={(e) => setEditExcludedPlayerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        required={editAutoCalculate}
                      >
                        <option value="">Select player to auto-calculate...</option>
                        {players.map((player) => (
                          <option key={player._id} value={player._id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {players.map((player) => (
                        <div key={player._id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {player.name}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={editGamePoints[player._id] || ""}
                            onChange={(e) =>
                              setEditGamePoints(prev => ({
                                ...prev,
                                [player._id]: e.target.value
                              }))
                            }
                            disabled={editAutoCalculate && editExcludedPlayerId === player._id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGameId(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Game {game.gameNumber}
                        {game.autoCalculated && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Auto-calculated
                          </span>
                        )}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGame(game)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveGame(game._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {players.map((player) => (
                        <div key={player._id} className="text-center">
                          <div className="text-sm text-gray-600">{player.name}</div>
                          <div className={`font-semibold ${
                            (game.points[player._id] || 0) < 0 ? "text-green-600" : 
                            (game.points[player._id] || 0) > 0 ? "text-red-600" : "text-gray-600"
                          }`}>
                            {(game.points[player._id] || 0) > 0 ? "+" : ""}{game.points[player._id] || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Results */}
      {games.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Current Standings</h3>
          <div className="space-y-2">
            {finalResults.map((result, index) => (
              <div
                key={result.player._id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? "bg-red-100 border border-red-200" : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                  <span className="font-medium text-gray-900">{result.player.name}</span>
                  {index === 0 && (
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                      Current Loser
                    </span>
                  )}
                </div>
                <span className={`text-xl font-bold ${
                  result.total < 0 ? "text-green-600" : 
                  result.total > 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {result.total > 0 ? "+" : ""}{result.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
