import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface JoinGameDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sessionId: Id<"sessions">) => void;
}

export function JoinGameDrawer({ isOpen, onOpenChange, onSuccess }: JoinGameDrawerProps) {
  const { t } = useTranslation();
  const [passcode, setPasscode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const joinByPasscode = useMutation(api.sessions.joinByPasscode);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setPasscode("");
      setIsJoining(false);
    }
  }, [isOpen]);

  const handleJoin = async () => {
    if (!passcode.trim()) {
      toast.error(t('joinGameModal.validation.passcodeRequired'));
      return;
    }

    if (passcode.length !== 6) {
      toast.error(t('joinGameModal.validation.passcodeInvalid'));
      return;
    }

    setIsJoining(true);
    try {
      const session = await joinByPasscode({ passcode });
      onSuccess(session._id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to join session:", error);
      const message = error instanceof Error ? error.message : t('joinGameModal.messages.joinFailed');
      toast.error(message);
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
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 justify-center">
            <Lock className="h-5 w-5" />
            {t('joinGameModal.title')}
          </DrawerTitle>
          <DrawerDescription className="text-center">
            {t('joinGameModal.description')}
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Content */}
        <div className="px-4 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <Label htmlFor="passcode" className="text-sm font-medium text-foreground mb-2 block">
                {t('joinGameModal.passcode')}
              </Label>
              <Input
                id="passcode"
                type="text"
                value={passcode}
                onChange={(e) => handlePasscodeChange(e.target.value)}
                placeholder={t('joinGameModal.passcodePlaceholder')}
                className="h-14 text-center text-2xl font-mono tracking-widest border-2 focus:border-primary"
                maxLength={6}
                autoFocus
                disabled={isJoining}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passcode.length === 6 && !isJoining) {
                    void handleJoin();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Ask the game creator for the 6-digit passcode
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="px-4 pb-4 pt-2 border-t bg-background">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 text-base font-medium"
              disabled={isJoining}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void handleJoin()}
              className="flex-1 h-12 text-base font-medium"
              disabled={isJoining || passcode.length !== 6}
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('joinGameModal.joining')}
                </>
              ) : (
                t('joinGameModal.joinGame')
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Keep the old export name for backward compatibility
export const JoinGameModal = JoinGameDrawer;
