"use client";

import type { SavedDocumentSummary } from "@/lib/api";

interface DocumentHistoryProps {
  items: SavedDocumentSummary[];
  activeId: number | null;
  loading: boolean;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** A user's saved documents — re-open or delete past work. */
export default function DocumentHistory({
  items,
  activeId,
  loading,
  onOpen,
  onDelete,
}: DocumentHistoryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">
        Your documents
      </h2>

      {loading ? (
        <p className="mt-3 text-sm text-brand-gray">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-brand-gray">
          Documents you save will appear here so you can pick up where you left off.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className={[
                    "flex-1 rounded-md px-2 py-1 text-left transition hover:bg-slate-50",
                    active ? "ring-1 ring-brand-blue" : "",
                  ].join(" ")}
                >
                  <span className="block truncate text-sm font-medium text-brand-navy">
                    {item.title}
                  </span>
                  <span className="block text-xs text-brand-gray">
                    Updated {formatWhen(item.updated_at)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.title}`}
                  className="rounded-md px-2 py-1 text-xs font-medium text-brand-gray transition hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
