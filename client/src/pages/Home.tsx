import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { socket } from "../socket";
import { useEffect } from "react";
import { useSound } from "../context/SoundContext";

export function Home() {
  const { playClick } = useSound();

  useEffect(() => {
    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-4">
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pale-primary to-pale-text drop-shadow-sm"
      >
        BINGO
      </motion.h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          to="/setup"
          search={{ mode: "pve" }}
          onClick={playClick}
          className="w-full text-center p-4 text-xl font-bold bg-white border-2 border-pale-primary text-pale-text rounded-xl shadow-md hover:bg-pale-primary hover:text-white transition-all duration-300"
        >
          Play vs Computer
        </Link>
        <Link
          to="/lobby"
          onClick={playClick}
          className="w-full text-center p-4 text-xl font-bold bg-white border-2 border-pale-accent text-pale-text rounded-xl shadow-md hover:bg-pale-accent hover:text-white transition-all duration-300"
        >
          Create / Join Room
        </Link>
      </div>
    </div>
  );
}
