/* Dashboard: role-based workspaces for buyers, sellers, agents, and admins.
   Every row below is placeholder content shaped like a live account record.
   Replace the const arrays with API data when accounts go live. */

renderNav("dashboard");
renderFooter();

/* ---------- placeholder data ---------- */

const SAVED_SEARCHES = [
  { name: "Austin under $900k", summary: "Austin · 3+ beds · up to $900,000", params: { q: "Austin", beds: 3, max: 900000 } },
  { name: "Condos with a pool", summary: "Condo · pool · up to $750,000", params: { types: "Condo", pool: 1, max: 750000 } },
  { name: "New listings, Seattle", summary: "Seattle · new listings · 2+ baths", params: { q: "Seattle", status: "New Listing", baths: 2 } }
];

const BUYER_TOURS = [
  { id: "sh-004", date: "Sat, Jul 18", time: "10:30 AM", agent: "M. Alvarez", status: "Confirmed" },
  { id: "sh-012", date: "Sun, Jul 19", time: "1:00 PM", agent: "D. Okafor", status: "Requested" }
];

const SELLER_HOME_ID = "sh-001";
const SELLER_WEEK = [
  { day: "Mon", views: 132 }, { day: "Tue", views: 158 }, { day: "Wed", views: 171 },
  { day: "Thu", views: 149 }, { day: "Fri", views: 196 }, { day: "Sat", views: 262 },
  { day: "Sun", views: 216 }
];

const OFFERS = [
  { buyer: "K. Nguyen", amount: 1162000, contingencies: "Financing, inspection", status: "Under review" },
  { buyer: "R. Whitfield", amount: 1149500, contingencies: "Inspection only", status: "Countered" },
  { buyer: "S. Patel", amount: 1178000, contingencies: "None, cash", status: "New" }
];

const CHECKLIST = [
  { key: "photos", label: "Photography scheduled" },
  { key: "disclosures", label: "Disclosures uploaded" },
  { key: "pricing", label: "Pricing review with your agent" },
  { key: "staging", label: "Staging and deep clean" },
  { key: "openhouse", label: "First open house planned" }
];

const PIPELINE = [
  { client: "Jordan Ellis", stage: "New", id: "sh-014", last: "Asked for a tour, 2h ago" },
  { client: "Priya Raman", stage: "Touring", id: "sh-002", last: "Toured Saturday morning" },
  { client: "Marcus Lee", stage: "Touring", id: "sh-019", last: "Second visit booked" },
  { client: "Dana Whitcomb", stage: "Offer", id: "sh-007", last: "Offer out for signatures" },
  { client: "Ana Sofia Ruiz", stage: "Offer", id: "sh-021", last: "Countered yesterday" },
  { client: "Tom Becker", stage: "Closing", id: "sh-025", last: "Appraisal cleared" }
];

const LEADS = [
  { name: "Hannah Cole", note: "Pre-approved to $650k, wants Raleigh", when: "8 min ago" },
  { name: "Victor Osei", note: "Asked about 1129 Canyon Rd", when: "24 min ago" },
  { name: "June Park", note: "Relocating to Denver in September", when: "1h ago" },
  { name: "Leo Martins", note: "Wants a condo tour this weekend", when: "3h ago" }
];

const AGENT_TOURS = [
  { when: "Tue 9:00 AM", client: "Priya Raman", id: "sh-002", status: "Confirmed" },
  { when: "Tue 11:30 AM", client: "Marcus Lee", id: "sh-019", status: "Confirmed" },
  { when: "Wed 4:00 PM", client: "Jordan Ellis", id: "sh-014", status: "Requested" },
  { when: "Sat 10:00 AM", client: "June Park", id: "sh-004", status: "Requested" }
];

const MOD_QUEUE = [
  { item: "Listing photo set, 24 Legare St", reason: "Awaiting first review", ago: "12 min" },
  { item: "Agent profile update, T. Vaughn", reason: "License number changed", ago: "1h" },
  { item: "Description edit, 1440 Ocean Dr #705", reason: "Wording check requested", ago: "3h" }
];

