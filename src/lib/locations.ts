/**
 * Types for the Ghent Block Locations API
 */

/**
 * Geographic point with longitude and latitude
 */
export interface GeoPoint {
  lon: number;
  lat: number;
}

/**
 * Block location record from the Ghent API
 */
export interface BlockLocation {
  id: number;
  titel: string;
  teaser_text: string | null;
  teaser_img_url: string | null;
  adres: string;
  postcode: string | null;
  gemeente: string | null;
  totale_capaciteit: number;
  gereserveerde_plaatsen: number;
  label_1: string | null;
  openingsuren: string | null;
  datum_reservatie: string | null;
  lees_meer: string;
  tag_1: string | null;
  tag_2: string | null;
  coordinates: string;
  x_coordinate: string;
  y_coordinate: string;
  geo_punt: GeoPoint | null;
}

/**
 * API response from the Ghent block locations endpoint
 */
export interface BlockLocationsResponse {
  total_count: number;
  results: BlockLocation[];
}

/**
 * Fetch block locations from the Ghent Open Data API
 * @param limit - Maximum number of results to fetch
 * @returns Promise with the locations data
 */
export async function fetchBlockLocations(
  limit: number = 20
): Promise<BlockLocation[]> {
  const url = `https://data.stad.gent/api/explore/v2.1/catalog/datasets/bloklocaties-gent/records?limit=${limit}`;

  try {
    const response = await fetch(url, {
      next: {
        // Revalidate every 5 minutes
        revalidate: 300,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: BlockLocationsResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Failed to fetch block locations:", error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Get availability status based on capacity
 */
export function getAvailabilityStatus(
  total: number,
  reserved: number
): { label: string; color: string } {
  const available = total - reserved;
  const percentage = (available / total) * 100;

  if (percentage > 50) {
    return { label: "Many spots available", color: "text-green-600 dark:text-green-400" };
  } else if (percentage > 20) {
    return { label: "Some spots available", color: "text-yellow-600 dark:text-yellow-400" };
  } else if (available > 0) {
    return { label: "Few spots left", color: "text-orange-600 dark:text-orange-400" };
  }
  return { label: "Fully booked", color: "text-red-600 dark:text-red-400" };
}

/**
 * Sound level type (re-exported for convenience)
 */
export type SoundLevel = "quiet" | "moderate" | "loud" | "too-loud";

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
