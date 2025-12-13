"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WordCloud } from "@/components/WordCloud";
import { QRDisplay } from "@/components/QRDisplay";
import { WebcamCapture } from "@/components/WebcamCapture";
import { HackerTerminal } from "@/components/HackerTerminal";
import { KaraokeDisplay } from "@/components/KaraokeDisplay";
import { StemPlayer } from "@/components/StemPlayer";
import { AppState, AudioResult, WordTimestamp, Stems } from "@/lib/types";
import { Lock, RotateCcw, Zap, Mic } from "lucide-react";

export default function MainStage() {
  // App state
  const [appState, setAppState] = useState<AppState>("LOBBY");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gtaImage, setGtaImage] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [stems, setStems] = useState<Stems | null>(null);
  const [timestamps, setTimestamps] = useState<WordTimestamp[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ step: "", progress: 0 });
  const [error, setError] = useState<string | null>(null);

  // Lock in words and move to capture
  const handleLockIn = useCallback(() => {
    setAppState("CAPTURE");
  }, []);

  // Capture image and start generation
  const handleCapture = useCallback(async (imageBase64: string) => {
    setCapturedImage(imageBase64);
    setAppState("LOADING");
    setError(null);

    try {
      // Step 1: Get words
      setProgress({ step: "Collecting buzzwords...", progress: 5 });
      const wordsResponse = await fetch("/api/words");
      const wordsData = await wordsResponse.json();
      const keywords = wordsData.words.map((w: { text: string }) => w.text);

      if (keywords.length === 0) {
        throw new Error("No buzzwords collected! Go back and add some.");
      }

      // Step 2: Generate lyrics
      setProgress({ step: "MC KPI writing bars...", progress: 15 });
      const lyricsResponse = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });

      if (!lyricsResponse.ok) {
        throw new Error("Failed to generate lyrics");
      }

      const lyricsData = await lyricsResponse.json();
      setLyrics(lyricsData.lyrics);
      setProgress({ step: "Lyrics generated!", progress: 30 });

      // Step 3: Generate GTA image (parallel with audio)
      setProgress({ step: "Transforming to GTA style...", progress: 35 });
      const imagePromise = fetch("/api/generate-visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });

      // Step 4: Generate audio
      setProgress({ step: "Cooking up the beat...", progress: 45 });
      const audioPromise = fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: lyricsData.lyrics, title: "Corporate Gangsta" }),
      });

      // Wait for both
      setProgress({ step: "Processing visual and audio...", progress: 60 });
      const [imageResponse, audioResponse] = await Promise.all([
        imagePromise,
        audioPromise,
      ]);

      // Process image
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setGtaImage(imageData.image);
        setProgress({ step: "GTA transformation complete!", progress: 80 });
      } else {
        // Use captured image as fallback
        console.warn("Image generation failed, using original");
        setGtaImage(imageBase64);
      }

      // Process audio
      if (!audioResponse.ok) {
        const errorData = await audioResponse.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const audioData: AudioResult = await audioResponse.json();
      setAudioUrl(audioData.audioUrl);
      if (audioData.stems) {
        setStems(audioData.stems);
      }
      setTimestamps(audioData.timestamps || []);

      setProgress({ step: "Ready to drop!", progress: 100 });

      // Short delay then show performance
      setTimeout(() => {
        setAppState("PERFORMANCE");
      }, 1000);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProgress({ step: "Error occurred", progress: 0 });
    }
  }, []);

  // Reset to lobby
  const handleReset = useCallback(async () => {
    // Clear words
    await fetch("/api/words", { method: "DELETE" });

    // Reset all state
    setCapturedImage(null);
    setGtaImage(null);
    setLyrics("");
    setAudioUrl("");
    setStems(null);
    setTimestamps([]);
    setCurrentTime(0);
    setIsPlaying(false);
    setProgress({ step: "", progress: 0 });
    setError(null);
    setAppState("LOBBY");
  }, []);

  // Suppress unused variable warning
  void capturedImage;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Global background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      <AnimatePresence mode="wait">
        {/* LOBBY STATE */}
        {appState === "LOBBY" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <Mic className="w-8 h-8 text-violet-400" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">MC KPI</h1>
                  <p className="text-xs text-zinc-500 font-mono">THE CORPORATE RAPPER</p>
                </div>
              </div>
              <Button
                onClick={handleLockIn}
                size="lg"
                className="h-12 px-8 text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-none border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                <Lock className="w-4 h-4 mr-2" />
                LOCK IN & SNAPSHOT
              </Button>
            </header>

            {/* Word Cloud - Full screen */}
            <div className="absolute inset-0 pt-24">
              <WordCloud refreshInterval={1000} />
            </div>

            {/* QR Code - Bottom right */}
            <div className="fixed bottom-8 right-8 z-40">
              <QRDisplay size={160} />
            </div>

            {/* Word count indicator */}
            <div className="fixed bottom-8 left-8 z-40">
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm">
                <Zap className="w-4 h-4 text-violet-400" />
                <span>Scan QR to add buzzwords</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CAPTURE STATE */}
        {appState === "CAPTURE" && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Capture the Crowd</h2>
              <p className="text-zinc-500">Strike a pose for the GTA transformation</p>
            </div>

            <WebcamCapture onCapture={handleCapture} />

            <Button
              onClick={() => setAppState("LOBBY")}
              variant="ghost"
              className="mt-8 text-zinc-500"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
          </motion.div>
        )}

        {/* LOADING STATE */}
        {appState === "LOADING" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex flex-col items-center justify-center p-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Generating Your Track</h2>
              <p className="text-zinc-500">MC KPI is cooking...</p>
            </div>

            <HackerTerminal progress={progress} />

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-4 bg-red-900/20 border border-red-800 text-red-400 max-w-md text-center"
              >
                <p className="font-mono text-sm">{error}</p>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="mt-4 border-red-800 text-red-400"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PERFORMANCE STATE */}
        {appState === "PERFORMANCE" && (
          <motion.div
            key="performance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            {/* GTA Background Image */}
            {gtaImage && (
              <div
                className="fixed inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${gtaImage})` }}
              >
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 min-h-screen flex">
              {/* Lyrics Panel - Right side */}
              <div className="ml-auto w-full max-w-xl h-screen bg-black/60 backdrop-blur-md border-l border-zinc-800/50">
                <KaraokeDisplay
                  lyrics={lyrics}
                  timestamps={timestamps}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
              </div>
            </div>

            {/* Player - Fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <StemPlayer
                audioUrl={audioUrl}
                stems={stems || undefined}
                onTimeUpdate={setCurrentTime}
                onPlayStateChange={setIsPlaying}
              />
            </div>

            {/* Reset button - Top left */}
            <div className="fixed top-6 left-6 z-50">
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-zinc-700 text-zinc-300 bg-black/50 backdrop-blur"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
