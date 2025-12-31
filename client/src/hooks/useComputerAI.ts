import { useCallback } from "react";
import { WINNING_LINES } from "./useGameLogic";

export type Difficulty = "easy" | "medium" | "hard";

export function useComputerAI(
  difficulty: Difficulty,
  computerBoard: number[],
  selectedNumbers: Set<number>
) {
  const getNextMove = useCallback(() => {
    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const availableNumbers = allNumbers.filter((n) => !selectedNumbers.has(n));

    if (availableNumbers.length === 0) return null;

    // EASY: Random move
    if (difficulty === "easy") {
      return availableNumbers[
        Math.floor(Math.random() * availableNumbers.length)
      ];
    }

    // Heuristics for Medium/Hard
    const calculateScore = (
      board: number[],
      num: number,
      selected: Set<number>
    ) => {
      let score = 0;
      // Simulate selecting this number
      const hypotheticalSelected = new Set(selected);
      hypotheticalSelected.add(num);

      // Check how many lines this number helps progress
      for (const line of WINNING_LINES) {
        // Get numbers in this line from board
        const lineNumbers = line.map((idx) => board[idx]);

        // Count how many are already selected
        const alreadySelectedCount = lineNumbers.filter((n) =>
          selected.has(n)
        ).length;

        // Check if THE number is in this line
        if (lineNumbers.includes(num)) {
          // If the line is now complete (4 previously + 1 now = 5), massive bonus
          if (alreadySelectedCount === 4) {
            score += 1000; // Big bonus for completing a line
          } else {
            // Points for progressing lines
            score += (alreadySelectedCount + 1) * 10;
          }
        }
      }
      return score;
    };

    // Calculate "Net Value" of each available number
    const numberScores = availableNumbers.map((num) => {
      // 1. How much does this help the Computer?
      const aiScore = calculateScore(computerBoard, num, selectedNumbers);

      // FAIR PLAY: We no longer look at the player's board.
      // The AI is purely offensive/optimizing its own win.

      return { num, score: aiScore, aiScore };
    });

    // Sort by score descending
    numberScores.sort((a, b) => b.score - a.score);

    // MEDIUM: Mix of best moves and random to be imperfect
    if (difficulty === "medium") {
      // 60% chance to pick from top 3 best moves (based on AI score primarily), 40% random
      if (Math.random() > 0.4) {
        const candidates = numberScores.slice(0, 3);
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return pick.num;
      } else {
        return availableNumbers[
          Math.floor(Math.random() * availableNumbers.length)
        ];
      }
    }

    // HARD: Strong but human (Blind to player)
    if (difficulty === "hard") {
      // 85% chance to play optimal
      if (Math.random() > 0.15) {
        const bestScore = numberScores[0].score;
        const bestMoves = numberScores.filter((n) => n.score === bestScore);
        return bestMoves[Math.floor(Math.random() * bestMoves.length)].num;
      } else {
        // 15% chance to slip up slightly (pick from top 3)
        const candidates = numberScores.slice(0, 3);
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        return pick.num;
      }
    }

    return availableNumbers[
      Math.floor(Math.random() * availableNumbers.length)
    ];
  }, [difficulty, computerBoard, selectedNumbers]);

  return { getNextMove };
}
