import { useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserPlus, X } from "@phosphor-icons/react";

interface AddPlayerModalProps {
  onConfirm: (playerName: string) => void;
  existingPlayerNames: string[];
}

export const AddPlayerModal = NiceModal.create(({
  onConfirm,
  existingPlayerNames,
}: AddPlayerModalProps) => {
  const modal = useModal();
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError("Player name cannot be empty");
      return;
    }

    // Check if player name already exists (case-insensitive)
    const nameExists = existingPlayerNames.some(
      name => name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (nameExists) {
      setError("A player with this name already exists");
      return;
    }

    onConfirm(trimmedName);
    modal.hide();
  };

  const handleClose = () => {
    setPlayerName("");
    setError("");
    modal.hide();
  };

  // Don't render if modal is not visible
  if (!modal.visible) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop for closing
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      style={{ touchAction: 'none' }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content container */}
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Player</h2>
              <p className="text-sm text-gray-600">Add a new player to this session</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-sm font-medium text-gray-700">
              Player Name
            </Label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError(""); // Clear error when user types
              }}
              placeholder="Enter player name"
              className="w-full h-12 px-4 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Existing Players Info */}
          {existingPlayerNames.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 mb-2">Current players:</p>
              <div className="flex flex-wrap gap-1">
                {existingPlayerNames.map((name, index) => (
                  <span
                    key={name}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-white text-xs text-gray-700 border border-gray-200"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 text-base font-medium border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
