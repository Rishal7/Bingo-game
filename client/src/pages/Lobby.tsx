import { useState, useEffect } from "react";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { socket } from "../socket";
import { SoundButton } from "../components/SoundButton";

const lobbyRoute = getRouteApi("/lobby");

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SoundButton
      onClick={handleCopy}
      className={`p-2 rounded-lg transition-all ${
        copied
          ? "bg-green-100 text-green-600"
          : "bg-pale-secondary/20 text-pale-text/60 hover:bg-pale-secondary hover:text-pale-text"
      }`}
      title="Copy Code"
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </SoundButton>
  );
}

export function Lobby() {
  const navigate = useNavigate();
  const search = lobbyRoute.useSearch();

  // State: 'menu' | 'join-input' | 'waiting'
  const [view, setView] = useState<"menu" | "join-input" | "waiting">(
    search.roomId ? "waiting" : "menu"
  );
  const [roomId, setRoomId] = useState(search.roomId || "");
  const [joinInput, setJoinInput] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("bingo_playerName") || ""
  );
  const [isHost, setIsHost] = useState(!!search.roomId);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (search.alert === "opponent_left") {
      setErrorMsg("Opponent has left the game.");
    }
  }, [search.alert]);

  useEffect(() => {
    // Connect socket on mount
    socket.connect();

    const onRoomCreated = (id: string) => {
      setRoomId(id);
      setIsHost(true);
      // setPlayers set via player_update
      setView("waiting");
    };

    const onPlayerUpdate = (updatedPlayers: { id: string; name: string }[]) => {
      setPlayers(updatedPlayers);
    };

    const onGameStarted = () => {
      navigate({
        to: "/setup",
        // @ts-expect-error
        search: { mode: "pvp", roomId: roomId || joinInput, playerName },
      });
    };

    const onError = (msg: string) => {
      setErrorMsg(msg);
    };

    socket.on("room_created", onRoomCreated);
    socket.on("player_update", onPlayerUpdate);
    socket.on("game_started", onGameStarted);
    socket.on("error", onError);

    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("player_update", onPlayerUpdate);
      socket.off("game_started", onGameStarted);
      socket.off("error", onError);
      // socket.disconnect(); // Removed to prevent StrictMode double-mount issues killing the room
    };
  }, [navigate, roomId, joinInput, playerName]);

  const getOrGenerateName = () => {
    if (playerName.trim()) return playerName;
    const newName = `Guest ${Math.floor(Math.random() * 9000) + 1000}`;
    setPlayerName(newName);
    localStorage.setItem("bingo_playerName", newName);
    return newName;
  };

  const handleCreate = () => {
    const finalName = getOrGenerateName();
    socket.emit("create_room", { playerName: finalName });
  };

  const handleJoin = () => {
    if (!joinInput.trim()) return;
    const finalName = getOrGenerateName();
    socket.emit("join_room", { roomId: joinInput, playerName: finalName });
    setRoomId(joinInput);
    setIsHost(false);
    setView("waiting");
  };

  const handleStartGame = () => {
    socket.emit("start_game", roomId);
  };

  const handleBack = () => {
    if (view === "waiting") {
      socket.disconnect();
      setRoomId("");
      setJoinInput("");
      setPlayers([]);
      setIsHost(false);
      setView("menu");
      socket.connect();
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-sm sm:max-w-md mx-auto p-4 gap-6">
      <button
        onClick={handleBack}
        className="self-start text-pale-text/60 hover:text-pale-primary font-bold transition-colors flex items-center gap-2 mb-4"
      >
        ← Back
      </button>

      {view === "menu" && (
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-3xl font-black text-pale-text text-center mb-4">
            PvP Lobby
          </h2>

          <div className="w-full mb-8">
            <label className="block text-left text-pale-text/60 font-bold uppercase tracking-wider text-xs ml-1 mb-2">
              Who are you?
            </label>
            <input
              value={playerName}
              onChange={(e) => {
                const val = e.target.value;
                setPlayerName(val);
                localStorage.setItem("bingo_playerName", val);
                setErrorMsg("");
              }}
              placeholder="Enter Your Name"
              className="w-full p-4 text-center text-xl border-2 border-pale-primary/30 rounded-xl focus:border-pale-primary focus:outline-none bg-white shadow-sm transition-all focus:shadow-md"
            />
          </div>

          <SoundButton
            onClick={handleCreate}
            className="w-full py-4 text-xl font-bold bg-pale-primary text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Create Room
          </SoundButton>

          <div className="flex items-center gap-3 w-full my-2 opacity-50">
            <div className="h-0.5 bg-gray-300 flex-1 rounded-full" />
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">
              OR
            </span>
            <div className="h-0.5 bg-gray-300 flex-1 rounded-full" />
          </div>

          <div className="flex flex-col gap-2">
            <input
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value);
                setErrorMsg("");
              }}
              placeholder="Enter Room Code"
              className="w-full p-4 text-center text-xl border-2 border-pale-primary/30 rounded-xl focus:border-pale-primary focus:outline-none bg-white"
            />
            <SoundButton
              onClick={handleJoin}
              disabled={!playerName.trim() || !joinInput.trim()}
              className="w-full py-4 text-xl font-bold bg-pale-secondary text-pale-text rounded-xl shadow-md hover:bg-pale-accent transition-all disabled:opacity-50"
            >
              Join Room
            </SoundButton>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-center text-sm font-medium animate-pulse">
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {view === "waiting" && (
        <div className="flex flex-col gap-6 w-full text-center animate-in fade-in zoom-in duration-300">
          <div>
            <h3 className="text-pale-text/60 font-bold uppercase tracking-wider text-sm">
              Room Code
            </h3>
            <div
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                const icon = document.getElementById("copy-icon");
                const text = document.getElementById("copy-text");
                if (icon && text) {
                  // Simple icon swap logic or state could be better but this is quick and low-dep
                  // Let's use internal state for this component if possible?
                  // Actually, let's just use a class trigger or simple DOM manipulation for the icon path
                  // But since we are in React, local state is cleaner. I will use a local variable in the render scope? No, that won't trigger re-render.
                  // I'll stick to the previous simple DOM approach but for the SVG if I can, OR just create a small sub-component?
                  // Let's just use the 'Copied!' text feedback below it or change the icon color.
                }
              }}
              className="group relative flex items-center justify-center gap-3 text-4xl font-black text-pale-text tracking-widest mt-2 bg-white p-4 rounded-xl border-2 border-dashed border-pale-text/20 cursor-pointer hover:bg-pale-secondary/10 transition-all select-none active:scale-95"
            >
              {roomId}
              <CopyButton text={roomId} />
            </div>
            <p className="text-xs text-pale-text/40 mt-1">Click to copy</p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-pale-text/60 font-bold uppercase tracking-wider text-sm">
              Players
            </h3>
            <div className="flex justify-center gap-8">
              {/* Player 1 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-pale-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-md">
                  {players[0]?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="text-sm font-bold text-pale-text">
                  {players[0]?.name || "Waiting..."}
                </span>
                {players[0]?.id === socket.id && (
                  <span className="text-xs text-pale-text/50">(You)</span>
                )}
              </div>

              {/* Player 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2 shadow-md transition-all ${
                    players[1] ? "bg-pale-accent" : "bg-gray-200"
                  }`}
                >
                  {players[1]?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="text-sm font-bold text-pale-text">
                  {players[1]?.name || "Waiting..."}
                </span>
                {players[1]?.id === socket.id && (
                  <span className="text-xs text-pale-text/50">(You)</span>
                )}
              </div>
            </div>
          </div>

          {isHost ? (
            <SoundButton
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="w-full py-4 text-xl font-bold bg-pale-primary text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {players.length < 2 ? "Waiting for Player..." : "Start Game"}
            </SoundButton>
          ) : (
            <div className="p-4 bg-pale-secondary/30 rounded-xl text-pale-text font-bold animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
