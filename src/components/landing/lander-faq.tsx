"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function LanderFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: "1px solid oklch(1 0 0 / 10%)",
              background: "oklch(1 0 0 / 3%)",
              backdropFilter: "blur(8px)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "16px 20px",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--lfg)", lineHeight: 1.4 }}>
                {item.q}
              </span>
              <ChevronDown
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  color: "var(--lmuted)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                opacity: isOpen ? 1 : 0,
                transition: "grid-template-rows 0.3s ease, opacity 0.3s ease",
              }}
            >
              <div style={{ minHeight: 0 }}>
                <p style={{ padding: "0 20px 16px", fontSize: 13.5, lineHeight: 1.6, color: "var(--lmuted)" }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
