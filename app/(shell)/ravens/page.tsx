"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { timeAgo } from "@/lib/social/types";
import { Icon } from "@/components/ui/icon";

interface Notif {
  id: string;
  kind: string;
  body: string | null;
  read: boolean;
  created_at: string;
  subject_id: string | null;
  actor: { handle: string | null; display_name: string | null } | null;
}

const kindIcon: Record<string, string> = {
  like: "heart",
  reply: "reply",
  reraven: "repost",
  follow: "user",
  raven_reply: "raven",
  duel_answered: "swords",
  duel_won: "crown",
  call_verdict: "target",
};

const kindText: Record<string, string> = {
  like: "admired your raven",
  reply: "answered your raven",
  reraven: "re-ravened your words",
  follow: "now follows your banner",
  raven_reply: "the Herald has answered",
  duel_answered: "answered your duel",
  duel_won: "victory in the duel",
  call_verdict: "your Call has been judged",
};

export default function RavensPage() {
  const { ready, authenticated } = useRealmAuth();
  const [items, setItems] = useState<Notif[] | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) return;
    void (async () => {
      const res = await realmFetch<{ notifications?: Notif[] }>(
        "/api/notifications"
      );
      setItems(res.data?.notifications ?? []);
      await realmFetch("/api/notifications", { method: "POST" });
    })();
  }, [ready, authenticated]);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">Ravens</h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Notifications
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {!authenticated ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            <Link href="/signin" className="text-gold underline">
              Enter the realm
            </Link>{" "}
            and the ravens will find you.
          </div>
        ) : items === null ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="glass glass-sm h-14 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            No ravens have arrived for you yet.
          </div>
        ) : (
          items.map((n) => (
            <Link
              key={n.id}
              href={n.subject_id ? `/post/${n.subject_id}` : "/home"}
              className={`glass glass-sm flex items-start gap-3 p-3.5 ${n.read ? "opacity-70" : ""}`}
            >
              <Icon
                name={kindIcon[n.kind] ?? "bell"}
                className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-bone">
                  {n.actor?.display_name ?? n.actor?.handle ?? "The realm"}{" "}
                  <span className="text-bone-mut">
                    {kindText[n.kind] ?? n.kind}
                  </span>
                </p>
                {n.body && (
                  <p className="mt-0.5 truncate text-xs text-bone-faint">
                    {n.body}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-bone-faint">
                {timeAgo(n.created_at)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
