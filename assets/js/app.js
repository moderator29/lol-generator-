/* Havnora shared runtime: theme, nav, favorites, card rendering,
   quick view, footer, toasts. No dependencies. */

/* ---------- launch placeholders (Phase 9): fill after launch ---------- */
const CONTACT = {
  email: "", supportEmail: "", salesEmail: "", phone: "",
  instagram: "", facebook: "", x: "", tiktok: "", linkedin: "", youtube: "",
  address: "", hours: ""
};

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const fmtPrice = n => "$" + n.toLocaleString("en-US");
const fmtNum = n => n.toLocaleString("en-US");
const fmtShort = n => n >= 1e6 ? "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : "$" + Math.round(n / 1e3) + "K";
const perSqft = p => p.sqft ? Math.round(p.price / p.sqft) : 0;
const byId = id => PROPERTIES.find(p => p.id === id);
const toneOf = p => "tone-" + (parseInt(p.id.slice(-3), 10) % 6);

const BADGE_CLASS = {
  "For Sale": "badge-sale", "New Listing": "badge-new", "Open House": "badge-open",
  "Pending": "badge-pending", "Price Cut": "badge-cut"
};

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-8.6C1.1 8.3 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3c.7-1.2 2.1-2.3 4.1-2.3 3.4 0 5.3 3.3 3.7 6.4C19 15.6 12 20 12 20z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h11V21L12 16.8 6.5 21z"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

const LOGO_MARK = `
<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="hvGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0DA9E"/>
      <stop offset="0.5" stop-color="#D4A94E"/>
      <stop offset="1" stop-color="#9C7426"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="40" height="40" rx="11" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.6"/>
  <path d="M14.5 12l7 3.2v21.3l-7-3.2z" fill="url(#hvGold)"/>
  <rect x="25.5" y="26.5" width="3.4" height="8" rx="1" fill="currentColor" opacity="0.4"/>
  <rect x="30.5" y="21.5" width="3.4" height="13" rx="1" fill="currentColor" opacity="0.55"/>
  <path d="M35.5 16.5l4.5-2.2v20.4l-4.5-1.8z" fill="currentColor" opacity="0.3"/>
</svg>`;

/* ---------- persistent stores ---------- */
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem("havnora:" + key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("havnora:" + key, JSON.stringify(value)); } catch { /* private mode */ }
  }
};

const favorites = {
  all: () => store.get("favorites", []),
  has: id => favorites.all().includes(id),
  toggle(id) {
    const list = favorites.all();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    store.set("favorites", list);
    return i < 0;
  }
};

/* ---------- theme ---------- */
function initTheme() {
  const saved = store.get("theme", null);
  document.documentElement.dataset.theme = saved || "dark";
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store.set("theme", next);
}
initTheme();

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  let el = $(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 2600);
}

