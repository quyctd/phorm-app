import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import NiceModal from "@ebay/nice-modal-react";
import "./index.css";
import "./i18n";
import App from "./App";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root") as HTMLElement).render(
  <ConvexAuthProvider client={convex}>
    <NiceModal.Provider>
      <App />
    </NiceModal.Provider>
  </ConvexAuthProvider>,
);
