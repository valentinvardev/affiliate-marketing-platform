"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { OfferConfigRow } from "./offer-config-row";
import type { Offer } from "@/lib/taprain";

type Config = { offerId: string; whitelisted: boolean; imageUrl: string | null; appStackId: string | null; colorPresetId: string | null; logoPresetId: string | null; domain: string | null; fontTitle: string | null; fontBody: string | null; appIds: string[] };

export function AdminOffersTab({
  offers,
  configs,
  whitelistedCount,
}: {
  offers: Offer[];
  configs: Config[];
  whitelistedCount: number;
}) {
  const [query, setQuery]         = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const filtered = useMemo(() => {
    let list = offers;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((o) => o.name.toLowerCase().includes(q));
    }
    if (onlyActive) {
      const activeIds = new Set(configs.filter((c) => c.whitelisted).map((c) => c.offerId));
      list = list.filter((o) => activeIds.has(o.id));
    }
    return list;
  }, [offers, configs, query, onlyActive]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "var(--color-surface-overlay)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar offer…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-foreground)" }}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              <X className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOnlyActive((v) => !v)}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{
            background:   onlyActive ? "rgba(167,139,250,0.15)" : "var(--color-surface-overlay)",
            border:       `1px solid ${onlyActive ? "rgba(167,139,250,0.3)" : "var(--color-border)"}`,
            color:        onlyActive ? "#a78bfa"                 : "var(--color-muted-foreground)",
          }}
        >
          Solo activas ({whitelistedCount})
        </button>
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
        {filtered.length} {filtered.length === 1 ? "offer" : "offers"}{query ? ` para "${query}"` : ""}
      </p>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Sin resultados.
          </p>
        ) : (
          filtered.map((offer) => (
            <OfferConfigRow
              key={offer.id}
              offer={offer}
              config={configs.find((c) => c.offerId === offer.id) ?? null}
            />
          ))
        )}
      </div>
    </div>
  );
}