const TEAM = [
  { name: "Alexis Moreau", role: "Operations lead", last: "Active now" },
  { name: "Sam Torres", role: "Listings QA", last: "12 min ago" },
  { name: "Grace Obi", role: "Trust and safety", last: "1h ago" },
  { name: "Noah Feld", role: "Support", last: "Yesterday" }
];

const AUDIT = [
  { t: "09:42", e: "Listing sh-018 approved by Sam Torres" },
  { t: "09:15", e: "Agent verification completed, license checked" },
  { t: "08:58", e: "Report #311 closed as resolved" },
  { t: "08:31", e: "Price change on sh-011 logged" },
  { t: "07:50", e: "New agent application received" },
  { t: "07:12", e: "Nightly data quality sweep finished, 0 issues" }
];

/* ---------- helpers ---------- */

const content = $("#dash-content");
const noMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const hBtn = key => typeof helpBtn === "function"
  ? helpBtn(key)
  : `<button class="help-btn" data-help="${key}" aria-label="How this works">?</button>`;

const DASH_BADGE = {
  "Confirmed": "badge-new", "Requested": "badge-pending",
  "New": "badge-new", "Touring": "badge-open", "Offer": "badge-sale", "Closing": "badge-pending",
  "Under review": "badge-pending", "Countered": "badge-cut"
};
const dashBadge = s => `<span class="badge ${DASH_BADGE[s] || ""}">${s}</span>`;

const initialsOf = name => name.split(" ").map(w => w[0]).join("").replace(".", "").slice(0, 2).toUpperCase();

const propCell = id => {
  const p = byId(id);
  return `<a href="property.html?id=${p.id}"><b>${p.address}</b></a>
    <span class="small muted" style="display:block">${p.city}, ${p.state}</span>`;
};

function headRow(title, sub, helpKey) {
  return `<div class="dash-head">
    <div>
      <h1>${title}</h1>
      <p class="muted">${sub}</p>
    </div>
    ${hBtn(helpKey)}
  </div>`;
}

function kpiRow(items) {
  return `<div class="kpi-row">${items.map(k => `
    <div class="kpi card glass reveal">
      <span>${k.label}</span>
      <b class="num"><span class="kpi-val" data-val="${k.value}">${k.value}</span>${k.delta ? ` <span class="delta">${k.delta}</span>` : ""}</b>
    </div>`).join("")}</div>`;
}

