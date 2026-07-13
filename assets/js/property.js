/* Property detail page: photo gallery from p.views, payment options,
   key features checklist, mortgage estimate, property manager card,
   tour booking, similar and recently viewed homes. */

renderNav("search");
renderFooter();

const PHOTO_COUNT = 10;
const SLIDE_SHADES = [0.06, 0.1, 0.08, 0.12, 0.09, 0.11, 0.02, 0.15, 0.27, 0.09];

const PROP_ICONS = {
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="5.5" r="2.6"/><circle cx="17.5" cy="18.5" r="2.6"/><path d="M8.3 10.8 15.2 6.7M8.3 13.2l6.9 4.1"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v11H12l-4.5 3.8v-3.8H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M10 8.6v6.8l5.6-3.4z"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 7.3v9.4L12 21l7.5-4.3V7.3z"/><path d="M4.5 7.3 12 11.6l7.5-4.3M12 11.6V21"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4v7M12 11h8M12 15h-8"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.6l5 5L19.5 6.4"/></svg>'
};

const helpBit = key => (typeof window.helpBtn === "function" ? window.helpBtn(key) : "");
const secHead = (title, key) => `<div class="sec-head"><h2>${title}</h2>${key ? helpBit(key) : ""}</div>`;
const checkRow = text => `<li><span class="check-ic" aria-hidden="true">${PROP_ICONS.check}</span>${text}</li>`;
const fmtDate = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ---------- load property ---------- */
const propId = new URLSearchParams(location.search).get("id") || "";
const prop = propId ? byId(propId) : null;
const root = $("#prop-root");
const crumbs = $("#crumbs");

/* ============================================================
   page build
   ============================================================ */
function buildPage(p) {
  /* deterministic derived facts, seeded from the listing id so every
     visit shows the same placeholder numbers until real data arrives */
  const seed = [...p.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pick = (arr, o = 0) => arr[(seed + o) % arr.length];

  const recentBefore = store.get("recent", []).filter(id => id !== p.id);
  trackViewed(p.id);

  /* listing-supplied facts win; seeded placeholders fill any gaps */
  const annualTax = p.taxes ?? Math.round(p.price * (0.011 + (seed % 8) * 0.0012));
  const hoaMonthly = p.hoa ?? (p.type === "Condo" ? 260 + (seed % 9) * 45
    : p.type === "Townhouse" ? 120 + (seed % 6) * 30
    : p.type === "Multi-Family" ? 0
    : (p.pool ? 60 + (seed % 4) * 15 : 0));
  const heating = p.heating || pick(["Forced air, gas", "Heat pump", "Radiant floor", "Forced air, electric", "Hot water boiler"], 1);
  const cooling = p.cooling || pick(["Central air", "Heat pump", "Mini-split zones", "Central air, two zones"], 2);
  const parkingDesc = p.parkingDesc || (p.garage ? `${p.garage}-car garage` : "Street parking");
  const walkScore = p.walkScore ?? Math.min(97, 46 + (seed % 38) + (p.type === "Condo" ? 13 : 0));
  const walkLabel = walkScore >= 90 ? "Walker's paradise" : walkScore >= 70 ? "Very walkable" : walkScore >= 50 ? "Somewhat walkable" : "Car-dependent";

  document.title = `${p.address}, ${p.city} ${p.state} · Havnora`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content",
    `${p.beds} bed, ${p.baths} bath ${p.type.toLowerCase()} at ${p.address}, ${p.city}, ${p.state} ${p.zip}. ${fmtPrice(p.price)} on Havnora.`);
  injectJsonLd(p);

  crumbs.innerHTML = `
    <a href="index.html">Home</a><span class="sep" aria-hidden="true">·</span>
    <a href="search.html">Buy</a><span class="sep" aria-hidden="true">·</span>
    <a href="search.html?q=${encodeURIComponent(p.city)}">${p.city}, ${p.state}</a><span class="sep" aria-hidden="true">·</span>
    <span aria-current="page">${p.address}</span>`;

  root.innerHTML = `
    ${galleryHTML(p)}
    ${headerHTML(p)}
    ${paymentHTML(p)}
    <div class="prop-layout">
      <div class="prop-main">
        ${overviewHTML(p, { annualTax, hoaMonthly, heating, cooling, parkingDesc, walkScore })}
        ${descriptionHTML(p)}
        ${featuresHTML(p)}
        ${roomsHTML(p, seed)}
        ${floorPlanHTML()}
        ${locationHTML(p)}
        ${priceHistoryHTML(p)}
        ${nearbyHTML(p, seed)}
        ${walkScoreHTML(walkScore, walkLabel)}
        ${mediaHTML()}
        <section class="prop-section" aria-labelledby="similar-h">
          <div class="sec-head"><h2 id="similar-h">Similar homes</h2></div>
          <div class="similar-grid" id="similar-grid"></div>
        </section>
        <section class="prop-section" id="recent-section" aria-labelledby="recent-h" hidden>
          <div class="sec-head"><h2 id="recent-h">Recently viewed</h2></div>
          <div class="recent-grid" id="recent-grid"></div>
        </section>
      </div>
      <aside class="prop-aside" aria-label="Cost estimate, property manager, and tours">
        ${calcHTML(p)}
        ${agentHTML()}
        ${tourHTML()}
      </aside>
    </div>`;

  initGallery(p);
  initHeaderActions(p);
  initCalc(p, { annualTax, hoaMonthly });
  initAgentCard(p);
  initTourCard(p);
  renderSimilar(p);
  renderRecent(recentBefore);
  observeReveals(root);
}

