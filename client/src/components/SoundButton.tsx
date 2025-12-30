import { ButtonHTMLAttributes } from "react";
import { useSound } from "../context/SoundContext";

interface SoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function SoundButton({
  children,
  onClick,
  className = "",
  variant,
  ...props
}: SoundButtonProps) {
  const { playClick } = useSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  );
}
