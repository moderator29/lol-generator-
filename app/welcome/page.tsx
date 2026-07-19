"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RavenMark } from "@/components/brand/raven-mark";
import { houses } from "@/lib/data/houses";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { Icon } from "@/components/ui/icon";

const sigilIcon: Record<string, string> = {
  raven: "raven",
  flame: "flame",
  snowflake: "shield",
  storm: "signal",
  moon: "eye",
  lion: "crown",
};

export default function WelcomePage() {
  const router = useRouter();
  const { ready, authenticated } = useRealmAuth();
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [house, setHouse] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* Keep the raised banner through the sign-in detour. */
    const banner = new URLSearchParams(window.location.search).get("banner");
    if (banner) localStorage.setItem("rvn_banner", banner);
    if (ready && !authenticated) router.replace("/signin");
  }, [ready, authenticated, router]);

  const finish = async () => {
    if (!house || busy) return;
    setBusy(true);
    setError(null);
    const referral =
      new URLSearchParams(window.location.search).get("banner") ??
      localStorage.getItem("rvn_banner");
    const res = await realmFetch<{ error?: string }>("/api/onboard", {
      method: "POST",
      json: {
        handle,
        house,
        display_name: displayName || undefined,
        referral: referral || undefined,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.error ?? "The Maester frowned. Try again.");
      setStep(0);
      return;
    }
    localStorage.removeItem("rvn_banner");
    router.replace("/home?welcome=1");
  };

  return (
    <main className="realm-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <RavenMark className="h-12 w-12" />
      <h1 className="mt-3 font-display text-2xl font-semibold text-bone">
        The Maester welcomes you
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-bone-faint">
        Step {step + 1} of 2
      </p>

      {step === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-8 w-full max-w-md p-6"
        >
          <label className="text-xs font-semibold uppercase tracking-wider text-bone-mut">
            Claim your name
          </label>
          <div className="mt-2 flex items-center gap-1 rounded-xl border border-steel-line bg-void px-3 py-2.5">
            <span className="text-bone-faint">@</span>
            <input
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20)
                )
              }
              placeholder="your_handle"
              className="min-w-0 flex-1 bg-transparent text-sm text-bone outline-none"
            />
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-bone-mut">
            Display name (optional)
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
            placeholder="How the realm knows you"
            className="mt-2 w-full rounded-xl border border-steel-line bg-void px-3 py-2.5 text-sm text-bone outline-none"
          />
          {error && <p className="mt-3 text-xs text-ember-deep">{error}</p>}
          <button
            onClick={() => handle.length >= 3 && setStep(1)}
            disabled={handle.length < 3}
            className="btn-gold mt-5 w-full py-2.5 text-sm disabled:opacity-50"
          >
            Choose your House
          </button>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 w-full max-w-2xl"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {houses.map((h) => (
              <button
                key={h.slug}
                onClick={() => setHouse(h.slug)}
                className={`glass glass-sm glass-hover p-4 text-left transition ${
                  house === h.slug ? "border-gold/60" : ""
                }`}
                style={
                  house === h.slug
                    ? { boxShadow: `0 0 30px ${h.color}22` }
                    : undefined
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={sigilIcon[h.sigil] ?? "banner"}
                    className="h-5 w-5"
                  />
                  <p className="font-display text-base font-semibold text-bone">
                    {h.name}
                  </p>
                  {house === h.slug && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gold">
                      Chosen
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs italic text-gold/80">{h.motto}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-bone-mut">
                  {h.desc}
                </p>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-xs text-ember-deep">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="btn-glass px-5 py-2.5 text-sm text-bone-mut"
            >
              Back
            </button>
            <button
              onClick={finish}
              disabled={!house || busy}
              className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50"
            >
              {busy ? "Swearing your oath..." : "Swear your sword"}
            </button>
          </div>
          <p className="mt-4 text-center text-[11px] text-bone-faint">
            Finishing onboarding earns your first crest: Took the Black.
          </p>
        </motion.div>
      )}
    </main>
  );
}
