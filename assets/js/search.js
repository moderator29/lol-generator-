/* Search page: top filter bar, full filter drawer, URL-synced state,
   sorting, grid/list view toggle, results, and map placeholder pins. */

renderNav("search");
renderFooter();

const TYPES = ["Single-Family", "Condo", "Townhouse", "Multi-Family"];
const STATUSES = ["For Sale", "New Listing", "Open House", "Pending", "Price Cut"];

/* Preset price ranges for the top bar (max price anywhere is 800000) */
const PRICE_RANGES = [
  { v: "any", label: "Any Price", min: "", max: "" },
  { v: "u300", label: "Under 300K", min: "", max: "300000" },
  { v: "300-500", label: "300K to 500K", min: "300000", max: "500000" },
  { v: "500-650", label: "500K to 650K", min: "500000", max: "650000" },
  { v: "650-800", label: "650K to 800K", min: "650000", max: "800000" }
];

/* ---------- filter state ---------- */
const defaults = () => ({
  q: "", city: "", min: "", max: "", beds: 0, baths: 0, types: [], status: "",
  sqftMin: "", lotMin: "", garage: false, pool: false,
  yearMin: "", yearMax: "", district: "", neighborhood: "", sort: "recommended"
});
let state = defaults();

function readURL() {
  const p = new URLSearchParams(location.search);
  const s = defaults();
  for (const k of ["q", "city", "min", "max", "sqftMin", "lotMin", "yearMin", "yearMax", "district", "neighborhood", "status", "sort"])
    if (p.has(k)) s[k] = p.get(k);
  if (p.has("beds")) s.beds = +p.get("beds") || 0;
  if (p.has("baths")) s.baths = +p.get("baths") || 0;
  if (p.has("types")) s.types = p.get("types").split(",").filter(t => TYPES.includes(t));
  s.garage = p.get("garage") === "1";
  s.pool = p.get("pool") === "1";
  return s;
}

function writeURL() {
  const p = new URLSearchParams();
  const d = defaults();
  for (const [k, v] of Object.entries(state)) {
    if (k === "types") { if (v.length) p.set(k, v.join(",")); continue; }
    if (k === "garage" || k === "pool") { if (v) p.set(k, "1"); continue; }
    if (v !== d[k] && v !== "" && v !== 0) p.set(k, v);
  }
  history.replaceState(null, "", p.size ? "?" + p : location.pathname);
}

