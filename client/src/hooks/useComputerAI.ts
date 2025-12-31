import { useCallback } from "react";
import { WINNING_LINES } from "./useGameLogic";

export type Difficulty = "easy" | "medium" | "hard";

export function useComputerAI(
  difficulty: Difficulty,
  computerBoard: number[],
  selectedNumbers: Set<number>,
  playerBoard: number[] = []
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

      // 2. How much does this help the Player? (Defense)
      let playerScore = 0;
      if (difficulty === "hard" && playerBoard.length > 0) {
        playerScore = calculateScore(playerBoard, num, selectedNumbers);
      }

      // 3. Net Score
      // In Medium, we mostly ignore player score (or simplistic).
      // In Hard, we heavily penalize helping the player.

      let netScore = aiScore;
      if (difficulty === "hard") {
        // If this move gives player a line, MASSIVE penalty, unless it also gives AI a line
        // If aiScore >= 1000 (AI wins/lines), we don't care about player score as much (race condition)
        // But if we are just building, avoided giving player lines.

        if (playerScore >= 1000 && aiScore < 1000) {
          // Player wins/gets line, but we don't -> AVOID AT ALL COSTS
          netScore -= 5000;
        } else {
          // General penalty for helping player
          netScore -= playerScore * 1.5;
        }
      }

      return { num, score: netScore, aiScore };
    });

    // Sort by score descending
    numberScores.sort((a, b) => b.score - a.score);

    // MEDIUM: Mix of best moves and random to be imperfect
    if (difficulty === "medium") {
      // 60% chance to pick from top 3 best moves (based on AI score primarily), 40% random
      // Note: We used netScore above which is same as aiScore for medium.
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

    // HARD: Ruthless
    if (difficulty === "hard") {
      // Always pick the absolute best Net Score.
      // If there's a tie, random between them.
      const bestScore = numberScores[0].score;
      const bestMoves = numberScores.filter((n) => n.score === bestScore);

      return bestMoves[Math.floor(Math.random() * bestMoves.length)].num;
    }

    return availableNumbers[
      Math.floor(Math.random() * availableNumbers.length)
    ];
  }, [difficulty, computerBoard, selectedNumbers, playerBoard]);

  return { getNextMove };
}
