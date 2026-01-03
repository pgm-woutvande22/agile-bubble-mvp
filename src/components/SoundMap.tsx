"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  BlockLocation,
  fetchBlockLocations,
  getSoundLevelColor,
  calculateDistance,
  formatDistance,
} from "@/lib/locations";
import { SoundLevel, getSoundLevelLabel } from "@/hooks/useAudioLevel";

// Dynamically import map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

/**
 * Interface for location with simulated sound data
 */
interface LocationWithSound extends BlockLocation {
  soundLevel: SoundLevel;
  decibels: number;
  distanceFromUser?: number; // Distance in km from user
}

/**
 * Generate fake/simulated sound level for a location
 * Uses location ID as seed for consistent values
 */
function generateFakeSoundLevel(locationId: number): { level: SoundLevel; decibels: number } {
  // Use location ID to create pseudo-random but consistent values
  const seed = locationId * 13 + 7;
  const baseDecibels = 20 + (seed % 60); // Range: 20-80 dB

  // Libraries and study places tend to be quieter
  const quietBonus = locationId % 3 === 0 ? -15 : 0;
  const finalDecibels = Math.max(15, Math.min(85, baseDecibels + quietBonus));

  let level: SoundLevel;
  if (finalDecibels < 30) level = "quiet";
  else if (finalDecibels < 60) level = "moderate";
  else if (finalDecibels < 80) level = "loud";
  else level = "too-loud";

  return { level, decibels: finalDecibels };
}

interface SoundMapProps {
  /** User's current location for centering the map */
  userLocation?: { lat: number; lon: number } | null;
}

/**
 * SoundMap - Interactive map showing locations with simulated sound levels
 */
