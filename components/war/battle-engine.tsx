"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Champion } from "@/lib/game/champions";
import { champions } from "@/lib/game/champions";
import { Icon } from "@/components/ui/icon";

/*
  The War, real-time. A full screen, landscape battle where the player's
  champion leads an army of real characters against an enemy host. Units are
  rendered from champion art, clash with lunge and slash animations, and the
  player commands Attack, an Ultimate and a Shield. Kills build a Glory streak
  that converts to $RSP at the season's rate. Rewards stay server authoritative
  (the battle page banks the outcome); this engine reports kills, duration and
  an estimated Glory.
*/

export interface BattleOutcome {
  result: "victory" | "defeat";
  kills: number;
  glory: number;
  duration_s: number;
}

interface Unit {
  id: number;
  team: 0 | 1; // 0 = your host, 1 = the enemy
  hero: boolean;
  x: number; // fraction 0..1 across the field
  y: number; // fraction 0..1 down the field
  hp: number;
  maxHp: number;
  atk: number;
  range: number;
  speed: number;
  size: number;
  cooldown: number;
  alive: boolean;
  hitFlash: number;
  lunge: number;
  shield: number;
  img: HTMLImageElement | null;
}
interface Float {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}
interface Slash {
  x: number;
  y: number;
  life: number;
  team: 0 | 1;
}

const BATTLE_SECONDS = 200;
/* Illustrative season conversion, shown to players. Not a promise. */
const GLORY_PER_RSP = 1000;

