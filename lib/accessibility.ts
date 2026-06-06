import {
  type AccessibilitySummaryStats,
  type CityAccessibilityRecord,
  type EnrichedCityAccessibilityRecord,
  type MetricKey,
  type SortDirection,
  type SortableColumn,
} from "@/types/city-accessibility";

const METRIC_WEIGHTS: Record<MetricKey, number> = {
  hospitals: 4,
  schools: 2,
  parks: 1,
  busStops: 1,
};

const METRIC_KEYS: MetricKey[] = ["hospitals", "schools", "parks", "busStops"];

const WEIGHT_SUM = Object.values(METRIC_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

export function calculateRawScore(city: CityAccessibilityRecord): number {
  return (
    city.hospitals * METRIC_WEIGHTS.hospitals +
    city.schools * METRIC_WEIGHTS.schools +
    city.parks * METRIC_WEIGHTS.parks +
    city.busStops * METRIC_WEIGHTS.busStops
  );
}

export function calculateDensityScore(city: CityAccessibilityRecord): number {
  if (city.areaKm2 <= 0) {
    return 0;
  }

  return calculateRawScore(city) / city.areaKm2;
}

function calculateMetricDensity(
  city: CityAccessibilityRecord,
): Record<MetricKey, number> {
  if (city.areaKm2 <= 0) {
    return {
      hospitals: 0,
      schools: 0,
      parks: 0,
      busStops: 0,
    };
  }

  return {
    hospitals: (city.hospitals / city.areaKm2) * 1000,
    schools: (city.schools / city.areaKm2) * 1000,
    parks: (city.parks / city.areaKm2) * 1000,
    busStops: (city.busStops / city.areaKm2) * 1000,
  };
}

function calculatePercentileRank(value: number, values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const lessCount = values.filter((candidate) => candidate < value).length;
  const equalCount = values.filter((candidate) => candidate === value).length;

  return ((lessCount + 0.5 * equalCount) / values.length) * 100;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function getMetricContributions(
  city: CityAccessibilityRecord,
): Record<MetricKey, number> {
  const weightedValues: Record<MetricKey, number> = {
    hospitals: city.hospitals * METRIC_WEIGHTS.hospitals,
    schools: city.schools * METRIC_WEIGHTS.schools,
    parks: city.parks * METRIC_WEIGHTS.parks,
    busStops: city.busStops * METRIC_WEIGHTS.busStops,
  };

  const rawScore = calculateRawScore(city);

  return {
    hospitals: (weightedValues.hospitals / rawScore) * 100,
    schools: (weightedValues.schools / rawScore) * 100,
    parks: (weightedValues.parks / rawScore) * 100,
    busStops: (weightedValues.busStops / rawScore) * 100,
  };
}

export function enrichCityAccessibilityData(
  cities: CityAccessibilityRecord[],
): EnrichedCityAccessibilityRecord[] {
  const densityScores = cities.map(calculateDensityScore);
  const densityByCity = cities.map(calculateMetricDensity);

  const densityValuesByMetric: Record<MetricKey, number[]> = {
    hospitals: densityByCity.map((record) => record.hospitals),
    schools: densityByCity.map((record) => record.schools),
    parks: densityByCity.map((record) => record.parks),
    busStops: densityByCity.map((record) => record.busStops),
  };

  const percentileByCity = densityByCity.map((metricDensity) => {
    return {
      hospitals: calculatePercentileRank(
        metricDensity.hospitals,
        densityValuesByMetric.hospitals,
      ),
      schools: calculatePercentileRank(
        metricDensity.schools,
        densityValuesByMetric.schools,
      ),
      parks: calculatePercentileRank(
        metricDensity.parks,
        densityValuesByMetric.parks,
      ),
      busStops: calculatePercentileRank(
        metricDensity.busStops,
        densityValuesByMetric.busStops,
      ),
    };
  });

  const compositeScores = percentileByCity.map((metricPercentiles) => {
    const weightedTotal = METRIC_KEYS.reduce((sum, key) => {
      return sum + metricPercentiles[key] * METRIC_WEIGHTS[key];
    }, 0);

    return weightedTotal / WEIGHT_SUM;
  });

  const compositeMedian = calculateMedian(compositeScores);
  const nationalPercentiles = compositeScores.map((score) =>
    calculatePercentileRank(score, compositeScores),
  );

  const enriched = cities.map((city, index) => {
    const compositeScore = Number(compositeScores[index].toFixed(1));
    const medianGap =
      compositeMedian === 0
        ? 0
        : Number(
            (
              ((compositeScores[index] - compositeMedian) / compositeMedian) *
              100
            ).toFixed(1),
          );

    return {
      ...city,
      rawScore: calculateRawScore(city),
      densityScore: densityScores[index],
      metricDensity: METRIC_KEYS.reduce(
        (accumulator, key) => {
          accumulator[key] = Number(densityByCity[index][key].toFixed(3));
          return accumulator;
        },
        {} as Record<MetricKey, number>,
      ),
      percentileByMetric: METRIC_KEYS.reduce(
        (accumulator, key) => {
          accumulator[key] = Number(percentileByCity[index][key].toFixed(1));
          return accumulator;
        },
        {} as Record<MetricKey, number>,
      ),
      accessibilityScore: compositeScore,
      nationalPercentile: Number(nationalPercentiles[index].toFixed(1)),
      gapVsMedianPct: medianGap,
      contributions: getMetricContributions(city),
      rank: 0,
    };
  });

  return enriched
    .sort((a, b) => b.accessibilityScore - a.accessibilityScore)
    .map((city, index) => ({ ...city, rank: index + 1 }));
}

export function getSummaryStats(
  cities: EnrichedCityAccessibilityRecord[],
): AccessibilitySummaryStats {
  const bestCity = cities[0];

  return {
    bestAccessibilityScore: bestCity.accessibilityScore,
    bestCity: bestCity.city,
    totalHospitals: cities.reduce((sum, city) => sum + city.hospitals, 0),
    totalSchools: cities.reduce((sum, city) => sum + city.schools, 0),
    totalParks: cities.reduce((sum, city) => sum + city.parks, 0),
    totalTransitStops: cities.reduce((sum, city) => sum + city.busStops, 0),
  };
}

export function sortCities(
  cities: EnrichedCityAccessibilityRecord[],
  column: SortableColumn,
  direction: SortDirection,
): EnrichedCityAccessibilityRecord[] {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...cities].sort((a, b) => {
    if (column === "city") {
      return a.city.localeCompare(b.city) * multiplier;
    }

    return (a[column] - b[column]) * multiplier;
  });
}

export function getLastUpdatedDate(): string {
  return "06 Jun 2026";
}
