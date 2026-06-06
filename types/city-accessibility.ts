export interface CityAccessibilityRecord {
  city: string;
  areaKm2: number;
  hospitals: number;
  schools: number;
  parks: number;
  busStops: number;
}

export type MetricKey = "hospitals" | "schools" | "parks" | "busStops";

export type SortableColumn =
  | "city"
  | "accessibilityScore"
  | "nationalPercentile"
  | "gapVsMedianPct"
  | "hospitals"
  | "schools"
  | "parks"
  | "busStops"
  | "areaKm2";

export type SortDirection = "asc" | "desc";

export interface EnrichedCityAccessibilityRecord extends CityAccessibilityRecord {
  rawScore: number;
  densityScore: number;
  metricDensity: Record<MetricKey, number>;
  percentileByMetric: Record<MetricKey, number>;
  accessibilityScore: number;
  nationalPercentile: number;
  gapVsMedianPct: number;
  contributions: Record<MetricKey, number>;
  rank: number;
}

export interface AccessibilitySummaryStats {
  bestAccessibilityScore: number;
  bestCity: string;
  totalHospitals: number;
  totalSchools: number;
  totalParks: number;
  totalTransitStops: number;
}
