import { StateAccessibilityContainer } from "@/components/dashboard/state-accessibility-container";
import { getFallbackStateAccessibilityPayload } from "@/lib/state-accessibility-source";

export default async function Home() {
  const initialPayload = getFallbackStateAccessibilityPayload();

  return <StateAccessibilityContainer initialPayload={initialPayload} />;
}
