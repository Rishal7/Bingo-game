import { Cell } from "./Cell";

interface BoardProps {
  board: number[];
  selectedNumbers: Set<number>;
  onCellClick: (num: number, index: number) => void;
  disabled?: boolean;
  winningLines?: number[];
}

export function Board({
  board,
  selectedNumbers,
  onCellClick,
  disabled,
  winningLines = [],
}: BoardProps) {
  const getLineCoordinates = (index: number) => {
    // Indices 0-4: Rows
    if (index >= 0 && index <= 4) {
      const y = 10 + index * 20;
      return { x1: "2%", y1: `${y}%`, x2: "98%", y2: `${y}%` };
    }
    // Indices 5-9: Cols
    if (index >= 5 && index <= 9) {
      const colIndex = index - 5;
      const x = 10 + colIndex * 20;
      return { x1: `${x}%`, y1: "2%", x2: `${x}%`, y2: "98%" };
    }
    // Index 10: Diagonal (TL-BR)
    if (index === 10) {
      return { x1: "2%", y1: "2%", x2: "98%", y2: "98%" };
    }
    // Index 11: Diagonal (TR-BL)
    if (index === 11) {
      return { x1: "98%", y1: "2%", x2: "2%", y2: "98%" };
    }
    return null;
  };

  return (
    <div className="relative w-full aspect-square mx-auto">
      <div className="grid grid-cols-5 gap-2 md:gap-3 w-full h-full p-2 md:p-4 bg-white rounded-2xl md:rounded-3xl shadow-lg border border-pale-primary/20">
        {board.map((num, idx) => (
          <Cell
            key={`${idx}-${num}`}
            value={num}
            isSelected={selectedNumbers.has(num)}
            isCrossed={selectedNumbers.has(num)}
            onClick={() => onCellClick(num, idx)}
            disabled={disabled || selectedNumbers.has(num)}
          />
        ))}
      </div>

      {/* SVG Overlay for Winning Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl z-20 overflow-hidden">
        {winningLines.map((lineIndex) => {
          const coords = getLineCoordinates(lineIndex);
          if (!coords) return null;
          return (
            <line
              key={lineIndex}
              {...coords}
              stroke="#f87171"
              strokeWidth="6"
              strokeLinecap="round"
              className="opacity-60"
            />
          );
        })}
      </svg>
    </div>
  );
}
