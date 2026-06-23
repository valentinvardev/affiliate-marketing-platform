"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  Loader2, Upload, Pencil, Check, X,
} from "lucide-react";

type Offer = RouterOutputs["offer"]["listByCampaign"][number];

const BADGE_OPTIONS = ["TOP", "HOT", "NEW", "BEST"];

/* ─── Main component ─── */
export function OfferManager({
  campaignId,
  currencySymbol,
  initialOffers,
}: {
  campaignId: string;
  currencySymbol: string;
  initialOffers: Offer[];
}) {
  const utils = api.useUtils();

  const { data: offers = initialOffers } = api.offer.listByCampaign.useQuery(
    { campaignId },
    { initialData: initialOffers },
  );

  const invalidate = () => utils.offer.listByCampaign.invalidate({ campaignId });

  const create = api.offer.create.useMutation({ onSuccess: invalidate });
  const del    = api.offer.delete.useMutation({ onSuccess: invalidate });
  const reorder = api.offer.reorder.useMutation({ onSuccess: invalidate });

  function addOffer() {
    create.mutate({
      campaignId,
      name: "Nueva app",
      tag: "1 hr",
      badge: "TOP",
      amount: 10,
      rating: 4.9,
    });
  }

  return (
    <div className="space-y-3">
      {/* Offer list */}
      {offers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-10 text-center"
          style={{ border: "1px dashed var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Sin ofertas. Añade la primera.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {offers.map((offer, idx) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              currencySymbol={currencySymbol}
              isFirst={idx === 0}
              isLast={idx === offers.length - 1}
              onDelete={() => del.mutate({ id: offer.id })}
              onMoveUp={() => reorder.mutate({ id: offer.id, direction: "up" })}
              onMoveDown={() => reorder.mutate({ id: offer.id, direction: "down" })}
              onSaved={invalidate}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addOffer}
        disabled={create.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-colors"
        style={{
          border: "1px dashed var(--color-border)",
          color: "var(--color-muted-foreground)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-focus)";
          (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
          (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)";
        }}
      >
        {create.isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Plus className="h-3.5 w-3.5" />}
        Añadir oferta
      </button>

      <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
        El monto se formatea con el símbolo de moneda de la campaña ({currencySymbol}).
        Máximo 4 ofertas recomendado (la plantilla muestra una grilla 2×2).
      </p>
    </div>
  );
}

/* ─── Single offer row (expandable editor) ─── */
function OfferRow({
  offer,
  currencySymbol,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSaved,
}: {
  offer: Offer;
  currencySymbol: string;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Thumbnail */}
        {offer.imageUrl ? (
          <Image
            src={offer.imageUrl}
            alt={offer.name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-base"
            style={{ background: "var(--color-surface-overlay)" }}
          >
            🎮
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {offer.name}
          </p>
          <p className="text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
            <span
              className="mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
            >
              {offer.badge}
            </span>
            {offer.tag} · {currencySymbol}{offer.amount} · ★ {offer.rating}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <IconBtn title="Subir" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Bajar" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Editar" onClick={() => setOpen((o) => !o)} active={open}>
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Eliminar" onClick={onDelete} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Expanded editor */}
      {open && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          <OfferEditor
            offer={offer}
            currencySymbol={currencySymbol}
            onSaved={() => { onSaved(); setOpen(false); }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Inline editor ─── */
function OfferEditor({
  offer,
  currencySymbol,
  onSaved,
  onCancel,
}: {
  offer: Offer;
  currencySymbol: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({
    name:     offer.name,
    imageUrl: offer.imageUrl ?? "",
    tag:      offer.tag,
    badge:    offer.badge,
    amount:   offer.amount,
    rating:   offer.rating,
    note:     offer.note ?? "",
  });
  const [uploading, setUploading] = useState(false);

  const update = api.offer.update.useMutation({ onSuccess: onSaved });

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((p) => ({ ...p, [k]: v }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string };
    if (data.url) set("imageUrl", data.url);
    setUploading(false);
  }

  function handleSave() {
    update.mutate({
      id: offer.id,
      ...values,
      imageUrl: values.imageUrl || null,
      note: values.note || null,
    });
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {/* Name */}
      <div className="space-y-1.5">
        <FieldLabel>Nombre de la app</FieldLabel>
        <EditorInput
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Block Blast"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <FieldLabel>Imagen</FieldLabel>
        <div className="flex gap-2 items-center">
          {values.imageUrl && (
            <Image src={values.imageUrl} alt="" width={32} height={32}
              className="h-8 w-8 rounded-lg object-cover shrink-0" />
          )}
          <label className="flex-1 cursor-pointer inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)", background: "var(--color-surface-overlay)" }}>
            <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? "Subiendo…" : "Subir"}
          </label>
          <EditorInput
            value={values.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="URL de imagen"
            className="flex-1 text-xs"
          />
        </div>
      </div>

      {/* Tag */}
      <div className="space-y-1.5">
        <FieldLabel>Tag (tarea/tiempo)</FieldLabel>
        <EditorInput
          value={values.tag}
          onChange={(e) => set("tag", e.target.value)}
          placeholder="1 hr · Level 20 · 30 min"
        />
      </div>

      {/* Badge */}
      <div className="space-y-1.5">
        <FieldLabel>Badge</FieldLabel>
        <div className="flex gap-1.5 flex-wrap">
          {BADGE_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set("badge", b)}
              className="rounded px-2.5 py-1 text-xs font-bold transition-colors"
              style={{
                background: values.badge === b ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                color: values.badge === b ? "var(--color-background)" : "var(--color-muted-foreground)",
                border: "1px solid var(--color-border)",
              }}
            >
              {b}
            </button>
          ))}
          {!BADGE_OPTIONS.includes(values.badge) && (
            <EditorInput
              value={values.badge}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="Custom"
              className="w-24 text-xs"
            />
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <FieldLabel>Monto ({currencySymbol})</FieldLabel>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono shrink-0" style={{ color: "var(--color-muted-foreground)" }}>
            {currencySymbol}
          </span>
          <EditorInput
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-1.5">
        <FieldLabel>Rating (0–5)</FieldLabel>
        <EditorInput
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={values.rating}
          onChange={(e) => set("rating", parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5 sm:col-span-2">
        <FieldLabel>Nota opcional</FieldLabel>
        <EditorInput
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Juego popular · Oferta especial"
        />
      </div>

      {/* Save / cancel */}
      <div className="flex items-center gap-2 sm:col-span-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
        {update.error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            {update.error.message}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>
      {children}
    </p>
  );
}

function EditorInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors ${className}`}
      style={{
        background: "var(--color-surface-overlay)",
        border: "1px solid var(--color-border)",
        color: "var(--color-foreground)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-border-focus)"; props.onFocus?.(e); }}
      onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--color-border)"; props.onBlur?.(e); }}
    />
  );
}

function IconBtn({
  children, title, onClick, disabled, active, danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30"
      style={{ color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = danger ? "var(--color-error-bg)" : "var(--color-surface-overlay)";
        el.style.color = danger ? "var(--color-error)" : "var(--color-foreground)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.color = active ? "var(--color-foreground)" : "var(--color-muted-foreground)";
      }}
    >
      {children}
    </button>
  );
}