/* ---------- nav + footer ---------- */
function renderNav(current) {
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="logo" href="index.html" aria-label="Havnora home">${LOGO_MARK}<span>HAVNORA</span></a>
      <nav class="nav-links" aria-label="Primary">
        <a href="index.html" ${current === "home" ? 'aria-current="page"' : ""}>Home</a>
        <a href="search.html" ${current === "search" ? 'aria-current="page"' : ""}>Buy</a>
        <a href="dashboard.html" ${current === "sell" ? 'aria-current="page"' : ""}>Sell</a>
        <a href="dashboard.html" ${current === "dashboard" ? 'aria-current="page"' : ""}>Dashboard</a>
      </nav>
      <div class="nav-cta">
        <button class="btn btn-icon btn-ghost" id="theme-toggle" aria-label="Toggle color theme" title="Toggle theme">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/></svg>
        </button>
        ${store.get("user", null)
          ? `<a class="btn btn-ghost" href="dashboard.html" title="Your dashboard">My Havnora</a>`
          : `<a class="btn btn-ghost" href="signin.html">Sign in</a>`}
        <a class="btn btn-primary" href="dashboard.html">List your home</a>
        <button class="btn btn-icon btn-ghost nav-toggle" aria-label="Open menu" aria-expanded="false">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>`;
  document.body.prepend(nav);

  $("#theme-toggle").addEventListener("click", toggleTheme);
  const burger = $(".nav-toggle");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  renderTabbar(current);
}

/* mobile bottom tab bar (styles hide it above 900px) */
function renderTabbar(current) {
  const user = store.get("user", null);
  const items = [
    { label: "Home", href: "index.html", key: "home", icon: ICONS.home },
    { label: "Search", href: "search.html", key: "search", icon: ICONS.eye },
    { label: "Saved", href: "dashboard.html", key: "dashboard", icon: ICONS.heart },
    { label: "Account", href: user ? "dashboard.html" : "signin.html", key: "account", icon: ICONS.bookmark }
  ];
  const bar = document.createElement("nav");
  bar.className = "tabbar";
  bar.setAttribute("aria-label", "Quick navigation");
  bar.innerHTML = items.map(it =>
    `<a href="${it.href}" ${current === it.key ? 'aria-current="page"' : ""}>${it.icon}<span>${it.label}</span></a>`
  ).join("");
  document.body.appendChild(bar);
}

function renderFooter() {
  const slot = (label, value) =>
    `<div class="slot"><span>${label}</span><i>${value || "Coming soon"}</i></div>`;
  const social = ["IG", "FB", "X", "TT", "IN", "YT"];
  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a class="logo" href="index.html">${LOGO_MARK}<span>HAVNORA</span></a>
          <p class="muted" style="margin-top:14px; max-width:280px; font-size:14.5px;">Find your haven. A clearer, calmer way to find, buy, and sell homes across America.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <div class="footer-links">
            <a href="search.html">Buy a home</a>
            <a href="dashboard.html">Sell a home</a>
            <a href="index.html#communities">Communities</a>
            <a href="index.html#faq">FAQ</a>
          </div>
        </div>
        <div>
          <h4>Company</h4>
          <div class="footer-links">
            <a href="index.html#why">Why Havnora</a>
            <a href="index.html#stories">Buyer stories</a>
            <a href="dashboard.html">For agents</a>
            <a href="dashboard.html">Admin</a>
          </div>
        </div>
        <div>
          <h4>Contact</h4>
          ${slot("Email", CONTACT.email)}
          ${slot("Support", CONTACT.supportEmail)}
          ${slot("Sales", CONTACT.salesEmail)}
          ${slot("Phone", CONTACT.phone)}
          ${slot("Office", CONTACT.address)}
          ${slot("Hours", CONTACT.hours)}
        </div>
      </div>
      <div class="footer-base">
        <span>© Havnora. Equal Housing Opportunity. Listings shown are design placeholders.</span>
        <div class="social-row" aria-label="Social media (links coming soon)">
          ${social.map(s => `<button class="btn btn-icon" aria-label="${s} link coming soon" title="Coming soon">${s}</button>`).join("")}
        </div>
      </div>
    </div>`;
  document.body.appendChild(footer);
  $$(".social-row .btn-icon", footer).forEach(b =>
    b.addEventListener("click", () => toast("Social links arrive at launch")));
}

/* ---------- property card ---------- */
function specHTML(p) {
  return `<span><b class="num">${p.beds}</b> bd</span>
    <span><b class="num">${p.baths}</b> ba</span>
    <span><b class="num">${fmtNum(p.sqft)}</b> sqft</span>`;
}

function propertyCard(p) {
  const card = document.createElement("article");
  card.className = "property-card reveal";
  card.innerHTML = `
    <a class="pc-media ${toneOf(p)}" href="property.html?id=${p.id}" aria-label="View ${p.address}, ${p.city}">
      ${p.images?.front ? `<img class="pc-img" src="${p.images.front.replace("w=1600", "w=800")}" alt="" loading="lazy" onerror="this.remove()" />` : `<span class="pc-art">${ICONS.home}</span>`}
      <span class="pc-badges">
        ${p.featured ? `<span class="badge badge-featured">Featured</span>` : ""}
        <span class="badge ${BADGE_CLASS[p.status] || ""}">${p.status}</span>
      </span>
    </a>
    <div class="pc-actions">
      <button class="btn-icon btn fav ${favorites.has(p.id) ? "is-active" : ""}" aria-label="Favorite this home" aria-pressed="${favorites.has(p.id)}">${ICONS.heart}</button>
      <button class="btn-icon btn quick" aria-label="Quick view">${ICONS.eye}</button>
      <button class="btn-icon btn save" aria-label="Save to a collection">${ICONS.bookmark}</button>
    </div>
    <div class="pc-body">
      <address class="pc-addr" style="font-style:normal"><b>${p.address}</b>${p.neighborhood}, ${p.city}, ${p.state}</address>
      <div class="pc-price num">${fmtPrice(p.price)}<span class="per num">$${perSqft(p)}/sqft</span></div>
      <div class="pc-specs num">
        <span class="spec-chip"><b>${p.beds}</b> Beds</span>
        <span class="spec-chip"><b>${p.baths}</b> Baths</span>
        <span class="spec-chip"><b>${fmtNum(p.sqft)}</b> sqft</span>
      </div>
      <div class="pay-row">
        <a class="pay-btn pay-down" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.downPayment)}</b><span>Down Payment</span></a>
        <a class="pay-btn pay-full" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.price)}</b><span>Full Payment</span></a>
      </div>
    </div>`;

  $(".fav", card).addEventListener("click", e => {
    const added = favorites.toggle(p.id);
    e.currentTarget.classList.toggle("is-active", added);
    e.currentTarget.setAttribute("aria-pressed", String(added));
    toast(added ? "Added to favorites" : "Removed from favorites");
  });
  $(".quick", card).addEventListener("click", () => quickView(p));
  $(".save", card).addEventListener("click", () => {
    if (!favorites.has(p.id)) favorites.toggle(p.id);
    toast("Saved. Find it in your dashboard");
  });
  return card;
}

