import { json } from "@/lib/auth/server";

interface Check {
  label: string;
  status: "pass" | "caution" | "risk";
  detail?: string;
}

interface GoPlusToken {
  is_open_source?: string;
  owner_change_balance?: string;
  is_mintable?: string;
  is_honeypot?: string;
  buy_tax?: string;
  sell_tax?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = (url.searchParams.get("address") ?? "").toLowerCase();
  const chain = url.searchParams.get("chain") ?? "1";
  if (!/^0x[a-f0-9]{40}$/.test(address)) {
    return json({ error: "invalid address" }, 400);
  }

  try {
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${address}`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) {
      return json({ error: "The Watch could not reach the wall" }, 502);
    }

    const body = (await res.json()) as {
      result?: Record<string, GoPlusToken>;
    };
    const result = body.result ?? {};
    const token = result[address] ?? Object.values(result)[0];
    if (!token) {
      return json({ error: "No report for this contract" }, 404);
    }

    const buyTax = Number(token.buy_tax ?? 0) * 100 || 0;
    const sellTax = Number(token.sell_tax ?? 0) * 100 || 0;

    const checks: Check[] = [];
    let score = 100;

    if (token.is_open_source === "1") {
      checks.push({ label: "Contract verified", status: "pass" });
    } else {
      score -= 20;
      checks.push({
        label: "Contract unverified",
        status: "caution",
        detail: "Source code is not published",
      });
    }

    if (token.is_honeypot === "1") {
      score -= 70;
      checks.push({
        label: "Honeypot",
        status: "risk",
        detail: "Buys succeed but sells are blocked",
      });
    } else {
      checks.push({ label: "No honeypot detected", status: "pass" });
    }

    if (token.owner_change_balance === "1") {
      score -= 25;
      checks.push({
        label: "Owner can alter balances",
        status: "risk",
        detail: "Holder balances can be changed by the owner",
      });
    } else {
      checks.push({ label: "Balances beyond owner reach", status: "pass" });
    }

    if (token.is_mintable === "1") {
      score -= 15;
      checks.push({
        label: "Owner can mint",
        status: "caution",
        detail: "Supply can be inflated at will",
      });
    } else {
      checks.push({ label: "No open mint", status: "pass" });
    }

    if (buyTax > 10 || sellTax > 10) {
      score -= 10;
      checks.push({
        label: "Heavy trade tax",
        status: "caution",
        detail: `Buy ${buyTax.toFixed(1)}%, sell ${sellTax.toFixed(1)}%`,
      });
    } else {
      checks.push({
        label: "Trade taxes within reason",
        status: "pass",
        detail: `Buy ${buyTax.toFixed(1)}%, sell ${sellTax.toFixed(1)}%`,
      });
    }

    score = Math.max(0, Math.min(100, score));

    return json({ score, checks, raw: { buyTax, sellTax } });
  } catch {
    return json({ error: "The Watch could not reach the wall" }, 502);
  }
}
