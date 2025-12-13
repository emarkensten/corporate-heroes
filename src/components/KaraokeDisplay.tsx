"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { WordTimestamp } from "@/lib/types";

interface KaraokeDisplayProps {
  lyrics: string;
  timestamps: WordTimestamp[];
  currentTime: number;
  isPlaying: boolean;
}

export function KaraokeDisplay({
  lyrics,
  timestamps,
  currentTime,
  isPlaying,
}: KaraokeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Parse lyrics into lines and words
  const lines = useMemo(() => {
    return lyrics.split("\n").map((line) => ({
      text: line,
      words: line.split(/\s+/).filter(Boolean),
      isTag: line.startsWith("[") && line.endsWith("]"),
    }));
  }, [lyrics]);

  // Find current word based on timestamp
  const activeWordIndex = useMemo(() => {
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (currentTime >= timestamps[i].start) {
        return i;
      }
    }
    return -1;
  }, [timestamps, currentTime]);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeWordIndex]);

  // Create a map of word positions to timestamps
  const wordTimestampMap = useMemo(() => {
    const map = new Map<string, { index: number; timestamp: WordTimestamp }>();
    let wordCount = 0;

    lines.forEach((line) => {
      if (!line.isTag) {
        line.words.forEach((word) => {
          if (wordCount < timestamps.length) {
            map.set(`${wordCount}`, {
              index: wordCount,
              timestamp: timestamps[wordCount],
            });
          }
          wordCount++;
        });
      }
    });

    return map;
  }, [lines, timestamps]);

  let globalWordIndex = 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPlaying ? "bg-green-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <span className="text-xs font-mono text-zinc-500 uppercase">
            {isPlaying ? "Live" : "Ready"}
          </span>
        </div>
      </div>

      {/* Lyrics container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700"
      >
        {lines.map((line, lineIndex) => {
          // Tag lines (like [Verse 1], [Chorus])
          if (line.isTag) {
            return (
              <motion.div
                key={lineIndex}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="py-2"
              >
                <span className="text-violet-500 font-mono text-sm uppercase tracking-wider">
                  {line.text}
                </span>
              </motion.div>
            );
          }

          // Empty lines
          if (line.words.length === 0) {
            return <div key={lineIndex} className="h-4" />;
          }

          // Regular lyric lines
          return (
            <div key={lineIndex} className="leading-relaxed">
              {line.words.map((word, wordIndex) => {
                const currentWordIndex = globalWordIndex++;
                const wordData = wordTimestampMap.get(`${currentWordIndex}`);
                const isActive = wordData && currentWordIndex === activeWordIndex;
                const isPast = wordData && currentWordIndex < activeWordIndex;
                const isFuture = wordData && currentWordIndex > activeWordIndex;

                return (
                  <span
                    key={wordIndex}
                    ref={isActive ? activeWordRef : null}
                    className={`inline-block mr-2 transition-all duration-150 font-mono text-lg md:text-xl ${
                      isActive
                        ? "text-violet-400 scale-110 font-bold drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                        : isPast
                        ? "text-zinc-500"
                        : isFuture
                        ? "text-white"
                        : "text-zinc-400"
                    }`}
                  >
                    {word}
                    {/* Ad-lib detection */}
                    {word.includes("(") && (
                      <span className="text-cyan-400 text-sm ml-1">
                        {word.match(/\(.*?\)/)?.[0]}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
