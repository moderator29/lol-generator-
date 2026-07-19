"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/social/post-card";
import { Avatar } from "@/components/social/avatar";
import { CrestRoundel, findCrest } from "@/components/brand/crests";
import { Icon } from "@/components/ui/icon";
import {
  fetchFollowCounts,
  fetchProfilePosts,
  fetchUserCrests,
} from "@/lib/social/queries";
import { TIER_NAMES, type Post, type PublicProfile } from "@/lib/social/types";
import { houses } from "@/lib/data/houses";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";

export function ProfileView({
  profile,
  own = false,
}: {
  profile: PublicProfile;
  own?: boolean;
}) {
  const { authenticated } = useRealmAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [crestSlugs, setCrestSlugs] = useState<string[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"posts" | "calls">("posts");
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    void fetchProfilePosts(profile.id).then(setPosts);
    void fetchUserCrests(profile.id).then(setCrestSlugs);
    void fetchFollowCounts(profile.id).then(setCounts);
  }, [profile.id]);

  const house = houses.find((h) => h.slug === profile.house_slug);
  const callPosts = posts.filter((p) => p.kind === "call");
  const callsWon = callPosts.filter((p) => p.call?.verdict === "hit").length;
  const shown = tab === "calls" ? callPosts : posts;

  const toggleFollow = async () => {
    if (!authenticated) {
      window.location.href = "/signin";
      return;
    }
    const on = !following;
    setFollowing(on);
    setCounts((c) => ({ ...c, followers: c.followers + (on ? 1 : -1) }));
    await realmFetch("/api/social", {
      method: "POST",
      json: { action: "follow", subject_id: profile.id, on },
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      {/* Banner */}
      <div
        className="glass h-32 overflow-hidden sm:h-40"
        style={
          profile.banner_url
            ? {
                backgroundImage: `url(${profile.banner_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `radial-gradient(ellipse 70% 90% at 30% 0%, ${house?.color ?? "#C8A24C"}1e, transparent), linear-gradient(180deg, #101017, #0C0C11)`,
              }
        }
      />
      <div className="-mt-8 px-4">
        <div className="flex items-end justify-between">
          <Avatar author={profile} size={76} />
          {own ? (
            <span className="btn-glass px-4 py-1.5 text-xs text-bone-mut">
              This is your Keep
            </span>
          ) : (
            <button
              onClick={toggleFollow}
              className={`px-5 py-1.5 text-xs ${following ? "btn-glass text-bone-mut" : "btn-gold"}`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-semibold text-bone">
            {profile.display_name ?? profile.handle}
          </h1>
          {crestSlugs.slice(0, 4).map((slug) => {
            const def = findCrest(slug);
            return def ? (
              <span key={slug} title={def.name}>
                <CrestRoundel icon={def.icon} className="h-6 w-6" />
              </span>
            ) : null;
          })}
          {profile.is_agent && (
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
              Herald of the realm
            </span>
          )}
        </div>
        <p className="text-sm text-bone-faint">@{profile.handle}</p>

        {profile.bio && (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-bone-mut">
            {profile.bio}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-faint">
          {house && (
            <span className="flex items-center gap-1.5">
              <Icon name="banner" className="h-3.5 w-3.5" />
              {house.name}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Icon name="medal" className="h-3.5 w-3.5" />
            {TIER_NAMES[profile.tier] ?? profile.tier} ·{" "}
            <span className="tnum">{profile.renown.toLocaleString()}</span>{" "}
            Renown
          </span>
          {profile.x_handle && (
            <a
              href={`https://x.com/${profile.x_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-bone-mut hover:text-bone"
            >
              <Icon name="xlogo" className="h-3.5 w-3.5" />
              @{profile.x_handle}
            </a>
          )}
        </div>

        <div className="tnum mt-3 flex gap-5 text-sm">
          <span>
            <b className="text-bone">{counts.followers}</b>{" "}
            <span className="text-bone-faint">Followers</span>
          </span>
          <span>
            <b className="text-bone">{counts.following}</b>{" "}
            <span className="text-bone-faint">Following</span>
          </span>
          <span>
            <b className="text-bone">{callsWon}</b>{" "}
            <span className="text-bone-faint">Calls won</span>
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-1.5">
        {(["posts", "calls"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              tab === t ? "btn-gold" : "btn-glass text-bone-mut"
            }`}
          >
            {t === "posts" ? "Ravens" : "Calls"}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {shown.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-bone-mut">
            {tab === "calls"
              ? "No Calls sealed yet."
              : own
                ? "Your Keep awaits its first raven."
                : "No ravens from this Keep yet."}
          </div>
        ) : (
          shown.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