/* count each KPI up from zero on view switch; strings without digits stay put */
function countUpKPIs() {
  if (noMotion) return;
  $$(".kpi-val", content).forEach(el => {
    const m = el.dataset.val.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[2].replace(/,/g, ""));
    const decimals = (m[2].split(".")[1] || "").length;
    const fmt = v => decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US");
    const t0 = performance.now(), dur = 900;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = m[1] + fmt(k < 1 ? target * eased : target) + m[3];
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* staggered entrance for KPI tiles and glass panels; delay clears after reveal */
function staggerCards() {
  if (noMotion) return;
  const stagger = (els, step, cap) => els.forEach((el, i) => {
    const delay = Math.min(i * step, cap);
    if (!delay) return;
    el.style.transitionDelay = delay + "ms";
    el.addEventListener("transitionend", function clear(e) {
      if (e.propertyName !== "opacity") return;
      el.style.transitionDelay = "";
      el.removeEventListener("transitionend", clear);
    });
  });
  stagger($$(".kpi", content), 60, 300);
  stagger($$("section.card.glass.reveal", content), 90, 360);
}

function tableHTML(cols, rows) {
  return `<div class="table-wrap"><table class="table">
    <thead><tr>${cols.map(c => `<th scope="col">${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function updateCheckCount() {
  const el = $("#check-count", content);
  if (!el) return;
  const done = store.get("sell-checklist", {});
  const n = CHECKLIST.filter(c => done[c.key]).length;
  el.textContent = `${n} of ${CHECKLIST.length} done`;
}

/* ---------- welcome strip ---------- */

const ROLE_LINES = {
  buyer: "Here is where your search stands today.",
  seller: "Here is how your listing is doing.",
  agent: "Your week is taking shape. Leads first.",
  admin: "The platform is steady. Today at a glance."
};

function welcomeStrip(role) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const user = store.get("user", null);
  const who = user && user.email
    ? `<span class="welcome-who small muted num" title="Signed in">${esc(user.email)}</span>`
    : `<a class="btn btn-sm" href="signin.html">Sign in</a>`;
  return `<div class="welcome-strip card glass reveal">
    <p><b class="text-aurora">${greet}.</b> <span class="muted">${ROLE_LINES[role]}</span></p>
    ${who}
  </div>`;
}

/* ---------- buyer ---------- */

function buyerView() {
  const saved = favorites.all().map(byId).filter(Boolean);
  const recent = store.get("recent", []).map(byId).filter(Boolean).slice(0, 4);

  const savedBlock = saved.length
    ? `<div class="dash-grid" id="saved-grid"></div>`
    : `<div class="empty">${ICONS.heart}
        <b>No saved homes yet</b>
        <p>Tap the heart on any listing and it will wait for you here.</p>
        <a class="btn btn-brass" href="search.html">Start searching</a>
      </div>`;

  content.innerHTML =
    headRow("Buyer dashboard", "Saved homes, searches, and tours in one calm place.", "saved-searches") +
    kpiRow([
      { label: "Saved homes", value: saved.length },
      { label: "Saved searches", value: SAVED_SEARCHES.length },
      { label: "Upcoming tours", value: BUYER_TOURS.length },
      { label: "Recently viewed", value: store.get("recent", []).length }
    ]) +
    `<section class="card glass reveal stack-card">
      <div class="card-head"><h3>Saved homes</h3><a class="btn btn-sm" href="search.html">Browse homes</a></div>
      ${savedBlock}
    </section>
    <div class="panel-grid">
      <section class="card glass reveal">
        <div class="card-head"><h3>Saved searches</h3></div>
        ${SAVED_SEARCHES.map(s => `
          <div class="ss-item">
            <div>
              <b>${s.name}</b><span class="badge badge-new">Alerts on</span>
              <span class="small muted">${s.summary}</span>
            </div>
            <a class="btn btn-sm" href="search.html?${new URLSearchParams(s.params)}">Run</a>
          </div>`).join("")}
      </section>
      <section class="card glass reveal">
        <div class="card-head"><h3>Upcoming tours</h3></div>
        ${tableHTML(
          ["Home", "When", "Agent", "Status"],
          BUYER_TOURS.map(t => [
            propCell(t.id),
            `<span class="num">${t.date} · ${t.time}</span>`,
            t.agent,
            dashBadge(t.status)
          ])
        )}
      </section>
    </div>
    <section class="card glass reveal">
      <div class="card-head"><h3>Recently viewed</h3></div>
      ${recent.length
        ? `<div class="recent-row">${recent.map(p => `
            <a class="recent-card" href="property.html?id=${p.id}">
              <span class="thumb ${toneOf(p)}">${ICONS.home}</span>
              <b class="num">${fmtPrice(p.price)}</b>
              <span class="small muted">${p.address}</span>
            </a>`).join("")}</div>`
        : `<p class="muted" style="margin:0">Homes you open will appear here.</p>`}
    </section>`;

  const grid = $("#saved-grid", content);
  if (grid) saved.forEach(p => grid.appendChild(propertyCard(p)));
}

/* ---------- seller ---------- */

function sellerView() {
  const home = byId(SELLER_HOME_ID);
  const max = Math.max(...SELLER_WEEK.map(d => d.views));
  const done = store.get("sell-checklist", {});
  const barsLabel = "Daily listing views, Monday through Sunday: " + SELLER_WEEK.map(d => d.views).join(", ");

  content.innerHTML =
    headRow("Seller dashboard", `How ${home.address} is performing this week.`, "seller-dashboard") +
    kpiRow([
      { label: "Views this week", value: fmtNum(1284), delta: "+18%" },
      { label: "Saves", value: 86, delta: "+9" },
      { label: "Tour requests", value: 9, delta: "+3" },
      { label: "Days listed", value: 12 }
    ]) +
    `<div class="panel-grid">
      <section class="card glass reveal">
        <div class="card-head"><h3>Listing performance</h3><span class="badge badge-sale">Last 7 days</span></div>
        <div class="bars" role="img" aria-label="${barsLabel}">
          ${SELLER_WEEK.map(d => `
            <div class="bar">
              <i style="height:0%" data-h="${Math.round((d.views / max) * 100)}"></i>
              <span>${d.day}</span>
            </div>`).join("")}
        </div>
      </section>
      <section class="card glass reveal">
        <div class="card-head"><h3>Selling checklist</h3><span class="small muted num" id="check-count"></span></div>
        ${CHECKLIST.map(c => `
          <label class="check">
            <input type="checkbox" data-check="${c.key}" ${done[c.key] ? "checked" : ""} />
            ${c.label}
          </label>`).join("")}
      </section>
    </div>
    <section class="card glass reveal">
      <div class="card-head"><h3>Offers</h3><span class="badge badge-new">${OFFERS.length} active</span></div>
      ${tableHTML(
        ["Buyer", "Offer", "Contingencies", "Status", `<span class="visually-hidden" style="position:absolute; left:-9999px">Actions</span>`],
        OFFERS.map((o, i) => [
          `<span class="who"><span class="avatar mini-avatar ${toneOf({ id: "00" + i })}">${initialsOf(o.buyer)}</span>${o.buyer}</span>`,
          `<b class="num">${fmtPrice(o.amount)}</b>`,
          o.contingencies,
          dashBadge(o.status),
          `<button class="btn btn-sm" data-toast="Offer review opens with your agent at launch">Review</button>`
        ])
      )}
    </section>`;

  updateCheckCount();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$(".bars i", content).forEach((el, i) => {
      if (!noMotion) {
        el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
        el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
      }
      el.style.height = el.dataset.h + "%";
    });
  }));
}

