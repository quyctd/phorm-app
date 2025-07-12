import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ArrowLeft, UserPlus, Trash2, Users } from "lucide-react";

interface PlayerManagerProps {
  onBack: () => void;
}

export function PlayerManager({ onBack }: PlayerManagerProps) {
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
      await removePlayer({ playerId });
      toast.success("Player removed");
    } catch (error) {
      toast.error("Failed to remove player");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Players</h1>
          <p className="text-sm text-muted-foreground">
            {players.length} player{players.length !== 1 ? 's' : ''} added
          </p>
        </div>
      </div>

      {/* Add Player Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Add New Player
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={!newPlayerName.trim()}
              className="w-full"
            >
              Add Player
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            All Players ({players.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No players added yet</p>
              <p className="text-sm">Add your first player above to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">{player.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePlayer(player._id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
