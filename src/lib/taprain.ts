// TapRain API client
// Default credentials (Valentin). Multi-tenant: pass apiKey per call.
const DEFAULT_API_KEY = "21f1b1200d6ebc03ac422018d31d2881";
const BASE = "https://taprain.com/api";

export type StatsRange = "hour" | "today" | "yesterday" | "7days" | "30days";

export type StatsSummary = {
  revenue: number;
  conversions?: number;
  clicks?: number;
  epc?: number;
  [key: string]: number | undefined;
};

export type StatsRow = Record<string, string | number | null>;

export type StatsData = {
  summary: StatsSummary;
  rows?: StatsRow[];
};

export async function fetchStats(
  range: StatsRange = "today",
  apiKey = DEFAULT_API_KEY,
): Promise<StatsData> {
  const url = new URL(`${BASE}/v1/stats`);
  url.searchParams.set("range", range);

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`TapRain stats ${res.status}`);

  const json = (await res.json()) as { data: StatsData };
  return json.data;
}
