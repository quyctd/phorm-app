import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
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
import { cn } from "@/lib/utils";

interface JoinGameDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sessionId: Id<"sessions">) => void;
}

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

function OTPInput({ value, onChange, length, disabled = false, autoFocus = false }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, inputDigit: string) => {
    // Only allow single digits
    let digit = inputDigit;
    if (digit.length > 1) {
      digit = digit.slice(-1);
    }

    // Only allow numbers
    if (!/^\d*$/.test(digit)) {
      return;
    }

    const newValue = value.split('');
    newValue[index] = digit;
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, focus previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={`otp-${index.toString()}`}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-14 h-16 text-center text-3xl font-bold border-2 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "transition-all duration-200",
            value[index] ? "border-primary bg-primary/5" : "border-muted-foreground/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          maxLength={1}
        />
      ))}
    </div>
  );
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

  const handleJoin = useCallback(async () => {
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
  }, [passcode, joinByPasscode, onSuccess, onOpenChange, t]);

  // Auto-submit when passcode is complete
  useEffect(() => {
    if (passcode.length === 6 && !isJoining) {
      const timer = setTimeout(() => {
        void handleJoin();
      }, 300); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [passcode, isJoining, handleJoin]);

  const handlePasscodeChange = (value: string) => {
    setPasscode(value);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="h-fit">
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
        <div className="px-4 space-y-8 overflow-y-auto py-8">
          <div className="space-y-8">
            <div className="text-center">
              <Label className="text-xl font-medium text-foreground mb-6 block">
                {t('joinGameModal.passcode')}
              </Label>
              <div className="mb-6">
                <OTPInput
                  value={passcode}
                  onChange={handlePasscodeChange}
                  length={6}
                  disabled={isJoining}
                  autoFocus={true}
                />
              </div>
              <p className="text-base text-muted-foreground">
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
              size="lg"
              onClick={handleClose}
              className="flex-1 font-medium"
              disabled={isJoining}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void handleJoin()}
              className="flex-1 font-medium"
              size="lg"
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
