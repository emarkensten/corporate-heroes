"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface StemPlayerProps {
  audioUrl: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function StemPlayer({
  audioUrl,
  onPlayStateChange,
}: StemPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
    }
  }, [isPlaying, onPlayStateChange]);

  // Handle time update - don't update while seeking
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isSeeking]);

  // Handle metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
      console.log("Audio loaded, duration:", audioRef.current.duration);
    }
  }, []);

  // Handle can play
  const handleCanPlay = useCallback(() => {
    if (audioRef.current && !isLoaded) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // Handle seek - while dragging
  const handleSeek = useCallback((value: number[]) => {
    setIsSeeking(true);
    setCurrentTime(value[0]);
  }, []);

  // Handle seek commit - when user releases slider
  const handleSeekCommit = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
    }
    setIsSeeking(false);
  }, []);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle audio ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
    setCurrentTime(0);
  }, [onPlayStateChange]);

  // Show player and reset hide timer
  const showPlayer = useCallback(() => {
    setIsVisible(true);

    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    // Set new timeout to hide after 3 seconds of inactivity
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, []);

  // Track mouse movement near bottom of screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;

      // Show if mouse is in bottom 150px of screen
      if (windowHeight - mouseY < 150) {
        showPlayer();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Initial show
    showPlayer();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [showPlayer]);

  // Format time helper
  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Audio element - always mounted */}
      <audio
        ref={audioRef}
        src={audioUrl}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        }}
        preload="auto"
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={containerRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={showPlayer}
            onMouseMove={showPlayer}
            className="w-full bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 p-4 md:p-6"
          >
            {/* Controls row */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Play/Pause */}
              <Button
                onClick={() => {
                  showPlayer();
                  togglePlay();
                }}
                size="lg"
                disabled={!audioUrl}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white border-0 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                )}
              </Button>

              {/* Timeline */}
              <div className="flex-1 space-y-1">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration > 0 ? duration : 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  onValueCommit={handleSeekCommit}
                  disabled={!isLoaded}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2 w-28">
                <button
                  onClick={() => {
                    showPlayer();
                    setVolume(volume > 0 ? 0 : 0.8);
                  }}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  {volume > 0 ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => {
                    showPlayer();
                    setVolume(v[0]);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
