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
    // We want to pick a number that helps the computer complete lines.

    // Calculate "value" of each available number for the Computer
    const numberScores = availableNumbers.map((num) => {
      let score = 0;

      // Simulate selecting this number
      const hypotheticalSelected = new Set(selectedNumbers);
      hypotheticalSelected.add(num);

      // Check how many lines this number helps progress
      for (const line of WINNING_LINES) {
        // Get numbers in this line from computer board
        const lineNumbers = line.map((idx) => computerBoard[idx]);

        // Count how many are already selected
        const alreadySelectedCount = lineNumbers.filter((n) =>
          selectedNumbers.has(n)
        ).length;

        // Check if OUR number is in this line
        if (lineNumbers.includes(num)) {
          // If the line is now complete (4 previously + 1 now = 5), massive bonus
          if (alreadySelectedCount === 4) {
            score += 100;
          } else {
            // Otherwise, give points based on how close the line is to completion
            // The closer to completion, the more valuable handling it is
            score += (alreadySelectedCount + 1) * 2;
          }
        }
      }
      return { num, score };
    });

    // Sort by score descending
    numberScores.sort((a, b) => b.score - a.score);

    // MEDIUM: Mix of best moves and random to be imperfect
    if (difficulty === "medium") {
      // 60% chance to pick from top 3 best moves, 40% random
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

    // HARD: Always pick the best move, or top 2 if tied
    if (difficulty === "hard") {
      // 90% chance to play optimal, 10% random (human error simulation)
      if (Math.random() > 0.1) {
        return numberScores[0].num;
      } else {
        // Pick from top 5 to still be good but slightly less predictable?
        // Or just pure random for the "mistake"
        const mistakeCandidates = numberScores.slice(0, 5);
        return mistakeCandidates[
          Math.floor(Math.random() * mistakeCandidates.length)
        ].num;
      }
    }

    return availableNumbers[
      Math.floor(Math.random() * availableNumbers.length)
    ];
  }, [difficulty, computerBoard, selectedNumbers]);

  return { getNextMove };
}