export function BattleEngine({
  champion,
  mastery,
  field,
  onEnd,
}: {
  champion: Champion;
  mastery: number;
  field: string;
  onEnd: (o: BattleOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<"howto" | "rotate" | "playing">("howto");
  const [landscape, setLandscape] = useState(true);
  const [hud, setHud] = useState({
    heroHp: 1,
    time: BATTLE_SECONDS,
    kills: 0,
    streak: 1,
    glory: 0,
    ultReady: 0,
    shieldReady: 0,
  });

  /* Live game state kept in refs so the animation loop never re-renders. */
  const stateRef = useRef({
    units: [] as Unit[],
    floats: [] as Float[],
    slashes: [] as Slash[],
    nextId: 1,
    kills: 0,
    streak: 1,
    elapsed: 0,
    wave: 0,
    ended: false,
    ultCd: 0,
    shieldCd: 0,
    lastHudPush: 0,
  });
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const ended = useRef(false);

  /* Orientation: a landscape phone (or any wide screen) can fight. */
  useEffect(() => {
    const check = () => {
      const wide =
        typeof window !== "undefined" &&
        window.innerWidth >= window.innerHeight;
      setLandscape(wide || window.innerWidth >= 900);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  /* Preload champion art for the hero, the enemy champion and the host. */
  useEffect(() => {
    const withArt = champions.filter((c) => c.art);
    const pool = [champion, ...withArt].filter(
      (c, i, a) => a.findIndex((x) => x.slug === c.slug) === i
    );
    pool.forEach((c) => {
      if (!c.art || imgs.current[c.slug]) return;
      const im = new Image();
      im.src = c.art;
      imgs.current[c.slug] = im;
    });
  }, [champion]);

  const spawnHost = useCallback(() => {
    const s = stateRef.current;
    const withArt = champions.filter((c) => c.art && c.slug !== champion.slug);
    const enemyHero =
      withArt[Math.floor((mastery + field.length) % withArt.length)] ??
      withArt[0];
    const heroHp = 200 + champion.stats.health / 60 + mastery * 20;

    const mk = (
      team: 0 | 1,
      hero: boolean,
      x: number,
      y: number,
      art: string | undefined
    ): Unit => ({
      id: s.nextId++,
      team,
      hero,
      x,
      y,
      hp: hero ? (team === 0 ? heroHp : heroHp * 0.9) : 46,
      maxHp: hero ? (team === 0 ? heroHp : heroHp * 0.9) : 46,
      atk: hero ? 26 : 9,
      range: hero ? 0.05 : 0.045,
      speed: hero ? 0.05 : 0.06 + Math.abs(((s.nextId * 7) % 5) - 2) * 0.006,
      size: hero ? 0.085 : 0.05,
      cooldown: 0,
      alive: true,
      hitFlash: 0,
      lunge: 0,
      shield: 0,
      img: art ? (imgs.current[artSlug(art)] ?? null) : null,
    });

    /* Your hero and a first line of the host. */
    s.units.push(mk(0, true, 0.16, 0.55, champion.art));
    const allyArt = withArt.slice(0, 6);
    for (let i = 0; i < 5; i++) {
      s.units.push(
        mk(0, false, 0.1 + (i % 2) * 0.05, 0.3 + i * 0.1, allyArt[i % allyArt.length]?.art)
      );
    }
    /* The enemy champion leads the first wave. */
    s.units.push(mk(1, true, 0.85, 0.5, enemyHero?.art));
  }, [champion, mastery, field]);

  const spawnWave = useCallback((count: number) => {
    const s = stateRef.current;
    const foes = champions.filter((c) => c.art && c.slug !== champion.slug);
    for (let i = 0; i < count; i++) {
      const art = foes[(s.nextId + i) % foes.length]?.art;
      s.units.push({
        id: s.nextId++,
        team: 1,
        hero: false,
        x: 0.98 + Math.random() * 0.04,
        y: 0.24 + Math.random() * 0.6,
        hp: 40 + s.wave * 6,
        maxHp: 40 + s.wave * 6,
        atk: 8 + s.wave,
        range: 0.045,
        speed: 0.058 + Math.random() * 0.02,
        size: 0.05,
        cooldown: Math.random(),
        alive: true,
        hitFlash: 0,
        lunge: 0,
        shield: 0,
        img: art ? (imgs.current[artSlug(art)] ?? null) : null,
      });
    }
  }, [champion]);

  const finish = useCallback(
    (result: "victory" | "defeat") => {
      if (ended.current) return;
      ended.current = true;
      const s = stateRef.current;
      const glory = Math.round(s.kills * 3 * (1 + s.kills * 0.012));
      onEnd({
        result,
        kills: s.kills,
        glory,
        duration_s: Math.max(10, Math.round(s.elapsed)),
      });
    },
    [onEnd]
  );

  const hero = () => stateRef.current.units.find((u) => u.team === 0 && u.hero);

  /* Player commands. */
  const doAttack = useCallback(() => {
    const s = stateRef.current;
    const h = hero();
    if (!h || !h.alive) return;
    const foe = nearestEnemy(s.units, h);
    if (!foe) return;
    h.lunge = 1;
    if (dist(h, foe) < 0.22) {
      damage(s, foe, h.atk * 2, h.team);
      s.slashes.push({ x: foe.x, y: foe.y, life: 1, team: h.team });
    }
  }, []);

  const doUlt = useCallback(() => {
    const s = stateRef.current;
    const h = hero();
    if (!h || !h.alive || s.ultCd > 0) return;
    s.ultCd = 14;
    h.lunge = 1;
    s.units.forEach((u) => {
      if (u.team === 1 && u.alive && dist(h, u) < 0.28) {
        damage(s, u, h.atk * 3, h.team);
        s.slashes.push({ x: u.x, y: u.y, life: 1, team: h.team });
      }
    });
    s.floats.push({ x: h.x, y: h.y - 0.06, text: champion.ultimate.name, life: 1.4, color: "#F0D68C" });
  }, [champion]);

  const doShield = useCallback(() => {
    const s = stateRef.current;
    const h = hero();
    if (!h || !h.alive || s.shieldCd > 0) return;
    s.shieldCd = 16;
    s.units.forEach((u) => {
      if (u.team === 0 && u.alive && dist(h, u) < 0.18) u.shield = 3;
    });
    h.shield = 3.5;
  }, []);

  /* The battle loop. Runs only while playing and in landscape. */
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (stateRef.current.units.length === 0) spawnHost();

    let raf = 0;
    let last = performance.now();
    const s = stateRef.current;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(s, dt, spawnWave);
      render(ctx, canvas, s, field, champion);

      s.elapsed += dt;
      s.ultCd = Math.max(0, s.ultCd - dt);
      s.shieldCd = Math.max(0, s.shieldCd - dt);

      const h = s.units.find((u) => u.team === 0 && u.hero);
      const foesLeft = s.units.some((u) => u.team === 1 && u.alive);

      /* Push HUD ~10x a second, not every frame. */
      if (now - s.lastHudPush > 100) {
        s.lastHudPush = now;
        setHud({
          heroHp: h ? Math.max(0, h.hp / h.maxHp) : 0,
          time: Math.max(0, Math.ceil(BATTLE_SECONDS - s.elapsed)),
          kills: s.kills,
          streak: s.streak,
          glory: Math.round(s.kills * 3 * (1 + s.kills * 0.012)),
          ultReady: s.ultCd,
          shieldReady: s.shieldCd,
        });
      }

      if (!ended.current) {
        if (!h || h.hp <= 0) {
          finish("defeat");
          return;
        }
        if (s.elapsed >= BATTLE_SECONDS) {
          finish("victory");
          return;
        }
        if (!foesLeft && s.wave >= 4) {
          finish("victory");
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [phase, spawnHost, spawnWave, finish, field, champion]);

  /* A landscape phone is required to command the field. */
  const wantRotate = phase === "playing" && !landscape && isTouch();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-obsidian">
      {phase === "howto" ? (
        <HowToPlay champion={champion} onBegin={() => setPhase("playing")} onExit={() => history.back()} />
      ) : (
        <>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {wantRotate && <RotatePrompt />}

          {/* Top HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-3 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <div className="glass glass-sm pointer-events-auto flex min-w-0 flex-1 items-center gap-2 p-2">
              {champion.art && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={champion.art} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-bone">{champion.name}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-void">
                  <div
                    className="h-full rounded-full transition-[width] duration-150"
                    style={{
                      width: `${hud.heroHp * 100}%`,
                      background: hud.heroHp > 0.3 ? "linear-gradient(90deg,#C8A24C,#F0D68C)" : "#E5702A",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="glass glass-sm pointer-events-auto px-3 py-2 text-center">
              <p className="tnum text-sm font-bold text-bone">{fmt(hud.time)}</p>
              <p className="text-[9px] uppercase tracking-wider text-bone-faint">Time</p>
            </div>
            <button
              onClick={() => history.back()}
              className="glass glass-sm pointer-events-auto flex h-9 w-9 items-center justify-center text-bone-mut"
              aria-label="Retreat"
            >
              <Icon name="arrow" className="h-4 w-4 rotate-180" />
            </button>
          </div>

          {/* Score strip */}
          <div className="pointer-events-none absolute left-1/2 top-[calc(3.75rem+env(safe-area-inset-top))] -translate-x-1/2">
            <div className="glass glass-sm px-4 py-1.5 text-center">
              <span className="tnum text-sm font-bold text-gold-bright">{hud.kills}</span>
              <span className="ml-1 text-[10px] uppercase tracking-wider text-bone-faint">felled</span>
              <span className="mx-2 text-bone-faint">·</span>
              <span className="tnum text-sm font-bold text-ember">x{hud.streak.toFixed(1)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              onClick={doShield}
              disabled={hud.shieldReady > 0}
              className="glass glass-sm flex h-14 w-14 items-center justify-center rounded-full text-bone disabled:opacity-40"
              aria-label="Shield"
            >
              {hud.shieldReady > 0 ? (
                <span className="tnum text-xs">{Math.ceil(hud.shieldReady)}</span>
              ) : (
                <Icon name="shield" className="h-6 w-6" />
              )}
            </button>
            <div className="flex items-end gap-3">
              <button
                onClick={doUlt}
                disabled={hud.ultReady > 0}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-ember/60 bg-ember/20 text-ember disabled:opacity-40"
                aria-label={champion.ultimate.name}
              >
                {hud.ultReady > 0 ? (
                  <span className="tnum text-sm font-bold">{Math.ceil(hud.ultReady)}</span>
                ) : (
                  <Icon name="flame" className="h-7 w-7" />
                )}
              </button>
              <button
                onClick={doAttack}
                className="gold-metal flex h-20 w-20 items-center justify-center rounded-full border border-gold-bright/60 text-obsidian active:scale-95"
                aria-label="Attack"
              >
                <Icon name="swords" className="h-9 w-9" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- pure helpers ---------- */

function artSlug(art: string) {
  return art.split("/").pop()?.replace(/\.\w+$/, "") ?? art;
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = (a.y - b.y) * 0.6;
  return Math.hypot(dx, dy);
}
function nearestEnemy(units: Unit[], u: Unit): Unit | null {
  let best: Unit | null = null;
  let bd = Infinity;
  for (const o of units) {
    if (!o.alive || o.team === u.team) continue;
    const d = dist(u, o);
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}
function damage(s: { units: Unit[]; floats: Float[]; kills: number; streak: number }, target: Unit, amount: number, byTeam: 0 | 1) {
  if (!target.alive) return;
  const dealt = target.shield > 0 ? amount * 0.25 : amount;
  target.hp -= dealt;
  target.hitFlash = 1;
  s.floats.push({ x: target.x, y: target.y - 0.03, text: `-${Math.round(dealt)}`, life: 0.8, color: byTeam === 0 ? "#F0D68C" : "#E5702A" });
  if (target.hp <= 0) {
    target.alive = false;
    if (byTeam === 0) {
      s.kills += 1;
      s.streak = Math.min(5, 1 + s.kills * 0.05);
    }
  }
}

function step(
  s: {
    units: Unit[];
    floats: Float[];
    slashes: Slash[];
    kills: number;
    streak: number;
    wave: number;
    elapsed: number;
  },
  dt: number,
  spawnWave: (n: number) => void
) {
  /* Waves arrive over the first half of the battle. */
  const wavesDue = Math.min(4, Math.floor(s.elapsed / 24));
  if (wavesDue >= s.wave && s.wave < 4) {
    s.wave += 1;
    spawnWave(5 + s.wave);
  }

  for (const u of s.units) {
    if (!u.alive) continue;
    u.hitFlash = Math.max(0, u.hitFlash - dt * 3);
    u.lunge = Math.max(0, u.lunge - dt * 3);
    u.shield = Math.max(0, u.shield - dt);
    u.cooldown = Math.max(0, u.cooldown - dt);

    const foe = nearestEnemy(s.units, u);
    if (!foe) continue;
    const d = dist(u, foe);
    if (d > u.range) {
      /* March toward the foe. */
      const dx = foe.x - u.x;
      const dy = foe.y - u.y;
      const m = Math.hypot(dx, dy) || 1;
      u.x += (dx / m) * u.speed * dt;
      u.y += (dy / m) * u.speed * dt;
      u.y = Math.max(0.22, Math.min(0.88, u.y));
    } else if (u.cooldown <= 0) {
      /* The host and enemy auto-strike; the player hero mostly waits on
         commands but still trades blows in the press of battle. */
      u.cooldown = u.hero ? 1.1 : 0.9;
      u.lunge = 1;
      damage(s, foe, u.atk, u.team);
    }
  }

  /* Cull the fallen after a beat so their fade can play, and decay effects. */
  for (const f of s.floats) f.life -= dt;
  for (const sl of s.slashes) sl.life -= dt * 2.5;
  s.floats = s.floats.filter((f) => f.life > 0);
  s.slashes = s.slashes.filter((sl) => sl.life > 0);
  s.units = s.units.filter((u) => u.alive || u.hitFlash > 0.01 || u.hero);
}

const FIELD_TINT: Record<string, string> = {
  "river-crossing": "#0d1420",
  "castle-siege": "#1a1108",
  "snow-valley": "#141821",
  "dark-fortress": "#120b12",
};

function render(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  s: { units: Unit[]; floats: Float[]; slashes: Slash[] },
  field: string,
  champion: Champion
) {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  /* Ground and sky. */
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, FIELD_TINT[field] ?? "#0d1018");
  sky.addColorStop(1, "#050507");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(200,162,76,0.06)";
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
  /* Center line where the hosts meet. */
  ctx.strokeStyle = "rgba(200,162,76,0.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, H * 0.2);
  ctx.lineTo(W / 2, H);
  ctx.stroke();

  /* Draw back to front by y. */
  const ordered = [...s.units].sort((a, b) => a.y - b.y);
  for (const u of ordered) {
    const px = u.x * W + (u.lunge * (u.team === 0 ? 1 : -1) * 0.02 * W);
    const py = u.y * H;
    const r = u.size * H;
    const ring = u.team === 0 ? "#C8A24C" : "#E5702A";

    /* Shadow */
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(px, py + r * 0.9, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    const alpha = u.alive ? 1 : Math.max(0, u.hitFlash);
    ctx.globalAlpha = alpha;

    /* Portrait clipped to a circle. */
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (u.img && u.img.complete && u.img.naturalWidth > 0) {
      const iw = u.img.naturalWidth;
      const ih = u.img.naturalHeight;
      const scale = Math.max((r * 2) / iw, (r * 2) / ih);
      ctx.drawImage(u.img, px - (iw * scale) / 2, py - (ih * scale) / 2 - r * 0.15, iw * scale, ih * scale);
    } else {
      ctx.fillStyle = u.team === 0 ? "#26210f" : "#2a130a";
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
    ctx.restore();

    /* Ring, hero crown, hit flash, shield. */
    ctx.lineWidth = u.hero ? 3 : 2;
    ctx.strokeStyle = ring;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    if (u.shield > 0) {
      ctx.strokeStyle = "rgba(240,214,140,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (u.hitFlash > 0.02 && u.alive) {
      ctx.fillStyle = `rgba(255,255,255,${u.hitFlash * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Health bar */
    if (u.alive) {
      const bw = r * 1.8;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(px - bw / 2, py - r - 8, bw, 4);
      ctx.fillStyle = ring;
      ctx.fillRect(px - bw / 2, py - r - 8, bw * Math.max(0, u.hp / u.maxHp), 4);
    }
    ctx.globalAlpha = 1;
  }

  /* Slashes */
  for (const sl of s.slashes) {
    ctx.globalAlpha = sl.life;
    ctx.strokeStyle = sl.team === 0 ? "#F0D68C" : "#E5702A";
    ctx.lineWidth = 3;
    const x = sl.x * W;
    const y = sl.y * H;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 14);
    ctx.lineTo(x + 14, y + 14);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* Damage numbers */
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.round(H * 0.03)}px ui-sans-serif, system-ui`;
  for (const f of s.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x * W, f.y * H - (1 - f.life) * 20);
    ctx.globalAlpha = 1;
  }

  void champion;
}

/* ---------- overlays ---------- */

function HowToPlay({
  champion,
  onBegin,
  onExit,
}: {
  champion: Champion;
  onBegin: () => void;
  onExit: () => void;
}) {
  return (
    <div className="realm-bg flex h-full flex-col items-center justify-center overflow-y-auto p-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">The War · How to play</p>
      <h2 className="gold-text mt-2 font-display text-3xl font-semibold">Command your host</h2>
      <div className="glass mt-5 w-full max-w-md p-5 text-left text-sm text-bone-mut">
        <Rule icon="swords" title="Attack">
          Tap the gold swords to have {champion.name} strike the nearest enemy. Your host fights at your side.
        </Rule>
        <Rule icon="flame" title={`Ultimate: ${champion.ultimate.name}`}>
          Unleash an area blast on cooldown. It clears clustered foes and turns the tide.
        </Rule>
        <Rule icon="shield" title="Shield">
          Raise a guard on you and nearby allies for a few seconds. Time it against the enemy charge.
        </Rule>
        <Rule icon="medal" title="Glory and $RSP">
          Every foe felled builds your streak and Glory. Survive the waves to claim victory. Glory converts to
          $RSP at the season rate (about {GLORY_PER_RSP} Glory per $RSP, illustrative for the season).
        </Rule>
      </div>
      <p className="mt-3 text-xs text-bone-faint">On a phone, turn it sideways for the full field.</p>
      <div className="mt-5 flex gap-3">
        <button onClick={onExit} className="btn-glass px-6 py-2.5 text-sm text-bone-mut">
          Not yet
        </button>
        <button onClick={onBegin} className="btn-gold px-8 py-2.5 text-sm">
          Sound the horns
        </button>
      </div>
    </div>
  );
}

function Rule({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex gap-3 last:mb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-void text-gold">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-bone">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-bone-mut">{children}</p>
      </div>
    </div>
  );
}

function RotatePrompt() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-obsidian/95 p-6 text-center">
      <div className="animate-pulse text-gold">
        <Icon name="compass" className="h-12 w-12" />
      </div>
      <p className="mt-4 font-display text-xl font-semibold text-bone">Turn your device sideways</p>
      <p className="mt-2 text-sm text-bone-mut">Rotate to landscape to command the field.</p>
    </div>
  );
}

/* ---------- tiny utils ---------- */
function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
function isTouch() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}
