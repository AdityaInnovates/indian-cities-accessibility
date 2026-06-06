"use client";

import { useMemo, useState } from "react";
import india from "@svg-maps/india";

import type { EnrichedCityAccessibilityRecord } from "@/types/city-accessibility";

interface HoverState {
  x: number;
  y: number;
  mapName: string;
  record?: EnrichedCityAccessibilityRecord;
}

interface IndiaBoundaryMapProps {
  records: EnrichedCityAccessibilityRecord[];
  selectedName?: string;
  onSelect: (name: string) => void;
}

interface IndiaMapLocation {
  id: string;
  name: string;
  path: string;
}

interface ColorBand {
  min: number;
  label: string;
  color: string;
}

const NAME_ALIASES: Record<string, string> = {
  nctofdelhi: "delhi",
  orissa: "odisha",
  uttaranchal: "uttarakhand",
};

const COLOR_BANDS: ColorBand[] = [
  { min: 80, label: "80-100", color: "#f59e0b" },
  { min: 60, label: "60-79", color: "#d97706" },
  { min: 40, label: "40-59", color: "#b45309" },
  { min: 20, label: "20-39", color: "#92400e" },
  { min: 0, label: "0-19", color: "#78350f" },
];

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function toLookupKey(value: string): string {
  const normalized = normalizeName(value);
  return NAME_ALIASES[normalized] ?? normalized;
}

function getFillColor(score: number): string {
  const match = COLOR_BANDS.find((band) => score >= band.min);
  return match ? match.color : "#1f2937";
}

export function IndiaBoundaryMap({
  records,
  selectedName,
  onSelect,
}: IndiaBoundaryMapProps) {
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const recordLookup = useMemo(() => {
    const lookup = new Map<string, EnrichedCityAccessibilityRecord>();

    for (const record of records) {
      lookup.set(toLookupKey(record.city), record);
    }

    return lookup;
  }, [records]);

  const selectedKey = selectedName ? toLookupKey(selectedName) : "";

  return (
    <div className="relative w-full">
      <svg
        viewBox={india.viewBox}
        className="h-auto w-full rounded-xl border border-slate-700 bg-[#0f1114]"
        role="img"
        aria-label="India state boundary map"
      >
        <g>
          {(india.locations as IndiaMapLocation[]).map((location) => {
            const record = recordLookup.get(toLookupKey(location.name));
            const isSelectable = Boolean(record);
            const isSelected =
              record && selectedKey === toLookupKey(record.city);
            const baseFill = record
              ? getFillColor(record.accessibilityScore)
              : "#111827";
            const hoverFill = record ? "#fbbf24" : "#111827";

            return (
              <path
                key={location.id}
                d={location.path}
                fill={isSelected ? "#facc15" : baseFill}
                stroke={record ? "#f59e0b" : "#475569"}
                strokeWidth={isSelected ? 1.2 : 0.8}
                style={{
                  transition: "fill 160ms ease, stroke 160ms ease",
                }}
                className={
                  isSelectable ? "cursor-pointer" : "pointer-events-none"
                }
                onMouseMove={(event) => {
                  setHovered({
                    x: event.clientX,
                    y: event.clientY,
                    mapName: location.name,
                    record,
                  });
                }}
                onMouseEnter={(event) => {
                  setHovered({
                    x: event.clientX,
                    y: event.clientY,
                    mapName: location.name,
                    record,
                  });
                }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  if (record) {
                    onSelect(record.city);
                  }
                }}
                onMouseOver={(event) => {
                  if (isSelected) {
                    return;
                  }

                  event.currentTarget.setAttribute("fill", hoverFill);
                }}
                onMouseOut={(event) => {
                  event.currentTarget.setAttribute(
                    "fill",
                    isSelected ? "#facc15" : baseFill,
                  );
                }}
              />
            );
          })}
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <span className="font-semibold text-slate-200">
          Accessibility Score
        </span>
        {COLOR_BANDS.map((band) => (
          <span key={band.label} className="inline-flex items-center gap-1.5">
            <span
              className="size-3 rounded-sm border border-slate-600"
              style={{ backgroundColor: band.color }}
            />
            {band.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-slate-600 bg-slate-900" />
          No record
        </span>
      </div>

      {hovered ? (
        <div
          className="pointer-events-none fixed z-50 min-w-44 rounded-lg border border-slate-700 bg-[#121518] px-3 py-2 text-xs shadow-lg"
          style={{ left: hovered.x + 12, top: hovered.y + 12 }}
        >
          <p className="font-semibold text-slate-100">{hovered.mapName}</p>
          {hovered.record ? (
            <>
              <p className="text-slate-300">Rank #{hovered.record.rank}</p>
              <p className="text-slate-300">
                Score {hovered.record.accessibilityScore.toFixed(1)}
              </p>
            </>
          ) : (
            <p className="text-slate-400">No dataset record</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
