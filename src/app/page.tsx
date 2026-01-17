"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WordCloud } from "@/components/WordCloud";
import { QRDisplay } from "@/components/QRDisplay";
import { WebcamCapture } from "@/components/WebcamCapture";
import { HackerTerminal } from "@/components/HackerTerminal";
import { KaraokeDisplay } from "@/components/KaraokeDisplay";
import { StemPlayer } from "@/components/StemPlayer";
import { ImageReveal } from "@/components/ImageReveal";
import { AppState } from "@/lib/types";
import { Lock, RotateCcw, Zap, Mic, Image as ImageIcon, Music } from "lucide-react";
import { downloadBase64, downloadUrl } from "@/lib/download";

export default function MainStage() {
  // App state
  const [appState, setAppState] = useState<AppState>("LOBBY");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gtaImage, setGtaImage] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [buzzwords, setBuzzwords] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ step: "", progress: 0 });
  const [error, setError] = useState<string | null>(null);
  const [musicTaskId, setMusicTaskId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const pollStartTime = useRef<number>(0);
  const pollFailures = useRef<number>(0);
  const MAX_POLL_TIME = 180000; // 3 minutes max

  // Lock in words and move to capture
  const handleLockIn = useCallback(() => {
    setAppState("CAPTURE");
  }, []);

  // Capture image and start generation
  const handleCapture = useCallback(async (imageBase64: string) => {
    // Prevent double-click
    if (isCapturing) return;
    setIsCapturing(true);

    setCapturedImage(imageBase64);
    setAppState("LOADING");
    setError(null);
    setMusicTaskId(null);

    try {
      // Step 1: Get words
      setProgress({ step: "Collecting buzzwords...", progress: 5 });
      const wordsResponse = await fetch("/api/words");
      if (!wordsResponse.ok) {
        throw new Error("Failed to fetch buzzwords from server");
      }
      const wordsData = await wordsResponse.json();
      const keywords = wordsData.words.map((w: { text: string }) => w.text);
      setBuzzwords(keywords); // Store for highlighting in lyrics

      if (keywords.length === 0) {
        throw new Error("No buzzwords collected! Go back and add some.");
      }

      // Step 2: Generate lyrics (with crowd analysis)
      setProgress({ step: "Analyzing crowd & writing bars...", progress: 15 });
      const lyricsResponse = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, image: imageBase64 }),
      });

      if (!lyricsResponse.ok) {
        throw new Error("Failed to generate lyrics");
      }

      const lyricsData = await lyricsResponse.json();
      setLyrics(lyricsData.lyrics);
      // Update buzzwords with cleaned/preprocessed keywords for accurate count
      if (lyricsData.cleanedKeywords) {
        setBuzzwords(lyricsData.cleanedKeywords);
      }
      setProgress({ step: "Lyrics generated!", progress: 30 });

      // Step 3: Start music generation (don't wait for completion!)
      setProgress({ step: "Starting music generation...", progress: 35 });
      const musicResponse = await fetch("/api/start-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: lyricsData.lyrics, title: "Arena Anthem" }),
      });

      if (!musicResponse.ok) {
        const errorData = await musicResponse.json();
        throw new Error(errorData.error || "Failed to start music generation");
      }

      const musicData = await musicResponse.json();
      setMusicTaskId(musicData.taskId);
      console.log("Music task started:", musicData.taskId);

      // Step 4: Generate stylized image (wait for this, but don't crash on failure)
      setProgress({ step: "Transforming photo...", progress: 50 });
      try {
        const imageResponse = await fetch("/api/generate-visuals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageBase64 }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setGtaImage(imageData.image);
          setProgress({ step: "Transformation complete!", progress: 80 });
        } else {
          const errorData = await imageResponse.json().catch(() => ({}));
          console.warn("Image generation failed:", errorData.error || imageResponse.status);
          setGtaImage(imageBase64);
        }
      } catch (imgErr) {
        // Network error or other failure - use original image
        console.warn("Image generation error, using original:", imgErr);
        setGtaImage(imageBase64);
      }

      // Step 5: Show image reveal while music generates
      setProgress({ step: "Image ready! Generating music...", progress: 100 });
      setAppState("IMAGE_REVEAL");

    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProgress({ step: "Error occurred", progress: 0 });
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // Poll for music completion in IMAGE_REVEAL state
  useEffect(() => {
    if (appState !== "IMAGE_REVEAL" || !musicTaskId) return;

    console.log("Starting music polling for task:", musicTaskId);
    pollStartTime.current = Date.now();
    pollFailures.current = 0;
    setIsCapturing(false); // Reset capture guard

    const pollInterval = setInterval(async () => {
      // Check for timeout
      if (Date.now() - pollStartTime.current > MAX_POLL_TIME) {
        clearInterval(pollInterval);
        setError("Music generation timed out (3 min). Please try again.");
        return;
      }

      try {
        // Don't use ?process=true - skip stems/timestamps for faster playback
        const response = await fetch(`/api/music-status/${musicTaskId}`);
        const data = await response.json();

        console.log("Music status:", data.status);
        pollFailures.current = 0; // Reset on success

        if (data.status === "completed") {
          clearInterval(pollInterval);
          setAudioUrl(data.audioUrl);
          // Skip stems and timestamps - just play the music
          setAppState("PERFORMANCE");
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error || "Music generation failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
        pollFailures.current += 1;

        // Warn after 3 consecutive failures
        if (pollFailures.current >= 3) {
          setError("Network issues - check your connection. Still trying...");
        }
      }
    }, 5000); // Increased to 5s for stability

    return () => clearInterval(pollInterval);
  }, [appState, musicTaskId]);

  // Reset to lobby
  const handleReset = useCallback(async () => {
    // Clear words
    await fetch("/api/words", { method: "DELETE" });

    // Reset all state
    setCapturedImage(null);
    setGtaImage(null);
    setLyrics("");
    setAudioUrl("");
    setBuzzwords([]);
    setIsPlaying(false);
    setProgress({ step: "", progress: 0 });
    setError(null);
    setMusicTaskId(null);
    setIsCapturing(false);
    setAppState("LOBBY");
  }, []);

  // Suppress unused variable warning
  void capturedImage;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Global background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,31,142,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,215,0,0.1),transparent_50%)]" />
      </div>

      {/* Global reset button - hidden in LOBBY (has its own header) */}
      {appState !== "LOBBY" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleReset}
          className="fixed top-4 right-4 z-[100] p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 hover:bg-black/70 transition-all group"
          title="Start over"
        >
          <RotateCcw className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </motion.button>
      )}

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
                <Mic className="w-8 h-8 text-[#FF1F8E]" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight chrome-text">The Corporate Heroes</h1>
                  <p className="text-xs text-zinc-500 font-mono">THE ARENA ROCKERS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Clear words button */}
                <button
                  onClick={handleReset}
                  className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors group"
                  title="Clear all words"
                >
                  <RotateCcw className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
                <Button
                  onClick={handleLockIn}
                  size="lg"
                  className="h-12 px-8 text-sm font-bold bg-[#FF1F8E] hover:bg-[#FF6BB5] text-white rounded-none border-0 shadow-[0_0_20px_rgba(255,31,142,0.3)] neon-glow-magenta"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  LOCK IN & SNAPSHOT
                </Button>
              </div>
            </header>

            {/* Word Cloud - Full screen */}
            <div className="absolute inset-0 pt-24">
              <WordCloud refreshInterval={1000} />
            </div>

            {/* QR Code - Bottom right (high z-index to stay above words) */}
            <div className="fixed bottom-8 right-8 z-[60]">
              <QRDisplay size={160} />
            </div>

            {/* Word count indicator */}
            <div className="fixed bottom-8 left-8 z-40">
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm">
                <Zap className="w-4 h-4 text-[#FFD700]" />
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
              <p className="text-zinc-500">Strike a pose!</p>
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
              <p className="text-zinc-500">The Corporate Heroes is cooking...</p>
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

        {/* IMAGE_REVEAL STATE */}
        {appState === "IMAGE_REVEAL" && gtaImage && (
          <motion.div
            key="image-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            <ImageReveal gtaImage={gtaImage} lyrics={lyrics} />

            {/* Error overlay */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
              >
                <div className="p-6 bg-red-900/20 border border-red-800 text-red-400 max-w-md text-center rounded-lg">
                  <p className="font-mono text-sm mb-4">{error}</p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-red-800 text-red-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                </div>
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
            {/* Download buttons - fixed top left */}
            <div className="fixed top-4 left-4 z-[100] flex gap-2">
              {gtaImage && (
                <button
                  onClick={() => downloadBase64(gtaImage, `CORPORATE_HEROES_${Date.now()}.jpg`)}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-800 hover:border-[#FFD700] hover:bg-black/70 transition-all group"
                  title="Download image"
                >
                  <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-[#FFD700] transition-colors" />
                </button>
              )}
              {audioUrl && (
                <button
                  onClick={() => downloadUrl(audioUrl, `CORPORATE_HEROES_${Date.now()}.mp3`)}
                  className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-800 hover:border-[#FFD700] hover:bg-black/70 transition-all group"
                  title="Download song"
                >
                  <Music className="w-5 h-5 text-zinc-500 group-hover:text-[#FFD700] transition-colors" />
                </button>
              )}
            </div>

            {/* Split Screen Layout */}
            <div className="relative min-h-screen flex flex-col lg:flex-row">
              {/* LEFT SIDE - Album Cover Photo (takes remaining space) */}
              <div className="lg:flex-1 h-[40vh] lg:h-screen relative overflow-hidden">
                {gtaImage && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${gtaImage})` }}
                    />
                    {/* Spotlight gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/50" />
                    {/* 80s style border glow */}
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,215,0,0.2)]" />
                  </>
                )}
              </div>

              {/* RIGHT SIDE - Lyrics Panel (max 800px width) */}
              <div className="h-[60vh] lg:h-screen lg:w-full lg:max-w-[800px] bg-gradient-to-br from-black via-zinc-900 to-black border-t lg:border-t-0 lg:border-l border-[#FF1F8E]/30">
                <KaraokeDisplay
                  lyrics={lyrics}
                  isPlaying={isPlaying}
                  buzzwords={buzzwords}
                />
              </div>
            </div>

            {/* Player - Fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <StemPlayer
                audioUrl={audioUrl}
                onPlayStateChange={setIsPlaying}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