/* ============================================================
   JSON-LD
   ============================================================ */
function injectJsonLd(p) {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
    "url": location.href,
    "description": p.blurb,
    "image": (p.views || []).map(v => v.src),
    "offers": { "@type": "Offer", "price": p.price, "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "about": {
      "@type": "Residence",
      "numberOfBedrooms": p.beds,
      "numberOfBathroomsTotal": p.baths,
      "yearBuilt": p.yearBuilt,
      "floorSize": { "@type": "QuantitativeValue", "value": p.sqft, "unitCode": "FTK" },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": p.address,
        "addressLocality": p.city,
        "addressRegion": p.state,
        "postalCode": p.zip,
        "addressCountry": "US"
      }
    }
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/* ============================================================
   gallery: six labeled photos from p.views, then reserved slots
   ============================================================ */
const viewsOf = p => Array.isArray(p.views) ? p.views.slice(0, PHOTO_COUNT) : [];

function slideHTML(p, i) {
  const views = viewsOf(p);
  const v = views[i];
  if (v) {
    return `
      <div class="gallery-slide ${toneOf(p)}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${v.label}, photo ${i + 1} of ${PHOTO_COUNT}">
        <div class="slide-shade" style="opacity:${SLIDE_SHADES[i]}" aria-hidden="true"></div>
        <img class="slide-img" src="${v.src}" alt="${v.label} of ${p.address}, ${p.city}" ${i === 0 ? "" : 'loading="lazy"'} onerror="this.remove()" />
        <span class="slide-label">${v.label}</span>
      </div>`;
  }
  return `
    <div class="gallery-slide ${toneOf(p)}" data-i="${i}" role="group" aria-roledescription="slide" aria-label="Photo ${i + 1} of ${PHOTO_COUNT}, reserved for photography">
      <div class="slide-shade" style="opacity:${SLIDE_SHADES[i]}" aria-hidden="true"></div>
      <div class="slide-ph">${ICONS.camera}<b>Photo ${i + 1} of ${PHOTO_COUNT}</b><span>Reserved for photography</span></div>
    </div>`;
}

function thumbHTML(p, i) {
  const views = viewsOf(p);
  const v = views[i];
  const label = v ? v.label : `Photo ${i + 1}`;
  return `
    <button type="button" class="${i === 0 ? "is-active" : ""}" data-thumb="${i}" aria-label="Go to photo ${i + 1}, ${label}" aria-pressed="${i === 0}">
      <span class="t-img ${toneOf(p)}">
        <span class="slide-shade" style="opacity:${SLIDE_SHADES[i]}" aria-hidden="true"></span>
        ${v
          ? `<img src="${v.src.replace("w=1600", "w=400")}" alt="" loading="lazy" onerror="this.remove()" />`
          : `<span class="t-num num" aria-hidden="true">${i + 1}</span>`}
      </span>
      <span class="t-label">${label}</span>
    </button>`;
}

function galleryHTML(p) {
  const slides = [...Array(PHOTO_COUNT)].map((_, i) => slideHTML(p, i)).join("");
  const thumbs = [...Array(PHOTO_COUNT)].map((_, i) => thumbHTML(p, i)).join("");
  return `
    <section aria-label="Photo gallery">
      <div class="gallery" id="gallery" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Listing photos, use arrow keys to browse">
        <div class="gallery-track" id="gallery-track">${slides}</div>
        <button type="button" class="gallery-nav gallery-prev" id="g-prev" aria-label="Previous photo">${ICONS.left}</button>
        <button type="button" class="gallery-nav gallery-next" id="g-next" aria-label="Next photo">${ICONS.right}</button>
        <button type="button" class="btn btn-icon glass gallery-expand" id="g-expand" aria-label="Open full-screen photo viewer">${PROP_ICONS.expand}</button>
        <span class="gallery-count num" id="g-count" aria-live="polite">1 / ${PHOTO_COUNT}</span>
      </div>
      <div class="thumbs" id="thumbs" role="group" aria-label="Photo thumbnails">${thumbs}</div>
    </section>`;
}

