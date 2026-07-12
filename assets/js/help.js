/* Solhaven help system: topic content, glass help modal, and the small
   circular "?" buttons that open it. No dependencies. Styling for
   .help-btn, .help-modal, .help-tabs, and .help-list lives in main.css. */

window.HELP_TOPICS = {
  "search-filters": {
    title: "Search filters",
    intro: "Filters narrow the listings on the search page so you only see homes that fit your life, not everything on the market.",
    tabs: {
      how: [
        "Every filter applies instantly on this page. There is no submit button and no page reload.",
        "Filters combine, so price, beds, baths, home type, and city all narrow the same set of listings together.",
        "The results count updates as you go, and the map and list stay in sync with your choices."
      ],
      use: [
        "Start broad with a price range, then add beds and baths once you can see the shape of the market.",
        "Use the home type control to compare, for example, condos against single family homes in the same area.",
        "If results thin out too far, clear one filter at a time rather than starting over."
      ],
      why: [
        "A shortlist of eight right homes beats a scroll of eighty wrong ones.",
        "Filtering early keeps your favorites list honest, so the homes you save are homes you would actually tour."
      ]
    }
  },

  map: {
    title: "The map",
    intro: "The map shows where each listing sits, because in real estate the where matters as much as the what.",
    tabs: {
      how: [
        "Each pin is a listing from your current filtered results. Change a filter and the pins change with it.",
        "Hovering a card highlights its pin, and hovering a pin highlights its card, so list and map read as one view.",
        "This preview uses a simplified schematic map. Full street level mapping arrives at launch."
      ],
      use: [
        "Click a pin to see the home it marks, then open the full listing from there.",
        "Sweep the map with your eye before you sort by price. Clusters of pins usually mean a neighborhood worth a closer look."
      ],
      why: [
        "Two identical homes a mile apart can live very different lives. Commute, schools, and quiet all come down to location.",
        "Seeing results spatially surfaces neighborhoods you might never have typed into a search box."
      ]
    }
  },

  favorites: {
    title: "Favorites",
    intro: "Favorites is your personal shortlist, the homes you want to keep an eye on while you decide.",
    tabs: {
      how: [
        "Tap the heart on any card or listing to add it. Tap again to remove it.",
        "Favorites are stored on this device in your browser, so they persist between visits without an account.",
        "Because they live on this device, they will not follow you to another browser or phone yet. Synced accounts arrive at launch."
      ],
      use: [
        "Heart anything that clears your bar on a first pass. Pruning later is easier than re-finding.",
        "Review your full list anytime in the dashboard, where you can compare and remove in one place."
      ],
      why: [
        "Good homes move fast. A shortlist means you compare deliberately instead of relying on memory.",
        "Watching a small set over a week or two teaches you the market faster than any single browsing session."
      ]
    }
  },

  "quick-view": {
    title: "Quick view",
    intro: "Quick view opens the essentials of a listing in a small overlay, so you can triage without leaving the page.",
    tabs: {
      how: [
        "Click the eye icon on any property card to open it.",
        "You get price, beds, baths, square footage, year built, and a short description at a glance.",
        "Close it with the close button, the Escape key, or a click outside the card. Your scroll position is preserved."
      ],
      use: [
        "Use quick view to decide whether a home earns a full click. It keeps browsing fast.",
        "If it holds your interest, the button inside takes you straight to the full listing."
      ],
      why: [
        "Most homes are a no within five seconds. Quick view respects that and keeps you moving.",
        "Fewer full page detours means your search session stays focused and your comparisons stay fresh."
      ]
    }
  },

  tours: {
    title: "Home tours",
    intro: "A tour request tells the listing agent you want to see a home in person or over video.",
    tabs: {
      how: [
        "Pick a day and time on the listing page and send the request. No commitment is made until the agent confirms.",
        "The agent confirms your slot, usually within the hour during business hours.",
        "In this preview the listings are design placeholders, so requests are illustrative rather than booked."
      ],
      use: [
        "Request an in person tour when you are serious, and a video tour when you are still shortlisting from a distance.",
        "Add a note with anything you want the agent to cover, like the roof age or the neighbors at 5 pm."
      ],
      why: [
        "Photos flatter and floor plans flatten. Light, noise, and flow only reveal themselves in person.",
        "An hour of walking a home can save you from a decade in the wrong one."
      ]
    }
  },

  "mortgage-calculator": {
    title: "Mortgage calculator",
    intro: "The calculator turns a list price into a monthly number you can actually weigh against your budget.",
    tabs: {
      how: [
        "It combines price, down payment, interest rate, and loan term into an estimated monthly payment.",
        "Estimates for property tax and insurance are included and labeled as estimates. Your actual figures will differ.",
        "Every number updates live as you move the controls. Nothing is submitted anywhere."
      ],
      use: [
        "Try a few down payment levels and watch how the monthly figure moves. The slope is often the real lesson.",
        "Test a rate half a point above today's to see whether the home still fits if the market shifts.",
        "Treat the result as a planning figure, then confirm real numbers with a lender before you offer."
      ],
      why: [
        "You live with the monthly payment, not the list price.",
        "Knowing your ceiling before you fall for a home keeps the decision yours instead of the market's."
      ]
    }
  },

  gallery: {
    title: "Photo gallery",
    intro: "The gallery walks you through a home room by room before you ever set foot inside.",
    tabs: {
      how: [
        "Use the arrow buttons or your keyboard's arrow keys to move between images. Thumbnails jump straight to a shot.",
        "The counter shows where you are in the set, so you always know how much is left.",
        "In this preview, photos are elegant placeholder tiles. Real photography arrives with real listings at launch."
      ],
      use: [
        "Go through the full set once quickly, then return to kitchens, baths, and any room that felt off.",
        "Note what is not pictured. Missing rooms are worth a question on your tour."
      ],
      why: [
        "Photos are the first honest and the first flattering thing about a listing at the same time.",
        "A careful read of the gallery sharpens the questions you bring to a showing."
      ]
    }
  },

  "walk-score": {
    title: "Walkability",
    intro: "The walkability score summarizes how much of daily life you can reach on foot from a home.",
    tabs: {
      how: [
        "It reflects proximity to everyday destinations like groceries, schools, parks, and transit.",
        "Higher means more errands on foot. Lower usually means the car is part of the plan.",
        "The scores shown here are estimates for placeholder listings and are labeled as such."
      ],
      use: [
        "Compare scores between your favorites rather than reading any single number in isolation.",
        "Pair the score with the map. A good score with a park two blocks away is a different life than a good score beside a highway."
      ],
      why: [
        "You buy the errands, the school run, and the evening walk along with the house.",
        "Walkable streets tend to hold their appeal, and their value, over time."
      ]
    }
  },

  "saved-searches": {
    title: "Saved searches",
    intro: "A saved search remembers a set of filters so the looking keeps happening even when you are not.",
    tabs: {
      how: [
        "Set your filters on the search page, then save them under a name you will recognize.",
        "Saved searches are stored on this device in your browser and appear in your dashboard.",
        "At launch, saved searches will pair with alerts so new matches come to you."
      ],
      use: [
        "Save one search per real scenario, such as one for each neighborhood or one per budget tier.",
        "Name them plainly. Three months from now, a clear name beats a clever one.",
        "Rerun a saved search from the dashboard anytime with one click."
      ],
      why: [
        "Rebuilding the same six filters every visit is how good listings get missed.",
        "A steady search, run consistently, gives you a truer picture of the market than scattered browsing."
      ]
    }
  },

  "seller-dashboard": {
    title: "Seller dashboard",
    intro: "The seller dashboard is your window into how your listing is performing and what happens next.",
    tabs: {
      how: [
        "It gathers views, saves, and tour requests for your home into one calm page.",
        "Interest trends over time, so you can see whether attention is building or settling.",
        "The figures in this preview are sample data. Your live listing will show real activity at launch."
      ],
      use: [
        "Check in weekly rather than hourly. Trends carry meaning that single days do not.",
        "Plenty of views but few saves often points to price. Plenty of saves but few tours often points to photos or timing.",
        "Bring the dashboard to conversations with your agent. Shared numbers make better decisions."
      ],
      why: [
        "Selling a home is stressful mostly where it is opaque. Seeing the activity replaces worry with information.",
        "Early signals let you adjust price or presentation while attention is still fresh."
      ]
    }
  },

  "agent-pipeline": {
    title: "Agent pipeline",
    intro: "The pipeline is a working view of every client an agent is guiding, from first hello to keys in hand.",
    tabs: {
      how: [
        "Each client sits in a stage, from new lead through touring, offer, and closing.",
        "Clients move between stages as the relationship progresses, so the board always reflects reality.",
        "This preview is populated with sample clients to show the flow."
      ],
      use: [
        "Scan the board each morning and start with whoever has waited longest for a reply.",
        "Watch for stages that crowd up. A pile in touring with nothing in offer is a signal, not just a picture."
      ],
      why: [
        "In this business, a slow reply is often a lost client. The pipeline makes silence visible.",
        "Steady, deliberate follow up is what separates a practice from a scramble."
      ]
    }
  },

  "admin-tools": {
    title: "Admin tools",
    intro: "Admin tools are where the platform itself is looked after: listings, people, and overall health.",
    tabs: {
      how: [
        "Admins can review listings, manage member accounts, and watch platform activity in one place.",
        "Changes here affect what buyers and sellers see, so key actions ask for confirmation.",
        "This preview runs on sample data. Nothing you do here touches a live system."
      ],
      use: [
        "Work the review queue before browsing the metrics. Accuracy for buyers comes first.",
        "Use the activity view to spot the unusual, like a listing gathering flags or a sudden quiet spell."
      ],
      why: [
        "Every trustworthy marketplace is trustworthy because someone tends it.",
        "Buyers and sellers extend trust to Solhaven. Careful curation is how that trust is repaid."
      ]
    }
  },

  alerts: {
    title: "Alerts",
    intro: "Alerts watch the market for you and speak up when something you care about changes.",
    tabs: {
      how: [
        "Alerts attach to your saved searches and favorites, covering new matches, price changes, and status changes.",
        "Your preferences are stored on this device for now.",
        "Delivery by email arrives at launch. In this preview, alerts appear inside Solhaven."
      ],
      use: [
        "Turn on new match alerts for the one or two searches you check most.",
        "Price change alerts on favorites are the quiet workhorse. A price cut on a home you love is worth knowing the day it happens."
      ],
      why: [
        "The best homes in a good market do not wait for your next browsing session.",
        "A timely alert can be the difference between touring first and reading about the sale."
      ]
    }
  },

  "sign-in": {
    title: "Signing in",
    intro: "An account carries your favorites, searches, and alerts with you instead of leaving them on one device.",
    tabs: {
      how: [
        "Right now, favorites and recently viewed homes live in this browser on this device. No account is required to browse.",
        "Signing in links that activity to you, so it can follow you across devices at launch.",
        "Solhaven does not sell your personal information, and you can browse every listing without an account."
      ],
      use: [
        "Browse freely first. Create an account when you notice you keep coming back.",
        "Use an email you actually check, since tour confirmations and alerts will land there."
      ],
      why: [
        "House hunting happens on the couch, at lunch, and in line for coffee. Your shortlist should be in all three places.",
        "An account also lets agents pick up the thread of your search instead of starting from zero."
      ]
    }
  },

  communities: {
    title: "Communities",
    intro: "Community pages introduce the places behind the listings, one neighborhood at a time.",
    tabs: {
      how: [
        "Each community gathers its character, typical price range, and current listings in one view.",
        "The profiles draw on local data and are refined over time.",
        "Details in this preview are illustrative while the catalog is being built."
      ],
      use: [
        "Read a community page before you tour there. Ten minutes of context changes what you notice on the street.",
        "Compare two or three communities side by side before you commit your search to one."
      ],
      why: [
        "You can renovate a kitchen. You cannot renovate a neighborhood.",
        "Most people who love their home name the community first when asked why."
      ]
    }
  },

  stats: {
    title: "Market stats",
    intro: "Market stats condense listing activity into a few honest numbers, like median price and days on market.",
    tabs: {
      how: [
        "Figures are computed from the listings currently on Solhaven, so they shift as inventory shifts.",
        "Days on market counts from the day a home is listed here.",
        "In this preview the numbers describe placeholder listings and are meant to show the format, not the market."
      ],
      use: [
        "Use median price to anchor your budget for an area before you tour anything.",
        "Falling days on market means a quicker market. Have your financing conversation early if you see it."
      ],
      why: [
        "One number in context beats twenty listings skimmed in a hurry.",
        "Knowing the pace of a market tells you how decisively you will need to move."
      ]
    }
  },

  "price-history": {
    title: "Price history",
    intro: "Price history shows what a home has asked and sold for over time, which is often the most honest part of a listing.",
    tabs: {
      how: [
        "The timeline records listing prices, cuts, and past sales in order.",
        "Estimated values shown alongside are clearly labeled as estimates, not appraisals.",
        "Histories in this preview are illustrative while listings remain placeholders."
      ],
      use: [
        "Look at the gap between the original ask and today's price. A widening gap can mean a motivated seller.",
        "Several cuts in quick succession say more about pricing strategy than about the home itself.",
        "Compare the current ask against the last sale plus the years since. It frames what the seller is really asking for."
      ],
      why: [
        "The asking price is a hope. The history is a record.",
        "Reading it well helps you offer with confidence instead of guessing."
      ]
    }
  }
};

