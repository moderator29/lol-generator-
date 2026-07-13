/* Havnora dashboard: black and gold app shell with a switchable main column
   and a live property details panel. Local-first; syncs through hvApi when a
   session exists. */

renderNav("dashboard");
renderFooter();

/* ---------- shared bits ---------- */

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const WIDE = () => matchMedia("(min-width: 1201px)").matches;

const dashMain = $("#dash-main");
const dashSide = $("#dash-side");
const dashDetails = $("#dash-details");

const SICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="3.5" width="7.4" height="7.4" rx="2"/><rect x="3.5" y="13.1" width="7.4" height="7.4" rx="2"/><rect x="13.1" y="13.1" width="7.4" height="7.4" rx="2"/></svg>',
  properties: ICONS.home,
  favorites: ICONS.heart,
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  bookings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="m9.5 14.5 2 2 3.5-3.7"/></svg>',
  payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15.5h4"/></svg>',
  analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M21 20H3.5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95a7 7 0 0 0-2.42-1.4L13.7 2.6h-3.4l-.39 2.54a7 7 0 0 0-2.42 1.4l-2.35-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.42 1.4l.39 2.54h3.4l.39-2.54a7 7 0 0 0 2.42-1.4l2.35.95 2-3.46-2-1.55c.09-.46.14-.92.14-1.4z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.1 7-11.2A7 7 0 0 0 5 9.8C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.6" r="2.5"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18 18 6M9 6h9v9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'
};

const currentUser = () => store.get("user", null);
/* Guests can still pick a display name; it lives under its own key so
   the stored "user" record keeps mirroring the real session. */
const guestName = () => store.get("guestName", "");
const displayName = () => { const u = currentUser(); return u?.name || u?.email || guestName(); };

