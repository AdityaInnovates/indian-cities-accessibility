# City Accessibility Intelligence - Complete Methodology

## 1. Objective

This system compares Indian states on accessibility to essential public services using OpenStreetMap (OSM) features and converts the data into relative, benchmark-friendly insights.

Primary goals:

- avoid raw-count bias across large vs small geographies
- provide interpretable relative performance (percentiles, gap vs median)
- retain policy priority weighting (health and education weighted higher)

---

## 2. Spatial Scope and Units

- Unit of analysis: State-level (India)
- Geography source for areas: curated area list in `data/indian-states.ts`
- Service metrics per state:
  - hospitals
  - schools
  - parks
  - bus stops

All scores are computed at state level for a single snapshot timestamp.

---

## 3. Data Sources

### 3.1 Live Data Source

Live counts are fetched from Overpass API using OSM tags.

Endpoints used:

- `https://overpass-api.de/api/interpreter`
- `https://overpass.kumi.systems/api/interpreter`

Query logic per state:

- locate India admin boundary (`ISO3166-1=IN`, `admin_level=2`)
- locate state boundary (`boundary=administrative`, `admin_level=4`, `name=<state>`)
- count features inside the state area:
  - `amenity=hospital`
  - `amenity=school`
  - `leisure=park`
  - `highway=bus_stop`

Implementation reference: `lib/state-accessibility-source.ts`

### 3.2 Fallback Source

If a live fetch fails, deterministic estimated values are generated using area and a stable name-derived factor. This ensures every state always has a record.

Fallback formulas:

- `hospitals = max(50, round(areaKm2 * 0.01 * scale))`
- `schools = max(250, round(areaKm2 * 0.05 * scale))`
- `parks = max(80, round(areaKm2 * 0.022 * scale))`
- `busStops = max(150, round(areaKm2 * 0.032 * scale))`

where:

- `nameFactor = sum(charCode(stateName chars)) mod 17`
- `scale = 1 + nameFactor / 50`

Implementation reference: `lib/state-accessibility-source.ts`

---

## 4. Ingestion and Reliability Pipeline

### 4.1 Request Strategy

- concurrency batches: 6 states per batch
- per endpoint timeout: 10 seconds
- endpoint failover: try first endpoint, then second

### 4.2 Caching

- in-memory cache TTL: 12 hours
- cache key behavior: single snapshot payload
- optional force refresh supported by API route query param

### 4.3 API Layer

- route: `app/api/state-accessibility/route.ts`
- response includes:
  - `records`
  - `source` (`live-overpass` or `fallback-estimated`)
  - `lastUpdated`
  - optional `message`

### 4.4 Frontend Hydration Behavior

- initial render uses fallback payload for immediate UX
- client then fetches live API payload and replaces data when available

---

## 5. Feature Engineering

Let each state be indexed by `s` and each metric by `k`.

Metrics:

- `k in {hospitals, schools, parks, busStops}`

### 5.1 Raw Weighted Score (legacy-compatible diagnostic)

Used for contribution diagnostics and densityScore display:

`rawScore_s = 4*hospitals_s + 2*schools_s + 1*parks_s + 1*busStops_s`

Implementation: `calculateRawScore` in `lib/accessibility.ts`

### 5.2 Raw Density Score (legacy-compatible diagnostic)

`densityScore_s = rawScore_s / areaKm2_s`

Implementation: `calculateDensityScore` in `lib/accessibility.ts`

### 5.3 Metric Density (core relative input)

For each metric, convert count to intensity per 1000 km2:

`density_{k,s} = (count_{k,s} / areaKm2_s) * 1000`

This is the first major anti-bias step. A larger state must have proportionately larger infrastructure counts to maintain equal density.

Implementation: `calculateMetricDensity` in `lib/accessibility.ts`

---

## 6. Relative Normalization

### 6.1 Percentile Rank per Metric

For each metric `k`, compute percentile rank of state `s` against all states.

Tie-aware formula used in code:

`percentile_{k,s} = ((L + 0.5*E) / N) * 100`

where:

- `L` = number of states with strictly smaller density
- `E` = number of states with equal density
- `N` = total states in snapshot

This produces values in `[0, 100]` and is more robust than min-max against extreme outliers.

Implementation: `calculatePercentileRank` in `lib/accessibility.ts`

