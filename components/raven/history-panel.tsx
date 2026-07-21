"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import type { Conversation } from "@/components/raven/types";

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Chat history: past conversations titled by their first message. Selecting
 * one reloads it; "New chat" starts a fresh thread. Left-side sheet so it
 * mirrors the settings surface on the right.
 */
export function HistoryPanel({
  open,
  onClose,
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-label="Chat history"
        className="relative flex h-full w-[340px] max-w-[88vw] flex-col border-r border-gold/20 bg-obsidian/95 shadow-2xl backdrop-blur-xl"
      >
        <header className="flex items-center justify-between border-b border-steel-line/70 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-panel-warm">
              <Icon name="scroll" className="h-4 w-4 text-gold" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-bone">
                History
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                {conversations.length} saved
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-steel-line/70 text-bone-mut transition-colors hover:border-gold/35 hover:text-bone"
          >
            <Icon name="plus" className="h-4 w-4 rotate-45" />
          </button>
        </header>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={onNewChat}
            className="btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
          >
            <Icon name="plus" className="h-4 w-4" />
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {conversations.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-bone-mut">No conversations yet</p>
              <p className="mt-1 text-[11px] text-bone-faint">
                Your threads with the Raven will gather here.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {conversations.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id}>
                    <div
                      className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                        active
                          ? "border-gold/40 bg-panel-warm"
                          : "border-transparent hover:border-steel-line/70 hover:bg-panel/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(c.id)}
                        className="flex min-w-0 flex-1 flex-col items-start text-left"
                      >
                        <span
                          className={`w-full truncate text-sm ${
                            active ? "text-gold" : "text-bone"
                          }`}
                        >
                          {c.title || "Untitled"}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-bone-faint">
                          {relTime(c.updatedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        aria-label="Delete conversation"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-bone-faint opacity-0 transition-colors hover:text-ember-deep focus:opacity-100 group-hover:opacity-100"
                      >
                        <Icon name="plus" className="h-3.5 w-3.5 rotate-45" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
