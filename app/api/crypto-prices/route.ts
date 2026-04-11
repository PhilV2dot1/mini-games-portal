import { NextResponse } from "next/server";

export const runtime = "edge";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3/simple/price";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ error: "ids param required" }, { status: 400 });
  }

  const url = `${COINGECKO_BASE}?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_market_cap=true`;

  let data: unknown;
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error", status: res.status }, { status: 502 });
    }

    data = await res.json();
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 503 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
