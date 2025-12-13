"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (imageBase64: string) => void;
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Initialize webcam
  const initCamera = useCallback(async () => {
    try {
      setError(null);

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported. Please use HTTPS or localhost, or try a different browser.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission")) {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (errorMessage.includes("NotFoundError")) {
        setError("No camera found. Please connect a camera and try again.");
      } else {
        setError(`Camera error: ${errorMessage}`);
      }
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      initCamera();
    }

    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initCamera]);

  // Stop stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

    // Flash effect then callback
    setTimeout(() => {
      setIsCapturing(false);
      onCapture(imageBase64);
    }, 200);
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-zinc-400 text-center">{error}</p>
        <Button
          onClick={initCamera}
          variant="outline"
          className="border-zinc-700 text-zinc-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Video container */}
      <div className="relative aspect-video bg-zinc-900 overflow-hidden border-4 border-zinc-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanlines effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
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

        {/* Capture flash */}
        {isCapturing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white"
          />
        )}

        {/* Corner brackets overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-violet-500" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-violet-500" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-violet-500" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-violet-500" />
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex justify-center"
      >
        <Button
          onClick={captureImage}
          disabled={!stream || isCapturing}
          size="lg"
          className="h-16 px-12 text-xl font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-none border-0 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        >
          <Camera className="w-6 h-6 mr-3" />
          CAPTURE CROWD
        </Button>
      </motion.div>
    </div>
  );
}
