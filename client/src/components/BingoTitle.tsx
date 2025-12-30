import React from "react";

interface BingoTitleProps {
  progress: string;
}

export const BingoTitle: React.FC<BingoTitleProps> = ({ progress }) => {
  return (
    <div className="flex gap-2 text-4xl font-black text-pale-text opacity-30">
      {["B", "I", "N", "G", "O"].map((char, i) => (
        <span
          key={i}
          className={`transition-all ${
            i < progress.length
              ? "text-green-700 opacity-100 line-through decoration-red-500 decoration-4"
              : ""
          }`}
        >
          {char}
        </span>
      ))}
    </div>
  );
};
