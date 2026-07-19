"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";
import { ReferralPanel } from "@/components/referral/referral-panel";
import { WalletSection } from "@/components/wallet/wallet-section";

interface MeProfile {
  id: string;
  handle: string | null;
  house_slug: string | null;
  onboarded: boolean;
  tier: string | null;
}

interface Prefs {
  publicPositions: boolean;
  pnlVisible: boolean;
  notifyMentions: boolean;
  notifyReplies: boolean;
  notifyDuels: boolean;
  notifyHouse: boolean;
}

const DEFAULT_PREFS: Prefs = {
  publicPositions: false,
  pnlVisible: false,
  notifyMentions: true,
  notifyReplies: true,
  notifyDuels: true,
  notifyHouse: true,
};

/* Which settings bucket each toggle lives in, and its key inside that bucket.
   Buckets map to the profiles.settings jsonb the /api/settings route merges. */
const PREF_MAP: Record<
  keyof Prefs,
  { bucket: "privacy" | "notifications"; key: string }
> = {
  publicPositions: { bucket: "privacy", key: "publicPositions" },
  pnlVisible: { bucket: "privacy", key: "pnlVisible" },
  notifyMentions: { bucket: "notifications", key: "mentions" },
  notifyReplies: { bucket: "notifications", key: "replies" },
  notifyDuels: { bucket: "notifications", key: "duels" },
  notifyHouse: { bucket: "notifications", key: "house" },
};

type Bucket = Record<string, unknown>;
interface RealmSettings {
  privacy?: Bucket;
  notifications?: Bucket;
  appearance?: Bucket;
}

function prefsFromSettings(settings: RealmSettings | null): Prefs {
  const next = { ...DEFAULT_PREFS };
  if (!settings) return next;
  for (const field of Object.keys(PREF_MAP) as (keyof Prefs)[]) {
    const { bucket, key } = PREF_MAP[field];
    const val = settings[bucket]?.[key];
    if (typeof val === "boolean") next[field] = val;
  }
  return next;
}

