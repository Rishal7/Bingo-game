import { useCallback, useState, useRef } from "react";

export function useGameSounds() {
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;
      isMutedRef.current = newState;
      return newState;
    });
  }, []);

  const playTone = useCallback(
    (
      frequency: number,
      type: OscillatorType,
      duration: number,
      startTime = 0,
      volume = 0.1
    ) => {
      if (isMutedRef.current) return;

      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + startTime + duration
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    },
    []
  );

  const playClick = useCallback(() => {
    playTone(600, "sine", 0.1, 0, 0.1);
  }, [playTone]);

  const playTurn = useCallback(() => {
    // Gentle chime
    playTone(800, "sine", 0.3, 0, 0.1);
    playTone(1200, "sine", 0.6, 0.1, 0.05);
  }, [playTone]);

  const playWin = useCallback(() => {
    // Major Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, i) => {
      playTone(freq, "triangle", 0.4, i * 0.1, 0.1);
    });
  }, [playTone]);

  const playLose = useCallback(() => {
    // Descending Tritone / Sadness
    playTone(400, "sawtooth", 0.5, 0, 0.1);
    playTone(280, "sawtooth", 0.8, 0.3, 0.1);
  }, [playTone]);

  const playLineComplete = useCallback(() => {
    // Quick rising flourish (C5 -> E5 -> G5)
    playTone(523.25, "sine", 0.15, 0, 0.1);
    playTone(659.25, "sine", 0.15, 0.1, 0.1);
    playTone(783.99, "sine", 0.3, 0.2, 0.1);
  }, [playTone]);

  return {
    playClick,
    playTurn,
    playLineComplete,
    playWin,
    playLose,
    isMuted,
    toggleMute,
  };
}
