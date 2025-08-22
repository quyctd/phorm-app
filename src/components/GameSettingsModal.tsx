import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Gear, Lock, Copy } from "@phosphor-icons/react";

interface GameSettingsModalProps {
  sessionId: Id<"sessions">;
  sessionName: string;
  currentPasscode: string;
}

export const GameSettingsModal = NiceModal.create(
  ({ sessionId, sessionName, currentPasscode }: GameSettingsModalProps) => {
    const modal = useModal();
    const [newPasscode, setNewPasscode] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    
    const updatePasscode = useMutation(api.sessions.updatePasscode);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!newPasscode.trim()) {
        toast.error("Please enter a new passcode");
        return;
      }

      if (!/^\d{6}$/.test(newPasscode.trim())) {
        toast.error("Passcode must be exactly 6 digits");
        return;
      }

      if (newPasscode.trim() === currentPasscode) {
        toast.error("New passcode must be different from current passcode");
        return;
      }

      setIsUpdating(true);
      
      try {
        await updatePasscode({
          sessionId,
          newPasscode: newPasscode.trim()
        });
        
        toast.success("Passcode updated successfully!");
        modal.hide();
      } catch (error) {
        console.error("Error updating passcode:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update passcode. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCopyPasscode = async () => {
      try {
        await navigator.clipboard.writeText(currentPasscode);
        toast.success("Current passcode copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy passcode");
      }
    };

    const handleGenerateRandom = () => {
      const randomPasscode = Math.floor(100000 + Math.random() * 900000).toString();
      setNewPasscode(randomPasscode);
    };

    return (
      <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Gear className="h-4 w-4 text-white" />
              </div>
              Game Settings
            </DialogTitle>
            <DialogDescription>
              Manage settings for "{sessionName}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Passcode Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Current Passcode</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="font-mono text-lg tracking-wider text-gray-900">
                    {currentPasscode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void handleCopyPasscode()}
                  className="h-10 w-10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Share this passcode with players to join the game
              </p>
            </div>

            {/* Update Passcode Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-passcode" className="text-sm font-medium text-gray-700">
                  New Passcode
                </Label>
                <div className="space-y-2">
                  <Input
                    id="new-passcode"
                    type="text"
                    value={newPasscode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setNewPasscode(value);
                    }}
                    placeholder="Enter 6 digits"
                    className="font-mono text-lg tracking-wider text-center"
                    maxLength={6}
                    disabled={isUpdating}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRandom}
                    disabled={isUpdating}
                    className="w-full text-xs"
                  >
                    Generate Random Passcode
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter exactly 6 digits for the new passcode
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => modal.hide()}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !newPasscode.trim() || newPasscode.length !== 6}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Passcode
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

GameSettingsModal.displayName = "GameSettingsModal";
