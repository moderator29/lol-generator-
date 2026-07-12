/* Search page: filter form (sidebar + mobile drawer), URL-synced state,
   sorting, results grid, and map placeholder pins. */

renderNav("search");
renderFooter();

const TYPES = ["Single-Family", "Condo", "Townhouse", "Multi-Family"];
const STATUSES = ["For Sale", "New Listing", "Open House", "Pending", "Price Cut"];

/* ---------- filter state ---------- */
const defaults = () => ({
  q: "", min: "", max: "", beds: 0, baths: 0, types: [], status: "",
  sqftMin: "", lotMin: "", garage: false, pool: false,
  yearMin: "", yearMax: "", district: "", neighborhood: "", sort: "recommended"
});
let state = defaults();

function readURL() {
  const p = new URLSearchParams(location.search);
  const s = defaults();
  for (const k of ["q", "min", "max", "sqftMin", "lotMin", "yearMin", "yearMax", "district", "neighborhood", "status", "sort"])
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

/* ---------- filter form ---------- */
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
    <div class="filter-group">
      <b>Price</b>
      <div class="range-row">
        <input class="input num" type="number" inputmode="numeric" data-f="min" value="${state.min}" placeholder="Min" aria-label="Minimum price" min="0" step="10000" />
        <span>–</span>
        <input class="input num" type="number" inputmode="numeric" data-f="max" value="${state.max}" placeholder="Max" aria-label="Maximum price" min="0" step="10000" />
      </div>
    </div>
    <div class="filter-group"><b>Bedrooms</b>${segButtons("beds", state.beds)}</div>
    <div class="filter-group"><b>Bathrooms</b>${segButtons("baths", state.baths)}</div>
    <div class="filter-group">
      <b>Property type</b>
      ${TYPES.map(t => `<label class="check"><input type="checkbox" data-type="${t}" ${state.types.includes(t) ? "checked" : ""}/> ${t}</label>`).join("")}
    </div>
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
        <span>–</span>
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

function bindFilterForm(host, live) {
  host.innerHTML = filterFormHTML();
  host.addEventListener("input", e => {
    const f = e.target.dataset.f;
    if (f) state[f] = e.target.value;
    if (e.target.dataset.fBool) state[e.target.dataset.fBool] = e.target.checked;
    if (e.target.dataset.type) {
      const t = e.target.dataset.type;
      state.types = e.target.checked ? [...state.types, t] : state.types.filter(x => x !== t);
    }
    if (live) apply();
  });
  host.addEventListener("click", e => {
    const seg = e.target.closest("[data-seg]");
    if (seg) {
      state[seg.dataset.seg] = +seg.dataset.val;
      $$(`[data-seg="${seg.dataset.seg}"]`, host).forEach(b =>
        b.setAttribute("aria-pressed", String(b === seg)));
      if (live) apply();
    }
    if (e.target.closest("[data-reset]")) {
      state = defaults();
      bindFilterForm(host, live);
      if (live) apply();
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

/* Deterministic pseudo-position for map pins (placeholder for real geo) */
function pinPos(p, i, total) {
  const hash = [...p.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  return {
    left: 8 + ((hash % 89) * 0.94),
    top: 16 + (((hash >> 4) % 71) * 0.94)
  };
}

function apply() {
  const list = PROPERTIES.filter(matches).sort(SORTS[state.sort] || SORTS.recommended);
  writeURL();

  countEl.textContent = `${list.length} home${list.length === 1 ? "" : "s"} · placeholder listings`;
  $("#results-title").textContent = state.q ? `Homes matching “${state.q}”` : "Homes for sale";

  resultsEl.innerHTML = "";
  emptyEl.innerHTML = "";
  if (!list.length) {
    emptyEl.innerHTML = `<div class="empty card">${ICONS.home}<b>No homes match those filters</b>
      <p>Try widening the price range or clearing a filter or two.</p>
      <button class="btn btn-primary" id="empty-reset">Reset filters</button></div>`;
    $("#empty-reset").addEventListener("click", () => {
      state = defaults();
      bindFilterForm($("#filters-host"), true);
      apply();
    });
  } else {
    list.forEach(p => {
      const card = propertyCard(p);
      card.classList.add("is-in"); // results appear instantly; reveal is for landing
      resultsEl.appendChild(card);
    });
  }

  /* map pins */
  $$(".map-pin", mapEl).forEach(el => el.remove());
  $("#map-note").style.display = list.length ? "none" : "";
  list.slice(0, 14).forEach((p, i) => {
    const pos = pinPos(p, i, list.length);
    const pin = document.createElement("button");
    pin.className = "map-pin num";
    pin.style.left = pos.left + "%";
    pin.style.top = pos.top + "%";
    pin.textContent = "$" + (p.price >= 1e6 ? (p.price / 1e6).toFixed(1) + "M" : Math.round(p.price / 1e3) + "K");
    pin.setAttribute("aria-label", `${p.address}, ${p.city} — ${fmtPrice(p.price)}`);
    pin.addEventListener("click", () => quickView(p));
    mapEl.appendChild(pin);
  });
}

/* ---------- mobile drawer ---------- */
const drawer = $("#filter-drawer");
const scrim = $("#scrim");
function openDrawer() {
  drawer.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => { drawer.classList.add("is-open"); scrim.classList.add("is-on"); });
  bindFilterForm($("#drawer-host"), false);
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
  bindSidebar();
  apply();
  closeDrawer();
});
$("#drawer-reset").addEventListener("click", () => {
  state = defaults();
  bindFilterForm($("#drawer-host"), false);
});

/* ---------- init ---------- */
function bindSidebar() { bindFilterForm($("#filters-host"), true); }
state = readURL();
$("#sort").value = state.sort;
$("#sort").addEventListener("change", e => { state.sort = e.target.value; apply(); });
bindSidebar();
apply();
