import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ArrowLeft, UserPlus, Users } from "@phosphor-icons/react";

interface PlayerManagerProps {
  onBack: () => void;
}

export function PlayerManager({ onBack }: PlayerManagerProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const players = useQuery(api.players.list) || [];
  const createPlayer = useMutation(api.players.create);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-b-lg mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-15" />
        <div className="relative px-6 py-6">
          <div className="flex items-center justify-between">
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
                  <h1 className="text-xl font-bold text-gray-900">Players</h1>
                  <p className="text-sm text-gray-600">Manage your players</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
              {players.length} player{players.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8">
        {/* Add Player Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Player</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <form onSubmit={(e) => void handleAddPlayer(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-gray-700 font-medium">
                  Player Name
                </Label>
                <Input
                  id="playerName"
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="border-gray-200 rounded-xl h-12"
                />
              </div>
              <Button
                type="submit"
                disabled={!newPlayerName.trim()}
                className="w-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-600 hover:to-emerald-600 text-white border-0 transition-all duration-200 h-12 text-base font-medium"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add Player
              </Button>
            </form>
          </div>
        </div>

        {/* Players List Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">All Players ({players.length})</h2>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            {players.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">No players added yet</h3>
                <p className="text-gray-600 text-base">Add your first player above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {players.map((player) => {
                  const avatar = getPlayerAvatar(player.name);
                  return (
                    <div
                      key={player._id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${avatar.color}`}>
                        <span className="text-white font-semibold text-sm">{avatar.initials}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-500">Player</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
