"use client";

import { useState } from "react";
import type { ErrorInfo } from "@/lib/errors";
import { describeError } from "@/lib/errors";

export const inputCls =
  "min-h-12 w-full rounded-input border border-field bg-surface px-3.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:bg-track disabled:text-muted";
export const btnPrimary =
  "min-h-[52px] rounded-button bg-accent px-5 text-[17px] font-semibold text-white hover:bg-[#08513f] disabled:cursor-not-allowed disabled:opacity-50";
export const btnDark =
  "min-h-11 rounded-button bg-ink px-4 text-[15px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50";
export const btnOutline =
  "min-h-11 rounded-button border border-field bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-ground disabled:cursor-not-allowed disabled:opacity-50";
export const card = "flex flex-col gap-3 rounded-card border border-line bg-surface p-6";

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </div>
  );
}

/** Program/wallet error in the design's red alert box. Pass a thrown value or a ready ErrorInfo. */
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const info: ErrorInfo = typeof error === "object" && error && "title" in error && "message" in error
    ? (error as ErrorInfo)
    : describeError(error);
  return (
    <div role="alert" className="flex items-start gap-3 rounded-card border border-error bg-error-soft p-4">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A3261B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 16.5v.5" />
      </svg>
      <div className="flex flex-col gap-1">
        <strong className="text-error">{info.title}</strong>
        <span className="text-[15px] text-error-ink">{info.message}</span>
        {info.code && <span className="font-mono text-[13px] text-error-ink">Error: {info.code}</span>}
      </div>
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-card border border-line bg-surface p-6 text-muted">{children}</div>;
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      {children && <p className="max-w-[680px] text-muted">{children}</p>}
    </div>
  );
}

/** Two-step button for irreversible actions: first click arms it, second click runs it. */
export function ArmedButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
  className = btnOutline,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed)
    return (
      <button type="button" className={className} disabled={disabled} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  return (
    <span className="flex gap-2">
      <button
        type="button"
        className="min-h-11 rounded-button bg-error px-4 text-[15px] font-semibold text-white hover:bg-error-ink disabled:opacity-50"
        disabled={disabled}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className={btnOutline} onClick={() => setArmed(false)}>
        Keep
      </button>
    </span>
  );
}