/* ---------- circular help button ---------- */
window.helpBtn = key =>
  `<button class="help-btn" data-help="${key}" aria-label="How this works">?</button>`;

/* ---------- help modal ---------- */
const HELP_TAB_LABELS = { how: "How it works", use: "How to use it", why: "Why it matters" };

const HELP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.6 9.2c.3-1.9 1.9-3 3.6-2.9 1.8.1 3.2 1.4 3.2 3 0 2.4-3.3 2.6-3.3 4.8"/><circle cx="12" cy="18" r="0.4" fill="currentColor"/></svg>';

let helpModal;

window.openHelp = function (key) {
  const topic = window.HELP_TOPICS[key];
  if (!topic) return;

  if (!helpModal) {
    helpModal = document.createElement("dialog");
    helpModal.className = "modal help-modal";
    document.body.appendChild(helpModal);
    helpModal.addEventListener("click", e => {
      if (e.target === helpModal) helpModal.close();
    });
  }

  helpModal.innerHTML = `
    <div class="modal-card" style="position:relative; padding:30px 28px 28px">
      <button class="btn btn-icon modal-close glass" aria-label="Close help">&#10005;</button>
      <div class="help-icon" aria-hidden="true">${HELP_ICON}</div>
      <h3 style="margin:14px 0 8px">${topic.title}</h3>
      <p class="muted" style="font-size:14.5px; line-height:1.55">${topic.intro}</p>
      <div class="seg help-tabs" role="group" aria-label="Help sections" style="margin:18px 0 14px">
        ${Object.keys(HELP_TAB_LABELS).map((tab, i) =>
          `<button type="button" data-tab="${tab}" aria-pressed="${i === 0}">${HELP_TAB_LABELS[tab]}</button>`
        ).join("")}
      </div>
      <ul class="help-list"></ul>
    </div>`;

  const list = helpModal.querySelector(".help-list");
  const tabs = [...helpModal.querySelectorAll(".help-tabs button")];

  const showTab = tab => {
    tabs.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
    list.innerHTML = (topic.tabs[tab] || []).map(item => `<li>${item}</li>`).join("");
  };

  tabs.forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
  showTab("how");

  const closeBtn = helpModal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => helpModal.close());

  helpModal.showModal();
  closeBtn.focus();
};

/* ---------- open any topic from data-help ---------- */
document.addEventListener("click", e => {
  const trigger = e.target.closest("[data-help]");
  if (!trigger) return;
  e.preventDefault();
  window.openHelp(trigger.dataset.help);
});
