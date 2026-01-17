"use client";

import { motion } from "framer-motion";
import { Music, Loader2 } from "lucide-react";

interface ImageRevealProps {
  gtaImage: string;
  lyrics?: string;
}

export function ImageReveal({ gtaImage }: ImageRevealProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fullscreen Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${gtaImage})` }}
        />
        {/* Gradient overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </motion.div>

      {/* Music Loading Indicator - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute inset-0 flex flex-col items-center justify-end pb-32"
      >
        {/* Pulsing music icon container */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8 p-6 rounded-full bg-black/50 backdrop-blur-md border border-[#FF1F8E]/30 spotlight-overlay"
        >
          <Music className="w-12 h-12 text-[#FF1F8E]" />
        </motion.div>

        {/* Loading text */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-2xl md:text-3xl font-bold text-white mb-3"
          >
            The Corporate Heroes skapar din power ballad...
          </motion.h2>

          {/* Animated loading dots */}
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-mono">Skapar anthemisk låt</span>
          </div>
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          transition={{ delay: 1 }}
          className="mt-8 w-64"
        >
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#FF1F8E] to-transparent"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Subtle scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.3) 2px,
            rgba(0, 0, 0, 0.3) 4px
          )`,
        }}
      />
    </div>
  );
}