export function SoundMap({ userLocation }: SoundMapProps) {
  const [locations, setLocations] = useState<LocationWithSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<SoundLevel | "all">("all");
  
  // Radius in meters for nearby recommendations (adjustable via slider)
  const [radius, setRadius] = useState(400);
  const MIN_RADIUS = 100;
  const MAX_RADIUS = 2000;

  // Default center: Ghent city center
  const defaultCenter: [number, number] = [51.0543, 3.7174];
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : defaultCenter;

  useEffect(() => {
    async function loadLocations() {
      try {
        setIsLoading(true);
        const data = await fetchBlockLocations(40);

        // Add fake sound data and distance to each location
        const locationsWithSound: LocationWithSound[] = data
          .filter((loc) => loc.geo_punt) // Only locations with coordinates
          .map((loc) => {
            const { level, decibels } = generateFakeSoundLevel(loc.id);
            
            // Calculate distance from user if available
            let distanceFromUser: number | undefined;
            if (userLocation && loc.geo_punt) {
              distanceFromUser = calculateDistance(
                userLocation.lat,
                userLocation.lon,
                loc.geo_punt.lat,
                loc.geo_punt.lon
              );
            }
            
            return {
              ...loc,
              soundLevel: level,
              decibels,
              distanceFromUser,
            };
          });

        // Sort by distance if user location available
        if (userLocation) {
          locationsWithSound.sort((a, b) => 
            (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity)
          );
        }

        setLocations(locationsWithSound);
        setError(null);
      } catch {
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    }

    loadLocations();
  }, [userLocation]);

  // Filter locations based on selected sound level
  const filteredLocations = useMemo(() => {
    if (selectedFilter === "all") return locations;
    return locations.filter((loc) => loc.soundLevel === selectedFilter);
  }, [locations, selectedFilter]);

  // Get nearby quiet locations (within radius meters, sorted by quietness then distance)
  const nearbyRecommendations = useMemo(() => {
    if (!userLocation) return [];
    
    const nearbyRadiusKm = radius / 1000; // Convert to km
    
    return locations
      .filter((loc) => {
        // Only locations within the radius
        return loc.distanceFromUser !== undefined && loc.distanceFromUser <= nearbyRadiusKm;
      })
      .sort((a, b) => {
        // Sort by sound level first (quieter first), then by distance
        const levelOrder: Record<SoundLevel, number> = {
          quiet: 0,
          moderate: 1,
          loud: 2,
          "too-loud": 3,
        };
        const levelDiff = levelOrder[a.soundLevel] - levelOrder[b.soundLevel];
        if (levelDiff !== 0) return levelDiff;
        return (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity);
      })
      .slice(0, 3); // Top 3 recommendations
  }, [locations, userLocation, radius]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span aria-hidden="true">🗺️</span>
            Sound Map of Ghent
          </h2>
        </div>
        <div className="h-[400px] md:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2" aria-hidden="true">🗺️</div>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span aria-hidden="true">🗺️</span>
            Sound Map of Ghent
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Explore noise levels at different locations (simulated data)
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedFilter === "all"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All ({locations.length})
          </button>
          {(["quiet", "moderate", "loud", "too-loud"] as const).map((level) => {
            const count = locations.filter((l) => l.soundLevel === level).length;
            return (
              <button
                key={level}
                onClick={() => setSelectedFilter(level)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  selectedFilter === level
                    ? "text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                style={
                  selectedFilter === level
                    ? { backgroundColor: getSoundLevelColor(level) }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getSoundLevelColor(level) }}
                  aria-hidden="true"
                />
                {getSoundLevelLabel(level)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Radius slider */}
      {userLocation && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">📍</span>
              <label htmlFor="radius-slider" className="font-medium text-gray-900 dark:text-white">
                Search Radius
              </label>
            </div>
            <div className="flex-1 flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                {MIN_RADIUS}m
              </span>
              <input
                id="radius-slider"
                type="range"
                min={MIN_RADIUS}
                max={MAX_RADIUS}
                step={50}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                aria-valuemin={MIN_RADIUS}
                aria-valuemax={MAX_RADIUS}
                aria-valuenow={radius}
                aria-valuetext={`${radius} meters`}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-14">
                {MAX_RADIUS}m
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map container */}
      <div className="h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Location markers */}
          {filteredLocations.map((location) => {
            if (!location.geo_punt) return null;

            const color = getSoundLevelColor(location.soundLevel);
            const position: [number, number] = [
              location.geo_punt.lat,
              location.geo_punt.lon,
            ];

            return (
              <CircleMarker
                key={location.id}
                center={position}
                radius={12}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span className="font-medium">{location.titel}</span>
                  <br />
                  <span>
                    {location.decibels} dB - {getSoundLevelLabel(location.soundLevel)}
                  </span>
                </Tooltip>
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-gray-900 mb-2">
                      {location.titel}
                    </h3>

                    {/* Sound level badge */}
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium mb-3"
                      style={{ backgroundColor: color }}
                    >
                      <span>{location.decibels} dB</span>
                      <span>•</span>
                      <span>{getSoundLevelLabel(location.soundLevel)}</span>
                    </div>

                    {/* Location details */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-start gap-1">
                        <span>📍</span>
                        <span>{location.adres}</span>
                      </p>
                      {location.openingsuren && (
                        <p className="flex items-center gap-1">
                          <span>🕐</span>
                          <span>{location.openingsuren}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <span>👥</span>
                        <span>
                          Capacity: {location.totale_capaciteit - location.gereserveerde_plaatsen}/
                          {location.totale_capaciteit} available
                        </span>
                      </p>
                    </div>

                    {/* Link */}
                    <a
                      href={location.lees_meer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-blue-600 hover:underline text-sm"
                    >
                      More info →
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* User location marker */}
          {userLocation && (
            <>
              {/* Dynamic radius circle - non-interactive so markers can be clicked */}
              <Circle
                center={[userLocation.lat, userLocation.lon]}
                radius={radius}
                interactive={false}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "5, 10",
                }}
              />
              
              {/* User marker */}
              <CircleMarker
                center={[userLocation.lat, userLocation.lon]}
                radius={10}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#3b82f6",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span className="font-medium">Your location</span>
                  <br />
                  <span className="text-xs">{radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`} radius</span>
                </Tooltip>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-gray-900 mb-1">📍 You are here</h3>
                    <p className="text-sm text-gray-600">
                      The blue circle shows a {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`} radius around your location.
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Nearby Recommendations */}
      {userLocation && nearbyRecommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <span aria-hidden="true">🎯</span>
            Recommended Nearby (within {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`})
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {nearbyRecommendations.map((loc, index) => (
              <div
                key={loc.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    #{index + 1}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: getSoundLevelColor(loc.soundLevel) }}
                  >
                    {loc.decibels} dB
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                  {loc.titel}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDistance(loc.distanceFromUser ?? 0)}</span>
                  <span
                    className="font-medium"
                    style={{ color: getSoundLevelColor(loc.soundLevel) }}
                  >
                    {getSoundLevelLabel(loc.soundLevel)}
                  </span>
                </div>
                {loc.openingsuren && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    🕐 {loc.openingsuren}
                  </p>
                )}
              </div>
            ))}
          </div>
          {nearbyRecommendations.length === 0 && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              No locations found within {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`} of your position.
            </p>
          )}
        </div>
      )}

      {/* No nearby locations message */}
      {userLocation && nearbyRecommendations.length === 0 && !isLoading && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
          <span className="text-2xl mb-2" aria-hidden="true">📍</span>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            No study locations found within {radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${radius}m`}. Try increasing the radius or explore the map!
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">Sound Levels:</span>
        {(["quiet", "moderate", "loud", "too-loud"] as const).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSoundLevelColor(level) }}
              aria-hidden="true"
            />
            <span>{getSoundLevelLabel(level)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
