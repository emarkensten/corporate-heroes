"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

interface LogEntry {
  text: string;
  type: "info" | "success" | "processing" | "warning";
}

interface HackerTerminalProps {
  progress: {
    step: string;
    progress: number;
  };
}

const FAKE_LOGS: LogEntry[] = [
  { text: "Initializing MC KPI protocol...", type: "info" },
  { text: "Parsing corporate boredom...", type: "processing" },
  { text: "Analyzing buzzword density...", type: "processing" },
  { text: "Injecting gangster flow...", type: "processing" },
  { text: "Calibrating swag coefficients...", type: "processing" },
  { text: "Loading street credentials...", type: "info" },
  { text: "Compiling rhyme patterns...", type: "processing" },
  { text: "Rendering visual style...", type: "processing" },
  { text: "Synthesizing west coast beats...", type: "processing" },
  { text: "Optimizing flow dynamics...", type: "processing" },
];

export function HackerTerminal({ progress }: HackerTerminalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentFakeLog, setCurrentFakeLog] = useState(0);

  // Add fake logs progressively
  useEffect(() => {
    if (currentFakeLog >= FAKE_LOGS.length) return;

    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, FAKE_LOGS[currentFakeLog]]);
      setCurrentFakeLog((prev) => prev + 1);
    }, 500 + Math.random() * 800);

    return () => clearTimeout(timer);
  }, [currentFakeLog]);

  // Add real progress updates
  useEffect(() => {
    if (progress.step) {
      setLogs((prev) => [
        ...prev,
        { text: `[REAL] ${progress.step}`, type: "success" },
      ]);
    }
  }, [progress.step]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Terminal window */}
      <div className="bg-zinc-950 border-2 border-zinc-800 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono">
            <Terminal className="w-4 h-4" />
            <span>mc-kpi-generator v6.9.420</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="p-4 h-80 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-1"
            >
              <span className="text-zinc-600 mr-2">$</span>
              <span
                className={
                  log.type === "success"
                    ? "text-green-400"
                    : log.type === "warning"
                    ? "text-yellow-400"
                    : log.type === "processing"
                    ? "text-cyan-400"
                    : "text-zinc-400"
                }
              >
                {log.text}
              </span>
            </motion.div>
          ))}

          {/* Blinking cursor */}
          <div className="flex items-center">
            <span className="text-zinc-600 mr-2">$</span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-4 bg-violet-400"
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 font-mono uppercase">
              Generation Progress
            </span>
            <span className="text-xs text-violet-400 font-mono">
              {Math.round(progress.progress)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
