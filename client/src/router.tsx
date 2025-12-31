import { Suspense, lazy } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home }))
);
const GameSetup = lazy(() =>
  import("./pages/GameSetup").then((m) => ({ default: m.GameSetup }))
);
const GameRoom = lazy(() =>
  import("./pages/GameRoom").then((m) => ({ default: m.GameRoom }))
);
const Lobby = lazy(() =>
  import("./pages/Lobby").then((m) => ({ default: m.Lobby }))
);

import { SoundProvider, useSound } from "./context/SoundContext";

// Layout Component
const RootComponent = () => (
  <SoundProvider>
    <LayoutContent />
  </SoundProvider>
);

const LayoutContent = () => {
  const { isMuted, toggleMute } = useSound();

  return (
    <div className="min-h-screen bg-pale-bg font-sans text-pale-text">
      <div className="p-4 flex gap-4 text-sm font-bold border-b border-pale-primary/20 bg-white/50 backdrop-blur-sm sticky top-0 z-50 justify-between items-center">
        <Link to="/" className="text-lg font-bold text-pale-primary">
          BINGO
        </Link>
        <button
          onClick={toggleMute}
          className="p-2 rounded-full hover:bg-black/5 transition-colors text-pale-text/60"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          )}
        </button>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-10 text-pale-primary font-bold">
            Loading...
          </div>
        }
      >
        <Outlet />
      </Suspense>
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </div>
  );
};

export const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const setupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup",
  component: GameSetup,
  validateSearch: (search: Record<string, unknown>) => {
    // simple validation
    return {
      mode: (search.mode as "pve" | "pvp") || "pve",
    };
  },
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play",
  component: GameRoom,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mode: (search.mode as "pve" | "pvp") || "pve",
      board: (search.board as string) || "",
      roomId: (search.roomId as string) || undefined,
      playerName: (search.playerName as string) || undefined,
      difficulty: (search.difficulty as "easy" | "medium" | "hard") || "easy",
    };
  },
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lobby",
  component: Lobby,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  setupRoute,
  playRoute,
  lobbyRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
