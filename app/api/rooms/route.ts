import { requireProfile, json } from "@/lib/auth/server";
import { adminClient } from "@/lib/supabase/admin";

/* The Rookery courts: live audio rooms lifecycle. The audio pipeline itself
   arrives with the LiveKit key; until then courts open, gather, and close. */

type HostRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export async function GET() {
  const db = adminClient();
  if (!db) return json({ rooms: [] });

  const { data: rooms, error } = await db
    .from("rooms")
    .select("id, host_id, title, kind, status, house_slug, started_at")
    .in("status", ["live", "scheduled"])
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(20);
  if (error) return json({ error: error.message }, 500);
  const list = rooms ?? [];
  if (list.length === 0) return json({ rooms: [] });

  const hostIds = [...new Set(list.map((r) => r.host_id as string))];
  const roomIds = list.map((r) => r.id as string);

  const [{ data: hosts }, { data: parts }] = await Promise.all([
    db
      .from("profiles")
      .select("id, handle, display_name, avatar_url")
      .in("id", hostIds),
    db
      .from("room_participants")
      .select("room_id, profile_id")
      .in("room_id", roomIds),
  ]);

  const hostMap = new Map<string, HostRow>();
  for (const h of (hosts ?? []) as HostRow[]) hostMap.set(h.id, h);

  const partMap = new Map<string, string[]>();
  for (const p of (parts ?? []) as { room_id: string; profile_id: string }[]) {
    const arr = partMap.get(p.room_id) ?? [];
    arr.push(p.profile_id);
    partMap.set(p.room_id, arr);
  }

  return json({
    rooms: list.map((r) => {
      const host = hostMap.get(r.host_id as string);
      const ids = partMap.get(r.id as string) ?? [];
      return {
        id: r.id,
        host_id: r.host_id,
        title: r.title,
        kind: r.kind,
        status: r.status,
        house_slug: r.house_slug,
        started_at: r.started_at,
        host: host
          ? {
              handle: host.handle,
              display_name: host.display_name,
              avatar_url: host.avatar_url,
            }
          : null,
        participants: ids.length,
        participant_ids: ids,
      };
    }),
  });
}

export async function POST(req: Request) {
  const profile = await requireProfile(req);
  if (!profile) return json({ error: "unauthenticated" }, 401);
  if (!profile.onboarded)
    return json(
      { error: "Take your vows first. Finish onboarding before holding court." },
      403
    );
  const db = adminClient();
  if (!db) return json({ error: "unavailable" }, 503);

  const body = (await req.json().catch(() => null)) as {
    action?: string;
    title?: string;
    room_id?: string;
  } | null;
  if (!body?.action) return json({ error: "bad request" }, 400);

  if (body.action === "open") {
    const title = body.title?.trim().slice(0, 80);
    if (!title) return json({ error: "A court needs a name." }, 400);

    const { data: held } = await db
      .from("rooms")
      .select("id")
      .eq("host_id", profile.id)
      .eq("status", "live")
      .maybeSingle();
    if (held)
      return json(
        {
          error:
            "One voice, one dais. Close the court you already hold before raising another.",
        },
        409
      );

    const { data: room, error } = await db
      .from("rooms")
      .insert({
        host_id: profile.id,
        title,
        kind: "audio",
        status: "live",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !room) return json({ error: error?.message ?? "failed" }, 500);

    /* Seat the host in their own court; best-effort. */
    await db.from("room_participants").insert({
      room_id: room.id,
      profile_id: profile.id,
      role: "host",
    });

    return json({ id: room.id });
  }

  if (body.action === "close") {
    if (!body.room_id) return json({ error: "bad request" }, 400);
    const { data: room } = await db
      .from("rooms")
      .select("id, host_id, status")
      .eq("id", body.room_id)
      .maybeSingle();
    if (!room) return json({ error: "No such court." }, 404);
    if (room.host_id !== profile.id)
      return json({ error: "Only the host may end the court." }, 403);
    if (room.status !== "ended") {
      const { error } = await db
        .from("rooms")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", room.id);
      if (error) return json({ error: error.message }, 500);
    }
    return json({ ok: true });
  }

  if (body.action === "join") {
    if (!body.room_id) return json({ error: "bad request" }, 400);
    const { data: room } = await db
      .from("rooms")
      .select("id, status")
      .eq("id", body.room_id)
      .maybeSingle();
    if (!room) return json({ error: "No such court." }, 404);
    if (room.status === "ended")
      return json({ error: "That court has adjourned." }, 409);

    const { error } = await db.from("room_participants").insert({
      room_id: room.id,
      profile_id: profile.id,
      role: "listener",
    });
    /* 23505: already seated, which is fine. */
    if (error && error.code !== "23505")
      return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (body.action === "leave") {
    if (!body.room_id) return json({ error: "bad request" }, 400);
    const { error } = await db
      .from("room_participants")
      .delete()
      .eq("room_id", body.room_id)
      .eq("profile_id", profile.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
}
