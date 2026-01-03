"use client";

import { useState, useEffect, useCallback } from "react";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { SoundMeter } from "@/components/SoundMeter";
import { NoiseTips } from "@/components/NoiseTips";
import { QuietLocations } from "@/components/QuietLocations";
import { SoundMap } from "@/components/SoundMap";

/**
 * Home - Main page for the Sound Bubble application
 * Provides sound level monitoring with tips and location recommendations
 */
export default function Home() {
  const {
    decibels,
    soundLevel,
    isMonitoring,
    isSimulated,
    error,
    startMonitoring,
    stopMonitoring,
  } = useAudioLevel();

  // User location state for sorting nearby locations
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  /**
   * Request user's geolocation
   */
  const requestLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Default to Ghent city center if location unavailable
          setUserLocation({ lat: 51.0543, lon: 3.7174 });
        }
      );
    } else {
      // Default to Ghent city center
      setUserLocation({ lat: 51.0543, lon: 3.7174 });
    }
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  /**
   * Toggle monitoring on/off
   */
  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Sound Bubble
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Know your sound environment
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={`flex items-center gap-2 text-sm ${
              isMonitoring
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">
              {isMonitoring ? "Listening..." : "Inactive"}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Sound Meter Section */}
        <section
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 md:p-8"
          aria-labelledby="meter-heading"
        >
          <h2 id="meter-heading" className="sr-only">
            Sound Level Meter
          </h2>

          {/* Sound Meter */}
          <SoundMeter
            decibels={decibels}
            soundLevel={soundLevel}
            isMonitoring={isMonitoring}
            isSimulated={isSimulated}
          />

          {/* Error message */}
          {error && (
            <div
              className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm text-center"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Start/Stop Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleToggleMonitoring}
              className={`
                px-8 py-4 rounded-full font-semibold text-lg
                transition-all duration-300 transform hover:scale-105
                focus:outline-none focus:ring-4 focus:ring-offset-2
                ${
                  isMonitoring
                    ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white focus:ring-blue-300"
                }
              `}
              aria-pressed={isMonitoring}
            >
              {isMonitoring ? (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="6" y="4" width="3" height="12" rx="1" />
                    <rect x="11" y="4" width="3" height="12" rx="1" />
                  </svg>
                  Stop Monitoring
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Start Monitoring
                </span>
              )}
            </button>
          </div>
        </section>

        {/* Tips Section */}
        <section
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 md:p-8"
          aria-labelledby="tips-heading"
        >
          <h2
            id="tips-heading"
            className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
          >
            <span aria-hidden="true">💡</span>
            Tips & Recommendations
          </h2>
          <NoiseTips soundLevel={soundLevel} isMonitoring={isMonitoring} />
        </section>

        {/* Sound Map Section */}
        <section
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 md:p-8"
          aria-labelledby="map-heading"
        >
          <h2 id="map-heading" className="sr-only">
            Interactive Sound Map
          </h2>
          <SoundMap userLocation={userLocation} />
        </section>

        {/* Locations Section */}
        <section
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 md:p-8"
          aria-labelledby="locations-heading"
        >
          <h2 id="locations-heading" className="sr-only">
            Quiet Locations
          </h2>
          <QuietLocations userLocation={userLocation} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Sound Bubble — Helping you find quieter spaces in Ghent
          </p>
          <p className="mt-1">
            Data provided by{" "}
            <a
              href="https://data.stad.gent/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Stad Gent Open Data
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
