import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { Board } from "../components/Board";
import { useGameLogic, WINNING_LINES } from "../hooks/useGameLogic";
import { socket } from "../socket";
import { GameOver } from "../components/GameOver";
import { useGameSounds } from "../hooks/useSoundEffects";
import { BingoTitle } from "../components/BingoTitle";
import { useComputerAI } from "../hooks/useComputerAI";

export function GameRoom() {
  const navigate = useNavigate();
  const {
    mode,
    board: boardStr,
    roomId: initialRoomId,
    playerName,
    difficulty,
  } = useSearch({ from: "/play" });
  const initialBoard = boardStr ? boardStr.split(",").map(Number) : [];

  const {
    board,
    selectedNumbers,
    markNumber,
    bingoProgress,
    winningLines,
    isWinner,
    checkWin,
  } = useGameLogic(initialBoard);

  const [gameState, setGameState] = useState<"waiting" | "playing" | "ended">(
    "waiting"
  );
  const [roomId, setRoomId] = useState(initialRoomId || "");
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Turn logic: In PVE, always me. In PvP, managed by effect.
  const [isMyTurn, setIsMyTurn] = useState(mode === "pve");
  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number; board?: number[] }[]
  >([]);
  const [opponentBoard, setOpponentBoard] = useState<number[]>([]);
  const [viewingOpponent, setViewingOpponent] = useState(false);

  // Calculate winning lines for opponent board since useGameLogic is bound to my board
  const opponentWinningLines = useMemo(() => {
    if (!viewingOpponent || opponentBoard.length === 0) return [];
    const lines: number[] = [];
    WINNING_LINES.forEach((line, index) => {
      const isLineComplete = line.every((idx) =>
        selectedNumbers.has(opponentBoard[idx])
      );
      if (isLineComplete) lines.push(index);
    });
    return lines;
  }, [viewingOpponent, opponentBoard, selectedNumbers]);

  const { playClick, playTurn, playLineComplete, playWin, playLose } =
    useGameSounds();
  const prevProgressLen = useRef(0);
  const isProcessingMove = useRef(false);

  // Reset processing flag when turn changes
  useEffect(() => {
    isProcessingMove.current = false;
  }, [isMyTurn]);

  // Computer Board State (stable for session)
  const computerBoard = useMemo(() => {
    if (mode === "pve") {
      // Seed randomness or just standard random.
      // For simplicity, random board is fine as long as invalidation doesn't happen unexpectedly.
      return Array.from({ length: 25 }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5
      );
    }
    return [];
    // Use empty dependency array to create ONCE on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getNextMove } = useComputerAI(
    // @ts-ignore - router ensures valid difficulty string or we default
    difficulty || "easy",
    computerBoard,
    selectedNumbers
  );

  // Play turn sound when it becomes my turn
  useEffect(() => {
    if (isMyTurn && gameState === "playing") {
      playTurn();
    }
  }, [isMyTurn, gameState, playTurn]);

  // Play sound on line completion
  useEffect(() => {
    if (bingoProgress.length > prevProgressLen.current) {
      if (gameState === "playing" && !isWinner) {
        playLineComplete();
      }
      prevProgressLen.current = bingoProgress.length;
    }
  }, [bingoProgress.length, gameState, isWinner, playLineComplete]);

  // Play win/lose sounds
  useEffect(() => {
    if (gameState === "ended" && gameResult) {
      if (gameResult === "win") playWin();
      else playLose();
    }
  }, [gameState, gameResult, playWin, playLose]);

  // Player Names State
  const [opponentName, setOpponentName] = useState("Opponent");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const myName = (playerName as string) || "You";

  // PvP Setup
  useEffect(() => {
    if (mode === "pvp") {
      socket.connect();

      if (!roomId) {
        setStatusMsg("Creating room...");
        socket.emit("create_room", { playerName: myName, board });
      } else {
        setStatusMsg(`Joining room ${roomId}...`);
        socket.emit("join_room", { roomId, playerName: myName, board });
      }

      socket.on("room_created", (id: string) => {
        setRoomId(id);
        setStatusMsg(`Room Created: ${id}. Waiting for opponent...`);
      });

      // Update names
      socket.on(
        "player_update",
        (updatedPlayers: { id: string; name: string }[]) => {
          setPlayers(updatedPlayers);
          const opponent = updatedPlayers.find((p) => p.id !== socket.id);
          if (opponent) {
            setOpponentName(opponent.name);
          }

          // Auto-start if 2 players
          if (updatedPlayers.length === 2) {
            setGameState("playing");
          }
        }
      );

      socket.on("player_joined", () => {
        // Received when we successfully join (or opponent joins)
        setGameState("playing");
      });

      socket.on("game_state_change", () => {
        setGameState("playing");
      });

      socket.on(
        "number_selected",
        ({ number, playerId }: { number: number; playerId: string }) => {
          if (playerId !== socket.id) {
            markNumber(number);
            setIsMyTurn(true);
          }
        }
      );

      socket.on(
        "game_over",
        ({
          winner,
          leaderboard,
        }: {
          winner: string;
          leaderboard?: {
            id?: string;
            name: string;
            score: number;
            board?: number[];
          }[];
        }) => {
          setGameState("ended");
          setGameResult(winner === socket.id ? "win" : "lose");
          setStatusMsg(winner === socket.id ? "You Won!" : "Opponent Won!");
          if (leaderboard) {
            setLeaderboard(leaderboard);
            const opponent = leaderboard.find((p) => p.id !== socket.id); // Assuming ID is passed now
            // Fallback for PvE or if ID not present (should be added in server)
            if (opponent && opponent.board) {
              setOpponentBoard(opponent.board);
            }
          }
        }
      );

      socket.on("error", (err: string) => {
        setStatusMsg(`Error: ${err}`);
      });

      return () => {
        socket.off("room_created");
        socket.off("player_update");
        socket.off("player_joined");
        socket.off("number_selected");
        socket.off("game_over");
      };
    } else {
      // PvE
      setGameState("playing");
      setStatusMsg("Your Turn");
    }
  }, [mode, roomId, markNumber, myName]);

  // Logic to determine initial turn
  useEffect(() => {
    if (mode === "pvp" && players.length > 0 && gameState === "playing") {
      if (players.length >= 1) {
        const isHost = players[0].id === socket.id;
        if (selectedNumbers.size === 0) {
          setIsMyTurn(isHost);
        }
      }
    }
  }, [players, mode, socket.id, selectedNumbers.size, gameState]);

  // Win Check logic
  useEffect(() => {
    if (isWinner && gameState !== "ended") {
      setGameState("ended");
      setGameResult("win");
      setStatusMsg("BINGO! You Won!");
      if (mode === "pvp") {
        socket.emit("bingo_win", { roomId });
      } else {
        // PvE Win
        setOpponentBoard(computerBoard); // Force set opponent board so we can view it
      }
    }
  }, [isWinner, gameState, mode, roomId, computerBoard]);

  const makeComputerMove = useCallback(() => {
    const pick = getNextMove();
    if (pick) {
      markNumber(pick);
      setIsMyTurn(true);
      setStatusMsg("Your Turn");
    }
  }, [getNextMove, markNumber]);

  // Trigger Computer Move when it's not my turn
  useEffect(() => {
    if (mode === "pve" && gameState === "playing" && !isMyTurn && !isWinner) {
      setStatusMsg("Computer thinking...");
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, gameState, isMyTurn, isWinner, makeComputerMove]);

  const handleCellClick = (num: number) => {
    if (gameState !== "playing") return;
    if (selectedNumbers.has(num)) return;
    if (!isMyTurn) return;
    if (isProcessingMove.current) return;

    isProcessingMove.current = true; // Block immediate subsequent clicks

    playClick();
    markNumber(num);

    if (mode === "pvp") {
      setIsMyTurn(false);

      const nextSelected = new Set(selectedNumbers);
      nextSelected.add(num);
      const { lines } = checkWin(nextSelected); // Assuming checkWin is returned from useGameLogic
      const win = lines >= 5;

      if (win) {
        setGameState("ended");
        setGameResult("win");
        setStatusMsg("BINGO! You Won!");
      }

      socket.emit("make_move", { roomId, number: num, win });
    } else {
      // PvE Logic
      setIsMyTurn(false);
      // Computer move is now triggered by useEffect listening to !isMyTurn
    }
  };

  const checkComputerWin = () => {
    if (mode !== "pve" || gameState === "ended") return;

    // WINNING_LINES imported from useGameLogic

    let lines = 0;
    for (const line of WINNING_LINES) {
      if (line.every((idx) => selectedNumbers.has(computerBoard[idx]))) lines++;
    }

    if (lines >= 5) {
      setGameState("ended");
      setGameResult("lose");
      setStatusMsg("Computer Won!");
      setOpponentBoard(computerBoard); // Set for viewing
    }
  };

  // Run Check after every move
  useEffect(() => {
    if (mode === "pve" && gameState === "playing") {
      checkComputerWin();
    }
  }, [selectedNumbers, mode, gameState]);

  const handleRestart = () => {
    navigate({
      to: "/setup",
      // @ts-expect-error
      search: { mode, roomId, playerName: myName },
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-lg mx-auto relative min-h-[80vh]">
      <div className="flex justify-between w-full items-center">
        {gameState === "playing" ? (
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-full font-bold shadow-sm transition-all ${
              isMyTurn
                ? "bg-pale-primary text-white scale-105 shadow-md"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            <span className="text-sm sm:text-base">
              {isMyTurn ? "Your Turn" : `${opponentName}'s Turn`}
            </span>
            {isMyTurn && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </div>
        ) : (
          <div className="text-xl font-bold text-pale-primary">
            {viewingOpponent ? `${opponentName}'s Board` : statusMsg}
          </div>
        )}

        {mode === "pvp" && roomId && (
          <div className="flex flex-col items-end">
            <div className="bg-gray-100 px-3 py-1 rounded text-xs select-all mb-1">
              Room: {roomId}
            </div>
            <div className="text-xs text-pale-text/60 font-medium">
              {myName} vs {opponentName}
            </div>
          </div>
        )}
      </div>

      <BingoTitle
        progress={
          viewingOpponent
            ? "BINGO".slice(0, Math.min(opponentWinningLines.length, 5))
            : bingoProgress
        }
      />

      <Board
        board={viewingOpponent ? opponentBoard : board}
        selectedNumbers={selectedNumbers}
        onCellClick={handleCellClick}
        disabled={gameState !== "playing" || (!isMyTurn && !viewingOpponent)} // Disable if viewing opponent
        winningLines={viewingOpponent ? opponentWinningLines : winningLines}
      />

      {gameState === "ended" && gameResult && (
        <GameOver
          result={gameResult}
          onRestart={handleRestart}
          leaderboard={mode === "pvp" ? leaderboard : undefined}
          onViewBoard={() => setViewingOpponent(!viewingOpponent)}
          isViewingOpponent={viewingOpponent}
        />
      )}
    </div>
  );
}
