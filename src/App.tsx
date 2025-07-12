import { Toaster } from "sonner";
import { GameTracker } from "./GameTracker";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 safe-area-padding">
      <main className="max-w-md min-h-screen mx-auto">
        <Content />
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'white',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            fontSize: '16px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  );
}

function Content() {
  return <GameTracker />;
}
