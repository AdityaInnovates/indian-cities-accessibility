"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpDown,
  Building2,
  Bus,
  GraduationCap,
  Leaf,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  enrichCityAccessibilityData,
  getSummaryStats,
  sortCities,
} from "@/lib/accessibility";
import { IndiaBoundaryMap } from "@/components/dashboard/india-boundary-map";
import {
  type CityAccessibilityRecord,
  type EnrichedCityAccessibilityRecord,
  type MetricKey,
  type SortDirection,
  type SortableColumn,
} from "@/types/city-accessibility";

const RankingChart = dynamic(
  () =>
    import("@/components/dashboard/ranking-chart").then(
      (module) => module.RankingChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full animate-pulse rounded-xl bg-slate-800/60" />
    ),
  },
);

const MetricRadarChart = dynamic(
  () =>
    import("@/components/dashboard/metric-radar-chart").then(
      (module) => module.MetricRadarChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full animate-pulse rounded-xl bg-slate-800/60" />
    ),
  },
);

interface CityAccessibilityDashboardProps {
  cities: CityAccessibilityRecord[];
  scopeLabel?: "City" | "State";
  datasetLabel?: string;
  lastUpdated?: string;
  sourceMessage?: string;
}

const metricLabels: Record<MetricKey, string> = {
  hospitals: "Hospitals",
  schools: "Schools",
  parks: "Parks",
  busStops: "Bus Stops",
};

