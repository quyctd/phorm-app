import { Toaster } from "sonner";
import { GameTracker } from "./GameTracker";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 safe-area-padding">
      <OfflineIndicator />
      <main className="max-w-md min-h-screen mx-auto">
        <Content />
      </main>
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        richColors
      />
    </div>
  );
}

function Content() {
  return <GameTracker />;
}
