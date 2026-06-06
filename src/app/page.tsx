import cityAccessibilityData from "@/data/city-accessibility.json";
import { CityAccessibilityDashboard } from "@/components/dashboard/city-accessibility-dashboard";
import type { CityAccessibilityRecord } from "@/types/city-accessibility";

export default function Home() {
  return (
    <CityAccessibilityDashboard
      cities={cityAccessibilityData as CityAccessibilityRecord[]}
    />
  );
}
