type SectionMeta = {
  themed: string;
  plain: string;
  icon: string;
  description: string;
  emptyNote?: string;
};

export const sectionMeta: Record<string, SectionMeta> = {
  home: {
    themed: "The Ravenry",
    plain: "Home",
    icon: "home",
    description:
      "The feed of the realm. Posts, Calls with verified verdicts, live price cards and word from every House.",
    emptyNote: "The ravens carry no word yet. The feed opens with the social layer.",
  },
  explore: {
    themed: "Explore",
    plain: "Discover",
    icon: "compass",
    description:
      "Find creators, Houses, tokens and rising Calls across the realm.",
  },
  rookery: {
    themed: "The Rookery",
    plain: "Live",
    icon: "signal",
    description:
      "Live rooms hosted by creators. Listen, raise your hand, join the conversation.",
    emptyNote: "No rooms are live. The Rookery opens its doors soon.",
  },
  messages: {
    themed: "Messages",
    plain: "DMs & Chats",
    icon: "mail",
    description: "Direct messages, group chats and House halls.",
    emptyNote: "No conversations yet.",
  },
  ledger: {
    themed: "The Ledger",
    plain: "Portfolio",
    icon: "book",
    description:
      "Your command center. Net worth, PnL, cost basis and positions across Ethereum and beyond, from real on-chain data only.",
    emptyNote: "Connect a wallet to open your Ledger.",
  },
  watch: {
    themed: "The Watch",
    plain: "Safety",
    icon: "shield",
    description:
      "The realm's shield. Token and contract scans, approval audits and one-tap revoke, before danger reaches you.",
    emptyNote: "Connect a wallet and the Watch takes its post.",
  },
  scrying: {
    themed: "The Scrying Glass",
    plain: "Smart Money",
    icon: "eye",
    description:
      "See what the powerful see. Track top wallets and funds, their flows and their positions in real time.",
  },
  raven: {
    themed: "The Raven",
    plain: "AI Companion",
    icon: "raven",
    description:
      "Ask about any wallet, token or position in plain language. The Raven answers from real data, explains, and warns.",
    emptyNote: "The Raven awakens with your sign-in.",
  },
  houses: {
    themed: "Houses",
    plain: "Guilds",
    icon: "banner",
    description:
      "Band together. Found a House, raise its banner, and compete for territories in Throne Wars.",
    emptyNote: "No Houses stand yet. The first banners rise at launch.",
  },
  wars: {
    themed: "Throne Wars",
    plain: "Season 1",
    icon: "swords",
    description:
      "Houses battle for control of real market sectors through verified performance. Daily quests, weekly battles, a seasonal War for the Throne.",
    emptyNote: "Season 1 begins when the realm opens.",
  },
  standing: {
    themed: "Badges & Standing",
    plain: "Reputation",
    icon: "medal",
    description:
      "Reputation here is earned, never bought. Verified Calls, contribution and safety actions raise your Standing from Smallfolk toward King.",
  },
  bookmarks: {
    themed: "Bookmarks",
    plain: "Saved",
    icon: "bookmark",
    description: "Posts and Calls you have saved for later.",
    emptyNote: "Nothing saved yet.",
  },
  banners: {
    themed: "Raise Your Banners",
    plain: "Refer & Earn",
    icon: "flag",
    description:
      "Call your banners. Invite others to the realm and earn as they become active, with rewards that resist sybils by design.",
  },
  chronicle: {
    themed: "The Chronicle",
    plain: "Docs",
    icon: "scroll",
    description:
      "The written record of Ravenspire. What it is, how it works, and how the realm is governed.",
  },
  wallet: {
    themed: "Wallet",
    plain: "Assets & Keys",
    icon: "wallet",
    description:
      "Your non-custodial wallets. We never hold your keys or your funds; every action is signed by you.",
    emptyNote: "Sign in to create or connect a wallet.",
  },
  settings: {
    themed: "Settings",
    plain: "Preferences",
    icon: "sliders",
    description:
      "Account, profile, privacy, notifications, security, wallets and appearance.",
  },
};
