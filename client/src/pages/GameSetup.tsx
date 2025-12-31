import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Board } from "../components/Board";
import { socket } from "../socket";
import { SoundButton } from "../components/SoundButton";

export function GameSetup() {
  const navigate = useNavigate();
  // @ts-ignore
  const {
    mode,
    roomId,
    playerName,
  }: { mode: "pve" | "pvp"; roomId?: string; playerName?: string } = useSearch({
    strict: false,
  });
  const [board, setBoard] = useState<number[]>(Array(25).fill(0));
  const [nextNumber, setNextNumber] = useState(1);
  const [isWaiting, setIsWaiting] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    () => {
      return (
        (localStorage.getItem("bingo_difficulty") as
          | "easy"
          | "medium"
          | "hard") || "easy"
      );
    }
  );

  useEffect(() => {
    if (mode === "pvp") {
      socket.connect(); // Ensure connected

      const onMatchStart = () => {
        navigate({
          to: "/play",
          search: {
            mode,
            board: board.join(","),
            roomId,
            playerName,
            difficulty: "easy",
          },
        });
      };

      socket.on("match_start", onMatchStart);

      return () => {
        socket.off("match_start", onMatchStart);
      };
    }
  }, [mode, roomId, board, navigate]);

  const randomizeBoard = () => {
    // Instant fill
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    setBoard(shuffled);
    setNextNumber(26); // Board full
  };

  const handleCellClick = (val: number, idx: number) => {
    if (val !== 0) return; // Already filled
    if (nextNumber > 25) return; // All 25 numbers placed

    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[idx] = nextNumber;
      return newBoard;
    });
    setNextNumber((prev) => prev + 1);
  };

  const clearBoard = () => {
    setBoard(Array(25).fill(0));
    setNextNumber(1);
  };

  const handleStart = () => {
    if (board.some((n) => n === 0)) {
      alert("Please fill the board completely!");
      return;
    }

    if (mode === "pvp") {
      setIsWaiting(true);
      socket.emit("player_ready", { roomId, board });
    } else {
      // PvE - Instant start
      navigate({
        to: "/play",
        search: {
          mode,
          board: board.join(","),
          roomId,
          playerName,
          difficulty,
        },
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full h-full min-h-screen relative">
      {isWaiting && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="text-3xl font-bold text-pale-primary animate-pulse">
            Waiting for Opponent...
          </div>
          <p className="text-pale-text/60 mt-2">
            The game will start when both players are ready.
          </p>
        </div>
      )}

      {/* Main wrapper, full width/height */}

      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-6 mx-auto">
        {/* Constrained layout container for everything */}

        <SoundButton
          onClick={() => navigate({ to: "/" })}
          className="self-start text-pale-text/60 hover:text-pale-primary font-bold transition-colors flex items-center gap-2"
        >
          ← Back
        </SoundButton>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-pale-text">Setup Board</h2>
          <p className="text-sm text-gray-500">
            {nextNumber <= 25 ? "Click cells to place numbers" : "Board Ready!"}
          </p>
        </div>

        {/* Board container - width controlled by parent */}
        <div className="w-full">
          <Board
            board={board}
            selectedNumbers={new Set()}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Buttons container - width controlled by parent */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex gap-3 w-full">
            <SoundButton
              onClick={randomizeBoard}
              className="flex-1 py-2 sm:py-3 px-4 text-sm sm:text-base bg-pale-secondary text-pale-text font-bold rounded-lg shadow-sm hover:bg-pale-accent transition-colors disabled:opacity-50"
            >
              Fill Random
            </SoundButton>
            <SoundButton
              onClick={clearBoard}
              className="flex-none w-24 py-2 sm:py-3 px-4 text-sm sm:text-base bg-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear
            </SoundButton>
          </div>

          {mode === "pve" && (
            <div className="w-full bg-pale-secondary/10 py-3 rounded-xl">
              <label className="block text-left text-pale-text/60 font-bold uppercase tracking-wider text-xs ml-1 mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <SoundButton
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      localStorage.setItem("bingo_difficulty", d);
                    }}
                    className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition-all border-2 ${
                      difficulty === d
                        ? "bg-pale-primary text-white border-pale-primary shadow-md"
                        : "bg-white text-pale-text border-transparent hover:bg-white/50"
                    }`}
                  >
                    {d}
                  </SoundButton>
                ))}
              </div>
            </div>
          )}

          <SoundButton
            onClick={handleStart}
            disabled={board.some((n) => n === 0)}
            className="w-full py-3 sm:py-4 text-lg sm:text-xl font-bold bg-pale-primary text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            Start Game
          </SoundButton>
        </div>
      </div>
    </div>
  );
}
