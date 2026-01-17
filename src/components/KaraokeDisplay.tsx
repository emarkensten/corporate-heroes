"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface KaraokeDisplayProps {
  lyrics: string;
  isPlaying: boolean;
  buzzwords?: string[]; // Words submitted by audience to highlight
}

export function KaraokeDisplay({
  lyrics,
  isPlaying,
  buzzwords = [],
}: KaraokeDisplayProps) {
  // Create a Set for faster lookup (case-insensitive)
  const buzzwordSet = useMemo(() => {
    return new Set(buzzwords.map(w => w.toLowerCase()));
  }, [buzzwords]);

  // Check if a word matches any buzzword
  const isBuzzword = (word: string) => {
    // Remove punctuation and check
    const cleanWord = word.replace(/[^\w\säöåÄÖÅ]/gi, '').toLowerCase();
    return buzzwordSet.has(cleanWord);
  };

  // Parse lyrics into lines
  const lines = useMemo(() => {
    return lyrics.split("\n").map((line) => ({
      text: line,
      isTag: line.startsWith("[") && line.endsWith("]"),
      isEmpty: line.trim() === "",
    }));
  }, [lyrics]);

  // Render a line with buzzword highlighting
  const renderLineWithHighlights = (text: string) => {
    const words = text.split(/(\s+)/); // Split but keep whitespace

    return words.map((word, i) => {
      if (word.match(/^\s+$/)) {
        // Whitespace - render as is
        return <span key={i}>{word}</span>;
      }

      if (isBuzzword(word)) {
        // Buzzword - highlight it!
        return (
          <span
            key={i}
            className="text-[#FFD700] bg-[#FFD700]/10 px-1 rounded"
          >
            {word}
          </span>
        );
      }

      // Regular word
      return <span key={i}>{word}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isPlaying ? "bg-green-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider">
            {isPlaying ? "Playing" : "Ready"}
          </span>
        </div>
        {buzzwords.length > 0 && (
          <span className="text-xs font-mono text-[#FFD700]">
            {buzzwords.length} buzzwords
          </span>
        )}
      </div>

      {/* Lyrics container - manually scrollable */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3">
        {lines.map((line, lineIndex) => {
          // Tag lines (like [Verse 1], [Chorus])
          if (line.isTag) {
            return (
              <motion.div
                key={lineIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: lineIndex * 0.02 }}
                className="py-3 mt-4"
              >
                <span className="text-[#FF1F8E] font-mono text-lg md:text-xl uppercase tracking-widest">
                  {line.text}
                </span>
              </motion.div>
            );
          }

          // Empty lines
          if (line.isEmpty) {
            return <div key={lineIndex} className="h-6" />;
          }

          // Regular lyric lines - LARGE font for audience visibility
          return (
            <motion.div
              key={lineIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: lineIndex * 0.02 }}
              className="leading-relaxed"
            >
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                {renderLineWithHighlights(line.text)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