/* ---------- quick view modal ---------- */
let quickModal;
function quickView(p) {
  if (!quickModal) {
    quickModal = document.createElement("dialog");
    quickModal.className = "modal";
    document.body.appendChild(quickModal);
  }
  quickModal.innerHTML = `
    <div class="modal-card" style="position:relative">
      <button class="btn btn-icon modal-close glass" aria-label="Close quick view">${ICONS.close}</button>
      <div class="pc-media ${toneOf(p)}" style="aspect-ratio:16/8">
        ${p.images?.front ? `<img class="pc-img" src="${p.images.front.replace("w=1600", "w=1000")}" alt="" loading="lazy" onerror="this.remove()" />` : `<span class="pc-art">${ICONS.home}</span>`}
        <span class="pc-badges">
          ${p.featured ? `<span class="badge badge-featured">Featured</span>` : ""}
          <span class="badge ${BADGE_CLASS[p.status] || ""}">${p.status}</span>
        </span>
      </div>
      <div style="padding:26px">
        <div class="pc-price num" style="font-size:28px">${fmtPrice(p.price)}<span class="per num">$${perSqft(p)}/sqft</span></div>
        <p class="pc-addr" style="margin:6px 0 10px"><b style="display:inline">${p.address}</b> · ${p.city}, ${p.state} ${p.zip}</p>
        <div class="pc-specs num" style="margin-bottom:14px">${specHTML(p)}<span><b>${p.type}</b></span><span>Built <b class="num">${p.yearBuilt}</b></span></div>
        <p class="muted" style="font-size:14.5px">${p.blurb}</p>
        <div class="pay-row" style="margin-top:16px">
          <a class="pay-btn pay-down" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.downPayment)}</b><span>Down Payment</span></a>
          <a class="pay-btn pay-full" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.price)}</b><span>Full Payment</span></a>
        </div>
        <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap">
          <a class="btn btn-primary" href="property.html?id=${p.id}">View full listing</a>
          <button class="btn" data-close>Keep browsing</button>
        </div>
      </div>
    </div>`;
  $(".modal-close", quickModal).addEventListener("click", () => quickModal.close());
  $("[data-close]", quickModal).addEventListener("click", () => quickModal.close());
  quickModal.addEventListener("click", e => { if (e.target === quickModal) quickModal.close(); });
  quickModal.showModal();
}

/* ---------- reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (en.isIntersecting) { en.target.classList.add("is-in"); revealObserver.unobserve(en.target); }
  }
}, { threshold: 0.12, rootMargin: "0px 0px -20px" });

function observeReveals(root = document) {
  $$(".reveal", root).forEach(el => revealObserver.observe(el));
}

/* ---------- recently viewed ---------- */
function trackViewed(id) {
  const list = store.get("recent", []).filter(x => x !== id);
  list.unshift(id);
  store.set("recent", list.slice(0, 8));
}

/* ---------- bookings + manager conversations (local-first) ---------- */
function getBookings() { return store.get("bookings", []); }
function addBooking(propertyId, date, time, note) {
  const list = getBookings();
  const booking = { id: "b" + Date.now(), propertyId, date, time, note: note || "", status: "pending", createdAt: Date.now() };
  list.unshift(booking);
  store.set("bookings", list);
  if (typeof hvApi !== "undefined") hvApi.bookViewing(propertyId, date, time, note);
  return booking;
}

function getConversations() { return store.get("conversations", []); }
function saveConversations(list) { store.set("conversations", list); }
/* find or create the conversation for a property, then open the chat */
function messageManagerAbout(propertyId) {
  const list = getConversations();
  let convo = propertyId ? list.find(c => c.propertyId === propertyId) : null;
  if (!convo) {
    const p = propertyId ? byId(propertyId) : null;
    convo = {
      id: "c" + Date.now(),
      propertyId: propertyId || null,
      subject: p ? `${p.address}, ${p.city}` : "General inquiry",
      createdAt: Date.now(),
      messages: []
    };
    list.unshift(convo);
    saveConversations(list);
    if (typeof hvApi !== "undefined") {
      hvApi.startConversation(propertyId, convo.subject).then(remote => {
        if (!remote) return;
        const l = getConversations();
        const c = l.find(x => x.id === convo.id);
        if (c) { c.remoteId = remote.id; saveConversations(l); }
      });
    }
  }
  location.href = "messages.html?c=" + convo.id;
}
