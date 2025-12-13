"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Mic, Music } from "lucide-react";
import { Stems } from "@/lib/types";

interface StemPlayerProps {
  audioUrl: string;
  stems?: Stems;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function StemPlayer({
  audioUrl,
  stems,
  onTimeUpdate,
  onPlayStateChange,
}: StemPlayerProps) {
  // Audio refs
  const mainAudioRef = useRef<HTMLAudioElement>(null);
  const vocalsRef = useRef<HTMLAudioElement>(null);
  const bassRef = useRef<HTMLAudioElement>(null);
  const drumsRef = useRef<HTMLAudioElement>(null);
  const otherRef = useRef<HTMLAudioElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vocalsOnly, setVocalsOnly] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);

  // All audio refs for stem mode
  const stemRefs = [vocalsRef, bassRef, drumsRef, otherRef];
  const hasStems = stems && stems.vocals && stems.bass && stems.drums && stems.other;

  // Sync all audio elements
  const syncAudio = useCallback((time: number) => {
    if (hasStems) {
      stemRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.currentTime = time;
        }
      });
    } else if (mainAudioRef.current) {
      mainAudioRef.current.currentTime = time;
    }
  }, [hasStems, stemRefs]);

  // Play all
  const playAll = useCallback(async () => {
    try {
      if (hasStems) {
        await Promise.all(
          stemRefs.map((ref) => ref.current?.play())
        );
      } else if (mainAudioRef.current) {
        await mainAudioRef.current.play();
      }
      setIsPlaying(true);
      onPlayStateChange?.(true);
    } catch (err) {
      console.error("Playback error:", err);
    }
  }, [hasStems, stemRefs, onPlayStateChange]);

  // Pause all
  const pauseAll = useCallback(() => {
    if (hasStems) {
      stemRefs.forEach((ref) => {
        ref.current?.pause();
      });
    } else {
      mainAudioRef.current?.pause();
    }
    setIsPlaying(false);
    onPlayStateChange?.(false);
  }, [hasStems, stemRefs, onPlayStateChange]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseAll();
    } else {
      playAll();
    }
  }, [isPlaying, playAll, pauseAll]);

  // Handle vocals only toggle
  useEffect(() => {
    if (!hasStems) return;

    const instrumentalVolume = vocalsOnly ? 0 : masterVolume;

    if (bassRef.current) bassRef.current.volume = instrumentalVolume;
    if (drumsRef.current) drumsRef.current.volume = instrumentalVolume;
    if (otherRef.current) otherRef.current.volume = instrumentalVolume;
    if (vocalsRef.current) vocalsRef.current.volume = masterVolume;
  }, [vocalsOnly, masterVolume, hasStems]);

  // Handle master volume for non-stem mode
  useEffect(() => {
    if (!hasStems && mainAudioRef.current) {
      mainAudioRef.current.volume = masterVolume;
    }
  }, [masterVolume, hasStems]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    const audio = hasStems ? vocalsRef.current : mainAudioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    }
  }, [hasStems, onTimeUpdate]);

  // Duration loaded handler
  const handleLoadedMetadata = useCallback(() => {
    const audio = hasStems ? vocalsRef.current : mainAudioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  }, [hasStems]);

  // Seek handler
  const handleSeek = useCallback(
    (value: number[]) => {
      const newTime = value[0];
      setCurrentTime(newTime);
      syncAudio(newTime);
    },
    [syncAudio]
  );

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6">
      {/* Hidden audio elements */}
      {hasStems ? (
        <>
          <audio
            ref={vocalsRef}
            src={stems.vocals}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="auto"
          />
          <audio ref={bassRef} src={stems.bass} preload="auto" />
          <audio ref={drumsRef} src={stems.drums} preload="auto" />
          <audio ref={otherRef} src={stems.other} preload="auto" />
        </>
      ) : (
        <audio
          ref={mainAudioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          preload="auto"
        />
      )}

      {/* Controls row */}
      <div className="flex items-center gap-6">
        {/* Play/Pause */}
        <Button
          onClick={togglePlay}
          size="lg"
          className="w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white border-0"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </Button>

        {/* Timeline */}
        <div className="flex-1 space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-32">
          {masterVolume > 0 ? (
            <Volume2 className="w-5 h-5 text-zinc-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-zinc-400" />
          )}
          <Slider
            value={[masterVolume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setMasterVolume(v[0])}
          />
        </div>

        {/* Vocals Only Toggle (only if stems available) */}
        {hasStems && (
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <Button
              onClick={() => setVocalsOnly(!vocalsOnly)}
              variant={vocalsOnly ? "default" : "outline"}
              className={`rounded-none ${
                vocalsOnly
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              {vocalsOnly ? (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  VOCALS
                </>
              ) : (
                <>
                  <Music className="w-4 h-4 mr-2" />
                  FULL MIX
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
