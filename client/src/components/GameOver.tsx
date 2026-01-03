import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useEffect, useState } from "react";
// @ts-ignore
import useWindowSize from "react-use/lib/useWindowSize";
import { SoundButton } from "./SoundButton";

interface GameOverProps {
  result: "win" | "lose";
  onRestart: () => void;
  leaderboard?: { name: string; score: number }[];
  onViewBoard?: () => void;
  isViewingOpponent?: boolean;
  onExit?: () => void;
  isRoomClosed?: boolean;
  isOpponentLeft?: boolean;
}

export function GameOver({
  result,
  onRestart,
  leaderboard,
  onViewBoard,
  isViewingOpponent,
  onExit,
  isRoomClosed,
  isOpponentLeft,
}: GameOverProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (result === "lose" || isRoomClosed) {
      setShowConfetti(false);
    } else {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [result, isRoomClosed]);

  if (isViewingOpponent && onViewBoard) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={onViewBoard}
          className="bg-pale-primary text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap"
        >
          Show Results / Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {result === "win" && showConfetti && !isRoomClosed && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden relative"
      >
        <div
          className={`absolute top-0 left-0 w-full h-2 ${
            isRoomClosed
              ? "bg-gray-400"
              : result === "win"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        />

        <h2
          className={`text-4xl font-black mb-2 ${
            isRoomClosed
              ? "text-gray-700"
              : result === "win"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {isRoomClosed
            ? "ROOM CLOSED"
            : result === "win"
            ? "YOU WON!"
            : "GAME OVER"}
        </h2>

        <p className="text-gray-500 mb-8 text-lg font-medium">
          {isRoomClosed
            ? "The host has closed the room."
            : isOpponentLeft
            ? "Opponent has left the room."
            : result === "win"
            ? "BINGO! You crushed it! 🎉"
            : "Better luck next time! 😅"}
        </p>

        {leaderboard && leaderboard.length > 0 && !isRoomClosed && (
          <div className="mb-6 bg-gray-50 rounded-xl p-4 text-left">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
              Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm font-semibold text-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full text-xs text-gray-500">
                        {i + 1}
                      </span>
                      <span>{p.name || "Player"}</span>
                    </div>
                    <span className="text-pale-primary">{p.score} wins</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          {!isRoomClosed && !isOpponentLeft && (
            <SoundButton
              onClick={onRestart}
              className="flex-1 py-4 rounded-xl bg-pale-primary text-white font-bold text-lg shadow-lg shadow-pale-primary/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Play Again
            </SoundButton>
          )}

          {onExit && (
            <SoundButton
              onClick={onExit}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                isRoomClosed || isOpponentLeft
                  ? "bg-pale-primary text-white shadow-lg"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
            >
              {isRoomClosed
                ? "Back to Lobby"
                : isOpponentLeft
                ? "Exit to Lobby"
                : "Exit"}
            </SoundButton>
          )}
        </div>

        {onViewBoard && !isRoomClosed && (
          <button
            onClick={onViewBoard}
            className="w-full mt-3 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-all"
          >
            View Opponent Board
          </button>
        )}
      </motion.div>
    </div>
  );
}
