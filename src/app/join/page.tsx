"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Check, Loader2, Mic } from "lucide-react";

export default function JoinPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [word, setWord] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || status === "sending") return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to send word");
      }

      setStatus("success");
      setWord("");

      // Reset after showing success and refocus input
      setTimeout(() => {
        setStatus("idle");
        inputRef.current?.focus();
      }, 1500);
    } catch {
      setStatus("error");
      setErrorMessage("Could not send. Try again.");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-violet-900/20 via-transparent to-transparent animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-cyan-900/20 via-transparent to-transparent animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mic className="w-6 h-6 text-violet-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              MC KPI
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">
            Drop your corporate buzzword
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="w-full space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="PROMPT, UX, PROTOTYP..."
              value={word}
              onChange={(e) => setWord(e.target.value.toUpperCase())}
              maxLength={50}
              disabled={status === "sending" || status === "success"}
              className="w-full h-14 px-4 text-lg font-mono bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20 rounded-none uppercase tracking-wider"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={!word.trim() || status === "sending" || status === "success"}
            className="w-full h-14 text-lg font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-none border-0 transition-all duration-200 disabled:opacity-50"
          >
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  SEND TO MC KPI
                </motion.span>
              )}
              {status === "sending" && (
                <motion.span
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SENDING...
                </motion.span>
              )}
              {status === "success" && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-green-400"
                >
                  <Check className="w-5 h-5" />
                  WORD DROPPED!
                </motion.span>
              )}
              {status === "error" && (
                <motion.span
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400"
                >
                  {errorMessage}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.form>

        {/* Success Animation */}
        <AnimatePresence>
          {status === "success" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-zinc-500 text-sm text-center"
            >
              Wait for the drop...
            </motion.p>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-600 text-xs text-center"
        >
          Your word will appear on the main stage
        </motion.p>
      </div>
    </main>
  );
}
