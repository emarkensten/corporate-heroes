"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

interface QRDisplayProps {
  size?: number;
}

export function QRDisplay({ size = 200 }: QRDisplayProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const joinUrl = `${baseUrl}/join`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-2 text-zinc-400">
        <Smartphone className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wider">
          Scan to join
        </span>
      </div>

      {/* QR Code with glow effect */}
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-lg" />

        {/* QR Container */}
        <div className="relative bg-white p-4 border-4 border-zinc-800">
          <QRCodeSVG
            value={joinUrl}
            size={size}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a0a0a"
          />
        </div>
      </div>

      {/* URL display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="font-mono text-xs text-zinc-500 mb-1">or visit</p>
        <p className="font-mono text-sm text-violet-400 tracking-wider">
          {joinUrl}
        </p>
      </motion.div>
    </motion.div>
  );
}
