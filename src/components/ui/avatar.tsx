import { cn } from "../../lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Generate a consistent color based on the name
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-red-500",
    "bg-orange-500", 
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500"
  ];
  
  // Create a simple hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to select a color
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Generate initials from the name
const getInitials = (name: string): string => {
  if (!name || name.trim().length === 0) return "?";
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    return words[0].slice(0, 2).toUpperCase();
  } else {
    // Multiple words: take first letter of first 2 words
    return words
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();
  }
};

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm", 
  lg: "w-10 h-10 text-sm",
  xl: "w-12 h-12 text-base"
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold select-none",
        colorClass,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}