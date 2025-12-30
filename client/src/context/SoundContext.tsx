import { createContext, useContext, ReactNode } from "react";
import { useGameSounds } from "../hooks/useSoundEffects";

type SoundContextType = ReturnType<typeof useGameSounds>;

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sound = useGameSounds();

  return (
    <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