const metricIcons: Record<MetricKey, ReactNode> = {
  hospitals: <Building2 className="size-4" />,
  schools: <GraduationCap className="size-4" />,
  parks: <Leaf className="size-4" />,
  busStops: <Bus className="size-4" />,
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function getCoverageDataPoints(city: EnrichedCityAccessibilityRecord): number {
  return city.hospitals + city.schools + city.parks + city.busStops;
}

function getMetricRadarData(city: EnrichedCityAccessibilityRecord) {
  return [
    { metric: "Hospitals", value: city.hospitals },
    { metric: "Schools", value: city.schools },
    { metric: "Parks", value: city.parks },
    { metric: "Bus Stops", value: city.busStops },
  ];
}

export function CityAccessibilityDashboard({
  cities,
  scopeLabel = "City",
  datasetLabel = "OpenStreetMap Overpass API Snapshot",
  lastUpdated,
  sourceMessage,
}: CityAccessibilityDashboardProps) {
  const enrichedCities = useMemo(
    () => enrichCityAccessibilityData(cities),
    [cities],
  );
  const summary = useMemo(
    () => getSummaryStats(enrichedCities),
    [enrichedCities],
  );

  const [sortColumn, setSortColumn] =
    useState<SortableColumn>("accessibilityScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAllRows, setShowAllRows] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState<string>(
    enrichedCities[0]?.city ?? "",
  );

  const sortedCities = useMemo(
    () => sortCities(enrichedCities, sortColumn, sortDirection),
    [enrichedCities, sortColumn, sortDirection],
  );

  const selectedCity =
    enrichedCities.find((city) => city.city === selectedCityName) ??
    sortedCities[0] ??
    null;

  const rankingChartData = sortedCities
    .map((city) => ({ city: city.city, score: city.accessibilityScore }))
    .sort((a, b) => b.score - a.score);

  const visibleCities = showAllRows ? sortedCities : sortedCities.slice(0, 12);

  const handleSort = (column: SortableColumn) => {
    if (column === sortColumn) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("desc");
  };

  const comparisonTitle = `${scopeLabel} Comparison Table`;
  const detailTitle = `${scopeLabel} Detail View`;
  const firstColumnLabel = scopeLabel;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_15%,#2f230e_0%,#121417_45%,#0a0c0e_100%)] pb-16">
      <main className="mx-auto max-w-7xl space-y-10 px-4 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-800 bg-[#111315]/95 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_44px_rgba(0,0,0,0.38)] backdrop-blur">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">
              {scopeLabel} Accessibility Intelligence
            </h1>
            <p className="max-w-3xl text-pretty text-sm leading-6 text-slate-300 md:text-base">
              Enhancing {scopeLabel.toLowerCase()} rankings with accessibility
              insights derived from OpenStreetMap public infrastructure data.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="border border-amber-700/60 bg-amber-950/50 text-amber-200"
              >
                Dataset: {datasetLabel}
              </Badge>
              <Badge
                variant="secondary"
                className="border border-slate-700 bg-slate-900 text-slate-200"
              >
                Last updated: {lastUpdated ?? "Loading..."}
              </Badge>
            </div>
            {sourceMessage ? (
              <p className="text-xs text-slate-400">{sourceMessage}</p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="bg-slate-900 text-white">
            <CardHeader className="space-y-1">
              <CardDescription className="text-slate-300">
                Best Accessibility Score
              </CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {summary.bestAccessibilityScore.toFixed(1)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-slate-200">
              <Trophy className="size-4" /> {summary.bestCity}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Hospitals</CardDescription>
              <CardTitle>{formatNumber(summary.totalHospitals)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Schools</CardDescription>
              <CardTitle>{formatNumber(summary.totalSchools)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Parks</CardDescription>
              <CardTitle>{formatNumber(summary.totalParks)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Transit Stops</CardDescription>
              <CardTitle>{formatNumber(summary.totalTransitStops)}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>India Accessibility Boundary Map</CardTitle>
              <CardDescription>
                State border lines with hover insights. Hover a state to view
                rank and score, or click to focus its detail view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndiaBoundaryMap
                records={enrichedCities}
                selectedName={selectedCityName}
                onSelect={setSelectedCityName}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>{comparisonTitle}</CardTitle>
              <CardDescription>
                Sortable comparison across relative accessibility metrics and
                national benchmarks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              <div className="min-w-[820px] space-y-2">
                <div className="grid grid-cols-[70px_0.9fr_95px_164px_1.55fr] gap-0 rounded-md bg-black px-3.5 py-2 text-[11px] font-semibold tracking-wide text-slate-200">
                  <span>Rank</span>
                  <button
                    type="button"
                    onClick={() => handleSort("city")}
                    className="inline-flex items-center gap-1 text-left hover:text-white"
                  >
                    {firstColumnLabel}
                    {sortColumn === "city" ? (
                      <ArrowDownUp className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-50" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSort("accessibilityScore")}
                    className="inline-flex items-center gap-1 text-left hover:text-white"
                  >
                    Score
                    {sortColumn === "accessibilityScore" ? (
                      <ArrowDownUp className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-50" />
                    )}
                  </button>
                  <span>Coverage</span>
                  <span>Performance</span>
                </div>

                <div className="space-y-2">
                  {visibleCities.map((city) => {
                    const isSelected = selectedCityName === city.city;

                    return (
                      <button
                        type="button"
                        key={city.city}
                        onClick={() => setSelectedCityName(city.city)}
                        className={`grid w-full grid-cols-[70px_0.9fr_95px_164px_1.55fr] items-center gap-0 border px-3.5 py-2.5 text-left transition ${
                          isSelected
                            ? "border-amber-400 bg-[#171717]"
                            : "border-slate-800 bg-[#121212] hover:border-slate-700"
                        }`}
                      >
                        <div className="text-3xl font-bold leading-none text-amber-400">
                          #{city.rank}
                        </div>

                        <div className="self-center width-min-content">
                          <p className="text-[1.5rem] leading-tight font-semibold text-white md:text-[1rem]">
                            {city.city}
                          </p>
                        </div>

                        <div className="self-center">
                          <p className="text-[1.7rem] font-bold leading-none text-amber-400 md:text-[1.5rem]">
                            {city.accessibilityScore.toFixed(1)}
                          </p>
                          <p className="text-sm text-slate-400">/100.0</p>
                        </div>

                        <div className="self-center space-y-0.5 text-[1.02rem] text-slate-300 md:text-[0.98rem]">
                          <p>
                            Data pts:{" "}
                            <span className="font-semibold text-white">
                              {formatNumber(getCoverageDataPoints(city))}
                            </span>
                          </p>
                          <p>
                            Area:{" "}
                            <span className="font-semibold text-white">
                              {formatNumber(city.areaKm2)}
                            </span>
                          </p>
                        </div>

                        <div className="self-center">
                          <div className="grid grid-cols-3 gap-1 w-[11rem]">
                            <span className="rounded border flex flex-col border-amber-700/70 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              <span>Hosp </span>
                              {city.percentileByMetric.hospitals.toFixed(1)}
                            </span>
                            <span className="rounded border flex flex-col border-amber-700/70 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              <span>Sch </span>
                              {city.percentileByMetric.schools.toFixed(1)}
                            </span>
                            <span className="rounded border flex flex-col border-amber-700/70 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              <span>Park </span>
                              {city.percentileByMetric.parks.toFixed(1)}
                            </span>
                            <span className="rounded border flex flex-col border-amber-700/70 bg-amber-950/35 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              <span>Bus </span>
                              {city.percentileByMetric.busStops.toFixed(1)}
                            </span>
                            <span className="rounded border flex flex-col border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200">
                              <span>NatP </span>
                              {city.nationalPercentile.toFixed(1)}
                            </span>
                            <span
                              className={`rounded border flex flex-col px-1.5 py-0.5 text-[10px] font-semibold ${
                                city.gapVsMedianPct >= 0
                                  ? "border-emerald-700/70 bg-emerald-950/35 text-emerald-200"
                                  : "border-rose-700/70 bg-rose-950/35 text-rose-200"
                              }`}
                            >
                              <span>Gap </span>
                              {formatSignedPercent(city.gapVsMedianPct)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {sortedCities.length > 12 ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRows((previous) => !previous)}
                    className="rounded-md border border-slate-700 bg-[#13171b] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-[#1b2026]"
                  >
                    {showAllRows
                      ? `Show top 12 ${scopeLabel.toLowerCase()}s`
                      : `Show all ${sortedCities.length} ${scopeLabel.toLowerCase()}s`}
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Ranking Chart</CardTitle>
              <CardDescription>
                {scopeLabel}s ranked by normalized accessibility score.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              <RankingChart data={rankingChartData} />
            </CardContent>
          </Card>
        </section>

        {selectedCity ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {detailTitle}: {selectedCity.city}
                </CardTitle>
                <CardDescription>
                  Selected {scopeLabel.toLowerCase()} performance with weighted
                  score composition.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-amber-700/50 bg-amber-950/25 p-5">
                  <p className="text-sm font-medium text-amber-200">
                    Accessibility Score
                  </p>
                  <p className="mt-1 text-4xl font-bold text-amber-300">
                    {selectedCity.accessibilityScore.toFixed(1)}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    Rank #{selectedCity.rank} | National Percentile{" "}
                    {selectedCity.nationalPercentile.toFixed(1)}th | Gap vs
                    Median {formatSignedPercent(selectedCity.gapVsMedianPct)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(metricLabels) as MetricKey[]).map((metric) => (
                    <div
                      key={metric}
                      className="rounded-xl border border-slate-800 bg-[#121518] p-3"
                    >
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        {metricIcons[metric]} {metricLabels[metric]}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-100">
                        {formatNumber(selectedCity[metric])}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Contribution{" "}
                        {formatPercent(selectedCity.contributions[metric])} |
                        Density {selectedCity.metricDensity[metric].toFixed(2)}{" "}
                        / 1000 km2 | Percentile{" "}
                        {selectedCity.percentileByMetric[metric].toFixed(1)}th
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metric Profile (Radar)</CardTitle>
                <CardDescription>
                  Small radar view of core service counts for the selected{" "}
                  {scopeLabel.toLowerCase()}.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[360px]">
                <MetricRadarChart
                  city={selectedCity.city}
                  data={getMetricRadarData(selectedCity)}
                />
              </CardContent>
            </Card>
          </section>
        ) : null}

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Methodology</CardTitle>
              <CardDescription>
                Complete methodology for data collection, transformation,
                relative scoring, and benchmark interpretation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-6 text-slate-300">
              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  1) Objective and Unit of Analysis
                </h4>
                <p>
                  This system compares Indian {scopeLabel.toLowerCase()}s on
                  accessibility to essential public services using OpenStreetMap
                  entities. The design focuses on relative benchmarking instead
                  of raw absolute counts so that large and small geographies can
                  be compared fairly.
                </p>
                <p>
                  Core service dimensions: hospitals, schools, parks, and bus
                  stops.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  2) Data Collection Pipeline
                </h4>
                <p>
                  Live counts are fetched from Overpass endpoints for each state
                  administrative boundary and tags: amenity=hospital,
                  amenity=school, leisure=park, highway=bus_stop.
                </p>
                <p>
                  Reliability controls: endpoint failover, timeout protection,
                  batched concurrency, and in-memory caching (12-hour TTL). If
                  live requests fail, deterministic fallback estimates are used
                  to avoid empty records.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  3) Raw Weighted Score (Diagnostic)
                </h4>
                <p>
                  Weighted raw score is retained for decomposition and
                  contribution analysis:
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  rawScore = (hospitals * 4) + (schools * 2) + (parks * 1) +
                  (busStops * 1)
                </p>
                <p>Raw density diagnostic:</p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  densityScore = rawScore / areaKm2
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  4) Metric Density Engineering
                </h4>
                <p>
                  To remove size bias, each metric is converted to intensity per
                  1000 km2:
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  metricDensity(k) = (count(k) / areaKm2) * 1000
                </p>
                <p>
                  This means two regions are compared on infrastructure
                  concentration, not landmass alone.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  5) Relative Normalization via Percentiles
                </h4>
                <p>
                  Each metric density is transformed into a tie-aware percentile
                  rank against all states:
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  percentile = ((L + 0.5 * E) / N) * 100
                </p>
                <p>
                  where L = number of states with lower value, E = number with
                  equal value, N = total states.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  6) Composite Accessibility Score
                </h4>
                <p>Percentile scores are aggregated with policy weights:</p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  accessibilityScore = (4*P_hospitals + 2*P_schools + 1*P_parks
                  + 1*P_busStops) / 8
                </p>
                <p>
                  This score is relative by design. It indicates benchmark
                  position against peers in the same snapshot, not an absolute
                  infrastructure adequacy threshold.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  7) Benchmark Insight Metrics
                </h4>
                <p>
                  Two additional metrics convert the score into decision-ready
                  insights:
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  nationalPercentile = percentile(accessibilityScore across all
                  states)
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  gapVsMedianPct = ((accessibilityScore - medianScore) /
                  medianScore) * 100
                </p>
                <p>
                  A positive median gap indicates above-median performance; a
                  negative value indicates lagging benchmark position.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-[#121518] p-4">
                <h4 className="text-sm font-semibold text-slate-100">
                  8) Contribution Interpretation
                </h4>
                <p>
                  Contributions displayed in detail cards are based on weighted
                  raw components:
                </p>
                <p className="rounded-md border border-slate-700 bg-[#0f1215] px-3 py-2 font-mono text-xs text-slate-200">
                  contribution(k) = weightedMetric(k) / rawScore * 100
                </p>
                <p>
                  This explains composition of weighted raw score, while
                  percentile metrics explain relative benchmark position.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-amber-700/60 bg-amber-950/25 p-4 text-amber-100">
                <h4 className="text-sm font-semibold">
                  9) Known Limitations and Practical Notes
                </h4>
                <p>
                  OSM coverage can vary by region, and fallback-estimated
                  records may be used when live requests fail. Rankings are
                  therefore best interpreted as snapshot-based comparative
                  signals, not final ground-truth service audits.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
