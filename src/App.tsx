import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { GameTracker } from "./GameTracker";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Game Points Tracker</h2>
      </header>
      <main className="flex-1 p-4">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  return (
    <div className="max-w-6xl mx-auto">
      <GameTracker />
    </div>
  );
}