---

## 7. Composite Accessibility Score

Weights:

- hospitals: 4
- schools: 2
- parks: 1
- busStops: 1
- total weight = 8

Composite formula:

`accessibilityScore_s = (4*P_hospitals + 2*P_schools + 1*P_parks + 1*P_busStops) / 8`

where each `P_*` is the percentile rank for that metric.

Interpretation:

- score is relative, not absolute
- a score of 80 means weighted percentile strength is high relative to peers in the same snapshot

Implementation: `enrichCityAccessibilityData` in `lib/accessibility.ts`

---

## 8. Benchmark Insight Metrics

### 8.1 National Percentile of Composite

The composite score itself is percentile-ranked again against all states:

`nationalPercentile_s = percentile(accessibilityScore_s over all states)`

Implementation: `enrichCityAccessibilityData` in `lib/accessibility.ts`

### 8.2 Gap vs National Median

Let `M` be median of all composite scores.

`gapVsMedianPct_s = ((accessibilityScore_s - M) / M) * 100`

Interpretation:

- positive: above median
- negative: below median

Implementation: `enrichCityAccessibilityData` in `lib/accessibility.ts`

---

## 9. Metric Contribution Breakdown

Contribution percentages are derived from weighted raw components:

`weightedHospitals_s = 4*hospitals_s`
`weightedSchools_s = 2*schools_s`
`weightedParks_s = 1*parks_s`
`weightedBusStops_s = 1*busStops_s`

`contribution_{k,s} = weighted_{k,s} / rawScore_s * 100`

This explains composition of raw weighted score, not percentile score.

Implementation: `getMetricContributions` in `lib/accessibility.ts`

---

## 10. Ranking and Sorting

Final ranking shown in UI is descending by `accessibilityScore`.

`rank = 1` means highest composite score in current snapshot.

Table supports sorting by:

- state name
- accessibility score
- national percentile
- gap vs median
- each raw metric count
- area

Implementation: `sortCities` in `lib/accessibility.ts`

---

## 11. End-to-End Calculation Walkthrough (template)

For any state `S`:

1. Retrieve counts from Overpass (or fallback if needed):

- `H, Sc, P, B`

2. Compute weighted raw score:

- `raw = 4H + 2Sc + P + B`

3. Compute diagnostic raw density:

- `rawDensity = raw / areaKm2`

4. Compute metric densities:

- `H_d = H / areaKm2 * 1000`
- `Sc_d = Sc / areaKm2 * 1000`
- `P_d = P / areaKm2 * 1000`
- `B_d = B / areaKm2 * 1000`

5. Convert each metric density to percentile rank vs all states:

- `P_H, P_Sc, P_P, P_B`

6. Compute weighted percentile composite:

- `score = (4*P_H + 2*P_Sc + P_P + P_B) / 8`

7. Compute national percentile of composite and gap vs median:

- `nationalPercentile`
- `gapVsMedianPct`

8. Assign rank by sorting all states on `score` descending.

---

## 12. Why This Methodology Is Better Than Absolute Counts

- normalizes for geography size using per-1000-km2 densities
- uses percentile ranking for robust peer-relative benchmarking
- keeps policy intent through explicit metric weights
- provides interpretable decision signals (percentile and median gap)
- remains resilient under API instability via fallback + cache

---

## 13. Known Limitations

- OSM completeness varies by state and by feature type.
- Some states may use fallback estimates in partial failure scenarios.
- Current source field is payload-level; mixed per-state provenance is not yet surfaced.
- No temporal trend model yet (single snapshot scoring).

---

## 14. Recommended Next Improvements

1. Add per-state provenance flag (`live` vs `fallback`) in response payload.
2. Add confidence score based on live/fallback ratio and query success history.
3. Persist historical snapshots and compute trend deltas.
4. Add population-normalized companion metrics where population data is available.
5. Include Union Territories for complete national administrative coverage.

---

## 15. Implementation References

- Scoring and ranking logic: `lib/accessibility.ts`
- Data retrieval and fallback logic: `lib/state-accessibility-source.ts`
- State areas baseline: `data/indian-states.ts`
- Types: `types/city-accessibility.ts`
- API route: `app/api/state-accessibility/route.ts`
- Dashboard presentation: `components/dashboard/city-accessibility-dashboard.tsx`