function firstName() {
  const u = currentUser();
  if (u?.name) return u.name.trim().split(/\s+/)[0];
  if (u?.email) return u.email.split("@")[0];
  if (guestName()) return guestName().trim().split(/\s+/)[0];
  return "Guest";
}
function initials() {
  const base = displayName() || "Guest";
  const parts = base.trim().split(/[\s.@_-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "G") + (parts[1]?.[0] || "")).toUpperCase();
}
function activeBookings() { return getBookings().filter(b => b.status !== "cancelled"); }

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDay = d => {
  const dt = new Date(d + "T12:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* small photo helper: tone gradient behind, image removes itself on error */
function photo(p, key, w) {
  const src = p.images?.[key];
  return `<span class="${toneOf(p)}" style="position:absolute; inset:0; display:block;"></span>` +
    (src ? `<img src="${src.replace("w=1600", "w=" + (w || 600))}" alt="" loading="lazy" onerror="this.remove()">` : "");
}

/* ---------- count-up ---------- */

function animateCounts(root) {
  $$("[data-count]", root).forEach(el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const suffix = el.dataset.suffix || "";
    const paint = v => { el.textContent = fmtNum(parseFloat(v.toFixed(dec))) + suffix; };
    if (REDUCED) { paint(target); return; }
    const t0 = performance.now(), dur = 900;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      paint(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- sidebar ---------- */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "properties", label: "Properties" },
  { key: "favorites", label: "Favorites" },
  { key: "messages", label: "Messages", href: "messages.html" },
  { key: "bookings", label: "Bookings" },
  { key: "payments", label: "Payments" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" }
];

function buildSidebar() {
  const user = currentUser();
  dashSide.innerHTML = `
    <div class="side-logo">${LOGO_MARK}<span>HAVNORA</span></div>
    <nav class="snav" aria-label="Dashboard sections">
      ${NAV_ITEMS.map(it => it.href
        ? `<a class="sn-item" href="${it.href}">${SICONS[it.key]}<span>${it.label}</span></a>`
        : `<button type="button" class="sn-item" data-view="${it.key}">${SICONS[it.key]}<span>${it.label}</span></button>`
      ).join("")}
    </nav>
    <div class="side-user">
      <div class="side-who">
        <span class="side-ava" aria-hidden="true">${initials()}</span>
        <div>
          <b>${esc(displayName() || "Guest")}</b>
          <span>Premium</span>
        </div>
      </div>
      ${user
        ? `<button type="button" class="btn btn-sm" id="side-signout">Sign out</button>`
        : `<a class="btn btn-sm" href="signin.html">Sign in</a>`}
    </div>`;
  $$("[data-view]", dashSide).forEach(b =>
    b.addEventListener("click", () => switchView(b.dataset.view)));
  const out = $("#side-signout", dashSide);
  if (out) out.addEventListener("click", () => hvAuth.signOut().finally(() => location.reload()));
}

function markActive(name) {
  $$(".sn-item", dashSide).forEach(el =>
    el.classList.toggle("is-active", el.dataset.view === name));
}

/* ---------- view switching ---------- */

let currentView = "dashboard";

const VIEWS = {
  dashboard: renderDashboardView,
  properties: renderPropertiesView,
  favorites: renderFavoritesView,
  bookings: renderBookingsView,
  payments: renderPaymentsView,
  analytics: renderAnalyticsView,
  settings: renderSettingsView
};

function switchView(name, instant) {
  if (!VIEWS[name]) name = "dashboard";
  currentView = name;
  markActive(name);
  try { history.replaceState({}, "", "dashboard.html?view=" + name); } catch { /* file:// preview */ }
  const paint = () => {
    VIEWS[name]();
    stagger();
    dashMain.classList.remove("is-switching");
  };
  if (instant || REDUCED) { paint(); return; }
  dashMain.classList.add("is-switching");
  setTimeout(paint, 150);
}

function refreshView() { VIEWS[currentView](); stagger(); }

function stagger() {
  $$(".dv", dashMain).forEach((el, i) => { el.style.animationDelay = Math.min(i * 60, 360) + "ms"; });
}

/* ---------- view: dashboard ---------- */

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function smoothPath(pts) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)},` +
      ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const CHART_DATA = {
  "This Month": { gold: [38, 52, 46, 68, 61, 84], steel: [28, 34, 44, 40, 52, 47] },
  "Last Month": { gold: [30, 44, 56, 49, 63, 58], steel: [24, 38, 33, 45, 41, 50] },
  "6 Months": { gold: [22, 35, 48, 57, 70, 84], steel: [18, 26, 37, 42, 49, 55] }
};
const CHART_MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

function lineChartSVG(setName) {
  const { gold, steel } = CHART_DATA[setName] || CHART_DATA["This Month"];
  const W = 560, H = 210, padX = 34, padT = 16, padB = 30;
  const x = i => padX + i * (W - padX * 2) / 5;
  const y = v => padT + (H - padT - padB) * (1 - v / 100);
  const goldPts = gold.map((v, i) => [x(i), Math.round(y(v))]);
  const steelPts = steel.map((v, i) => [x(i), Math.round(y(v))]);
  const grid = [0, 25, 50, 75, 100].map(v =>
    `<line x1="${padX}" y1="${y(v)}" x2="${W - padX}" y2="${y(v)}" stroke="currentColor" stroke-opacity="0.09" stroke-dasharray="3 5"/>`).join("");
  const labels = CHART_MONTHS.map((m, i) =>
    `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity="0.45">${m}</text>`).join("");
  const area = smoothPath(goldPts) + ` L ${goldPts[5][0]} ${H - padB} L ${goldPts[0][0]} ${H - padB} Z`;
  const dots = goldPts.map(pt => `<circle cx="${pt[0]}" cy="${pt[1]}" r="3" fill="#E4C173"/>`).join("");
  return `
  <svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Property views trend, ${setName.toLowerCase()}">
    <defs>
      <linearGradient id="hvArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E4C173" stop-opacity="0.28"/>
        <stop offset="1" stop-color="#C79A3E" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#hvArea)"/>
    <path d="${smoothPath(steelPts)}" fill="none" stroke="#76839B" stroke-width="2" stroke-linecap="round" stroke-opacity="0.75"/>
    <path d="${smoothPath(goldPts)}" fill="none" stroke="#E4C173" stroke-width="2.5" stroke-linecap="round"/>
    ${dots}
    ${labels}
  </svg>`;
}

function topLocations() {
  const counts = {};
  PROPERTIES.forEach(p => {
    const key = `${p.city}, ${p.state}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

function bookingBadge(b) {
  return b.status === "confirmed"
    ? '<span class="badge badge-featured">Confirmed</span>'
    : b.status === "cancelled"
      ? '<span class="badge badge-cut">Cancelled</span>'
      : '<span class="badge badge-pending">Pending</span>';
}

function recentBookingsHTML() {
  const rows = getBookings().slice(0, 3).map(b => {
    const p = byId(b.propertyId);
    if (!p) return "";
    return `
      <div class="bk-row">
        <span class="bk-thumb">${photo(p, "front", 200)}</span>
        <div>
          <b>${p.address}</b>
          <span class="small">${p.city}, ${p.state} · ${fmtDay(b.date)}${b.time ? " · " + b.time : ""}</span>
        </div>
        ${bookingBadge(b)}
      </div>`;
  }).join("");
  return rows || `
    <div class="empty" style="padding:34px 16px">
      ${ICONS.camera}
      <b>No viewings yet</b>
      <p class="small" style="margin:0">Pick a home you love and book a private viewing.</p>
    </div>`;
}

function renderDashboardView() {
  const locs = topLocations();
  const maxLoc = locs[0]?.[1] || 1;
  const kpis = [
    { label: "Homes available", value: PROPERTIES.length, delta: "+3", icon: SICONS.properties },
    { label: "Saved homes", value: favorites.all().length, delta: "+1", icon: SICONS.favorites },
    { label: "Viewings booked", value: activeBookings().length, delta: "+2", icon: SICONS.bookings },
    { label: "Conversations", value: getConversations().length, delta: "+1", icon: SICONS.messages }
  ];
  dashMain.innerHTML = `
    <div class="greet-card card glass dv">
      <div>
        <h1>${greeting()}, ${esc(firstName())} 👋</h1>
        <p class="muted">Welcome back to Havnora</p>
      </div>
      <span class="greet-date num">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
    </div>

    <div class="dkpi-row">
      ${kpis.map(k => `
        <div class="dkpi card glass dv">
          <div class="dkpi-top"><span>${k.label}</span><span class="dkpi-ico">${k.icon}</span></div>
          <b class="num" data-count="${k.value}">0</b>
          <span class="delta">${SICONS.up}${k.delta} this week</span>
        </div>`).join("")}
    </div>

    <div class="panel-row">
      <div class="card glass dv">
        <div class="card-head">
          <div><h2>Property Overview</h2><p class="muted sub">Views across your market</p></div>
          <label style="display:inline-flex; align-items:center; gap:8px">
            <span class="small muted" style="position:absolute; left:-9999px">Chart range</span>
            <select class="fpill" id="chart-range">
              <option>This Month</option><option>Last Month</option><option>6 Months</option>
            </select>
          </label>
        </div>
        <div class="chart-wrap" id="chart-slot">${lineChartSVG("This Month")}</div>
        <div class="chart-key">
          <span><i style="background:linear-gradient(90deg,#E4C173,#C79A3E)"></i>Property views</span>
          <span><i style="background:#76839B"></i>Market average</span>
        </div>
      </div>
      <div class="card glass dv">
        <div class="card-head"><h2>Top Locations</h2></div>
        ${locs.map(([city, n]) => `
          <div class="loc-row">
            <span class="loc-ico">${SICONS.pin}</span>
            <div>
              <b>${city}</b>
              <div class="loc-bar"><i style="width:${Math.round(n / maxLoc * 100)}%"></i></div>
            </div>
            <span class="small num">${n} listings</span>
          </div>`).join("")}
      </div>
    </div>

    <div class="card glass dv">
      <div class="card-head">
        <h2>Recent Bookings</h2>
        <button type="button" class="btn btn-sm" data-goto="bookings">View all</button>
      </div>
      ${recentBookingsHTML()}
    </div>`;
  animateCounts(dashMain);
  $("#chart-range", dashMain).addEventListener("change", e => {
    $("#chart-slot", dashMain).innerHTML = lineChartSVG(e.target.value);
  });
  $("[data-goto]", dashMain).addEventListener("click", () => switchView("bookings"));
}

/* ---------- view: properties ---------- */

const propFilter = { type: "", city: "", price: "", featured: false };

function filteredProps() {
  return PROPERTIES.filter(p => {
    if (propFilter.type && p.type !== propFilter.type) return false;
    if (propFilter.city && `${p.city}, ${p.state}` !== propFilter.city) return false;
    if (propFilter.price === "under400" && p.price >= 400000) return false;
    if (propFilter.price === "400to600" && (p.price < 400000 || p.price > 600000)) return false;
    if (propFilter.price === "over600" && p.price <= 600000) return false;
    if (propFilter.featured && !p.featured) return false;
    return true;
  });
}

function paintPropertyGrid(list, gridEl, emptyMsg) {
  gridEl.innerHTML = "";
  if (!list.length) {
    gridEl.innerHTML = `<div class="empty" style="grid-column:1/-1">${ICONS.home}<b>Nothing matches</b><p class="small" style="margin:0">${emptyMsg}</p></div>`;
    return;
  }
  list.forEach(p => {
    const card = propertyCard(p);
    card.dataset.pid = p.id;
    gridEl.appendChild(card);
  });
  observeReveals(gridEl);
}

function renderPropertiesView() {
  const types = [...new Set(PROPERTIES.map(p => p.type))].sort();
  const cities = [...new Set(PROPERTIES.map(p => `${p.city}, ${p.state}`))].sort();
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Featured Properties</h1>
      <p class="muted">Discover handpicked properties for you</p>
    </div>
    <div class="filter-row dv">
      <label><span style="position:absolute; left:-9999px">Property type</span>
        <select class="fpill" id="f-type"><option value="">All Types</option>${types.map(t => `<option${propFilter.type === t ? " selected" : ""}>${t}</option>`).join("")}</select>
      </label>
      <label><span style="position:absolute; left:-9999px">City</span>
        <select class="fpill" id="f-city"><option value="">All Cities</option>${cities.map(c => `<option${propFilter.city === c ? " selected" : ""}>${c}</option>`).join("")}</select>
      </label>
      <label><span style="position:absolute; left:-9999px">Price range</span>
        <select class="fpill" id="f-price">
          <option value="">Price Range</option>
          <option value="under400"${propFilter.price === "under400" ? " selected" : ""}>Under $400K</option>
          <option value="400to600"${propFilter.price === "400to600" ? " selected" : ""}>$400K to $600K</option>
          <option value="over600"${propFilter.price === "over600" ? " selected" : ""}>$600K and up</option>
        </select>
      </label>
      <button type="button" class="fpill" id="f-feat" aria-pressed="${propFilter.featured}">Featured only</button>
    </div>
    <div class="property-grid dv" id="prop-grid"></div>`;

  const grid = $("#prop-grid", dashMain);
  const repaint = () => paintPropertyGrid(filteredProps(), grid, "Loosen a filter or two to see more havens.");
  $("#f-type", dashMain).addEventListener("change", e => { propFilter.type = e.target.value; repaint(); });
  $("#f-city", dashMain).addEventListener("change", e => { propFilter.city = e.target.value; repaint(); });
  $("#f-price", dashMain).addEventListener("change", e => { propFilter.price = e.target.value; repaint(); });
  $("#f-feat", dashMain).addEventListener("click", e => {
    propFilter.featured = !propFilter.featured;
    e.currentTarget.setAttribute("aria-pressed", String(propFilter.featured));
    repaint();
  });
  repaint();
}

/* ---------- view: favorites ---------- */

function renderFavoritesView() {
  const saved = favorites.all().map(byId).filter(Boolean);
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Saved Homes</h1>
      <p class="muted">Every haven you have hearted, in one place</p>
    </div>
    ${saved.length
      ? `<div class="property-grid dv" id="fav-grid" style="margin-top:20px"></div>`
      : `<div class="card glass dv" style="margin-top:20px">
          <div class="empty">
            ${ICONS.heart}
            <b>No saved homes yet</b>
            <p class="small">Tap the heart on any property and it will wait for you here.</p>
            <button type="button" class="btn btn-brass btn-glow" id="fav-cta">Browse properties</button>
          </div>
        </div>`}`;
  if (saved.length) paintPropertyGrid(saved, $("#fav-grid", dashMain), "");
  else $("#fav-cta", dashMain).addEventListener("click", () => switchView("properties"));
}

/* ---------- view: bookings ---------- */

let bookingsTab = "upcoming";

function bookingBucket(b) {
  if (b.status === "cancelled") return "cancelled";
  return b.date && b.date < todayStr() ? "completed" : "upcoming";
}

function renderBookingsView() {
  const all = getBookings();
  const list = all.filter(b => bookingBucket(b) === bookingsTab);
  const emptyCopy = {
    upcoming: ["No upcoming viewings", "Book a viewing from any property and it lands here."],
    completed: ["Nothing completed yet", "Viewings you have already toured will appear here."],
    cancelled: ["No cancelled viewings", "Plans change; cancelled viewings are kept here for reference."]
  }[bookingsTab];
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Your Viewings</h1>
      <p class="muted">Every tour you have scheduled with the Havnora Property Manager</p>
    </div>
    <div class="tabrow dv" role="group" aria-label="Booking status" style="margin-top:18px">
      ${["upcoming", "completed", "cancelled"].map(t =>
        `<button type="button" data-tab="${t}" aria-pressed="${bookingsTab === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
    </div>
    <div class="card glass dv">
      ${list.length ? `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Property</th><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Status</th><th scope="col"><span style="position:absolute; left:-9999px">Actions</span></th></tr></thead>
          <tbody>
            ${list.map(b => {
              const p = byId(b.propertyId);
              return `<tr>
                <td><b>${p ? p.address : "Listing"}</b><span class="small muted" style="display:block">${p ? p.city + ", " + p.state : ""}</span></td>
                <td class="num">${fmtDay(b.date)}</td>
                <td class="num">${b.time || "TBD"}</td>
                <td>${bookingBadge(b)}</td>
                <td style="text-align:right">${bookingsTab === "upcoming" ? `<button type="button" class="btn btn-sm" data-cancel="${b.id}">Cancel</button>` : ""}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>` : `
      <div class="empty" style="padding:44px 20px">
        ${SICONS.bookings}
        <b>${emptyCopy[0]}</b>
        <p class="small" style="margin:0 0 14px">${emptyCopy[1]}</p>
        ${bookingsTab === "upcoming" ? '<button type="button" class="btn btn-brass btn-glow" id="bk-cta">Find a home to tour</button>' : ""}
      </div>`}
    </div>`;

  $$(".tabrow [data-tab]", dashMain).forEach(t =>
    t.addEventListener("click", () => { bookingsTab = t.dataset.tab; renderBookingsView(); stagger(); }));
  $$("[data-cancel]", dashMain).forEach(btn =>
    btn.addEventListener("click", () => {
      const listAll = getBookings();
      const b = listAll.find(x => x.id === btn.dataset.cancel);
      if (b) { b.status = "cancelled"; store.set("bookings", listAll); }
      toast("Viewing cancelled");
      renderBookingsView(); stagger();
    }));
  const cta = $("#bk-cta", dashMain);
  if (cta) cta.addEventListener("click", () => switchView("properties"));
}

/* ---------- view: payments ---------- */

function renderPaymentsView() {
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Payment Options</h1>
      <p class="muted">Two clear paths to owning your haven</p>
    </div>
    <div class="payx dv" style="margin-top:20px">
      <div class="payx-card plain card glass">
        <span class="kicker">Down Payment</span>
        <b class="big num">From $30K</b>
        <p class="muted small" style="margin:0">Initial deposit to secure your home</p>
        <ul class="payx-list">
          <li>${SICONS.check}<span>Secure the property</span></li>
          <li>${SICONS.check}<span>Flexible payment plan</span></li>
        </ul>
      </div>
      <div class="payx-card gold">
        <span class="kicker">Full Payment</span>
        <b class="big num">Pay in full</b>
        <p class="small" style="margin:0; opacity:0.8">Pay in full and save more</p>
        <ul class="payx-list">
          <li>${SICONS.check}<span>Best price</span></li>
          <li>${SICONS.check}<span>Instant ownership</span></li>
        </ul>
      </div>
    </div>
    <div class="card glass dv">
      <div class="card-head">
        <h2>Payment History</h2>
        ${helpBtn("mortgage-calculator")}
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Reference</th><th scope="col">Property</th><th scope="col">Amount</th><th scope="col">Status</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="empty" style="padding:40px 20px">
        ${SICONS.payments}
        <b>Payment processing connects at launch</b>
        <p class="small" style="margin:0">Your down payments and settlements will be tracked here once payments go live.</p>
      </div>
    </div>`;
}

/* ---------- view: analytics ---------- */

function renderAnalyticsView() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heights = [46, 62, 54, 78, 66, 92, 58];
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Analytics</h1>
      <p class="muted">How the Havnora market is moving this week</p>
    </div>
    <div class="dkpi-row dv" style="grid-template-columns:repeat(3,1fr); margin-top:20px">
      <div class="dkpi card glass">
        <div class="dkpi-top"><span>Total views</span><span class="dkpi-ico">${ICONS.eye}</span></div>
        <b class="num" data-count="12.5" data-dec="1" data-suffix="K">0</b>
        <span class="delta">${SICONS.up}+8.4%</span>
      </div>
      <div class="dkpi card glass">
        <div class="dkpi-top"><span>Inquiries</span><span class="dkpi-ico">${SICONS.messages}</span></div>
        <b class="num" data-count="320">0</b>
        <span class="delta">${SICONS.up}+5.2%</span>
      </div>
      <div class="dkpi card glass">
        <div class="dkpi-top"><span>Bookings</span><span class="dkpi-ico">${SICONS.bookings}</span></div>
        <b class="num" data-count="86">0</b>
        <span class="delta">${SICONS.up}+3.1%</span>
      </div>
    </div>
    <div class="card glass dv">
      <div class="card-head"><h2>Views, last 7 days</h2></div>
      <div class="bars" role="img" aria-label="Bar chart of property views over the last seven days">
        ${days.map((d, i) => `<div class="bar"><i style="height:${heights[i]}%"></i><span>${d}</span></div>`).join("")}
      </div>
      <p class="small muted" style="margin:14px 0 0">Sample metrics shown for design. Live analytics connect at launch.</p>
    </div>`;
  animateCounts(dashMain);
}

/* ---------- view: settings ---------- */

function renderSettingsView() {
  const user = currentUser();
  const prefs = store.get("prefs", { email: true, listings: true, viewings: true });
  const dark = document.documentElement.dataset.theme === "dark";
  dashMain.innerHTML = `
    <div class="view-head dv">
      <h1>Settings</h1>
      <p class="muted">Your profile, appearance, and notifications</p>
    </div>
    <div class="card glass dv stack-card" style="margin-top:20px">
      <div class="card-head"><h2>Profile</h2></div>
      <form id="profile-form" class="form-grid">
        <label class="field"><span>Full name</span>
          <input type="text" id="set-name" value="${esc(user?.name || guestName() || "")}" placeholder="Your name" autocomplete="name">
        </label>
        <label class="field"><span>Email</span>
          <input type="email" value="${esc(user?.email || "")}" placeholder="Sign in to link an email" disabled>
        </label>
        <div class="full"><button class="btn btn-brass btn-glow" type="submit">Save profile</button></div>
      </form>
    </div>
    <div class="card glass dv stack-card">
      <div class="card-head"><h2>Appearance</h2></div>
      <div class="set-row">
        <div><b>Theme</b><span class="small">Black and gold is the Havnora signature; ivory is easier in daylight.</span></div>
        <button type="button" class="btn" id="set-theme">${dark ? "Switch to ivory" : "Switch to dark"}</button>
      </div>
    </div>
    <div class="card glass dv stack-card">
      <div class="card-head"><h2>Notifications</h2></div>
      <label class="check set-row" style="cursor:pointer">
        <span><b>Email updates</b><span class="small" style="display:block">A calm weekly digest of your saved homes.</span></span>
        <input type="checkbox" id="pref-email" ${prefs.email ? "checked" : ""}>
      </label>
      <label class="check set-row" style="cursor:pointer">
        <span><b>New listing alerts</b><span class="small" style="display:block">Hear first when a matching haven lists.</span></span>
        <input type="checkbox" id="pref-listings" ${prefs.listings ? "checked" : ""}>
      </label>
      <label class="check set-row" style="cursor:pointer">
        <span><b>Viewing reminders</b><span class="small" style="display:block">A nudge the day before each booked tour.</span></span>
        <input type="checkbox" id="pref-viewings" ${prefs.viewings ? "checked" : ""}>
      </label>
    </div>
    <div class="card glass dv">
      <div class="set-row">
        <div><b>${user ? "Sign out" : "Sign in"}</b><span class="small">${user ? "End this session on this device." : "Sign in to sync favorites, viewings, and messages."}</span></div>
        ${user
          ? '<button type="button" class="btn" id="set-signout">Sign out</button>'
          : '<a class="btn btn-brass btn-glow" href="signin.html">Sign in</a>'}
      </div>
    </div>`;

  $("#profile-form", dashMain).addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#set-name", dashMain).value.trim();
    const u = currentUser();
    if (u) { u.name = name; store.set("user", u); }
    else store.set("guestName", name);
    buildSidebar(); markActive(currentView);
    toast("Profile saved");
  });
  $("#set-theme", dashMain).addEventListener("click", e => {
    toggleTheme();
    e.currentTarget.textContent = document.documentElement.dataset.theme === "dark" ? "Switch to ivory" : "Switch to dark";
  });
  const savePrefs = () => store.set("prefs", {
    email: $("#pref-email", dashMain).checked,
    listings: $("#pref-listings", dashMain).checked,
    viewings: $("#pref-viewings", dashMain).checked
  });
  ["#pref-email", "#pref-listings", "#pref-viewings"].forEach(sel =>
    $(sel, dashMain).addEventListener("change", savePrefs));
  const out = $("#set-signout", dashMain);
  if (out) out.addEventListener("click", () => hvAuth.signOut().finally(() => location.reload()));
}

/* ---------- right details panel ---------- */

let detailsProp = null;

function renderDetails(p) {
  if (!p) return;
  detailsProp = p;
  const views = p.views || [];
  const main = views[0] || { key: "front", label: "Front view", src: p.images?.front };
  dashDetails.innerHTML = `
    <div class="dp-top">
      <h2>Property Details</h2>
      <button type="button" class="dp-back" id="dp-back">${ICONS.left}Back to Properties</button>
    </div>
    <div class="dp-hero" id="dp-hero">
      ${photo(p, main.key, 800)}
      ${p.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
      <span class="dp-hero-label" id="dp-hero-label">${main.label}</span>
    </div>
    <div class="dp-thumbs" role="group" aria-label="More photos">
      ${views.slice(1).map(v => `
        <button type="button" data-view-key="${v.key}" aria-label="Show ${v.label.toLowerCase()}">
          ${photo(p, v.key, 200)}
        </button>`).join("")}
    </div>
    <div class="dp-addr">
      <b>${p.address}</b>
      <span>${p.neighborhood} · ${p.city}, ${p.state} ${p.zip}</span>
    </div>
    <div class="dp-price num">${fmtPrice(p.price)}<span class="per">$${perSqft(p)}/sqft</span></div>
    <div class="dp-stats num">
      <div class="dp-stat"><b>${p.beds}</b><span>Bedrooms</span></div>
      <div class="dp-stat"><b>${p.baths}</b><span>Bathrooms</span></div>
      <div class="dp-stat"><b>${fmtNum(p.sqft)}</b><span>Sqft</span></div>
      <div class="dp-stat"><b>${p.garage}</b><span>Garage</span></div>
    </div>
    <h3 class="dp-h">Payment Options</h3>
    <div class="pay-row">
      <a class="pay-btn pay-down" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.downPayment)}</b><span>Down Payment</span></a>
      <a class="pay-btn pay-full" href="property.html?id=${p.id}#payment"><b class="num">${fmtShort(p.price)}</b><span>Full Payment</span></a>
    </div>
    <h3 class="dp-h">Key Features</h3>
    <ul class="dp-feats">
      ${(p.features || []).map(f => `<li>${SICONS.check}<span>${f}</span></li>`).join("")}
    </ul>
    <div class="dp-cta">
      <button type="button" class="btn btn-brass btn-glow" id="dp-book">Book a Viewing</button>
      <button type="button" class="btn" id="dp-contact">Contact Agent</button>
    </div>`;

  $("#dp-back", dashDetails).addEventListener("click", () => switchView("properties"));
  $$("[data-view-key]", dashDetails).forEach(btn =>
    btn.addEventListener("click", () => {
      const v = views.find(x => x.key === btn.dataset.viewKey);
      if (!v) return;
      $("#dp-hero", dashDetails).innerHTML = photo(p, v.key, 800) +
        (p.featured ? '<span class="badge badge-featured">Featured</span>' : "") +
        `<span class="dp-hero-label">${v.label}</span>`;
      $$("[data-view-key]", dashDetails).forEach(b => b.classList.toggle("is-active", b === btn));
    }));
  $("#dp-book", dashDetails).addEventListener("click", () => openBookDialog(p));
  $("#dp-contact", dashDetails).addEventListener("click", () => messageManagerAbout(p.id));
}

/* intercept property card links on wide screens: load the details panel */
dashMain.addEventListener("click", e => {
  const link = e.target.closest(".property-card a");
  if (!link || !WIDE()) return;
  if (link.closest(".pay-row")) return; /* pay links keep their promised navigation */
  const card = link.closest(".property-card");
  const id = card?.dataset.pid || (link.href.match(/id=([\w-]+)/) || [])[1];
  const p = id && byId(id);
  if (!p) return;
  e.preventDefault();
  renderDetails(p);
});

/* ---------- booking dialog ---------- */

let bookDialog;
function openBookDialog(p) {
  if (!bookDialog) {
    bookDialog = document.createElement("dialog");
    bookDialog.className = "modal";
    document.body.appendChild(bookDialog);
  }
  const times = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];
  bookDialog.innerHTML = `
    <div class="modal-card" style="position:relative">
      <button type="button" class="btn btn-icon modal-close glass" aria-label="Close booking dialog">${ICONS.close}</button>
      <div style="padding:28px">
        <h3 style="margin-bottom:4px">Book a Viewing</h3>
        <p class="muted small" style="margin-bottom:18px">${p.address} · ${p.city}, ${p.state}</p>
        <form id="book-form" style="display:grid; gap:14px">
          <label class="field"><span>Date</span>
            <input type="date" id="bk-date" required min="${todayStr()}">
          </label>
          <label class="field"><span>Time</span>
            <select id="bk-time" required>${times.map(t => `<option>${t}</option>`).join("")}</select>
          </label>
          <label class="field"><span>Note for the manager (optional)</span>
            <input type="text" id="bk-note" maxlength="140" placeholder="Anything we should prepare?">
          </label>
          <button class="btn btn-brass btn-glow btn-block" type="submit">Confirm viewing</button>
        </form>
      </div>
    </div>`;
  $(".modal-close", bookDialog).addEventListener("click", () => bookDialog.close());
  bookDialog.addEventListener("click", e => { if (e.target === bookDialog) bookDialog.close(); });
  $("#book-form", bookDialog).addEventListener("submit", e => {
    e.preventDefault();
    const date = $("#bk-date", bookDialog).value;
    if (!date) return;
    addBooking(p.id, date, $("#bk-time", bookDialog).value, $("#bk-note", bookDialog).value.trim());
    bookDialog.close();
    toast("Viewing requested for " + fmtDay(date));
    if (currentView === "dashboard" || currentView === "bookings") refreshView();
  });
  bookDialog.showModal();
}

/* ---------- boot ---------- */

buildSidebar();
renderDetails(PROPERTIES.find(p => p.featured) || PROPERTIES[0]);

const requestedView = new URLSearchParams(location.search).get("view");
switchView(VIEWS[requestedView] ? requestedView : "dashboard", true);
