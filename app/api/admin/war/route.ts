import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";
import { champions, type Champion } from "@/lib/game/champions";

const RARITIES: Champion["rarity"][] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

/* The war ledger. Returns the roster shape (champions grouped by
   rarity, from the game data) and the true number of battles the
   realm has fought so far. */
export async function GET(req: Request) {
  const profile = await requireProfile(req);
  if (!profile?.is_admin) return json({ error: "forbidden" }, 403);
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const { count, error } = await db
    .from("war_battles")
    .select("id", { count: "exact", head: true });
  if (error) return json({ error: "query_failed" }, 500);

  const rarityCounts: Record<Champion["rarity"], number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  };
  for (const rarity of RARITIES) {
    rarityCounts[rarity] = champions.filter((c) => c.rarity === rarity).length;
  }

  return json({ battles: count ?? 0, champions: rarityCounts });
}
