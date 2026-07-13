/* Landing page: photo-first hero, featured-first listing grid, payment
   explainers, community photo tiles, pillars, stats, testimonials, FAQ. */

renderNav("home");
renderFooter();

/* hero search → search page with params */
$("#hero-search").addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const params = new URLSearchParams();
  for (const [k, v] of data) if (v) params.set(k, v);
  location.href = "search.html" + (params.size ? "?" + params : "");
});

/* popular search chips */
const chipWrap = $("#hero-chips");
["Austin, TX", "Denver, CO", "Homes with pools", "Under $800K", "New listings"].forEach(label => {
  const a = document.createElement("a");
  a.className = "chip";
  a.textContent = label;
  a.href = "search.html?" + (
    label === "Homes with pools" ? "pool=1" :
    label === "Under $800K" ? "max=800000" :
    label === "New listings" ? "status=New%20Listing" :
    "q=" + encodeURIComponent(label.split(",")[0]));
  chipWrap.appendChild(a);
});

/* full-bleed hero photo: a featured home's front view under the scrim */
const heroBgProp = byId("sh-001") || PROPERTIES.find(p => p.featured) || PROPERTIES[0];
if (heroBgProp?.images?.front) {
  $("#hero-photo").innerHTML =
    `<img src="${heroBgProp.images.front.replace("w=1600", "w=2000")}" alt="" fetchpriority="high" onerror="this.remove()" />`;
}

/* interactive hero property: featured card with real photo + pay buttons */
const heroProp = byId("sh-022") || PROPERTIES.find(p => p.featured) || PROPERTIES[0];
const heroCard = $("#hero-card");
heroCard.innerHTML = `
  <a class="pc-media ${toneOf(heroProp)}" href="property.html?id=${heroProp.id}" aria-label="View featured home: ${heroProp.address}, ${heroProp.city}">
    ${heroProp.images?.front ? `<img class="pc-img" src="${heroProp.images.front.replace("w=1600", "w=1200")}" alt="" onerror="this.remove()" />` : `<span class="pc-art">${ICONS.home}</span>`}
    <span class="pc-badges"><span class="badge badge-featured">Featured</span></span>
  </a>
  <div class="hero-card-info glass">
    <div class="pc-price num">${fmtPrice(heroProp.price)}</div>
    <div class="pc-specs num">${specHTML(heroProp)}</div>
    <div class="small muted">${heroProp.address} · ${heroProp.city}, ${heroProp.state}</div>
    <div class="pay-row">
      <a class="pay-btn pay-down" href="property.html?id=${heroProp.id}#payment"><b class="num">${fmtShort(heroProp.downPayment)}</b><span>Down Payment</span></a>
      <a class="pay-btn pay-full" href="property.html?id=${heroProp.id}#payment"><b class="num">${fmtShort(heroProp.price)}</b><span>Full Payment</span></a>
    </div>
  </div>`;

