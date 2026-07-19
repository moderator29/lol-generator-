"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileView } from "@/components/social/profile-view";
import { fetchProfile } from "@/lib/social/queries";
import type { PublicProfile } from "@/lib/social/types";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";

export default function KeepPage() {
  const { ready, authenticated, enabled, signOut } = useRealmAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [state, setState] = useState<"loading" | "anon" | "onboard" | "ok">(
    "loading"
  );

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      setState("anon");
      return;
    }
    void (async () => {
      const res = await realmFetch<{
        profile?: { handle: string | null; onboarded: boolean };
      }>("/api/me", { method: "POST" });
      const me = res.data?.profile;
      if (!me) {
        setState("anon");
        return;
      }
      if (!me.onboarded || !me.handle) {
        setState("onboard");
        return;
      }
      const full = await fetchProfile(me.handle);
      if (full) {
        setProfile(full);
        setState("ok");
      }
    })();
  }, [ready, authenticated]);

  if (state === "loading")
    return <div className="mx-auto max-w-2xl p-6"><div className="glass h-48 animate-pulse" /></div>;

  if (state === "anon")
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-bone">My Keep</h1>
        <p className="mt-3 text-sm text-bone-mut">
          {enabled
            ? "Your Keep rises when you enter the realm."
            : "Auth is not configured in this environment; your Keep awaits on the hosted realm."}
        </p>
        <Link href="/signin" className="btn-gold mt-6 inline-flex px-6 py-2.5 text-sm">
          Enter the Realm
        </Link>
      </div>
    );

  if (state === "onboard")
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-bone">
          One step remains
        </h1>
        <p className="mt-3 text-sm text-bone-mut">
          Claim your name and swear to a House, and your Keep is raised.
        </p>
        <Link href="/welcome" className="btn-gold mt-6 inline-flex px-6 py-2.5 text-sm">
          See the Maester
        </Link>
      </div>
    );

  return (
    <div>
      {profile && <ProfileView profile={profile} own />}
      <div className="mx-auto max-w-2xl px-4 pb-8">
        <button
          onClick={signOut}
          className="btn-glass px-4 py-2 text-xs text-bone-faint"
        >
          Leave the realm (sign out)
        </button>
      </div>
    </div>
  );
}
