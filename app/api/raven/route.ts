import { requireProfile, json } from "@/lib/auth/server";
import { askRaven, ravenEnabled } from "@/lib/ai/raven";
import { lookupToken, describeTokenForRaven } from "@/lib/data/tokens";

/* Per-instance rate limit: the Raven's mind costs real coin. */
const usage = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 3600_000;
const MAX_PER_WINDOW = 20;

type WalletHolding = { symbol: string; balance: number | null; quoteUsd: number | null };
type WalletCard = { address: string; totalUsd: number | null; holdings: WalletHolding[] };

/* Real, keyed wallet holdings via GoldRush (Covalent). Never fabricated:
   without a key, or when the well is dry, we simply return null. */
async function lookupWallet(address: string): Promise<WalletCard | null> {
  const key = process.env.GOLDRUSH_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.covalenthq.com/v1/eth-mainnet/address/${address}/balances_v2/?key=${key}`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data?: {
        items?: Array<{
          contract_ticker_symbol?: string | null;
          contract_decimals?: number | null;
          balance?: string | null;
          quote?: number | null;
        }>;
      };
    };
    const items = body.data?.items ?? [];
    let totalUsd = 0;
    for (const it of items) if (typeof it.quote === "number") totalUsd += it.quote;
    const holdings: WalletHolding[] = items
      .filter((it) => (it.contract_ticker_symbol ?? "").length > 0)
      .sort((a, b) => (b.quote ?? 0) - (a.quote ?? 0))
      .slice(0, 5)
      .map((it) => {
        const dec =
          typeof it.contract_decimals === "number" ? it.contract_decimals : 18;
        const raw = it.balance ? Number(it.balance) : NaN;
        const balance = Number.isFinite(raw) ? raw / 10 ** dec : null;
        return {
          symbol: (it.contract_ticker_symbol ?? "?").toUpperCase(),
          balance,
          quoteUsd: typeof it.quote === "number" ? it.quote : null,
        };
      });
    return {
      address,
      totalUsd: items.length ? totalUsd : null,
      holdings,
    };
  } catch {
    return null;
  }
}

function describeWalletForRaven(w: WalletCard): string {
  const head = `Wallet ${w.address}${
    w.totalUsd !== null ? ` holds about $${Math.round(w.totalUsd)} total` : ""
  }`;
  const body = w.holdings
    .map(
      (h) =>
        `${h.symbol}${h.quoteUsd !== null ? ` ($${Math.round(h.quoteUsd)})` : ""}`
    )
    .join(", ");
  return body ? `${head}. Top holdings: ${body}.` : `${head}.`;
}

export async function POST(req: Request) {
  if (!ravenEnabled())
    return json(
      { error: "The Raven sleeps: its mind is not configured in this environment." },
      503
    );

  const profile = await requireProfile(req);
  if (!profile)
    return json(
      { error: "The Raven speaks only to members of the realm. Enter first." },
      401
    );

  const now = Date.now();
  const u = usage.get(profile.id);
  if (!u || now - u.windowStart > WINDOW_MS) {
    usage.set(profile.id, { count: 1, windowStart: now });
  } else if (u.count >= MAX_PER_WINDOW) {
    return json(
      { error: "The Raven grows hoarse. Return within the hour." },
      429
    );
  } else {
    u.count += 1;
  }

  const body = (await req.json().catch(() => null)) as {
    messages?: { role: "user" | "assistant"; content: string }[];
  } | null;
  const messages = (body?.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return json({ error: "Say something to the Raven" }, 400);

  const lastUser = messages[messages.length - 1].content;
  const cashtags = [...lastUser.matchAll(/\$([a-zA-Z0-9]{2,12})/g)].map(
    (m) => m[1]
  );
  const contexts: string[] = [];
  const cards = [];
  for (const tag of cashtags.slice(0, 3)) {
    const card = await lookupToken(tag);
    if (card) {
      contexts.push(describeTokenForRaven(card));
      cards.push(card);
    } else {
      contexts.push(`Token $${tag.toUpperCase()}: no live data found.`);
    }
  }

  let walletCard: WalletCard | null = null;
  const addrMatch = lastUser.match(/0x[a-fA-F0-9]{40}/);
  if (addrMatch) {
    walletCard = await lookupWallet(addrMatch[0]);
    if (walletCard) contexts.push(describeWalletForRaven(walletCard));
  }

  const reply = await askRaven(
    messages,
    contexts.length ? contexts.join("\n") : undefined
  );
  if (!reply)
    return json({ error: "The Raven is preoccupied. Try again shortly." }, 502);
  return json({ reply, cards, walletCard });
}