const stage = $(".hero-stage");
const fine = matchMedia("(pointer: fine)").matches;
const noMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (fine && !noMotion) {
  stage.addEventListener("pointermove", e => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    heroCard.style.transform = `rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
  });
  stage.addEventListener("pointerleave", () => { heroCard.style.transform = ""; });
}

/* markets marquee: every city as a chip, duplicated once for a seamless loop.
   The moving strip is decorative (aria-hidden); a visually hidden list carries
   the same links for screen readers. */
const marqueeTrack = $("#market-marquee");
const marketList = $("#market-list");
const cityChip = (c, decorative) => {
  const href = "search.html?q=" + encodeURIComponent(c.split(",")[0]);
  return decorative
    ? `<a class="chip" tabindex="-1" href="${href}">${c}</a>`
    : `<li><a href="${href}">${c}</a></li>`;
};
const seg = `<div class="marquee-seg">${CITIES.map(c => cityChip(c, true)).join("")}</div>`;
marqueeTrack.innerHTML = seg + seg;
marketList.innerHTML = CITIES.map(c => cityChip(c, false)).join("");

/* staggered entrance: delay applies to the reveal only, then clears so
   hover transitions stay instant */
function staggerReveal(els, step, cap) {
  if (noMotion) return;
  els.forEach((el, i) => {
    const delay = Math.min(i * step, cap);
    if (!delay) return;
    el.style.transitionDelay = delay + "ms";
    el.addEventListener("transitionend", function clear(e) {
      if (e.propertyName !== "opacity") return;
      el.style.transitionDelay = "";
      el.removeEventListener("transitionend", clear);
    });
  });
}

/* all 30 homes: featured properties first, then the rest */
const grid = $("#listing-grid");
const ordered = [...PROPERTIES.filter(p => p.featured), ...PROPERTIES.filter(p => !p.featured)];
ordered.forEach(p => grid.appendChild(propertyCard(p)));
staggerReveal($$(".property-card", grid), 40, 400);
staggerReveal($$(".how-step"), 120, 400);

/* communities: each city's best front photo behind the gradient,
   deduped so neighboring tiles never repeat an image */
const usedCityPhotos = new Set();
function cityPhoto(city) {
  const homes = PROPERTIES.filter(p => p.city === city);
  const candidates = [...homes.filter(p => p.featured), ...homes.filter(p => !p.featured)];
  const pick = candidates.find(p => p.images?.front && !usedCityPhotos.has(p.images.front)) || candidates[0];
  if (!pick?.images?.front) return "";
  usedCityPhotos.add(pick.images.front);
  return pick.images.front.replace("w=1600", "w=900");
}
const communityGrid = $("#community-grid");
COMMUNITIES.forEach(c => {
  const count = PROPERTIES.filter(p => p.city === c.city).length;
  const photo = cityPhoto(c.city);
  const a = document.createElement("a");
  a.className = `community tone-${c.tone} reveal`;
  a.href = "search.html?q=" + encodeURIComponent(c.city);
  a.innerHTML = `
    ${photo ? `<img src="${photo}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
    <div class="community-info"><b>${c.city}, ${c.state}</b><span>${c.note} · ${count} listing${count === 1 ? "" : "s"}</span></div>`;
  communityGrid.appendChild(a);
});
staggerReveal($$(".community", communityGrid), 80, 400);

/* pillars */
const PILLARS = [
  { t: "Honest numbers", d: "Real prices, real days on market, labeled estimates. We never dress up data.", icon: ICONS.eye },
  { t: "Effortless search", d: "Fast, forgiving filters that remember what you love and alert you first.", icon: ICONS.home },
  { t: "Tours on your time", d: "Pick a slot on any listing and we confirm with the agent, usually within the hour.", icon: ICONS.camera },
  { t: "People, not pressure", d: "Agents measured on satisfaction, not volume. No spam, no cold calls, ever.", icon: ICONS.heart }
];
const pillarWrap = $("#pillars");
PILLARS.forEach(x => {
  const el = document.createElement("div");
  el.className = "card reveal";
  el.innerHTML = `<div class="pillar-icon">${x.icon}</div><h3>${x.t}</h3><p class="muted" style="font-size:14.5px; margin:0">${x.d}</p>`;
  pillarWrap.appendChild(el);
});

/* stats with count-up */
const STATS = [
  { n: 30, suffix: "", label: "Curated markets nationwide" },
  { n: 98, suffix: "%", label: "Buyers who'd recommend us" },
  { n: 11, suffix: " days", label: "Median time to accepted offer" },
  { n: 24, suffix: "/7", label: "Saved-search alerts, always on" }
];
const statsWrap = $("#stats");
STATS.forEach(s => {
  const el = document.createElement("div");
  el.className = "stat";
  el.innerHTML = `<b class="num" data-n="${s.n}" data-suffix="${s.suffix}">0${s.suffix}</b><span>${s.label}</span>`;
  statsWrap.appendChild(el);
});
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    statObserver.unobserve(en.target);
    const target = +en.target.dataset.n, suffix = en.target.dataset.suffix;
    if (noMotion) { en.target.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 1200;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      en.target.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$("#stats b").forEach(b => statObserver.observe(b));

/* testimonials */
const quoteWrap = $("#quotes");
TESTIMONIALS.forEach(t => {
  const initials = t.name.split(" ").map(w => w[0]).join("").slice(0, 2);
  const el = document.createElement("figure");
  el.className = "card quote reveal";
  el.style.margin = "0";
  el.innerHTML = `
    <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
    <blockquote>“${t.quote}”</blockquote>
    <figcaption class="quote-who">
      <span class="avatar tone-${t.tone}" aria-hidden="true">${initials}</span>
      <span><b>${t.name}</b><span>${t.role}</span></span>
    </figcaption>`;
  quoteWrap.appendChild(el);
});

/* FAQ */
const faqWrap = $("#faq-list");
FAQS.forEach((f, i) => {
  const d = document.createElement("details");
  if (i === 0) d.open = true;
  d.innerHTML = `<summary>${f.q}</summary><p>${f.a}</p>`;
  faqWrap.appendChild(d);
});

observeReveals();
