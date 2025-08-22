import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Lock, X } from "@phosphor-icons/react";
import { toast } from "sonner";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
}

export function JoinGameModal({ isOpen, onClose, onSuccess }: JoinGameModalProps) {
  const [passcode, setPasscode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const joinByPasscode = useMutation(api.sessions.joinByPasscode);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passcode.length !== 6) {
      toast.error("Passcode must be exactly 6 digits");
      return;
    }

    setIsJoining(true);
    try {
      const session = await joinByPasscode({ passcode });
      toast.success(`Joined "${session.name}"!`);
      onSuccess(session._id);
      onClose();
      setPasscode("");
    } catch (error) {
      console.error("Failed to join session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join session");
    } finally {
      setIsJoining(false);
    }
  };

  const handlePasscodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPasscode(cleaned);
  };

  const handleClose = () => {
    setPasscode("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Join Game</h2>
              <p className="text-sm text-gray-600">Enter the 6-digit passcode</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <Label htmlFor="passcode" className="text-sm font-medium text-gray-700 mb-2 block">
              Game Passcode
            </Label>
            <Input
              id="passcode"
              type="text"
              value={passcode}
              onChange={(e) => handlePasscodeChange(e.target.value)}
              placeholder="123456"
              className="h-14 text-center text-2xl font-mono tracking-widest border-2 focus:border-blue-500"
              maxLength={6}
              autoFocus
              disabled={isJoining}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Ask the game creator for the 6-digit passcode
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 text-base font-medium"
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isJoining || passcode.length !== 6}
            >
              {isJoining ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Join Game"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
