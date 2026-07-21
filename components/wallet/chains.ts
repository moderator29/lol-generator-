/* Lightweight EVM chain metadata for the wallet experience. The realm's
   embedded wallets are Ethereum (see components/providers.tsx), so we read the
   wallet's live chainId and describe it here. Unknown chains degrade honestly
   to a generic native-coin label rather than guessing. */

export interface ChainMeta {
  id: number;
  name: string;
  symbol: string;
  explorer?: string;
}

const CHAINS: Record<number, ChainMeta> = {
  1: { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io" },
  8453: { id: 8453, name: "Base", symbol: "ETH", explorer: "https://basescan.org" },
  84532: {
    id: 84532,
    name: "Base Sepolia",
    symbol: "ETH",
    explorer: "https://sepolia.basescan.org",
  },
  11155111: {
    id: 11155111,
    name: "Sepolia",
    symbol: "ETH",
    explorer: "https://sepolia.etherscan.io",
  },
  10: {
    id: 10,
    name: "Optimism",
    symbol: "ETH",
    explorer: "https://optimistic.etherscan.io",
  },
  42161: {
    id: 42161,
    name: "Arbitrum",
    symbol: "ETH",
    explorer: "https://arbiscan.io",
  },
  137: {
    id: 137,
    name: "Polygon",
    symbol: "POL",
    explorer: "https://polygonscan.com",
  },
};

/* Parse Privy's CAIP-2 chainId ("eip155:1") or a raw / hex id into a number. */
export function parseChainId(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const tail = raw.includes(":") ? raw.split(":").pop()! : raw;
  const n = tail.startsWith("0x") ? parseInt(tail, 16) : parseInt(tail, 10);
  return Number.isFinite(n) ? n : null;
}

export function chainMetaFor(id: number | null): ChainMeta {
  if (id !== null && CHAINS[id]) return CHAINS[id];
  return {
    id: id ?? 0,
    name: id ? `Chain ${id}` : "Unknown network",
    symbol: "coin",
  };
}

export function txExplorerUrl(meta: ChainMeta, hash: string): string | null {
  return meta.explorer ? `${meta.explorer}/tx/${hash}` : null;
}

export function addressExplorerUrl(
  meta: ChainMeta,
  address: string
): string | null {
  return meta.explorer ? `${meta.explorer}/address/${address}` : null;
}

/* Middle-truncate an address for compact display. */
export function shortAddress(addr: string, lead = 6, tail = 4): string {
  if (addr.length <= lead + tail + 2) return addr;
  return `${addr.slice(0, lead)}...${addr.slice(-tail)}`;
}
