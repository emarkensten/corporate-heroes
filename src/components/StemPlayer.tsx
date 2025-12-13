"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

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

  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      const newTime = value[0];
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
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

  // Format time helper
  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 p-4 md:p-6">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Controls row */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Play/Pause */}
        <Button
          onClick={togglePlay}
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
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
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
            onValueChange={(v) => setVolume(v[0])}
          />
        </div>
      </div>
    </div>
  );
}
