import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

interface CellProps {
  value: number;
  isSelected?: boolean;
  isCrossed?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function Cell({
  value,
  isSelected,
  isCrossed,
  onClick,
  disabled,
}: CellProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={twMerge(
        "aspect-square flex items-center justify-center text-lg md:text-xl font-bold rounded-xl shadow-sm border-2 transition-colors duration-200",
        "bg-white border-pale-primary text-pale-text",
        isSelected && "bg-pale-primary text-white border-pale-primary",
        isCrossed &&
          "bg-pale-accent text-white border-pale-accent relative overflow-hidden",
        disabled && "cursor-not-allowed opacity-80",
        "hover:border-pale-accent focus:outline-none focus:ring-2 focus:ring-pale-accent focus:ring-opacity-50"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`z-10 ${value === 0 ? "opacity-0" : ""}`}>
        {value === 0 ? "0" : value}
      </span>
      {isCrossed && (
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {/* Simple cross line or X effect could go here, but background color change is often enough. 
                 Let's stick to background change for minimal premium look, maybe a subtle diagonal line?
             */}
        </motion.div>
      )}
    </motion.button>
  );
}
