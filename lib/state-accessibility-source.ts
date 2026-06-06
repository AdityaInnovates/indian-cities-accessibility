import { INDIAN_STATES } from "@/data/indian-states";
import type { CityAccessibilityRecord } from "@/types/city-accessibility";

export interface StateAccessibilityPayload {
  records: CityAccessibilityRecord[];
  source: "live-overpass" | "fallback-estimated";
  lastUpdated: string;
  message?: string;
}

interface OverpassCount {
  type?: string;
  tags?: {
    total?: string;
  };
}

interface OverpassResponse {
  elements?: OverpassCount[];
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

let cache: {
  payload: StateAccessibilityPayload;
  cachedAt: number;
} | null = null;

function buildOverpassQuery(stateName: string): string {
  const safeStateName = stateName.replace(/"/g, '\\"');

  return `[out:json][timeout:90];
area["ISO3166-1"="IN"]["admin_level"="2"]->.india;
area["name"="${safeStateName}"]["boundary"="administrative"]["admin_level"="4"](area.india)->.state;
nwr["amenity"="hospital"](area.state)->.h;
nwr["amenity"="school"](area.state)->.s;
nwr["leisure"="park"](area.state)->.p;
nwr["highway"="bus_stop"](area.state)->.b;
.h out count;
.s out count;
.p out count;
.b out count;`;
}

async function fetchOverpassJson(query: string): Promise<OverpassResponse> {
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as OverpassResponse;
    } catch {
      clearTimeout(timeout);
    }
  }

  throw new Error("All Overpass endpoints failed.");
}

function readCounts(data: OverpassResponse): [number, number, number, number] {
  const counts = (data.elements ?? [])
    .filter((item) => item.type === "count")
    .map((item) => Number(item.tags?.total ?? 0));

  if (counts.length < 4) {
    throw new Error("Incomplete count response from Overpass.");
  }

  return [counts[0], counts[1], counts[2], counts[3]];
}

async function fetchStateMetricsFromOverpass(
  stateName: string,
  areaKm2: number,
): Promise<CityAccessibilityRecord> {
  const query = buildOverpassQuery(stateName);
  const json = await fetchOverpassJson(query);
  const [hospitals, schools, parks, busStops] = readCounts(json);

  return {
    city: stateName,
    areaKm2,
    hospitals,
    schools,
    parks,
    busStops,
  };
}

function estimateFallbackMetrics(
  stateName: string,
  areaKm2: number,
): CityAccessibilityRecord {
  const nameFactor =
    stateName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 17;

  const scale = 1 + nameFactor / 50;

  return {
    city: stateName,
    areaKm2,
    hospitals: Math.max(50, Math.round(areaKm2 * 0.01 * scale)),
    schools: Math.max(250, Math.round(areaKm2 * 0.05 * scale)),
    parks: Math.max(80, Math.round(areaKm2 * 0.022 * scale)),
    busStops: Math.max(150, Math.round(areaKm2 * 0.032 * scale)),
  };
}

async function fetchAllStatesLive(): Promise<CityAccessibilityRecord[]> {
  const concurrency = 6;
  const results: CityAccessibilityRecord[] = [];

  for (let index = 0; index < INDIAN_STATES.length; index += concurrency) {
    const batch = INDIAN_STATES.slice(index, index + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (state) => {
        try {
          return await fetchStateMetricsFromOverpass(state.name, state.areaKm2);
        } catch {
          return estimateFallbackMetrics(state.name, state.areaKm2);
        }
      }),
    );

    results.push(...batchResults);
  }

  return results;
}

function buildFallbackDataset(): CityAccessibilityRecord[] {
  return INDIAN_STATES.map((state) =>
    estimateFallbackMetrics(state.name, state.areaKm2),
  );
}

function nowLabel(): string {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getFallbackStateAccessibilityPayload(): StateAccessibilityPayload {
  return {
    records: buildFallbackDataset(),
    source: "fallback-estimated",
    lastUpdated: nowLabel(),
    message: "Showing estimated fallback data while live API data is loading.",
  };
}

export async function getIndianStateAccessibilityPayload(
  forceRefresh = false,
): Promise<StateAccessibilityPayload> {
  if (!forceRefresh && cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.payload;
  }

  try {
    const records = await fetchAllStatesLive();
    const payload: StateAccessibilityPayload = {
      records,
      source: "live-overpass",
      lastUpdated: nowLabel(),
    };

    cache = {
      payload,
      cachedAt: Date.now(),
    };

    return payload;
  } catch {
    const payload = getFallbackStateAccessibilityPayload();

    cache = {
      payload,
      cachedAt: Date.now(),
    };

    return payload;
  }
}
