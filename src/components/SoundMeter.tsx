"use client";

import React from "react";
import {
  SoundLevel,
  getSoundLevelLabel,
  getSoundLevelColor,
} from "@/hooks/useAudioLevel";

interface SoundMeterProps {
  /** Current decibel level (0-100) */
  decibels: number;
  /** Current sound level category */
  soundLevel: SoundLevel;
  /** Whether monitoring is active */
  isMonitoring: boolean;
  /** Whether using simulated data */
  isSimulated: boolean;
}

/**
 * SoundMeter - Visual indicator for current sound levels
 * Displays an animated circular meter with color-coded feedback
 */
export function SoundMeter({
  decibels,
  soundLevel,
  isMonitoring,
  isSimulated,
}: SoundMeterProps) {
  const label = getSoundLevelLabel(soundLevel);
  const color = getSoundLevelColor(soundLevel);

  // Calculate the circumference for the circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = (decibels / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main circular meter */}
      <div className="relative" role="meter" aria-valuenow={decibels} aria-valuemin={0} aria-valuemax={100} aria-label={`Sound level: ${decibels} decibels, ${label}`}>
        {/* SVG circular progress */}
        <svg
          width="280"
          height="280"
          viewBox="0 0 280 280"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-150 ease-out"
            style={{
              filter: isMonitoring ? `drop-shadow(0 0 8px ${color})` : "none",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Decibel value */}
          <span
            className="text-5xl font-bold transition-colors duration-300"
            style={{ color: isMonitoring ? color : "inherit" }}
          >
            {isMonitoring ? decibels : "--"}
          </span>
          <span className="text-lg text-gray-500 dark:text-gray-400 mt-1">
            dB
          </span>

          {/* Status label */}
          <div
            className="mt-3 px-4 py-1.5 rounded-full text-sm font-semibold text-white transition-all duration-300"
            style={{ backgroundColor: isMonitoring ? color : "#9ca3af" }}
          >
            {isMonitoring ? label : "Not Active"}
          </div>
        </div>
      </div>

      {/* Simulation indicator */}
      {isSimulated && isMonitoring && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Using simulated data</span>
        </div>
      )}

      {/* Sound level legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {(["quiet", "moderate", "loud", "too-loud"] as const).map((level) => (
          <div
            key={level}
            className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${
              soundLevel === level && isMonitoring
                ? "opacity-100"
                : "opacity-50"
            }`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSoundLevelColor(level) }}
              aria-hidden="true"
            />
            <span className="text-gray-600 dark:text-gray-400">
              {getSoundLevelLabel(level)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
