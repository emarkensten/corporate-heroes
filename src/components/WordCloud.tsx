"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Word } from "@/lib/types";

interface WordCloudProps {
  refreshInterval?: number;
}

// Color palette for words - 80s Power Ballad theme
const COLORS = [
  "text-[#FF6BB5]",      // Hot Pink
  "text-[#00D4FF]",      // Electric Blue
  "text-[#FFD700]",      // Neon Gold
  "text-[#FF1F8E]",      // Electric Magenta
  "text-[#FF6B35]",      // Sunset Orange
  "text-[#C20A6F]",      // Deep Magenta
];

// Generate random position avoiding QR code area (bottom-right)
function randomPosition() {
  let x, y;

  // Keep trying until we get a position outside the QR zone
  do {
    x = Math.random() * 70 + 10; // 10-80% of container
    y = Math.random() * 70 + 10; // 10-80% of container
  } while (x > 65 && y > 65); // Avoid bottom-right corner (QR area)

  return { x, y };
}

interface WordWithPosition extends Word {
  position: { x: number; y: number };
  color: string;
  rotation: number;
  scale: number;
}

export function WordCloud({ refreshInterval = 3000 }: WordCloudProps) {
  const [words, setWords] = useState<WordWithPosition[]>([]);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWords = useCallback(async () => {
    // Skip if already loading (use ref for synchronous check)
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/words", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const serverWords: Word[] = data.words || [];

      // Add position/style to new words, preserve existing ones
      setWords((prevWords) => {
        const prevMap = new Map(prevWords.map((w) => [w.id, w]));
        const serverWordIds = new Set(serverWords.map(w => w.id));

        // Start with existing words that are still on server
        const result: WordWithPosition[] = [];

        // Keep all existing words that still exist on server
        for (const prev of prevWords) {
          if (serverWordIds.has(prev.id)) {
            result.push(prev);
          }
        }

        // Add new words from server
        for (const word of serverWords) {
          if (!prevMap.has(word.id)) {
            result.push({
              ...word,
              position: randomPosition(),
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              rotation: Math.random() * 20 - 10,
              scale: 0.8 + Math.random() * 0.6,
            });
          }
        }

        return result;
      });
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Failed to fetch words:", error);
    } finally {
      // Only clear loading if this is still the current controller
      if (abortControllerRef.current === controller) {
        isLoadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchWords();

    // Set up polling interval (default 3 seconds)
    const interval = setInterval(fetchWords, refreshInterval);

    // Cleanup
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWords, refreshInterval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-[#FF1F8E]/10 via-transparent to-transparent" />

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
