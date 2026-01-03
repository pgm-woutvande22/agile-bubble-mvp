"use client";

import React, { useEffect, useState } from "react";
import {
  BlockLocation,
  fetchBlockLocations,
  calculateDistance,
  formatDistance,
  getAvailabilityStatus,
} from "@/lib/locations";

interface QuietLocationsProps {
  /** User's current position (optional) */
  userLocation?: { lat: number; lon: number } | null;
}

/**
 * QuietLocations - Displays recommended quiet locations in Ghent
 * Fetches data from the Ghent Open Data API
 */
export function QuietLocations({ userLocation }: QuietLocationsProps) {
  const [locations, setLocations] = useState<BlockLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocations() {
      try {
        setIsLoading(true);
        const data = await fetchBlockLocations(20);

        // Sort by distance if user location is available
        if (userLocation) {
          data.sort((a, b) => {
            if (!a.geo_punt || !b.geo_punt) return 0;
            const distA = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              a.geo_punt.lat,
              a.geo_punt.lon
            );
            const distB = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              b.geo_punt.lat,
              b.geo_punt.lon
            );
            return distA - distB;
          });
        }

        setLocations(data);
        setError(null);
      } catch {
        setError("Failed to load quiet locations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLocations();
  }, [userLocation]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span aria-hidden="true">📍</span>
          Quiet Locations in Ghent
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2" aria-hidden="true">
          😕
        </div>
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span aria-hidden="true">📍</span>
          Quiet Locations in Ghent
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {locations.length} locations found
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Looking for a quiet place to study or work? Here are some recommended spots in Ghent.
      </p>

      {/* Location cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {locations.map((location) => {
          const availability = getAvailabilityStatus(
            location.totale_capaciteit,
            location.gereserveerde_plaatsen
          );

          const distance =
            userLocation && location.geo_punt
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lon,
                  location.geo_punt.lat,
                  location.geo_punt.lon
                )
              : null;

          return (
            <article
              key={location.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {location.titel}
                </h3>
                {distance !== null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatDistance(distance)}
                  </span>
                )}
              </div>

              {/* Address */}
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
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
                <span className="line-clamp-2">{location.adres}</span>
              </p>

              {/* Opening hours */}
              {location.openingsuren && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{location.openingsuren}</span>
                </p>
              )}

              {/* Capacity */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Capacity: {location.totale_capaciteit - location.gereserveerde_plaatsen}/{location.totale_capaciteit}
                  </span>
                </div>
                <span className={`text-xs font-medium ${availability.color}`}>
                  {availability.label}
                </span>
              </div>

              {/* Tags */}
              {(location.tag_1 || location.tag_2) && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {location.tag_1 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {location.tag_1}
                    </span>
                  )}
                  {location.tag_2 &&
                    location.tag_2.split(",").slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
              )}

              {/* Link */}
              <a
                href={location.lees_meer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3"
              >
                Learn more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
