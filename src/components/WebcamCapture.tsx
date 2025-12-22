"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, AlertCircle, Check, SwitchCamera } from "lucide-react";

interface WebcamCaptureProps {
  onCapture: (imageBase64: string) => void;
}

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Camera selection state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  // List available cameras
  const listCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(cameras);
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  }, []);

  // Initialize webcam with optional deviceId
  const initCamera = useCallback(async (deviceId?: string) => {
    try {
      setError(null);

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported. Please use HTTPS or localhost, or try a different browser.");
        return;
      }

      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      // Use specific device if provided, otherwise default to user-facing
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = "user";
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);

      // Update selected device ID from the actual track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
      }

      // Refresh camera list (labels become available after permission)
      await listCameras();
    } catch (err) {
      console.error("Camera error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission")) {
        setError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (errorMessage.includes("NotFoundError")) {
        setError("No camera found. Please connect a camera and try again.");
      } else if (errorMessage.includes("OverconstrainedError")) {
        // Selected camera not available, try default
        setError(null);
        setSelectedDeviceId("");
        await initCamera();
      } else {
        setError(`Camera error: ${errorMessage}`);
      }
    }
  }, [listCameras]);

  // Switch to a different camera
  const switchCamera = useCallback(async (deviceId: string) => {
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setShowCameraMenu(false);
    await initCamera(deviceId);
  }, [stream, initCamera]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      initCamera();
    }

    return () => {
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

  // Listen for device changes (hotplugging)
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("Camera devices changed");
      listCameras();
    };

    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [listCameras]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCameraMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowCameraMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCameraMenu]);

  // Handle countdown
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      doCapture();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const doCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get canvas context");
      setIsCapturing(false);
      setError("Failed to capture image. Please try again.");
      return;
    }

    // Compress: scale down to max 800px width for faster upload
    const MAX_WIDTH = 800;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    // Draw scaled video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with compression (0.8 quality)
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

    // Flash effect then callback
    setTimeout(() => {
      setIsCapturing(false);
      onCapture(imageBase64);
    }, 200);
  }, [onCapture]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
  }, []);

  // Get camera label with fallback
  const getCameraLabel = (camera: MediaDeviceInfo, index: number) => {
    if (camera.label) return camera.label;
    return `Camera ${index + 1}`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-zinc-400 text-center">{error}</p>
        <Button
          onClick={() => initCamera()}
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

        {/* Camera selector - only show if multiple cameras */}
        {availableCameras.length > 1 && (
          <div ref={menuRef} className="absolute top-4 right-16 z-20">
            <button
              onClick={() => setShowCameraMenu(!showCameraMenu)}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-700 hover:border-violet-500 transition-all"
              title="Select camera"
            >
              <SwitchCamera className="w-4 h-4 text-zinc-400" />
            </button>

            <AnimatePresence>
              {showCameraMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 bg-black/90 backdrop-blur-md border border-zinc-800 rounded-lg p-2 min-w-[220px] max-w-[300px]"
                >
                  <div className="text-xs text-zinc-500 px-3 py-1 mb-1">Select Camera</div>
                  {availableCameras.map((camera, index) => (
                    <button
                      key={camera.deviceId}
                      onClick={() => switchCamera(camera.deviceId)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-zinc-800 transition-colors flex items-center gap-2 ${
                        camera.deviceId === selectedDeviceId ? "text-violet-400" : "text-zinc-400"
                      }`}
                    >
                      <span className="w-4 h-4 flex-shrink-0">
                        {camera.deviceId === selectedDeviceId && <Check className="w-4 h-4" />}
                      </span>
                      <span className="text-sm truncate">{getCameraLabel(camera, index)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <span className="text-[200px] font-bold text-white drop-shadow-[0_0_50px_rgba(139,92,246,0.8)]">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
          onClick={startCountdown}
          disabled={!stream || isCapturing || countdown !== null}
          size="lg"
          className="h-16 px-12 text-xl font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-none border-0 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        >
          <Camera className="w-6 h-6 mr-3" />
          {countdown !== null ? `${countdown}...` : "CAPTURE CROWD"}
        </Button>
      </motion.div>
    </div>
  );
}