function initGallery(p) {
  let idx = 0;
  let lightbox = null;
  let zoomed = false;
  const track = $("#gallery-track");
  const gallery = $("#gallery");
  const count = $("#g-count");

  function go(n) {
    idx = ((n % PHOTO_COUNT) + PHOTO_COUNT) % PHOTO_COUNT;
    track.style.transform = `translateX(${-idx * 100}%)`;
    count.textContent = `${idx + 1} / ${PHOTO_COUNT}`;
    $$("#thumbs button").forEach(b => {
      const on = +b.dataset.thumb === idx;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    if (lightbox && lightbox.open) renderLightboxSlide();
  }

  $("#g-prev").addEventListener("click", () => go(idx - 1));
  $("#g-next").addEventListener("click", () => go(idx + 1));
  $("#thumbs").addEventListener("click", e => {
    const b = e.target.closest("[data-thumb]");
    if (b) go(+b.dataset.thumb);
  });

  gallery.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
  });

  /* pointer swipe, no libraries */
  let startX = null, pointerId = null;
  track.addEventListener("pointerdown", e => {
    startX = e.clientX;
    pointerId = e.pointerId;
    track.setPointerCapture(pointerId);
    track.classList.add("is-dragging");
  });
  track.addEventListener("pointermove", e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    track.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`;
  });
  const endSwipe = e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    track.classList.remove("is-dragging");
    if (Math.abs(dx) > 48) go(idx + (dx < 0 ? 1 : -1));
    else go(idx);
  };
  track.addEventListener("pointerup", endSwipe);
  track.addEventListener("pointercancel", endSwipe);
  track.addEventListener("dragstart", e => e.preventDefault());

  /* lightbox */
  function renderLightboxSlide() {
    const host = $("#lb-slide-host", lightbox);
    host.innerHTML = slideHTML(p, idx);
    const slide = $(".gallery-slide", host);
    slide.classList.toggle("is-zoomed", zoomed);
    slide.addEventListener("click", toggleZoom);
    $("#lb-count", lightbox).textContent = `${idx + 1} / ${PHOTO_COUNT}`;
    $("#lb-zoom", lightbox).setAttribute("aria-pressed", String(zoomed));
  }
  function toggleZoom() {
    zoomed = !zoomed;
    const slide = $("#lb-slide-host .gallery-slide", lightbox);
    if (slide) slide.classList.toggle("is-zoomed", zoomed);
    $("#lb-zoom", lightbox).setAttribute("aria-pressed", String(zoomed));
  }
  function openLightbox() {
    if (!lightbox) {
      lightbox = document.createElement("dialog");
      lightbox.className = "lightbox";
      lightbox.setAttribute("aria-label", "Full-screen photo viewer");
      lightbox.innerHTML = `
        <div class="lightbox-inner">
          <div class="lightbox-tools">
            <button type="button" class="btn btn-icon" id="lb-zoom" aria-label="Toggle zoom" aria-pressed="false">${PROP_ICONS.zoom}</button>
            <button type="button" class="btn btn-icon" id="lb-close" aria-label="Close photo viewer">${ICONS.close}</button>
          </div>
          <button type="button" class="gallery-nav gallery-prev" id="lb-prev" aria-label="Previous photo">${ICONS.left}</button>
          <div id="lb-slide-host"></div>
          <button type="button" class="gallery-nav gallery-next" id="lb-next" aria-label="Next photo">${ICONS.right}</button>
          <span class="gallery-count num" id="lb-count" aria-live="polite"></span>
        </div>`;
      document.body.appendChild(lightbox);
      $("#lb-close", lightbox).addEventListener("click", () => lightbox.close());
      $("#lb-prev", lightbox).addEventListener("click", () => go(idx - 1));
      $("#lb-next", lightbox).addEventListener("click", () => go(idx + 1));
      $("#lb-zoom", lightbox).addEventListener("click", toggleZoom);
      lightbox.addEventListener("keydown", e => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
      });
      lightbox.addEventListener("close", () => { zoomed = false; });
    }
    zoomed = false;
    renderLightboxSlide();
    lightbox.showModal();
  }
  $("#g-expand").addEventListener("click", openLightbox);
}

/* ============================================================
   header row
   ============================================================ */
function headerHTML(p) {
  const saved = favorites.has(p.id);
  return `
    <header class="prop-head" style="margin-top:28px">
      <div>
        <h1 class="prop-addr">${p.address}</h1>
        <p class="prop-sub">${p.neighborhood} · ${p.city}, ${p.state} ${p.zip}</p>
        <div class="prop-meta">
          ${p.featured ? '<span class="badge badge-featured">Featured</span>' : ""}
          <span class="badge ${BADGE_CLASS[p.status] || ""}">${p.status}</span>
          <span class="small muted num">${p.dom} day${p.dom === 1 ? "" : "s"} on Havnora</span>
        </div>
        <div class="prop-price num gold-text">${fmtPrice(p.price)}</div>
        <div class="prop-chips num">
          <span class="spec-chip"><b>${p.beds}</b> Beds</span>
          <span class="spec-chip"><b>${p.baths}</b> Baths</span>
          <span class="spec-chip"><b>${fmtNum(p.sqft)}</b> sqft</span>
          <span class="spec-chip"><b>$${perSqft(p)}</b> per sqft</span>
          <span class="spec-chip">Built <b>${p.yearBuilt}</b></span>
          <span class="spec-chip">Lot <b>${p.lot ? p.lot + " ac" : "n/a"}</b></span>
        </div>
      </div>
      <div class="prop-actions">
        <button type="button" class="btn ${saved ? "is-active" : ""}" id="act-save" aria-pressed="${saved}">${ICONS.heart} ${saved ? "Saved" : "Save"}</button>
        <button type="button" class="btn" id="act-share">${PROP_ICONS.share} Share</button>
        <button type="button" class="btn btn-brass" id="act-message">${PROP_ICONS.message} Message manager</button>
      </div>
    </header>`;
}

function initHeaderActions(p) {
  $("#act-save").addEventListener("click", e => {
    const added = favorites.toggle(p.id);
    if (typeof hvApi !== "undefined") hvApi.syncFavorite(p.id, added);
    const btn = e.currentTarget;
    btn.classList.toggle("is-active", added);
    btn.setAttribute("aria-pressed", String(added));
    btn.innerHTML = `${ICONS.heart} ${added ? "Saved" : "Save"}`;
    toast(added ? "Added to favorites" : "Removed from favorites");
  });

  $("#act-share").addEventListener("click", async () => {
    const payload = { title: document.title, text: `${p.address}, ${p.city}, ${p.state} on Havnora`, url: location.href };
    if (navigator.share) {
      try { await navigator.share(payload); return; } catch { /* user dismissed, fall through */ }
    }
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Link copied to clipboard");
    } catch {
      toast("Copy the address bar link to share");
    }
  });

  $("#act-message").addEventListener("click", () => messageManagerAbout(p.id));
}

/* ============================================================
   payment options
   ============================================================ */
function paymentHTML(p) {
  return `
    <section class="prop-section" id="payment" style="border-top:none" aria-labelledby="pay-h">
      <div class="sec-head"><h2 id="pay-h">Payment options</h2></div>
      <div class="pay-duo">
        <div class="card glass pay-card">
          <span class="pay-kicker">Down Payment</span>
          <b class="pay-amount num gold-text">${fmtShort(p.downPayment)}</b>
          <p class="pay-caption">Initial deposit to secure this property</p>
          <ul class="pay-checks">
            ${checkRow("Secure Property")}
            ${checkRow("Flexible Payment Plan")}
          </ul>
          <a class="btn btn-block" style="margin-top:14px" href="payment.html?id=${p.id}&kind=down">Reserve with a down payment</a>
        </div>
        <div class="card glass pay-card pay-card-full">
          <span class="pay-kicker">Full Payment</span>
          <b class="pay-amount num gold-text">${fmtPrice(p.price)}</b>
          <p class="pay-caption">Pay in full and save more</p>
          <ul class="pay-checks">
            ${checkRow("Best Price")}
            ${checkRow("Instant Ownership")}
          </ul>
          <a class="btn btn-brass btn-glow btn-block" style="margin-top:14px" href="payment.html?id=${p.id}&kind=full">Proceed to full payment</a>
        </div>
      </div>
      <p class="pay-note small muted">Minimum down payment on Havnora is $30,000. ${helpBit("mortgage-calculator")}</p>
    </section>`;
}

/* ============================================================
   main column sections
   ============================================================ */
function overviewHTML(p, d) {
  const spec = (label, value) => `<div class="spec"><span>${label}</span><b>${value}</b></div>`;
  return `
    <section class="prop-section" style="border-top:none; padding-top:8px" aria-label="Overview">
      ${secHead("Overview")}
      <div class="spec-grid">
        ${spec("Property type", p.type)}
        ${spec("Year built", `<span class="num">${p.yearBuilt}</span>`)}
        ${spec("Lot size", p.lot ? `<span class="num">${p.lot}</span> acres` : "None (shared)")}
        ${spec("Parking", d.parkingDesc)}
        ${spec("Heating", d.heating)}
        ${spec("Cooling", d.cooling)}
        ${spec("HOA", d.hoaMonthly ? `<span class="num">$${fmtNum(d.hoaMonthly)}</span>/mo est.` : "None")}
        ${spec("Taxes", `<span class="num">$${fmtNum(d.annualTax)}</span>/yr est.`)}
        ${spec("Walk Score", `<span class="num">${d.walkScore}</span> / 100`)}
      </div>
    </section>`;
}

function descriptionHTML(p) {
  const feats = p.features.map(f => f.toLowerCase());
  const extra = `Day to day, the details carry it: ${feats.slice(0, 3).join(", ")}, and ${feats[3] || feats[0]}. `
    + `Set in ${p.neighborhood} within the ${p.district} boundary, it is a ${p.type.toLowerCase()} that asks very little and gives back a lot. `
    + `Every number on this page is stated plainly, and anything marked as an estimate is exactly that.`;
  return `
    <section class="prop-section" aria-label="Description">
      ${secHead("About this home")}
      <p style="max-width:680px">${p.blurb}</p>
      <p class="muted" style="max-width:680px; margin-bottom:0">${extra}</p>
    </section>`;
}

function featuresHTML(p) {
  return `
    <section class="prop-section" aria-label="Key features">
      ${secHead("Key features")}
      <ul class="feat-list">${p.features.map(checkRow).join("")}</ul>
    </section>`;
}

function roomsHTML(p, seed) {
  let rows;
  if (Array.isArray(p.rooms) && p.rooms.length) {
    rows = p.rooms.map(r => {
      const [w, l] = r.size.split(" x ").map(Number);
      const area = w && l ? `<span class="num">${fmtNum(w * l)}</span> sqft` : "·";
      return `<tr><td><b>${r.name}</b></td><td class="num">${r.size} ft</td><td>${area}</td></tr>`;
    }).join("");
  } else {
    const dim = i => `${11 + (seed + i * 7) % 8} x ${13 + (seed + i * 13) % 9}`;
    const names = ["Living room", "Kitchen", "Dining", "Primary bedroom", "Laundry"];
    rows = names.map((name, i) => {
      const [w, l] = dim(i).split(" x ").map(Number);
      return `<tr><td><b>${name}</b></td><td class="num">${dim(i)} ft</td><td><span class="num">${fmtNum(w * l)}</span> sqft</td></tr>`;
    }).join("");
  }
  return `
    <section class="prop-section" aria-label="Rooms">
      ${secHead("Rooms")}
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Room</th><th scope="col">Dimensions</th><th scope="col">Approx. area</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="small muted" style="margin:10px 0 0">Room dimensions are approximate until the floor plan is professionally measured.</p>
    </section>`;
}

function floorPlanHTML() {
  return `
    <section class="prop-section" aria-label="Floor plan">
      ${secHead("Floor plan")}
      <div class="ph-block" style="min-height:220px">${PROP_ICONS.plan}<b>Floor plan coming soon</b><span>Reserved for measured architectural drawings</span></div>
    </section>`;
}

function locationHTML(p) {
  return `
    <section class="prop-section" aria-label="Location">
      ${secHead("Location")}
      <div class="map-panel" role="img" aria-label="Map of ${p.address}, ${p.city} (interactive map placeholder)" style="min-height:280px">
        <div class="map-note">${PROP_ICONS.pin}<br /><b>Interactive map placeholder</b><br />Reserved for MapLibre or Mapbox integration.</div>
      </div>
      <p class="small muted" style="margin:12px 0 0">${p.address} sits in ${p.neighborhood}, ${p.city}, ${p.state} ${p.zip}, within the ${p.district} school boundary.</p>
    </section>`;
}

function priceHistoryHTML(p) {
  const events = (Array.isArray(p.priceHistory) && p.priceHistory.length
    ? [...p.priceHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [{ date: new Date().toISOString().slice(0, 10), event: "Listed", price: p.price }]);
  const rows = events.map((e, i) => {
    const prev = events[i + 1];
    const change = prev && prev.price ? Math.round((e.price / prev.price - 1) * 100) : null;
    const chip = change === null ? '<span class="muted">·</span>'
      : `<span class="badge ${change < 0 ? "badge-cut" : "badge-new"}">${change > 0 ? "+" : ""}${change}%</span>`;
    return `<tr><td class="num">${fmtDate(new Date(e.date + "T12:00:00"))}</td><td><b>${e.event}</b></td><td class="num">${fmtPrice(e.price)}</td><td>${chip}</td></tr>`;
  }).join("");
  return `
    <section class="prop-section" aria-label="Price history">
      ${secHead("Price history", "price-history")}
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th scope="col">Date</th><th scope="col">Event</th><th scope="col">Price</th><th scope="col">Change</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function nearbyHTML(p, seed) {
  const mi = o => ((seed + o) % 14 / 10 + 0.2).toFixed(1) + " mi";
  const li = (name, sub, val) => `<li><b>${name}${sub ? `<span class="nb-sub">${sub}</span>` : ""}</b><span class="num">${val}</span></li>`;
  const chip = n => `<span class="badge ${n >= 8 ? "badge-new" : ""} num">${n}/10</span>`;

  const schools = (Array.isArray(p.schools) && p.schools.length
    ? p.schools.map(s => li(s.name, `${s.level} · ${s.distance}`, chip(s.rating)))
    : [li("Assigned elementary", "", chip(6 + (seed + 1) % 5)), li("Assigned middle school", "", chip(6 + (seed + 3) % 5)), li("Assigned high school", "", chip(6 + (seed + 5) % 5))]).join("");
  const transit = (Array.isArray(p.transit) && p.transit.length
    ? p.transit.map(t => li(t.name, t.type, t.distance))
    : [li("Nearest bus stop", "", mi(2)), li("Rail or light rail", "", mi(9)), li("Bike route access", "", mi(4))]).join("");
  const shopping = (Array.isArray(p.shopping) && p.shopping.length
    ? p.shopping.map(s => li(s.name, "", s.distance))
    : [li("Grocery store", "", mi(6)), li("Coffee and cafes", "", mi(7)), li("Pharmacy", "", mi(11))]).join("");

  return `
    <section class="prop-section" aria-label="What's nearby">
      ${secHead("What's nearby")}
      <div class="nearby-grid">
        <div class="card glass">
          <h3>Schools</h3>
          <ul class="nearby-list">${schools}</ul>
          <p class="small muted" style="margin:12px 0 0">${p.district} · verify enrollment boundaries with the district.</p>
        </div>
        <div class="card glass">
          <h3>Transit</h3>
          <ul class="nearby-list">${transit}</ul>
          <p class="small muted" style="margin:12px 0 0">Distances are straight-line estimates.</p>
        </div>
        <div class="card glass">
          <h3>Shopping</h3>
          <ul class="nearby-list">${shopping}</ul>
          <p class="small muted" style="margin:12px 0 0">More points of interest arrive with the live map.</p>
        </div>
      </div>
    </section>`;
}

function walkScoreHTML(score, label) {
  return `
    <section class="prop-section" aria-label="Walk Score">
      ${secHead("Walk Score", "walk-score")}
      <div class="card glass walk-dial">
        <div class="ring" style="--score:${score}" role="img" aria-label="Walk Score ${score} out of 100"><i class="num">${score}</i></div>
        <div>
          <b>${label}</b>
          <p class="small muted" style="margin:4px 0 0; max-width:420px">An estimate of how easily daily errands can be done on foot from this address. A live pedestrian data feed replaces it at launch.</p>
        </div>
      </div>
    </section>`;
}

function mediaHTML() {
  return `
    <section class="prop-section" aria-label="Virtual tour and video">
      ${secHead("Tour it from anywhere")}
      <div class="media-duo">
        <div class="ph-block" style="min-height:200px">${PROP_ICONS.cube}<b>3D virtual tour coming soon</b><span>Reserved for an immersive walkthrough</span></div>
        <div class="ph-block" style="min-height:200px">${PROP_ICONS.play}<b>Video tour coming soon</b><span>Reserved for a filmed walkthrough</span></div>
      </div>
    </section>`;
}

function renderSimilar(p) {
  const pool = PROPERTIES.filter(x => x.id !== p.id);
  const sameCity = pool.filter(x => x.city === p.city);
  const sameType = pool.filter(x => x.type === p.type && !sameCity.includes(x));
  const rest = pool.filter(x => !sameCity.includes(x) && !sameType.includes(x));
  const picks = [...sameCity, ...sameType, ...rest].slice(0, 3);
  const grid = $("#similar-grid");
  picks.forEach(x => {
    const card = propertyCard(x);
    card.classList.add("is-in");
    grid.appendChild(card);
  });
}

function renderRecent(recentIds) {
  const picks = recentIds.map(byId).filter(Boolean).slice(0, 3);
  if (!picks.length) return;
  $("#recent-section").hidden = false;
  const grid = $("#recent-grid");
  picks.forEach(x => {
    const card = propertyCard(x);
    card.classList.add("is-in");
    grid.appendChild(card);
  });
}

/* ============================================================
   aside: mortgage estimate
   ============================================================ */
const MIN_DOWN = 30000;

function calcHTML(p) {
  return `
    <div class="card glass" id="calc-card">
      <div class="sec-head" style="margin-bottom:0"><h3 style="margin:0">Mortgage estimate</h3>${helpBit("mortgage-calculator")}</div>
      <div class="calc-out" aria-live="polite">
        <b class="num gold-text" id="calc-total">$0</b>
        <span>Estimate per month</span>
      </div>
      <form class="calc-form" id="calc-form">
        <label class="field">
          <span>Home price</span>
          <input class="input num" type="number" id="calc-price" inputmode="numeric" min="0" step="1000" value="${p.price}" />
        </label>
        <label class="field">
          <span>Down payment · <b class="num" id="calc-dp-out"></b></span>
          <input class="input num" type="number" id="calc-dp" inputmode="numeric" min="${MIN_DOWN}" step="500" value="${Math.max(MIN_DOWN, p.downPayment)}" />
        </label>
        <div class="calc-split">
          <label class="field">
            <span>Interest rate %</span>
            <input class="input num" type="number" id="calc-rate" inputmode="decimal" min="0" max="15" step="0.05" value="6.5" />
          </label>
          <label class="field">
            <span>Loan term</span>
            <select class="input" id="calc-term">
              <option value="30" selected>30 years</option>
              <option value="15">15 years</option>
            </select>
          </label>
        </div>
      </form>
      <ul class="calc-rows num" id="calc-rows"></ul>
      <p class="small muted" style="margin:14px 0 0">Minimum down payment on Havnora is $30,000. Every figure here is an estimate for planning only, not a quote or an offer of credit.</p>
    </div>`;
}

function initCalc(p, d) {
  const out = $("#calc-total");
  const rows = $("#calc-rows");
  const dpInput = $("#calc-dp");
  const dpOut = $("#calc-dp-out");
  const fmtMo = n => "$" + fmtNum(Math.round(n));

  function recalc() {
    const price = Math.max(0, +$("#calc-price").value || 0);
    const rawDown = +dpInput.value || 0;
    const down = Math.min(Math.max(MIN_DOWN, rawDown), Math.max(MIN_DOWN, price));
    const dpPct = price ? Math.round(down / price * 1000) / 10 : 0;
    const rate = Math.max(0, +$("#calc-rate").value || 0);
    const years = +$("#calc-term").value;
    const loan = Math.max(0, price - down);
    const r = rate / 100 / 12;
    const n = years * 12;
    const pi = n === 0 ? 0 : r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
    const taxMo = d.annualTax / 12;
    const insMo = price * 0.0035 / 12;
    const total = pi + taxMo + insMo + d.hoaMonthly;

    dpOut.textContent = `${fmtPrice(Math.round(down))} (${dpPct}%)`;
    out.textContent = fmtMo(total);
    rows.innerHTML = `
      <li><span>Principal and interest</span><b>${fmtMo(pi)}</b></li>
      <li><span>Property taxes (estimate)</span><b>${fmtMo(taxMo)}</b></li>
      <li><span>Home insurance (estimate)</span><b>${fmtMo(insMo)}</b></li>
      <li><span>HOA dues (estimate)</span><b>${d.hoaMonthly ? fmtMo(d.hoaMonthly) : "$0"}</b></li>`;
  }

  dpInput.addEventListener("change", () => {
    const v = +dpInput.value || 0;
    if (v < MIN_DOWN) { dpInput.value = MIN_DOWN; recalc(); }
  });
  $("#calc-form").addEventListener("input", recalc);
  $("#calc-form").addEventListener("submit", e => e.preventDefault());
  recalc();
}

/* ============================================================
   aside: property manager card
   ============================================================ */
function agentHTML() {
  return `
    <div class="card glass agent-card">
      <div class="pm-avatar" aria-hidden="true">${LOGO_MARK}</div>
      <b style="font-family:var(--font-display); font-size:19px">Havnora Property Manager</b>
      <p class="small muted" style="margin:4px 0 16px">Usually replies within the hour</p>
      <div style="display:grid; gap:10px">
        <button type="button" class="btn btn-brass btn-block" id="agent-msg">Contact Agent</button>
        <button type="button" class="btn" id="agent-info" aria-expanded="false" aria-controls="agent-form">Request info</button>
      </div>
      <form class="aside-form" id="agent-form" hidden>
        <label class="field"><span>Name</span><input class="input" type="text" id="req-name" autocomplete="name" required /></label>
        <label class="field"><span>Email</span><input class="input" type="email" id="req-email" autocomplete="email" required /></label>
        <label class="field"><span>Message</span><textarea class="input" id="req-msg" rows="3" placeholder="I would like to know more about this home."></textarea></label>
        <button type="submit" class="btn btn-brass btn-block">Send request</button>
      </form>
    </div>`;
}

function initAgentCard(p) {
  const form = $("#agent-form");
  const infoBtn = $("#agent-info");
  const user = store.get("user", null);
  if (user) {
    if (user.name) $("#req-name").value = user.name;
    if (user.email) $("#req-email").value = user.email;
  }

  $("#agent-msg").addEventListener("click", () => messageManagerAbout(p.id));

  infoBtn.addEventListener("click", () => {
    form.hidden = !form.hidden;
    infoBtn.setAttribute("aria-expanded", String(!form.hidden));
    if (!form.hidden) $("#req-name").focus();
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#req-name").value.trim();
    const email = $("#req-email").value.trim();
    const message = $("#req-msg").value.trim() || "I would like to know more about this home.";
    if (typeof hvApi !== "undefined") hvApi.sendInquiry({ propertyId: p.id, name, email, message });
    form.reset();
    form.hidden = true;
    infoBtn.setAttribute("aria-expanded", "false");
    toast("Request sent to the manager");
  });
}

/* ============================================================
   aside: tour card
   ============================================================ */
function tourHTML() {
  const days = [...Array(4)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 1 + i);
    return d;
  });
  const dayBtns = days.map((d, i) => `
    <button type="button" data-day="${d.toISOString().slice(0, 10)}" aria-pressed="${i === 0}">
      <span>${d.toLocaleDateString("en-US", { weekday: "short" })}</span>
      <b class="num">${d.getDate()}</b>
    </button>`).join("");
  const times = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];
  return `
    <div class="card glass" id="tour-card">
      <div class="sec-head" style="margin-bottom:14px"><h3 style="margin:0">Book a tour</h3></div>
      <div class="tour-days" role="group" aria-label="Pick a day">${dayBtns}</div>
      <label class="field" style="margin-bottom:14px">
        <span>Time</span>
        <select class="input" id="tour-time">${times.map(t => `<option>${t}</option>`).join("")}</select>
      </label>
      <button type="button" class="btn btn-brass btn-block" id="tour-request">Request this tour</button>
      <p class="small muted" style="margin:12px 0 0">Free, no obligation. The manager confirms your time, usually within the hour.</p>
    </div>`;
}

function initTourCard(p) {
  const card = $("#tour-card");
  card.addEventListener("click", e => {
    const b = e.target.closest(".tour-days button");
    if (!b) return;
    $$(".tour-days button", card).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });
  $("#tour-request").addEventListener("click", () => {
    const day = $('.tour-days button[aria-pressed="true"]', card);
    const date = day.dataset.day;
    const time = $("#tour-time").value;
    addBooking(p.id, date, time);
    toast("Viewing requested. The manager will confirm shortly.");
  });
}

/* ---------- boot, after every declaration above is initialized ---------- */
if (!prop) {
  crumbs.innerHTML = `<a href="index.html">Home</a><span class="sep" aria-hidden="true">·</span>
    <a href="search.html">Buy</a><span class="sep" aria-hidden="true">·</span>
    <span aria-current="page">Listing</span>`;
  root.innerHTML = `
    <div class="empty card" style="margin-bottom:64px">${ICONS.home}
      <b>We could not find that listing</b>
      <p>It may have sold, or the link may be incomplete. The search page has every home we know about.</p>
      <a class="btn btn-primary" href="search.html">Browse homes for sale</a>
    </div>`;
} else {
  buildPage(prop);
}
