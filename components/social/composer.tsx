"use client";

import { useState } from "react";
import { Avatar } from "@/components/social/avatar";
import { Icon } from "@/components/ui/icon";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import Link from "next/link";

export function Composer({ onPosted }: { onPosted?: () => void }) {
  const { authenticated, displayName } = useRealmAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callToken, setCallToken] = useState("");
  const [callStance, setCallStance] = useState<"up" | "down">("up");
  const [callTimeframe, setCallTimeframe] = useState("24h");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const attachImage = async (file: File) => {
    if (images.length >= 4 || uploading) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await realmFetch<{ url?: string; error?: string }>(
      "/api/upload",
      { method: "POST", body: form }
    );
    setUploading(false);
    if (res.data?.url) setImages((prev) => [...prev, res.data!.url!]);
    else setError(res.data?.error ?? "The image would not attach.");
  };

  if (!authenticated) {
    return (
      <div className="glass glass-sm flex items-center gap-3 p-4">
        <p className="text-sm text-bone-mut">
          The Ravenry is open to read. To send a raven, enter the realm.
        </p>
        <Link href="/signin" className="btn-gold ml-auto shrink-0 px-4 py-1.5 text-xs">
          Sign in
        </Link>
      </div>
    );
  }

  const send = async () => {
    if (busy || (!body.trim() && !callOpen && images.length === 0)) return;
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = { body };
    if (callOpen && callToken.trim()) {
      payload.call = {
        token: callToken.trim(),
        stance: callStance,
        timeframe: callTimeframe,
      };
    }
    if (images.length)
      payload.media = images.map((url) => ({ url, type: "image" }));
    const validPoll = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (pollOpen && validPoll.length >= 2) {
      payload.kind = "poll";
      payload.poll = { options: validPoll };
    }
    const res = await realmFetch<{ error?: string }>("/api/posts", {
      method: "POST",
      json: payload,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.error ?? "The raven refused to fly. Try again.");
      return;
    }
    setBody("");
    setCallOpen(false);
    setCallToken("");
    setImages([]);
    setPollOpen(false);
    setPollOptions(["", ""]);
    onPosted?.();
  };

  return (
    <div className="glass glass-sm p-4">
      <div className="flex gap-3">
        <Avatar
          author={{
            handle: null,
            display_name: displayName ?? null,
            avatar_url: null,
            house_slug: null,
          }}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            placeholder="Send a raven..."
            rows={body.length > 80 ? 4 : 2}
            className="w-full resize-none bg-transparent text-[15px] text-bone placeholder-bone-faint outline-none"
          />
          {callOpen && (
            <div className="glass-sm mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-gold/25 bg-panel-warm p-2.5">
              <Icon name="target" className="h-4 w-4 text-gold" />
              <input
                value={callToken}
                onChange={(e) => setCallToken(e.target.value.slice(0, 12))}
                placeholder="TOKEN"
                className="w-24 rounded-lg bg-void px-2 py-1 text-xs uppercase text-bone outline-none"
              />
              <div className="flex overflow-hidden rounded-lg border border-steel-line">
                {(["up", "down"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCallStance(s)}
                    className={`px-2.5 py-1 text-xs font-semibold ${
                      callStance === s
                        ? s === "up"
                          ? "bg-gold/20 text-gold-bright"
                          : "bg-ember-deep/25 text-ember"
                        : "text-bone-faint"
                    }`}
                  >
                    {s === "up" ? "Rises" : "Falls"}
                  </button>
                ))}
              </div>
              <div className="flex overflow-hidden rounded-lg border border-steel-line">
                {["24h", "7d", "30d"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCallTimeframe(t)}
                    className={`px-2 py-1 text-xs ${
                      callTimeframe === t
                        ? "bg-panel text-bone"
                        : "text-bone-faint"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="w-full text-[10px] text-bone-faint">
                A Call seals the live price now and the realm judges the verdict
                later. Real data only.
              </p>
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <div key={url} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-xl border border-steel-line object-cover"
                  />
                  <button
                    onClick={() =>
                      setImages((prev) => prev.filter((_, j) => j !== i))
                    }
                    aria-label="Remove image"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-steel-line bg-void text-[10px] text-bone-mut"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {pollOpen && (
            <div className="glass-sm mt-2 flex flex-col gap-1.5 rounded-xl border border-gold/25 bg-panel p-2.5">
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((prev) =>
                      prev.map((p, j) => (j === i ? e.target.value.slice(0, 60) : p))
                    )
                  }
                  placeholder={`Choice ${i + 1}`}
                  className="rounded-lg bg-void px-2.5 py-1.5 text-xs text-bone outline-none"
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                  className="self-start text-[11px] text-gold hover:text-gold-bright"
                >
                  Add a choice
                </button>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-xs text-ember-deep">{error}</p>}
          <div className="mt-2 flex items-center gap-1">
            <label
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                uploading
                  ? "text-gold"
                  : "text-bone-faint hover:bg-panel hover:text-bone-mut"
              }`}
            >
              <Icon name="image" className="h-4 w-4" />
              {uploading ? "Attaching..." : ""}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void attachImage(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => setPollOpen((v) => !v)}
              aria-label="Add a poll"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                pollOpen
                  ? "bg-gold/15 text-gold"
                  : "text-bone-faint hover:bg-panel hover:text-bone-mut"
              }`}
            >
              <Icon name="poll" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCallOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                callOpen
                  ? "bg-gold/15 text-gold"
                  : "text-bone-faint hover:bg-panel hover:text-bone-mut"
              }`}
            >
              <Icon name="target" className="h-4 w-4" />
              Make a Call
            </button>
            <span className="ml-auto text-[11px] text-bone-faint">
              {body.length > 0 && `${body.length}/1000`}
            </span>
            <button
              onClick={send}
              disabled={
                busy ||
                uploading ||
                (!body.trim() && !callToken.trim() && images.length === 0)
              }
              className="btn-gold px-4 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Flying..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
