import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function PlayerManager() {
  const [newPlayerName, setNewPlayerName] = useState("");
  const players = useQuery(api.players.list) || [];
  const createPlayer = useMutation(api.players.create);
  const removePlayer = useMutation(api.players.remove);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      await createPlayer({ name: newPlayerName.trim() });
      setNewPlayerName("");
      toast.success("Player added successfully");
    } catch (error) {
      toast.error("Failed to add player");
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await removePlayer({ playerId: playerId as any });
      toast.success("Player removed");
    } catch (error) {
      toast.error("Failed to remove player");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Players</h2>
        <p className="text-gray-600">Add and manage your list of players</p>
      </div>

      {/* Add Player Form */}
      <form onSubmit={handleAddPlayer} className="flex gap-3">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Enter player name"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        <button
          type="submit"
          disabled={!newPlayerName.trim()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Add Player
        </button>
      </form>

      {/* Players List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Players ({players.length})
        </h3>
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No players added yet</p>
            <p className="text-sm">Add your first player above to get started</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {players.map((player) => (
              <div
                key={player._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{player.name}</span>
                <button
                  onClick={() => handleRemovePlayer(player._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
