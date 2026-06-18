import { NextResponse } from "next/server";

const DATA_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

let cachedData: unknown = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  if (cachedData && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  try {
    const res = await fetch(DATA_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const data = await res.json();
    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching World Cup data:", error);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    return NextResponse.json(
      { error: "Failed to fetch World Cup data" },
      { status: 500 }
    );
  }
}
