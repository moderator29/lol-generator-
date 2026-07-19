import { json } from "@/lib/auth/server";

interface GoldRushItem {
  contract_ticker_symbol: string | null;
  contract_name: string | null;
  contract_decimals: number | null;
  balance: string | null;
  quote: number | null;
  logo_url: string | null;
}

function formatBalance(raw: string, decimals: number): string {
  const num = Number(raw) / Math.pow(10, decimals);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1000) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export async function GET(req: Request) {
  const key = process.env.GOLDRUSH_API_KEY;
  if (!key) return json({ configured: false });

  const url = new URL(req.url);
  const address = url.searchParams.get("address");
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return json({ configured: true, error: "invalid address" }, 400);
  }

  try {
    const res = await fetch(
      `https://api.covalenthq.com/v1/eth-mainnet/address/${address}/balances_v2/?key=${key}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return json({ configured: true, error: "unreachable" }, 502);

    const body = (await res.json()) as {
      data?: { items?: GoldRushItem[] };
    };
    const rawItems = body.data?.items ?? [];

    const items = rawItems
      .filter((it) => (it.quote ?? 0) > 0.5)
      .map((it) => ({
        symbol: it.contract_ticker_symbol ?? "?",
        name: it.contract_name ?? "Unknown token",
        balance: formatBalance(it.balance ?? "0", it.contract_decimals ?? 18),
        quoteUsd: it.quote ?? 0,
        logo: it.logo_url ?? null,
      }))
      .sort((a, b) => b.quoteUsd - a.quoteUsd);

    const totalUsd = items.reduce((sum, it) => sum + it.quoteUsd, 0);

    return json({ configured: true, items, totalUsd });
  } catch {
    return json({ configured: true, error: "unreachable" }, 502);
  }
}