/* ---------- top filter bar ---------- */
function initBar() {
  $("#fb-type").innerHTML = `<option value="">All Types</option>` +
    TYPES.map(t => `<option value="${t}">${t}</option>`).join("");
  $("#fb-city").innerHTML = `<option value="">All Locations</option>` +
    CITIES.map(c => `<option value="${c}">${c}</option>`).join("");
  $("#fb-price").innerHTML = PRICE_RANGES.map(r =>
    `<option value="${r.v}">${r.label}</option>`).join("");
  $("#fb-beds").innerHTML = `<option value="0">Any Beds</option>` +
    [1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}+ Beds</option>`).join("");

  $("#fb-type").addEventListener("change", e => {
    state.types = e.target.value ? [e.target.value] : [];
    apply();
  });
  $("#fb-city").addEventListener("change", e => { state.city = e.target.value; apply(); });
  $("#fb-price").addEventListener("change", e => {
    const r = PRICE_RANGES.find(x => x.v === e.target.value);
    if (r) { state.min = r.min; state.max = r.max; }
    syncBar();
    apply();
  });
  $("#fb-beds").addEventListener("change", e => { state.beds = +e.target.value || 0; apply(); });
}

function syncBar() {
  const type = $("#fb-type"), city = $("#fb-city"), price = $("#fb-price"), beds = $("#fb-beds");
  type.value = state.types.length === 1 ? state.types[0] : "";
  city.value = CITIES.includes(state.city) ? state.city : "";
  const r = PRICE_RANGES.find(x => String(state.min || "") === x.min && String(state.max || "") === x.max);
  let custom = $("option[value='custom']", price);
  if (r) {
    if (custom) custom.remove();
    price.value = r.v;
  } else {
    if (!custom) price.insertAdjacentHTML("beforeend", `<option value="custom">Custom price</option>`);
    price.value = "custom";
  }
  beds.value = String(state.beds || 0);
  type.classList.toggle("is-set", !!type.value);
  city.classList.toggle("is-set", !!city.value);
  price.classList.toggle("is-set", price.value !== "any");
  beds.classList.toggle("is-set", beds.value !== "0");
}

/* ---------- drawer filter form (More Filters) ---------- */
function segButtons(name, current) {
  return `<div class="seg" role="group" aria-label="Minimum ${name}">
    ${[0, 1, 2, 3, 4, 5].map(n =>
      `<button type="button" data-seg="${name}" data-val="${n}" aria-pressed="${current === n}">${n === 0 ? "Any" : n + "+"}</button>`
    ).join("")}
  </div>`;
}

function filterFormHTML() {
  return `
    <div class="filter-group">
      <b>Keywords</b>
      <input class="input" type="search" data-f="q" value="${state.q.replace(/"/g, "&quot;")}" placeholder="City, ZIP, address, feature…" aria-label="Keywords" />
    </div>
    <div class="filter-group"><b>Bathrooms</b>${segButtons("baths", state.baths)}</div>
    <div class="filter-group">
      <b>Size & lot</b>
      <div class="range-row" style="grid-template-columns:1fr 1fr; margin-bottom:8px">
        <input class="input num" type="number" inputmode="numeric" data-f="sqftMin" value="${state.sqftMin}" placeholder="Min sqft" aria-label="Minimum square footage" min="0" step="100" />
        <input class="input num" type="number" inputmode="decimal" data-f="lotMin" value="${state.lotMin}" placeholder="Min lot (acres)" aria-label="Minimum lot size in acres" min="0" step="0.05" />
      </div>
      <label class="check"><input type="checkbox" data-f-bool="garage" ${state.garage ? "checked" : ""}/> Has garage</label>
      <label class="check"><input type="checkbox" data-f-bool="pool" ${state.pool ? "checked" : ""}/> Has pool</label>
    </div>
    <div class="filter-group">
      <b>Year built</b>
      <div class="range-row">
        <input class="input num" type="number" inputmode="numeric" data-f="yearMin" value="${state.yearMin}" placeholder="From" aria-label="Year built from" min="1800" max="2030" />
        <span>to</span>
        <input class="input num" type="number" inputmode="numeric" data-f="yearMax" value="${state.yearMax}" placeholder="To" aria-label="Year built to" min="1800" max="2030" />
      </div>
    </div>
    <div class="filter-group">
      <b>Status</b>
      <select class="input" data-f="status" aria-label="Listing status">
        <option value="">Any status</option>
        ${STATUSES.map(s => `<option ${state.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>
    <div class="filter-group">
      <b>School district</b>
      <select class="input" data-f="district" aria-label="School district">
        <option value="">Any district</option>
        ${SCHOOL_DISTRICTS.map(d => `<option ${state.district === d ? "selected" : ""}>${d}</option>`).join("")}
      </select>
    </div>
    <div class="filter-group">
      <b>Neighborhood</b>
      <select class="input" data-f="neighborhood" aria-label="Neighborhood">
        <option value="">Any neighborhood</option>
        ${NEIGHBORHOODS.map(n => `<option ${state.neighborhood === n ? "selected" : ""}>${n}</option>`).join("")}
      </select>
    </div>
    <div class="filter-group">
      <button type="button" class="btn btn-block" data-reset>Reset all filters</button>
    </div>`;
}

function bindFilterForm(host) {
  host.innerHTML = filterFormHTML();
  if (host.dataset.bound) return; /* delegation listeners attach once; re-renders only swap markup */
  host.dataset.bound = "1";
  host.addEventListener("input", e => {
    const f = e.target.dataset.f;
    if (f) state[f] = e.target.value;
    if (e.target.dataset.fBool) state[e.target.dataset.fBool] = e.target.checked;
  });
  host.addEventListener("click", e => {
    const seg = e.target.closest("[data-seg]");
    if (seg) {
      state[seg.dataset.seg] = +seg.dataset.val;
      $$(`[data-seg="${seg.dataset.seg}"]`, host).forEach(b =>
        b.setAttribute("aria-pressed", String(b === seg)));
    }
    if (e.target.closest("[data-reset]")) {
      const sort = state.sort;
      state = defaults();
      state.sort = sort;
      bindFilterForm(host);
    }
  });
}

/* ---------- filtering + sorting ---------- */
function matches(p) {
  const q = state.q.trim().toLowerCase();
  if (q) {
    const hay = [p.address, p.city, p.state, p.zip, p.neighborhood, p.type, p.blurb, ...p.features].join(" ").toLowerCase();
    if (!q.split(/\s+/).every(word => hay.includes(word))) return false;
  }
  if (state.city && `${p.city}, ${p.state}` !== state.city) return false;
  if (state.min && p.price < +state.min) return false;
  if (state.max && p.price > +state.max) return false;
  if (state.beds && p.beds < state.beds) return false;
  if (state.baths && p.baths < state.baths) return false;
  if (state.types.length && !state.types.includes(p.type)) return false;
  if (state.status && p.status !== state.status) return false;
  if (state.sqftMin && p.sqft < +state.sqftMin) return false;
  if (state.lotMin && p.lot < +state.lotMin) return false;
  if (state.garage && !p.garage) return false;
  if (state.pool && !p.pool) return false;
  if (state.yearMin && p.yearBuilt < +state.yearMin) return false;
  if (state.yearMax && p.yearBuilt > +state.yearMax) return false;
  if (state.district && p.district !== state.district) return false;
  if (state.neighborhood && p.neighborhood !== state.neighborhood) return false;
  return true;
}

const SORTS = {
  recommended: (a, b) => a.dom - b.dom || b.price - a.price,
  newest: (a, b) => a.dom - b.dom,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "sqft-desc": (a, b) => b.sqft - a.sqft,
  "ppsf-asc": (a, b) => perSqft(a) - perSqft(b)
};

/* ---------- render ---------- */
const resultsEl = $("#results");
const emptyEl = $("#results-empty");
const countEl = $("#results-count");
const mapEl = $("#map");
const chipsEl = $("#filter-chips");
const REDUCE_MOTION = matchMedia("(prefers-reduced-motion: reduce)");

const escapeHTML = s => String(s).replace(/[&<>"]/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- grid / list view toggle ---------- */
let view = store.get("searchView", "grid");
function setView(v) {
  view = v === "list" ? "list" : "grid";
  store.set("searchView", view);
  resultsEl.classList.toggle("is-list", view === "list");
  $("#view-grid").setAttribute("aria-pressed", String(view === "grid"));
  $("#view-list").setAttribute("aria-pressed", String(view === "list"));
}
$("#view-grid").addEventListener("click", () => setView("grid"));
$("#view-list").addEventListener("click", () => setView("list"));

/* ---------- active-filter chips ---------- */
function chipList() {
  const chips = [];
  const add = (key, label, val) => chips.push({ key, label, val });
  if (state.q.trim()) add("q", `"${state.q.trim()}"`);
  if (state.city) add("city", state.city);
  if (state.min) add("min", `Min ${fmtPrice(+state.min)}`);
  if (state.max) add("max", `Max ${fmtPrice(+state.max)}`);
  if (state.beds) add("beds", `${state.beds}+ beds`);
  if (state.baths) add("baths", `${state.baths}+ baths`);
  state.types.forEach(t => add("type", t, t));
  if (state.status) add("status", state.status);
  if (state.sqftMin) add("sqftMin", `${fmtNum(+state.sqftMin)}+ sqft`);
  if (state.lotMin) add("lotMin", `${state.lotMin}+ acres`);
  if (state.garage) add("garage", "Garage");
  if (state.pool) add("pool", "Pool");
  if (state.yearMin) add("yearMin", `Built ${state.yearMin} or later`);
  if (state.yearMax) add("yearMax", `Built ${state.yearMax} or earlier`);
  if (state.district) add("district", state.district);
  if (state.neighborhood) add("neighborhood", state.neighborhood);
  return chips;
}

function removeChip(key, val) {
  if (key === "type") state.types = state.types.filter(t => t !== val);
  else if (key === "beds" || key === "baths") state[key] = 0;
  else if (key === "garage" || key === "pool") state[key] = false;
  else state[key] = "";
}

function renderChips() {
  const chips = chipList();
  chipsEl.innerHTML = chips.map((c, i) =>
    `<button type="button" class="chip chip-x chip-in" style="animation-delay:${Math.min(i * 40, 320)}ms"
       data-chip="${c.key}" data-chipval="${escapeHTML(c.val || "")}"
       aria-label="Remove filter: ${escapeHTML(c.label)}">${escapeHTML(c.label)} <i aria-hidden="true">✕</i></button>`
  ).join("") + (chips.length >= 2
    ? `<button type="button" class="chip chip-x chip-clear chip-in" style="animation-delay:${Math.min(chips.length * 40, 360)}ms"
         data-chip-clear aria-label="Clear all filters">Clear all</button>`
    : "");
}

chipsEl.addEventListener("click", e => {
  const clear = e.target.closest("[data-chip-clear]");
  const chip = e.target.closest("[data-chip]");
  if (!clear && !chip) return;
  if (clear) { const sort = state.sort; state = defaults(); state.sort = sort; }
  else removeChip(chip.dataset.chip, chip.dataset.chipval);
  syncBar();
  apply();
});

/* ---------- skeleton loading ---------- */
let skeletonTimer;
function showSkeletons() {
  emptyEl.innerHTML = "";
  if (!$(".sk-card", resultsEl))
    resultsEl.innerHTML = Array.from({ length: 4 },
      () => `<div class="skeleton sk-card" aria-hidden="true"></div>`).join("");
  countEl.textContent = "Updating results";
}

function apply() {
  clearTimeout(skeletonTimer);
  if (REDUCE_MOTION.matches) { render(); return; }
  showSkeletons();
  skeletonTimer = setTimeout(render, 250);
}

/* Deterministic pseudo-position for map pins (placeholder for real geo) */
function pinPos(p) {
  const hash = [...p.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  return {
    left: 8 + ((hash % 89) * 0.94),
    top: 16 + (((hash >> 4) % 71) * 0.94)
  };
}

function render() {
  clearTimeout(skeletonTimer);
  const list = PROPERTIES.filter(matches).sort(SORTS[state.sort] || SORTS.recommended);
  writeURL();
  renderChips();

  countEl.textContent = `${list.length} home${list.length === 1 ? "" : "s"} for sale`;
  $("#results-title").innerHTML = state.q
    ? `Homes matching <span class="text-aurora">${escapeHTML(state.q)}</span>`
    : "Homes for sale";

  resultsEl.innerHTML = "";
  emptyEl.innerHTML = "";
  const instant = REDUCE_MOTION.matches;
  if (!list.length) {
    emptyEl.innerHTML = `<div class="empty card">${ICONS.home}<b>No homes match those filters</b>
      <p>Try widening the price range or clearing a filter or two.</p>
      <button class="btn btn-primary" id="empty-reset">Reset filters</button></div>`;
    $("#empty-reset").addEventListener("click", () => {
      const sort = state.sort;
      state = defaults();
      state.sort = sort;
      syncBar();
      apply();
    });
  } else {
    list.forEach((p, i) => {
      const card = propertyCard(p);
      card.dataset.id = p.id;
      if (instant) {
        card.classList.add("is-in");
      } else {
        /* staggered entrance, delay capped and cleared afterwards
           so hover micro-interactions stay snappy */
        const delay = Math.min(i, 8) * 45;
        card.style.transitionDelay = delay + "ms";
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("is-in")));
        setTimeout(() => { card.style.transitionDelay = ""; }, delay + 800);
      }
      resultsEl.appendChild(card);
    });
  }

  /* live MapLibre map takes over when available; fallback pins otherwise */
  document.dispatchEvent(new CustomEvent("hv:results", { detail: list }));
  if (window.HV_MAP_LIVE) return;

  /* map pins */
  $$(".map-pin", mapEl).forEach(el => el.remove());
  const note = $("#map-note");
  if (note) note.style.display = list.length ? "none" : "";
  list.slice(0, 14).forEach((p, i) => {
    const pos = pinPos(p);
    const pin = document.createElement("button");
    pin.className = "map-pin num";
    if (!instant) {
      pin.classList.add("pin-pop");
      pin.style.animationDelay = Math.min(i * 45, 500) + "ms";
    }
    pin.dataset.id = p.id;
    pin.style.left = pos.left + "%";
    pin.style.top = pos.top + "%";
    pin.textContent = "$" + (p.price >= 1e6 ? (p.price / 1e6).toFixed(1) + "M" : Math.round(p.price / 1e3) + "K");
    pin.setAttribute("aria-label", `${p.address}, ${p.city}, ${fmtPrice(p.price)}`);
    pin.addEventListener("click", () => quickView(p));
    mapEl.appendChild(pin);
  });
}

/* ---------- card and pin cross-highlight ---------- */
function setHot(id, on) {
  const pin = $(`.map-pin[data-id="${id}"]`, mapEl);
  const card = $(`.property-card[data-id="${id}"]`, resultsEl);
  if (pin) pin.classList.toggle("is-hot", on);
  if (card) card.classList.toggle("is-hot", on);
}

function bindHot(container, sel) {
  container.addEventListener("pointerover", e => {
    const el = e.target.closest(sel);
    if (el && el.dataset.id) setHot(el.dataset.id, true);
  });
  container.addEventListener("pointerout", e => {
    const el = e.target.closest(sel);
    if (el && el.dataset.id && !el.contains(e.relatedTarget)) setHot(el.dataset.id, false);
  });
  container.addEventListener("focusin", e => {
    const el = e.target.closest(sel);
    if (el && el.dataset.id) setHot(el.dataset.id, true);
  });
  container.addEventListener("focusout", e => {
    const el = e.target.closest(sel);
    if (el && el.dataset.id && !el.contains(e.relatedTarget)) setHot(el.dataset.id, false);
  });
}
bindHot(resultsEl, ".property-card");
bindHot(mapEl, ".map-pin");

/* ---------- save this search ---------- */
$("#save-search").addEventListener("click", () => {
  const query = location.search.replace(/^\?/, "");
  const saved = store.get("savedSearches", []);
  if (saved.some(s => s.query === query)) { toast("This search is already saved"); return; }
  const name = chipList().map(c => c.label).join(" · ") || "All homes";
  saved.unshift({ name, query, savedAt: new Date().toISOString() });
  store.set("savedSearches", saved.slice(0, 20));
  toast("Search saved on this device");
});

/* ---------- filter drawer (all viewports) ---------- */
const drawer = $("#filter-drawer");
const scrim = $("#scrim");
function openDrawer() {
  drawer.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => { drawer.classList.add("is-open"); scrim.classList.add("is-on"); });
  bindFilterForm($("#drawer-host"));
  $("#close-filters").focus();
}
function closeDrawer() {
  drawer.classList.remove("is-open"); scrim.classList.remove("is-on");
  setTimeout(() => { drawer.hidden = true; scrim.hidden = true; }, 400);
  $("#open-filters").focus();
}
$("#open-filters").addEventListener("click", openDrawer);
$("#close-filters").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);
addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) closeDrawer(); });
$("#drawer-apply").addEventListener("click", () => {
  syncBar();
  apply();
  closeDrawer();
});
$("#drawer-reset").addEventListener("click", () => {
  const sort = state.sort;
  state = defaults();
  state.sort = sort;
  bindFilterForm($("#drawer-host"));
});

/* ---------- init ---------- */
state = readURL();
$("#sort").value = state.sort;
$("#sort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
initBar();
syncBar();
setView(view);
render(); /* first paint is instant; skeletons only cover later filter changes */
observeReveals();