/* ---------- agent ---------- */

function agentView() {
  content.innerHTML =
    headRow("Agent workspace", "Your pipeline, leads, and tours for the week ahead.", "agent-pipeline") +
    kpiRow([
      { label: "Active listings", value: 14 },
      { label: "New leads", value: 23, delta: "+6" },
      { label: "Tours this week", value: 11 },
      { label: "Median response", value: "8 min" }
    ]) +
    `<section class="card glass reveal stack-card">
      <div class="card-head"><h3>Pipeline</h3><span class="small muted num">${PIPELINE.length} clients</span></div>
      ${tableHTML(
        ["Client", "Stage", "Property", "Last activity"],
        PIPELINE.map(r => [
          `<b>${r.client}</b>`,
          dashBadge(r.stage),
          propCell(r.id),
          `<span class="muted">${r.last}</span>`
        ])
      )}
    </section>
    <div class="panel-grid">
      <section class="card glass reveal">
        <div class="card-head"><h3>Leads</h3><span class="badge badge-new">${LEADS.length} waiting</span></div>
        ${LEADS.map(l => `
          <div class="lead-row">
            <div>
              <b>${l.name}</b>
              <span class="small muted">${l.note} · ${l.when}</span>
            </div>
            <button class="btn btn-sm" data-toast="Replies open when messaging launches">Respond</button>
          </div>`).join("")}
      </section>
      <section class="card glass reveal">
        <div class="card-head"><h3>Tour schedule</h3></div>
        ${tableHTML(
          ["When", "Client", "Property", "Status"],
          AGENT_TOURS.map(t => [
            `<span class="num">${t.when}</span>`,
            t.client,
            propCell(t.id),
            dashBadge(t.status)
          ])
        )}
      </section>
    </div>`;
}

