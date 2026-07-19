import "server-only";

/* Keyless, real market data from DexScreener with a small in-memory cache.
   Never fabricated; when the well is dry we return null and the UI says so. */

export interface TokenCard {
  symbol: string;
  name: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  chain: string | null;
  address: string | null;
  url: string | null;
  fetchedAt: number;
}

const cache = new Map<string, TokenCard | null>();
const timestamps = new Map<string, number>();
const TTL_MS = 60_000;

export async function lookupToken(query: string): Promise<TokenCard | null> {
  const q = query.trim().replace(/^\$/, "").toLowerCase();
  if (!q) return null;
  const at = timestamps.get(q);
  if (at && Date.now() - at < TTL_MS) return cache.get(q) ?? null;

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(String(res.status));
    const body = (await res.json()) as {
      pairs?: Array<{
        baseToken?: { symbol?: string; name?: string; address?: string };
        priceUsd?: string;
        priceChange?: { h24?: number };
        volume?: { h24?: number };
        marketCap?: number;
        fdv?: number;
        chainId?: string;
        url?: string;
        liquidity?: { usd?: number };
      }>;
    };
    const pairs = (body.pairs ?? [])
      .filter(
        (p) => p.baseToken?.symbol?.toLowerCase() === q || q.length > 10
      )
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const p = pairs[0] ?? (body.pairs ?? [])[0];
    if (!p || !p.baseToken?.symbol) {
      cache.set(q, null);
      timestamps.set(q, Date.now());
      return null;
    }
    const card: TokenCard = {
      symbol: p.baseToken.symbol.toUpperCase(),
      name: p.baseToken.name ?? p.baseToken.symbol,
      priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
      change24h: p.priceChange?.h24 ?? null,
      volume24h: p.volume?.h24 ?? null,
      marketCap: p.marketCap ?? p.fdv ?? null,
      chain: p.chainId ?? null,
      address: p.baseToken.address ?? null,
      url: p.url ?? null,
      fetchedAt: Date.now(),
    };
    cache.set(q, card);
    timestamps.set(q, Date.now());
    return card;
  } catch {
    return cache.get(q) ?? null;
  }
}

export function describeTokenForRaven(card: TokenCard): string {
  const parts = [
    `Token ${card.symbol} (${card.name})`,
    card.priceUsd !== null ? `price $${card.priceUsd}` : "price unknown",
    card.change24h !== null ? `24h change ${card.change24h}%` : "",
    card.marketCap !== null ? `market cap $${Math.round(card.marketCap)}` : "",
    card.volume24h !== null ? `24h volume $${Math.round(card.volume24h)}` : "",
    card.chain ? `chain ${card.chain}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}
