import { NextResponse } from "next/server";

import { getIndianStateAccessibilityPayload } from "@/lib/state-accessibility-source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const payload = await getIndianStateAccessibilityPayload(forceRefresh);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
