import { useState } from "react";
import { Button } from "./ui/button";
import { Backspace, Check } from "@phosphor-icons/react";

interface GameKeypadProps {
  isOpen: boolean;
  playerName: string;
  initialValue?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export function GameKeypad({
  isOpen,
  playerName,
  initialValue = "",
  onClose,
  onConfirm,
}: GameKeypadProps) {
  const [keypadValue, setKeypadValue] = useState(() => {
    // Remove the minus sign for keypad value and track it separately
    return initialValue.startsWith("-") ? initialValue.slice(1) : initialValue;
  });
  const [isNegative, setIsNegative] = useState(() => initialValue.startsWith("-"));

  const handleKeypadNumber = (num: string) => {
    setKeypadValue(prev => prev + num);
  };

  const handleKeypadBackspace = () => {
    setKeypadValue(prev => prev.slice(0, -1));
  };

  const handleKeypadToggleSign = () => {
    setIsNegative(prev => !prev);
  };

  const handleKeypadConfirm = () => {
    const finalValue = keypadValue === "" ? "" : (isNegative ? "-" : "") + keypadValue;
    onConfirm(finalValue);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const displayValue = keypadValue === "" ? "0" : (isNegative ? "-" : "") + keypadValue;

  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      onClick={handleClose}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="bg-white w-full rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Display */}
        <div className="mb-6">
          <div className="text-center mb-2">
            <span className="text-sm text-gray-600">
              {playerName}
            </span>
          </div>
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <span className="text-3xl font-bold text-gray-900">
              {displayValue}
            </span>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Numbers 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="lg"
              onClick={() => handleKeypadNumber(num.toString())}
              className="h-14 text-xl font-semibold hover:bg-blue-50 hover:border-blue-300"
            >
              {num}
            </Button>
          ))}
        </div>

        {/* Bottom row: +/-, 0, Backspace */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handleKeypadToggleSign}
            className={`h-14 text-lg font-semibold ${
              isNegative
                ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                : "bg-green-50 border-green-300 text-green-600 hover:bg-green-100"
            }`}
          >
            {isNegative ? "−" : "+"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleKeypadNumber("0")}
            className="h-14 text-xl font-semibold hover:bg-blue-50 hover:border-blue-300"
          >
            0
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleKeypadBackspace}
            className="h-14 hover:bg-gray-50 hover:border-gray-300"
          >
            <Backspace className="h-6 w-6" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-12 text-base font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleKeypadConfirm}
            className="h-12 text-base font-medium bg-green-500 hover:bg-green-600 text-white"
          >
            <Check className="h-5 w-5 mr-2" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
