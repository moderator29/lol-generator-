"use client";

import { useEffect, useState } from "react";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";
import { houses } from "@/lib/data/houses";

interface UserRow {
  id: string;
  handle: string | null;
  display_name: string | null;
  tier: string;
  renown: number;
  points: number;
  house_slug: string | null;
  is_admin: boolean;
  created_at: string;
}

function houseName(slug: string | null): string {
  if (!slug) return "Unsworn";
  return houses.find((h) => h.slug === slug)?.name ?? slug;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "sealed" | "error">(
    "loading"
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void realmFetch<{ users: UserRow[] }>("/api/admin/users").then((res) => {
      if (cancelled) return;
      if (res.status === 401 || res.status === 403) {
        setStatus("sealed");
      } else if (res.ok && res.data?.users) {
        setUsers(res.data.users);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleAdmin(id: string) {
    setBusyId(id);
    setNote(null);
    const res = await realmFetch<{ ok?: boolean; user?: UserRow; error?: string }>(
      "/api/admin/users",
      { method: "POST", json: { profile_id: id, action: "toggle_admin" } }
    );
    if (res.ok && res.data?.ok && res.data.user) {
      const updated = res.data.user;
      setUsers((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
    } else if (res.data?.error === "cannot_change_own_seat") {
      setNote("You cannot change your own seat at the council table.");
    } else {
      setNote("The seat could not be changed. Try again.");
    }
    setBusyId(null);
  }

  if (status === "sealed") {
    return (
      <div className="glass p-8 text-center">
        <Icon name="lock" className="mx-auto h-6 w-6 text-bone-faint" />
        <p className="gold-text font-display mt-3 text-xl font-semibold">
          The council chamber is sealed
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Users
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        The fifty newest members of the realm
      </p>

      {note && <p className="mt-3 text-xs text-ember">{note}</p>}

      <div className="glass mt-4 overflow-x-auto">
        {status === "loading" ? (
          <div className="h-48 animate-pulse" />
        ) : status === "error" ? (
          <p className="p-6 text-sm text-bone-mut">
            The census could not be read. Try again shortly.
          </p>
        ) : users.length === 0 ? (
          <div className="flex items-center gap-3 p-6">
            <Icon name="user" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              No one has entered the realm yet.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="border-b border-steel-line text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                <th className="px-4 py-3 font-medium">Handle</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Renown</th>
                <th className="px-4 py-3 font-medium">House</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Seat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-steel-line last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-bone">
                    {u.handle ? `@${u.handle}` : "unclaimed"}
                    {u.is_admin && (
                      <span className="ml-2 rounded-full border border-steel-line bg-panel px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                        Steward
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-bone-mut">
                    {u.display_name?.trim() || "Nameless"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-bone-mut">
                    {u.tier}
                  </td>
                  <td className="tnum whitespace-nowrap px-4 py-3 text-gold">
                    {u.renown.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-bone-mut">
                    {houseName(u.house_slug)}
                  </td>
                  <td className="tnum whitespace-nowrap px-4 py-3 text-xs text-bone-faint">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      className="btn-glass px-3 py-1 text-xs"
                      disabled={busyId === u.id}
                      onClick={() => void toggleAdmin(u.id)}
                    >
                      {busyId === u.id
                        ? "Changing"
                        : u.is_admin
                          ? "Revoke seat"
                          : "Grant seat"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
