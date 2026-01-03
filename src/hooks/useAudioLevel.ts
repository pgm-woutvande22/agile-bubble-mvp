"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Sound level status types
 * - quiet: 0-30 dB (library, whisper)
 * - moderate: 30-60 dB (normal conversation)
 * - loud: 60-80 dB (busy traffic, loud music)
 * - too-loud: 80+ dB (dangerous levels)
 */
export type SoundLevel = "quiet" | "moderate" | "loud" | "too-loud";

/**
 * Returns the sound level category based on decibel value
 */
export function getSoundLevel(db: number): SoundLevel {
  if (db < 30) return "quiet";
  if (db < 60) return "moderate";
  if (db < 80) return "loud";
  return "too-loud";
}

/**
 * Get a human-readable label for the sound level
 */
export function getSoundLevelLabel(level: SoundLevel): string {
  const labels: Record<SoundLevel, string> = {
    quiet: "Quiet",
    moderate: "Moderate",
    loud: "Loud",
    "too-loud": "Too Loud",
  };
  return labels[level];
}

/**
 * Get the color for the sound level
 */
export function getSoundLevelColor(level: SoundLevel): string {
  const colors: Record<SoundLevel, string> = {
    quiet: "#22c55e", // green-500
    moderate: "#eab308", // yellow-500
    loud: "#f97316", // orange-500
    "too-loud": "#ef4444", // red-500
  };
  return colors[level];
}

interface UseAudioLevelReturn {
  /** Current decibel level (0-100 scale) */
  decibels: number;
  /** Current sound level category */
  soundLevel: SoundLevel;
  /** Whether microphone access was granted */
  hasPermission: boolean;
  /** Whether we're using simulated data */
  isSimulated: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Whether the audio is currently being monitored */
  isMonitoring: boolean;
  /** Start monitoring audio */
  startMonitoring: () => void;
  /** Stop monitoring audio */
  stopMonitoring: () => void;
  /** Toggle between real and simulated audio */
  toggleSimulation: () => void;
}

/**
 * Custom hook for measuring sound levels using Web Audio API
 * Falls back to simulated data if microphone access is unavailable
 */
export function useAudioLevel(): UseAudioLevelReturn {
  const [decibels, setDecibels] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);

  // Refs for audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Generate simulated sound levels for demo purposes
   * Creates realistic-looking fluctuations
   */
  const simulateSoundLevels = useCallback(() => {
    // Base level with random fluctuations
    const baseLevel = 45; // Moderate ambient noise
    const fluctuation = Math.sin(Date.now() / 1000) * 15; // Slow wave
    const noise = (Math.random() - 0.5) * 20; // Random noise

    // Occasionally spike to simulate sudden sounds
    const spike = Math.random() > 0.95 ? Math.random() * 30 : 0;

    const level = Math.max(0, Math.min(100, baseLevel + fluctuation + noise + spike));
    setDecibels(Math.round(level));
  }, []);

  /**
   * Start simulated audio monitoring
   */
  const startSimulation = useCallback(() => {
    setIsSimulated(true);
    simulationIntervalRef.current = setInterval(simulateSoundLevels, 100);
  }, [simulateSoundLevels]);

  /**
   * Calculate approximate decibels from audio data
   * This converts the amplitude to a 0-100 scale approximating dB
   */
  const calculateDecibels = useCallback((dataArray: Uint8Array): number => {
    // Calculate RMS (Root Mean Square) for better volume representation
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
      sum += value * value;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    // Convert to approximate decibel scale (0-100)
    // RMS of 0 = -infinity dB, RMS of 1 = 0 dB
    // We map this to a 0-100 scale for display purposes
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    // Map from typical range (-100 to 0) to (0 to 100)
    const normalizedDb = Math.max(0, Math.min(100, (db + 100)));

    return Math.round(normalizedDb);
  }, []);

  /**
   * Analyze audio from the microphone using requestAnimationFrame loop
   */
  const runAnalysisLoop = useCallback(() => {
    const analyze = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray);

      const db = calculateDecibels(dataArray);
      setDecibels(db);

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    analyze();
  }, [calculateDecibels]);

  /**
   * Start monitoring with real microphone
   */
  const startRealAudio = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setHasPermission(true);
      setIsSimulated(false);
      setError(null);

      // Start the analysis loop
      runAnalysisLoop();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Microphone access denied. Using simulated data.");
      setHasPermission(false);
      startSimulation();
    }
  }, [runAnalysisLoop, startSimulation]);

  /**
   * Start monitoring audio levels
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    // Check if Web Audio API is available
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      startRealAudio();
    } else {
      setError("Web Audio API not available. Using simulated data.");
      startSimulation();
    }
  }, [startRealAudio, startSimulation]);

  /**
   * Stop monitoring audio levels
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear simulation interval
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setDecibels(0);
  }, []);

  /**
   * Toggle between real and simulated audio
   */
  const toggleSimulation = useCallback(() => {
    stopMonitoring();
    if (isSimulated && hasPermission) {
      startRealAudio();
    } else {
      startSimulation();
    }
    setIsMonitoring(true);
  }, [isSimulated, hasPermission, stopMonitoring, startRealAudio, startSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    decibels,
    soundLevel: getSoundLevel(decibels),
    hasPermission,
    isSimulated,
    error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    toggleSimulation,
  };
}