/* ---------- admin ---------- */

function adminView() {
  content.innerHTML =
    headRow("Admin console", "Platform health, moderation, and the team behind it.", "admin-tools") +
    kpiRow([
      { label: "Listings live", value: 30 },
      { label: "Verified agents", value: 142 },
      { label: "Reports open", value: 3 },
      { label: "Uptime", value: "99.98%" }
    ]) +
    `<section class="card glass reveal stack-card">
      <div class="card-head"><h3>Moderation queue</h3><span class="badge badge-pending">${MOD_QUEUE.length} pending</span></div>
      ${tableHTML(
        ["Item", "Reason", "Waiting", `<span class="visually-hidden" style="position:absolute; left:-9999px">Actions</span>`],
        MOD_QUEUE.map(m => [
          `<b>${m.item}</b>`,
          `<span class="muted">${m.reason}</span>`,
          `<span class="num">${m.ago}</span>`,
          `<span style="display:inline-flex; gap:8px">
            <button class="btn btn-sm" data-toast="Approved, it will publish shortly">Approve</button>
            <button class="btn btn-sm btn-ghost" data-toast="Flagged for a second review">Flag</button>
          </span>`
        ])
      )}
    </section>
    <div class="panel-grid">
      <section class="card glass reveal">
        <div class="card-head"><h3>Team</h3></div>
        ${tableHTML(
          ["Name", "Role", "Last active"],
          TEAM.map((m, i) => [
            `<span class="who"><span class="avatar mini-avatar ${toneOf({ id: "00" + i })}">${initialsOf(m.name)}</span><b>${m.name}</b></span>`,
            m.role,
            `<span class="muted">${m.last}</span>`
          ])
        )}
      </section>
      <section class="card glass reveal">
        <div class="card-head"><h3>Audit log</h3><span class="small muted">Today</span></div>
        <ul class="audit-list">
          ${AUDIT.map(a => `<li><span class="num">${a.t}</span><span>${a.e}</span></li>`).join("")}
        </ul>
      </section>
    </div>`;
}

/* ---------- role switching ---------- */

const VIEWS = { buyer: buyerView, seller: sellerView, agent: agentView, admin: adminView };
const TITLES = {
  buyer: "Buyer dashboard", seller: "Seller dashboard",
  agent: "Agent workspace", admin: "Admin console"
};

let currentRole = null;
let switchTimer;

function renderRole(r) {
  VIEWS[r]();
  content.insertAdjacentHTML("afterbegin", welcomeStrip(r));
  observeReveals(content);
  staggerCards();
  countUpKPIs();
  document.title = `${TITLES[r]} · Havnora`;
  const p = new URLSearchParams(location.search);
  p.set("role", r);
  history.replaceState(null, "", "?" + p);
}

function setRole(role) {
  const r = VIEWS[role] ? role : "buyer";
  if (r === currentRole) return;
  $$("#dash-nav button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.role === r)));
  const first = currentRole === null;
  currentRole = r;
  if (first || noMotion) { renderRole(r); return; }
  /* 150ms out, 250ms back in; durations live in the page style block */
  content.classList.add("is-switching");
  clearTimeout(switchTimer);
  switchTimer = setTimeout(() => {
    renderRole(r);
    requestAnimationFrame(() => requestAnimationFrame(() => content.classList.remove("is-switching")));
  }, 150);
}

$$("#dash-nav button").forEach(b => b.addEventListener("click", () => setRole(b.dataset.role)));

content.addEventListener("click", e => {
  const t = e.target.closest("[data-toast]");
  if (t) toast(t.dataset.toast);
});

content.addEventListener("change", e => {
  const box = e.target.closest("[data-check]");
  if (!box) return;
  const done = store.get("sell-checklist", {});
  done[box.dataset.check] = box.checked;
  store.set("sell-checklist", done);
  updateCheckCount();
});

setRole(new URLSearchParams(location.search).get("role") || "buyer");
