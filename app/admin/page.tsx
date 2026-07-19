"use client";

import { useEffect, useState } from "react";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";

interface OverviewStats {
  users: number;
  posts: number;
  openReports: number;
  gloryIssued: number;
}

interface RecentPost {
  id: string;
  body: string;
  created_at: string;
  author: { handle: string | null; display_name: string | null } | null;
}

interface OverviewData {
  stats: OverviewStats;
  recent: RecentPost[];
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "sealed" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    void realmFetch<OverviewData>("/api/admin/overview").then((res) => {
      if (cancelled) return;
      if (res.status === 401 || res.status === 403) {
        setStatus("sealed");
      } else if (res.ok && res.data) {
        setData(res.data);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "sealed") {
    return (
      <div className="glass p-8 text-center">
        <Icon name="lock" className="mx-auto h-6 w-6 text-bone-faint" />
        <p className="gold-text font-display mt-3 text-xl font-semibold">
          The council chamber is sealed
        </p>
        <p className="mt-2 text-sm text-bone-mut">
          Your seal does not open this ledger.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="glass p-8 text-center">
        <p className="text-sm text-bone-mut">
          The ledger could not be read. Try again shortly.
        </p>
      </div>
    );
  }

  const statCards = data
    ? [
        { label: "Members of the realm", value: data.stats.users, icon: "user" },
        { label: "Ravens sent", value: data.stats.posts, icon: "raven" },
        {
          label: "Open reports",
          value: data.stats.openReports,
          icon: "shield",
        },
        {
          label: "Glory issued",
          value: data.stats.gloryIssued,
          icon: "medal",
        },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Overview
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The state of the realm
      </p>

      {status === "loading" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass glass-sm h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="glass glass-sm p-4 sm:p-5">
              <Icon name={s.icon} className="h-4 w-4 text-bone-faint" />
              <p className="tnum font-display mt-2 text-2xl font-semibold text-gold sm:text-3xl">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-bone">
          Recent ravens
        </h2>
        <div className="glass mt-3 overflow-x-auto">
          {status === "loading" ? (
            <div className="h-40 animate-pulse" />
          ) : data && data.recent.length > 0 ? (
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-steel-line text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Raven</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((p) => (
                  <tr key={p.id} className="border-b border-steel-line last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-semibold text-bone">
                        {p.author?.display_name?.trim() ||
                          (p.author?.handle ? `@${p.author.handle}` : "Unknown")}
                      </span>
                      {p.author?.handle && (
                        <span className="ml-2 text-xs text-bone-faint">
                          @{p.author.handle}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-bone-mut">{truncate(p.body)}</td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-xs text-bone-faint">
                      {timeAgo(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center gap-3 p-6">
              <Icon name="raven" className="h-5 w-5 text-bone-faint" />
              <p className="text-sm text-bone-mut">
                No ravens have flown yet. The rookery is quiet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
