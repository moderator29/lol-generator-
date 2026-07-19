"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Champion } from "@/lib/game/champions";

/*
  The War: real-time battle engine. Canvas simulation, DOM HUD.
  Two armies clash; the player fights inside the melee as their champion.
  Deterministic core (seeded PRNG), server-authoritative rewards.
*/

export interface BattleOutcome {
  result: "victory" | "defeat";
  kills: number;
  glory: number;
  duration_s: number;
}

interface Unit {
  id: number;
  side: 0 | 1; // 0 ally, 1 foe
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  range: number;
  cd: number;
  flash: number;
  dead: boolean;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  age: number;
  color: string;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 900;
const H = 560;
const BATTLE_SECONDS = 150;

export function BattleEngine({
  champion,
  onEnd,
}: {
  champion: Champion;
  onEnd: (o: BattleOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({
    hp: 1,
    allies: 1,
    foes: 1,
    time: BATTLE_SECONDS,
    glory: 0,
    mult: 1,
    powerCd: 0,
    blocking: false,
  });
  const [overlay, setOverlay] = useState<"intro" | "none">("intro");
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const keys = useRef<Record<string, boolean>>({});
  const pointer = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const actions = useRef({ attack: false, power: false, block: false });
  const started = useRef(false);

  const start = useCallback(() => {
    setOverlay("none");
    started.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = mulberry32(1207);
    const bg = new Image();
    bg.src = "/game/battlefield.png";
    const art = new Image();
    if (champion.art) art.src = champion.art;

    /* Player scaled from champion stats. */
    const pStats = {
      maxHp: 260 + champion.stats.health / 60,
      atk: 18 + champion.stats.attack / 90,
      speed: 95 + champion.stats.speed / 6,
      range: 46,
    };
    const player = {
      x: W * 0.2,
      y: H * 0.55,
      hp: pStats.maxHp,
      cd: 0,
      powerCd: 0,
      blockT: 0,
      blockCd: 0,
      kills: 0,
      streak: 0,
      streakT: 0,
      glory: 0,
      flash: 0,
    };

    let nextId = 1;
    const units: Unit[] = [];
    const spawn = (side: 0 | 1, n: number) => {
      for (let i = 0; i < n; i++) {
        units.push({
          id: nextId++,
          side,
          x: side === 0 ? W * (0.06 + rand() * 0.2) : W * (0.74 + rand() * 0.2),
          y: H * (0.18 + rand() * 0.7),
          hp: 46,
          maxHp: 46,
          atk: side === 0 ? 7 : 6.4,
          speed: 34 + rand() * 22,
          range: 18,
          cd: rand(),
          flash: 0,
          dead: false,
        });
      }
    };
    spawn(0, 22);
    spawn(1, 26);

    const floats: FloatText[] = [];
    const embers: { x: number; y: number; vx: number; vy: number; age: number }[] = [];

    let timeLeft = BATTLE_SECONDS;
    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const finish = (result: "victory" | "defeat") => {
      if (endedRef.current) return;
      endedRef.current = true;
      onEndRef.current({
        result,
        kills: player.kills,
        glory: Math.round(player.glory),
        duration_s: Math.round(BATTLE_SECONDS - timeLeft),
      });
    };

    const step = (dt: number) => {
      /* --- player input --- */
      let dx = 0;
      let dy = 0;
      const k = keys.current;
      if (k["arrowleft"] || k["a"]) dx -= 1;
      if (k["arrowright"] || k["d"]) dx += 1;
      if (k["arrowup"] || k["w"]) dy -= 1;
      if (k["arrowdown"] || k["s"]) dy += 1;
      if (pointer.current.active) {
        const px = pointer.current.x - player.x;
        const py = pointer.current.y - player.y;
        const d = Math.hypot(px, py);
        if (d > 14) {
          dx = px / d;
          dy = py / d;
        }
      }
      const mag = Math.hypot(dx, dy) || 1;
      const blocking = player.blockT > 0;
      const spd = pStats.speed * (blocking ? 0.4 : 1);
      player.x = Math.max(20, Math.min(W - 20, player.x + (dx / mag) * spd * dt));
      player.y = Math.max(20, Math.min(H - 20, player.y + (dy / mag) * spd * dt));

      player.cd = Math.max(0, player.cd - dt);
      player.powerCd = Math.max(0, player.powerCd - dt);
      player.blockT = Math.max(0, player.blockT - dt);
      player.blockCd = Math.max(0, player.blockCd - dt);
      player.streakT = Math.max(0, player.streakT - dt);
      player.flash = Math.max(0, player.flash - dt);
      if (player.streakT === 0) player.streak = 0;

      const foesAlive = units.filter((u) => !u.dead && u.side === 1);
      const alliesAlive = units.filter((u) => !u.dead && u.side === 0);

      const killFoe = (u: Unit, gloryBase: number) => {
        u.dead = true;
        player.kills += 1;
        player.streak += 1;
        player.streakT = 4;
        const mult = 1 + Math.min(2.2, player.streak * 0.2);
        const g = Math.round(gloryBase * mult);
        player.glory += g;
        floats.push({ x: u.x, y: u.y - 14, text: `+${g}`, age: 0, color: "#F0D68C" });
        for (let i = 0; i < 6; i++)
          embers.push({
            x: u.x,
            y: u.y,
            vx: (rand() - 0.5) * 80,
            vy: -40 - rand() * 60,
            age: 0,
          });
      };

      /* attack action: strike nearest foe in range */
      if (actions.current.attack && player.cd === 0) {
        actions.current.attack = false;
        player.cd = 0.38;
        let best: Unit | null = null;
        let bd = pStats.range + 10;
        for (const u of foesAlive) {
          const d = Math.hypot(u.x - player.x, u.y - player.y);
          if (d < bd) {
            bd = d;
            best = u;
          }
        }
        if (best) {
          best.hp -= pStats.atk;
          best.flash = 0.12;
          player.flash = 0.1;
          if (best.hp <= 0) killFoe(best, 10);
        }
      } else {
        actions.current.attack = false;
      }

      /* power: the champion's ultimate, an ember shockwave */
      if (actions.current.power && player.powerCd === 0) {
        actions.current.power = false;
        player.powerCd = 12;
        for (const u of foesAlive) {
          const d = Math.hypot(u.x - player.x, u.y - player.y);
          if (d < 130) {
            u.hp -= pStats.atk * 1.6;
            u.flash = 0.2;
            if (u.hp <= 0) killFoe(u, 14);
          }
        }
        for (let i = 0; i < 26; i++)
          embers.push({
            x: player.x,
            y: player.y,
            vx: Math.cos((i / 26) * Math.PI * 2) * 130,
            vy: Math.sin((i / 26) * Math.PI * 2) * 130,
            age: 0,
          });
      } else {
        actions.current.power = false;
      }

      /* block */
      if (actions.current.block && player.blockCd === 0) {
        actions.current.block = false;
        player.blockT = 1.4;
        player.blockCd = 4;
      } else {
        actions.current.block = false;
      }

      /* --- soldier AI: seek nearest enemy, swing on cooldown --- */
      for (const u of units) {
        if (u.dead) continue;
        u.cd = Math.max(0, u.cd - dt);
        u.flash = Math.max(0, u.flash - dt);
        const enemies = u.side === 0 ? foesAlive : alliesAlive;
        let target: { x: number; y: number; isPlayer: boolean; ref?: Unit } | null =
          null;
        let bd = Infinity;
        for (const e of enemies) {
          const d = Math.hypot(e.x - u.x, e.y - u.y);
          if (d < bd) {
            bd = d;
            target = { x: e.x, y: e.y, isPlayer: false, ref: e };
          }
        }
        if (u.side === 1) {
          const dp = Math.hypot(player.x - u.x, player.y - u.y);
          if (dp < bd) {
            bd = dp;
            target = { x: player.x, y: player.y, isPlayer: true };
          }
        }
        if (!target) continue;
        if (bd > u.range) {
          const tx = (target.x - u.x) / bd;
          const ty = (target.y - u.y) / bd;
          /* light separation so they fight like soldiers, not soup */
          let sx = 0;
          let sy = 0;
          for (const o of units) {
            if (o === u || o.dead) continue;
            const d = Math.hypot(o.x - u.x, o.y - u.y);
            if (d < 14 && d > 0) {
              sx += (u.x - o.x) / d;
              sy += (u.y - o.y) / d;
            }
          }
          u.x += (tx * u.speed + sx * 20) * dt;
          u.y += (ty * u.speed + sy * 20) * dt;
        } else if (u.cd === 0) {
          u.cd = 0.9;
          if (target.isPlayer) {
            const dmg = u.atk * (player.blockT > 0 ? 0.2 : 1);
            player.hp -= dmg;
            player.flash = 0.12;
            if (player.hp <= 0) finish("defeat");
          } else if (target.ref) {
            target.ref.hp -= u.atk;
            target.ref.flash = 0.1;
            if (target.ref.hp <= 0) target.ref.dead = true;
          }
        }
      }

      /* --- timers, win conditions --- */
      timeLeft -= dt;
      if (foesAlive.length === 0) {
        player.glory += 120;
        finish("victory");
      } else if (alliesAlive.length === 0 && foesAlive.length > 8) {
        finish("defeat");
      } else if (timeLeft <= 0) {
        finish(alliesAlive.length >= foesAlive.length ? "victory" : "defeat");
      }

      for (const f of floats) f.age += dt;
      while (floats.length && floats[0].age > 1.1) floats.shift();
      for (const e of embers) {
        e.age += dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vy += 60 * dt;
      }
      while (embers.length && embers[0].age > 0.9) embers.shift();

      hudTick += dt;
      if (hudTick > 0.12) {
        hudTick = 0;
        setHud({
          hp: Math.max(0, player.hp / pStats.maxHp),
          allies: alliesAlive.length / 22,
          foes: foesAlive.length / 26,
          time: Math.max(0, timeLeft),
          glory: Math.round(player.glory),
          mult: 1 + Math.min(2.2, player.streak * 0.2),
          powerCd: player.powerCd,
          blocking: player.blockT > 0,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (bg.complete && bg.naturalWidth) {
        const scale = Math.max(W / bg.naturalWidth, H / bg.naturalHeight);
        const bw = bg.naturalWidth * scale;
        const bh = bg.naturalHeight * scale;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "#0C0C11";
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = "rgba(7,7,10,0.35)";
      ctx.fillRect(0, 0, W, H);

      /* units */
      for (const u of units) {
        if (u.dead) continue;
        const color = u.side === 0 ? "#3E6EA8" : "#B02E2A";
        ctx.beginPath();
        ctx.arc(u.x, u.y + 5, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(u.x, u.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = u.flash > 0 ? "#ECE4D2" : color;
        ctx.fill();
        /* hp sliver */
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(u.x - 7, u.y - 12, 14, 2.5);
        ctx.fillStyle = color;
        ctx.fillRect(u.x - 7, u.y - 12, 14 * (u.hp / u.maxHp), 2.5);
      }

      /* player champion */
      const grad = ctx.createRadialGradient(
        player.x,
        player.y,
        2,
        player.x,
        player.y,
        26
      );
      grad.addColorStop(0, "rgba(240,214,140,0.5)");
      grad.addColorStop(1, "rgba(240,214,140,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = player.flash > 0 ? "#ECE4D2" : "#C8A24C";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = player.blockT > 0 ? "#ECE4D2" : "#F0D68C";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      /* embers + floats */
      for (const e of embers) {
        ctx.globalAlpha = Math.max(0, 1 - e.age);
        ctx.fillStyle = "#E5702A";
        ctx.fillRect(e.x, e.y, 2.5, 2.5);
      }
      ctx.globalAlpha = 1;
      for (const f of floats) {
        ctx.globalAlpha = Math.max(0, 1 - f.age);
        ctx.font = "bold 15px Inter, sans-serif";
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x - 12, f.y - f.age * 26);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (started.current && !endedRef.current) step(dt);
      draw();
      if (!endedRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === " ") {
        actions.current.attack = true;
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "q") actions.current.power = true;
      if (e.key.toLowerCase() === "e") actions.current.block = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const toLocal = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((ev.clientX - r.left) / r.width) * W,
        y: ((ev.clientY - r.top) / r.height) * H,
      };
    };
    const pDown = (ev: PointerEvent) => {
      const p = toLocal(ev);
      pointer.current = { ...p, active: true };
    };
    const pMove = (ev: PointerEvent) => {
      if (!pointer.current.active) return;
      const p = toLocal(ev);
      pointer.current = { ...p, active: true };
    };
    const pUp = () => {
      pointer.current.active = false;
    };
    canvas.addEventListener("pointerdown", pDown);
    canvas.addEventListener("pointermove", pMove);
    window.addEventListener("pointerup", pUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      canvas.removeEventListener("pointerdown", pDown);
      canvas.removeEventListener("pointermove", pMove);
      window.removeEventListener("pointerup", pUp);
    };
  }, [champion]);

  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
      Math.floor(s % 60)
    ).padStart(2, "0")}`;

  return (
    <div className="relative w-full select-none overflow-hidden rounded-3xl border border-steel-line bg-void">
      {/* top HUD */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-3">
        <div className="glass glass-sm flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2">
          {champion.art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={champion.art}
              alt=""
              className="h-9 w-9 rounded-lg border border-gold/40 object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg border border-gold/40 bg-panel" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-bone">
              {champion.name}
            </p>
            <div className="bar-track mt-1 h-2 w-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hud.hp * 100}%`,
                  background:
                    hud.hp > 0.4
                      ? "linear-gradient(90deg,#8A6A2C,#C8A24C,#F0D68C)"
                      : "linear-gradient(90deg,#7E1F1C,#C6402F)",
                }}
              />
            </div>
          </div>
        </div>
        <div className="glass glass-sm px-3 py-2 text-sm font-bold text-bone tnum">
          {mmss(hud.time)}
        </div>
      </div>
      {/* army bars */}
      <div className="absolute inset-x-0 top-[62px] z-10 flex gap-2 px-3">
        <div className="bar-track h-1.5 flex-1">
          <div
            className="h-full rounded-full bg-ally transition-all"
            style={{ width: `${hud.allies * 100}%` }}
          />
        </div>
        <div className="bar-track h-1.5 flex-1">
          <div
            className="ml-auto h-full rounded-full bg-foe transition-all"
            style={{ width: `${hud.foes * 100}%` }}
          />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="block aspect-[900/560] w-full touch-none"
      />

      {/* glory meter */}
      <div className="absolute inset-x-0 bottom-20 z-10 px-4 sm:bottom-16">
        <div className="mx-auto flex max-w-sm items-center gap-2">
          <div className="bar-track h-2 flex-1">
            <div
              className="bar-gold h-full transition-all"
              style={{ width: `${Math.min(100, (hud.glory / 800) * 100)}%` }}
            />
          </div>
          <span className="tnum text-xs font-bold text-gold-bright">
            {hud.glory} · x{hud.mult.toFixed(1)}
          </span>
        </div>
      </div>

      {/* action buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex items-end gap-2.5">
        <button
          onPointerDown={() => (actions.current.block = true)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-bone-mut backdrop-blur ${
            hud.blocking
              ? "border-bone bg-bone/20 text-bone"
              : "border-steel-line bg-void/70"
          }`}
          aria-label="Block"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z" />
          </svg>
        </button>
        <button
          onPointerDown={() => (actions.current.power = true)}
          disabled={hud.powerCd > 0}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-ember/60 bg-ember/20 text-ember backdrop-blur disabled:opacity-50"
          aria-label="Power"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path d="M12 3c1 3-3 4.5-3 8a3.5 3.5 0 0 0 7 0c0-1-.4-1.8-1-2.6.2 2-1 2.6-1 2.6.6-3.4-1-6.5-2-8z" />
          </svg>
          {hud.powerCd > 0 && (
            <span className="tnum absolute text-xs font-bold text-bone">
              {Math.ceil(hud.powerCd)}
            </span>
          )}
        </button>
        <button
          onPointerDown={() => (actions.current.attack = true)}
          className="gold-metal flex h-16 w-16 items-center justify-center rounded-full border border-gold-bright/60 text-obsidian shadow-lg"
          aria-label="Attack"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
            <path d="M4 4l10 10M20 4L10 14M6.5 17.5L4 20m2.5-2.5l2 2m9.5-2.5L20 20m-2.5-2.5l-2 2" />
          </svg>
        </button>
      </div>

      {/* movement hint */}
      <p className="absolute bottom-3 left-3 z-10 hidden text-[10px] uppercase tracking-wider text-bone-faint sm:block">
        Move: WASD / drag · Attack: space · Power: Q · Block: E
      </p>

      {overlay === "intro" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-obsidian/80 p-6 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bone-faint">
            River Crossing
          </p>
          <h2 className="gold-text mt-2 font-display text-3xl font-semibold">
            {champion.name}
          </h2>
          <p className="mt-1 text-sm text-bone-mut">
            {champion.title} · Ultimate: {champion.ultimate.name}
          </p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-bone-faint">
            Lead the charge. Cut through the enemy line, keep your shield ready,
            and let your Glory multiply with every unbroken streak.
          </p>
          <button onClick={start} className="btn-gold mt-6 px-8 py-3 text-sm">
            Sound the horns
          </button>
        </div>
      )}
    </div>
  );
}
