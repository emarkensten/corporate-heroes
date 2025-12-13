"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Word } from "@/lib/types";

interface WordCloudProps {
  refreshInterval?: number;
}

// Color palette for words
const COLORS = [
  "text-violet-400",
  "text-cyan-400",
  "text-fuchsia-400",
  "text-emerald-400",
  "text-amber-400",
  "text-rose-400",
];

// Generate random position ensuring some spread
function randomPosition() {
  return {
    x: Math.random() * 60 + 20, // 20-80% of container
    y: Math.random() * 60 + 20, // 20-80% of container
  };
}

interface WordWithPosition extends Word {
  position: { x: number; y: number };
  color: string;
  rotation: number;
  scale: number;
}

export function WordCloud({ refreshInterval = 1000 }: WordCloudProps) {
  const [words, setWords] = useState<WordWithPosition[]>([]);

  const fetchWords = useCallback(async () => {
    try {
      const response = await fetch("/api/words");
      const data = await response.json();

      // Add position/style to new words, preserve existing ones
      setWords((prevWords) => {
        const prevMap = new Map(prevWords.map((w) => [w.id, w]));

        return data.words.map((word: Word) => {
          // Keep existing word with its position
          if (prevMap.has(word.id)) {
            return prevMap.get(word.id)!;
          }

          // New word - assign random position and style
          return {
            ...word,
            position: randomPosition(),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 20 - 10, // -10 to 10 degrees
            scale: 0.8 + Math.random() * 0.6, // 0.8 to 1.4 scale
          };
        });
      });
    } catch (error) {
      console.error("Failed to fetch words:", error);
    }
  }, []);

  useEffect(() => {
    fetchWords();
    const interval = setInterval(fetchWords, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchWords, refreshInterval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-violet-900/10 via-transparent to-transparent" />

      <AnimatePresence>
        {words.map((word) => (
          <motion.div
            key={word.id}
            initial={{
              opacity: 0,
              scale: 0,
              left: "50%",
              top: "50%",
            }}
            animate={{
              opacity: 1,
              scale: word.scale,
              left: `${word.position.x}%`,
              top: `${word.position.y}%`,
              rotate: word.rotation,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.8,
            }}
            className="absolute"
            style={{
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Floating animation */}
            <motion.span
              animate={{
                y: [0, -12, 0, 12, 0],
                x: [0, 8, 0, -8, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`block font-mono font-bold text-xl md:text-3xl ${word.color} drop-shadow-[0_0_15px_currentColor] whitespace-nowrap select-none`}
            >
              {word.text}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {words.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-zinc-600 font-mono text-sm animate-pulse">
            Waiting for buzzwords...
          </p>
        </div>
      )}
    </div>
  );
}
