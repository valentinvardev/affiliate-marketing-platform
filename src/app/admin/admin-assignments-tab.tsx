"use client";

import { api } from "@/trpc/react";
import { Loader2, CreditCard, LayoutGrid } from "lucide-react";

type UserOpt = { id: string; username: string; role: string };

export function AdminAssignmentsTab() {
  const utils = api.useUtils();
  const usersQ = api.admin.users.useQuery();
  const cardsQ = api.cards.list.useQuery();
  const campsQ = api.campaign.list.useQuery();

  const assignCard = api.admin.assignCard.useMutation({
    onSuccess: () => void utils.cards.list.invalidate(),
  });
  const assignCampaign = api.admin.assignCampaign.useMutation({
    onSuccess: () => void utils.campaign.list.invalidate(),
  });

  const users = usersQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* ── Tarjetas ── */}
      <Section title="Tarjetas → usuario" icon={CreditCard} count={cardsQ.data?.cards.length}>
        {cardsQ.isLoading ? (
          <Spinner />
        ) : !cardsQ.data?.connected ? (
          <Note>Conectá la sesión de TapRain en <a href="/cards" className="underline">Tarjetas</a> para listar las VCCs.</Note>
        ) : cardsQ.data.cards.length === 0 ? (
          <Empty>Sin tarjetas.</Empty>
        ) : (
          <div className="space-y-2">
            {cardsQ.data.cards.map((c) => (
              <AssignRow
                key={c.id}
                label={c.cardName ?? c.id}
                sub={`•••• ${c.last4 ?? "????"} · ${c.status ?? "—"}`}
                value={c.ownerUserId ?? ""}
                users={users}
                pending={assignCard.isPending}
                onChange={(uid) => assignCard.mutate({ vccId: c.id, cardName: c.cardName, userId: uid || null })}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Campañas (subid) ── */}
      <Section title="Campañas (subid = slug) → usuario" icon={LayoutGrid} count={campsQ.data?.length}>
        {campsQ.isLoading ? (
          <Spinner />
        ) : (campsQ.data ?? []).length === 0 ? (
          <Empty>Sin campañas.</Empty>
        ) : (
          <div className="space-y-2">
            {(campsQ.data ?? []).map((c) => (
              <AssignRow
                key={c.id}
                label={c.name}
                sub={`s1=${c.slug}`}
                value={c.ownerId ?? ""}
                users={users}
                pending={assignCampaign.isPending}
                onChange={(uid) => assignCampaign.mutate({ campaignId: c.id, ownerId: uid || null })}
                dot={c.colorPrimary}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-componentes ── */
function Section({ title, icon: Icon, count, children }: { title: string; icon: React.ElementType; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h2>
        {count !== undefined && (
          <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function AssignRow({
  label, sub, value, users, onChange, pending, dot,
}: {
  label: string; sub: string; value: string; users: UserOpt[];
  onChange: (userId: string) => void; pending?: boolean; dot?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
      {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{label}</p>
        <p className="truncate font-mono text-[11px]" style={{ color: "var(--color-subtle)" }}>{sub}</p>
      </div>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="shrink-0 rounded-md px-2 py-1.5 text-xs outline-none"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: value ? "var(--color-foreground)" : "var(--color-subtle)", maxWidth: 160 }}
      >
        <option value="">Sin asignar</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.username}{u.role === "admin" ? " (admin)" : ""}</option>
        ))}
      </select>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>{children}</p>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{children}</p>;
}
