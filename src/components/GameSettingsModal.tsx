import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Gear, Lock, Copy } from "@phosphor-icons/react/dist/ssr";

interface GameSettingsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: Id<"sessions">;
  sessionName: string;
  currentPasscode: string;
}

export function GameSettingsDrawer({
  isOpen,
  onOpenChange,
  sessionId,
  sessionName,
  currentPasscode,
}: GameSettingsDrawerProps) {
  const [newPasscode, setNewPasscode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePasscode = useMutation(api.sessions.updatePasscode);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setNewPasscode("");
      setIsUpdating(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
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
      onOpenChange(false);
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

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 justify-center">
            <Gear className="h-5 w-5" />
            Game Settings
          </DrawerTitle>
          <DrawerDescription className="text-center">
            Manage settings for "{sessionName}"
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="px-4 space-y-6 overflow-y-auto flex-1">
          {/* Current Passcode Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Current Passcode</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                <span className="font-mono text-lg tracking-wider text-foreground">
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
            <p className="text-xs text-muted-foreground">
              Share this passcode with players to join the game
            </p>
          </div>

          {/* Update Passcode Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-passcode" className="text-sm font-medium text-foreground">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPasscode.length === 6 && !isUpdating) {
                      void handleSubmit();
                    }
                  }}
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
              <p className="text-xs text-muted-foreground">
                Enter exactly 6 digits for the new passcode
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="px-4 pb-4 pt-2 border-t bg-background">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={isUpdating || !newPasscode.trim() || newPasscode.length !== 6}
              className="flex-1"
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Keep the old export name for backward compatibility
export const GameSettingsModal = GameSettingsDrawer;
