export type NavItem = {
  slug: string;
  href: string;
  themed: string;
  plain: string;
  icon: string;
  blurb?: string;
};

export const liveNav: NavItem[] = [
  { slug: "home", href: "/home", themed: "The Ravenry", plain: "Home", icon: "home" },
  { slug: "explore", href: "/explore", themed: "Explore", plain: "Discover", icon: "compass" },
  { slug: "rookery", href: "/rookery", themed: "The Rookery", plain: "Live", icon: "signal" },
  { slug: "messages", href: "/messages", themed: "Messages", plain: "DMs & Chats", icon: "mail" },
  { slug: "ledger", href: "/ledger", themed: "The Ledger", plain: "Portfolio", icon: "book" },
  { slug: "watch", href: "/watch", themed: "The Watch", plain: "Safety", icon: "shield" },
  { slug: "scrying", href: "/scrying", themed: "The Scrying Glass", plain: "Smart Money", icon: "eye" },
  { slug: "raven", href: "/raven", themed: "The Raven", plain: "AI Companion", icon: "raven" },
  { slug: "houses", href: "/houses", themed: "Houses", plain: "Guilds", icon: "banner" },
  { slug: "wars", href: "/wars", themed: "Throne Wars", plain: "Season 1", icon: "swords" },
  { slug: "standing", href: "/standing", themed: "Badges & Standing", plain: "Reputation", icon: "medal" },
  { slug: "bookmarks", href: "/bookmarks", themed: "Bookmarks", plain: "Saved", icon: "bookmark" },
  { slug: "banners", href: "/banners", themed: "Raise Your Banners", plain: "Refer & Earn", icon: "flag" },
  { slug: "chronicle", href: "/chronicle", themed: "The Chronicle", plain: "Docs", icon: "scroll" },
  { slug: "wallet", href: "/wallet", themed: "Wallet", plain: "Assets & Keys", icon: "wallet" },
  { slug: "settings", href: "/settings", themed: "Settings", plain: "Preferences", icon: "sliders" },
];

export const comingSoonNav: NavItem[] = [
  {
    slug: "mint",
    href: "/soon/mint",
    themed: "The Mint",
    plain: "Trading",
    icon: "coin",
    blurb: "Trade any token across chains, shielded from MEV, gasless.",
  },
  {
    slug: "forge",
    href: "/soon/forge",
    themed: "The Forge",
    plain: "Staking",
    icon: "flame",
    blurb: "Swear an oath. Earn real yield from protocol fees, not emissions.",
  },
  {
    slug: "prophecies",
    href: "/soon/prophecies",
    themed: "Prophecies",
    plain: "Prediction Markets",
    icon: "orb",
    blurb: "Call the market. Win the realm.",
  },
  {
    slug: "raven-agent",
    href: "/soon/raven-agent",
    themed: "The Raven, Unbound",
    plain: "Autonomous Agent",
    icon: "raven",
    blurb: "Your all-seeing agent that trades, watches and hunts alpha for you.",
  },
  {
    slug: "long-night",
    href: "/soon/long-night",
    themed: "The Long Night",
    plain: "Co-op Survival",
    icon: "wall",
    blurb: "When the market crashes, the realm holds the Wall together.",
  },
];

export const bottomNav = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/rookery", label: "Live", icon: "signal" },
  { href: "/messages", label: "Messages", icon: "mail" },
  { href: "/wallet", label: "Wallet", icon: "wallet" },
];

export function findComingSoon(slug: string) {
  return comingSoonNav.find((i) => i.slug === slug);
}
