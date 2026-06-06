# Submission Notes

## 1) Prototype Link

- Local preview: http://localhost:3000
- Deployed link: replace with the final public URL before submission

## 2) Public Dataset Used

- OpenStreetMap public place data, accessed through the Overpass API
- Coverage used in the prototype: hospitals, schools, parks, and bus stops across Indian states

## 3) 50-Word Note on Why I Selected This Data

I chose OpenStreetMap because it is public, frequently updated, and works well for state-level comparison without depending on restricted government files. It helps show how accessible a state is through everyday services like hospitals, schools, parks, and bus stops, which is useful for both citizens and policy teams overall today.

## 4) How the Data Was Cleaned and Structured

- Pulled live counts from Overpass API for each state boundary.
- Standardized state names so map, chart, and table data stay in sync.
- Added fallback values when live requests fail so the dashboard always loads.
- Converted raw counts into per-area density, percentile ranks, and a final accessibility score.
- Stored the result in a dashboard-friendly format with rank, score, coverage, and benchmark fields.

## Short Product Summary

This prototype turns raw public map data into a simple state comparison dashboard. It helps users see which states are better served, where gaps exist, and how each state performs relative to others in the same snapshot.
