// TapRain API client
// Default credentials read from env. Multi-tenant: pass apiKey per call.
const DEFAULT_API_KEY = process.env.TAPRAIN_API_KEY ?? "";
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

export type Offer = {
  id: string;
  name: string;
  description?: string;
  conversion?: string;
  payout: number | null;
  currency: string;
  payout_type: string;
  image_url: string | null;
  tracking_url: string;
  countries: string[];
  devices: string[];
  daily_cap: number | null;
  is_private: boolean;
  source: string;
};

export type OffersResponse = {
  success: boolean;
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
  offers: Offer[];
};

export type OffersParams = {
  search?: string;
  countries?: string;
  devices?: string;
  type?: string;
  limit?: number;
  offset?: number;
  domain?: string;
  include_api_offers?: string;
};

export async function fetchOffers(
  params: OffersParams = {},
  apiKey = DEFAULT_API_KEY,
): Promise<OffersResponse> {
  const url = new URL(`${BASE}/offers/developer/offers`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TapRain offers ${res.status}`);
  return res.json() as Promise<OffersResponse>;
}

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
