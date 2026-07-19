import { json } from "@/lib/auth/server";

interface Boost {
  tokenAddress?: string;
  chainId?: string;
  url?: string;
  description?: string;
}

function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export async function GET() {
  try {
    const [boostsRes] = await Promise.all([
      fetch("https://api.dexscreener.com/token-boosts/top/v1", {
        next: { revalidate: 120 },
      }),
      fetch("https://api.dexscreener.com/latest/dex/search?q=ETH", {
        next: { revalidate: 120 },
      }).catch(() => null),
    ]);
    if (!boostsRes.ok) return json({ trending: [] });

    const boosts = (await boostsRes.json()) as Boost[];
    const trending = (Array.isArray(boosts) ? boosts : [])
      .slice(0, 12)
      .map((b) => {
        const addr = b.tokenAddress ?? "";
        const desc = (b.description ?? "").trim();
        return {
          name: desc ? desc.slice(0, 60) : shortAddress(addr),
          chain: b.chainId ?? "unknown",
          address: addr,
          url: b.url ?? (addr ? `https://dexscreener.com/search?q=${addr}` : ""),
        };
      })
      .filter((t) => t.address);

    return json({ trending });
  } catch {
    return json({ trending: [] });
  }
}
