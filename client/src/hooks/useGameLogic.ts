import { useState, useCallback, useMemo } from "react";

export const WINNING_LINES = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Cols
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function useGameLogic(initialBoard: number[] = []) {
  const [board, setBoard] = useState<number[]>(initialBoard);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(
    new Set()
  );

  const checkWin = useCallback(
    (currentSelected: Set<number>) => {
      if (board.length === 0)
        return { lines: 0, winningLineIndices: [] as number[] };

      let linesCompleted = 0;
      const winningLineIndices: number[] = [];

      WINNING_LINES.forEach((line, index) => {
        const isLineComplete = line.every((boardIndex) =>
          currentSelected.has(board[boardIndex])
        );
        if (isLineComplete) {
          linesCompleted++;
          winningLineIndices.push(index);
        }
      });
      return { lines: linesCompleted, winningLineIndices };
    },
    [board]
  );

  const { bingoProgress, winningLines } = useMemo(() => {
    // Calculate BINGO letters earned
    const { lines, winningLineIndices } = checkWin(selectedNumbers);
    const word = "BINGO";
    return {
      bingoProgress: word.slice(0, Math.min(lines, 5)),
      winningLines: winningLineIndices,
    };
  }, [selectedNumbers, checkWin]);

  const isWinner = bingoProgress.length === 5;

  const markNumber = useCallback((number: number) => {
    setSelectedNumbers((prev) => {
      const newSet = new Set(prev);
      newSet.add(number);
      return newSet;
    });
  }, []);

  return {
    board,
    setBoard,
    selectedNumbers,
    setSelectedNumbers,
    markNumber,
    bingoProgress,
    winningLines,
    isWinner,
  };
}
