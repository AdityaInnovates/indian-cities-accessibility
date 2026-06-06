"use client";

import { useEffect, useState } from "react";

import { CityAccessibilityDashboard } from "@/components/dashboard/city-accessibility-dashboard";
import type { StateAccessibilityPayload } from "@/lib/state-accessibility-source";

interface StateAccessibilityContainerProps {
  initialPayload: StateAccessibilityPayload;
}

export function StateAccessibilityContainer({
  initialPayload,
}: StateAccessibilityContainerProps) {
  const [payload, setPayload] =
    useState<StateAccessibilityPayload>(initialPayload);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      try {
        const response = await fetch("/api/state-accessibility", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const livePayload =
          (await response.json()) as StateAccessibilityPayload;

        if (!cancelled) {
          setPayload(livePayload);
        }
      } catch {
        // Keep initial payload if live fetch fails.
      }
    }

    loadLiveData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CityAccessibilityDashboard
      cities={payload.records}
      scopeLabel="State"
      datasetLabel={
        payload.source === "live-overpass"
          ? "OpenStreetMap Overpass API (Live)"
          : "OpenStreetMap-based Estimated Snapshot"
      }
      lastUpdated={payload.lastUpdated}
      sourceMessage={payload.message}
    />
  );
}
