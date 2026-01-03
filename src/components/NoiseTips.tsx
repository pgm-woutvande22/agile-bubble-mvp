"use client";

import React from "react";
import { SoundLevel } from "@/hooks/useAudioLevel";

/**
 * Tip recommendation structure
 */
interface Tip {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Get tips based on current sound level
 */
function getTipsForLevel(level: SoundLevel): Tip[] {
  const allTips: Tip[] = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      ),
      title: "Use Noise-Canceling Headphones",
      description:
        "Block out environmental noise with active noise-canceling headphones for better focus and hearing protection.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      title: "Find a Quieter Location",
      description:
        "Consider moving to a calmer space like a library, park, or quiet café to reduce noise exposure.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
      title: "Reduce Background Noise",
      description:
        "Close windows, turn off unnecessary appliances, or ask others to lower their volume.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Take Regular Breaks",
      description:
        "If you must stay in a noisy environment, take breaks in quieter areas to give your ears a rest.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      title: "Protect Your Hearing",
      description:
        "Prolonged exposure to loud noise can cause permanent hearing damage. Consider wearing earplugs.",
    },
  ];

  // Return different tips based on sound level
  switch (level) {
    case "quiet":
      return []; // No tips needed for quiet environments
    case "moderate":
      return allTips.slice(0, 2); // First 2 tips
    case "loud":
      return allTips.slice(0, 4); // First 4 tips
    case "too-loud":
      return allTips; // All tips
    default:
      return [];
  }
}

interface NoiseTipsProps {
  /** Current sound level */
  soundLevel: SoundLevel;
  /** Whether monitoring is active */
  isMonitoring: boolean;
}

/**
 * NoiseTips - Displays helpful recommendations based on current noise level
 */
export function NoiseTips({ soundLevel, isMonitoring }: NoiseTipsProps) {
  const tips = getTipsForLevel(soundLevel);

  // Don't show anything if quiet or not monitoring
  if (!isMonitoring || soundLevel === "quiet") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">🌿</div>
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
          {isMonitoring ? "Your Environment is Quiet" : "Start Monitoring"}
        </h3>
        <p className="text-green-600 dark:text-green-500 text-sm">
          {isMonitoring
            ? "Great! This is an ideal sound level for concentration and relaxation."
            : "Press the button above to start measuring your sound levels."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning header for loud/too-loud */}
      {(soundLevel === "loud" || soundLevel === "too-loud") && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 ${
            soundLevel === "too-loud"
              ? "bg-red-50 dark:bg-red-900/20"
              : "bg-orange-50 dark:bg-orange-900/20"
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className="text-2xl" aria-hidden="true">
            {soundLevel === "too-loud" ? "⚠️" : "🔊"}
          </span>
          <div>
            <h3
              className={`font-semibold ${
                soundLevel === "too-loud"
                  ? "text-red-700 dark:text-red-400"
                  : "text-orange-700 dark:text-orange-400"
              }`}
            >
              {soundLevel === "too-loud"
                ? "Noise Level is Too High!"
                : "It's Getting Loud"}
            </h3>
            <p
              className={`text-sm ${
                soundLevel === "too-loud"
                  ? "text-red-600 dark:text-red-500"
                  : "text-orange-600 dark:text-orange-500"
              }`}
            >
              {soundLevel === "too-loud"
                ? "This level can be harmful to your hearing. Consider these tips:"
                : "Here are some ways to reduce noise exposure:"}
            </p>
          </div>
        </div>
      )}

      {/* Tips list */}
      <div className="grid gap-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 items-start hover:shadow-md transition-shadow"
          >
            <div
              className={`flex-shrink-0 p-2 rounded-lg ${
                soundLevel === "too-loud"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : soundLevel === "loud"
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
              aria-hidden="true"
            >
              {tip.icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {tip.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