function Toggle({
  on,
  onChange,
  disabled,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed ${
        on ? "border-gold bg-gold/25" : "border-steel-line bg-panel"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
          on ? "left-6 bg-gold-bright" : "left-1 bg-bone-faint"
        }`}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-steel-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm text-bone">{title}</p>
        {desc ? <p className="mt-0.5 text-xs text-bone-faint">{desc}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Card({
  icon,
  title,
  plain,
  children,
}: {
  icon: string;
  title: string;
  plain: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <Icon name={icon} className="h-4 w-4 text-gold" />
        <h2 className="font-display text-base font-semibold text-bone">
          {title}
        </h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
          {plain}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { ready, enabled, authenticated, displayName, signOut, signInX, signInEmail } =
    useRealmAuth();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated) return;
    let cancelled = false;
    void (async () => {
      const [me, settings] = await Promise.all([
        realmFetch<{ profile: MeProfile }>("/api/me", { method: "POST" }),
        realmFetch<{ settings: RealmSettings }>("/api/settings"),
      ]);
      if (cancelled) return;
      if (me.ok && me.data) setProfile(me.data.profile);
      if (settings.ok && settings.data)
        setPrefs(prefsFromSettings(settings.data.settings));
      setPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated]);

  const setPref = (field: keyof Prefs) => (next: boolean) => {
    setPrefs((prev) => ({ ...prev, [field]: next }));
    const { bucket, key } = PREF_MAP[field];
    void realmFetch("/api/settings", {
      method: "POST",
      json: { [bucket]: { [key]: next } },
    });
  };

  const locked = ready && !authenticated;
  const toggleDisabled = locked || !prefsLoaded;

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <h1 className="font-display text-xl font-semibold text-bone">Settings</h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Your keep, your rules
      </p>

      {!ready ? (
        <div className="glass mt-5 h-40 animate-pulse" />
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {locked ? (
            <section className="glass p-6 text-center sm:p-8">
              <h2 className="gold-text font-display text-xl font-semibold">
                Enter the realm to command your settings
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-bone-mut">
                The sections below unlock once you are signed in.
              </p>
              {enabled ? (
                <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={signInX}
                    className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Icon name="xlogo" className="h-4 w-4" />
                    Enter with X
                  </button>
                  <button
                    type="button"
                    onClick={signInEmail}
                    className="btn-glass inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Icon name="mail" className="h-4 w-4" />
                    Enter with email
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-xs text-bone-faint">
                  The Gatehouse is not mounted in this environment, so sign-in
                  is resting.
                </p>
              )}
            </section>
          ) : null}

          <div
            className={
              locked
                ? "pointer-events-none flex flex-col gap-3 opacity-50"
                : "flex flex-col gap-3"
            }
            aria-disabled={locked || undefined}
          >
            {/* Account */}
            <Card icon="user" title="Account" plain="Identity">
              <Row
                title="Display name"
                desc={locked ? "Sign in to see it" : undefined}
              >
                <span className="text-sm text-bone-mut">
                  {authenticated ? (displayName ?? "Unnamed wanderer") : "--"}
                </span>
              </Row>
              <Row
                title="Handle"
                desc={
                  authenticated && !profile
                    ? "Fetching from the archives"
                    : undefined
                }
              >
                <span className="tnum font-mono text-sm text-bone-mut">
                  {authenticated && profile?.handle
                    ? `@${profile.handle}`
                    : "--"}
                </span>
              </Row>
              <Row title="Leave the realm" desc="Sign out on this device">
                <button
                  type="button"
                  onClick={signOut}
                  disabled={locked}
                  className="btn-glass px-4 py-1.5 text-sm"
                >
                  Sign out
                </button>
              </Row>
            </Card>

            {/* Wallet: receive, holdings, send, and backup, all non-custodial */}
            <div className="flex items-center justify-between gap-3 px-1 pt-1">
              <div className="flex items-center gap-2.5">
                <Icon name="wallet" className="h-4 w-4 text-gold" />
                <h2 className="font-display text-base font-semibold text-bone">
                  Wallet
                </h2>
                <span className="text-[11px] uppercase tracking-[0.2em] text-bone-faint">
                  Keys and coin
                </span>
              </div>
              <Link
                href="/wallet"
                className="text-xs text-gold underline underline-offset-2"
              >
                Full view
              </Link>
            </div>
            <WalletSection />
            <p className="px-1 text-xs text-bone-faint">
              Your wallet is non-custodial. Ravenspire never holds your keys and
              cannot move your funds; every transfer and key export happens on
              your device, and only you can authorize it.
            </p>

            {/* Privacy */}
            <Card icon="eye" title="Privacy" plain="What others see">
              <Row
                title="Public positions"
                desc="Let others see what you hold"
              >
                <Toggle
                  on={prefs.publicPositions}
                  onChange={setPref("publicPositions")}
                  disabled={toggleDisabled}
                  label="Public positions"
                />
              </Row>
              <Row title="PnL visibility" desc="Show your gains and losses">
                <Toggle
                  on={prefs.pnlVisible}
                  onChange={setPref("pnlVisible")}
                  disabled={toggleDisabled}
                  label="PnL visibility"
                />
              </Row>
              <p className="mt-3 text-xs text-bone-faint">
                Saved to the Archives against your name, so these follow you to
                every device you sign in from.
              </p>
            </Card>

            {/* Notifications */}
            <Card icon="bell" title="Notifications" plain="Ravens at your window">
              <Row title="Mentions" desc="When someone names you">
                <Toggle
                  on={prefs.notifyMentions}
                  onChange={setPref("notifyMentions")}
                  disabled={toggleDisabled}
                  label="Mention notifications"
                />
              </Row>
              <Row title="Replies" desc="Answers to your ravens">
                <Toggle
                  on={prefs.notifyReplies}
                  onChange={setPref("notifyReplies")}
                  disabled={toggleDisabled}
                  label="Reply notifications"
                />
              </Row>
              <Row title="Duels" desc="Challenges and verdicts">
                <Toggle
                  on={prefs.notifyDuels}
                  onChange={setPref("notifyDuels")}
                  disabled={toggleDisabled}
                  label="Duel notifications"
                />
              </Row>
              <Row title="House calls" desc="Word from your banner">
                <Toggle
                  on={prefs.notifyHouse}
                  onChange={setPref("notifyHouse")}
                  disabled={toggleDisabled}
                  label="House notifications"
                />
              </Row>
              <p className="mt-3 text-xs text-bone-faint">
                Saved to the Archives, so your choices travel with you.
              </p>
            </Card>

            {/* Appearance */}
            <Card icon="orb" title="Appearance" plain="The realm's look">
              <Row
                title="Reduced motion"
                desc="We follow your system's preference automatically"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
                  Respected
                </span>
              </Row>
              <Row title="Theme" desc="Obsidian is the realm's only sky">
                <span className="text-xs uppercase tracking-[0.2em] text-bone-faint">
                  Obsidian
                </span>
              </Row>
            </Card>

            {/* Referral */}
            <Card icon="banner" title="Referral" plain="Raise your banner">
              <ReferralPanel enabled={authenticated} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
