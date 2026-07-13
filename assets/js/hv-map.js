/* Havnora live maps: MapLibre GL with CARTO basemaps (free with the
   attribution MapLibre renders automatically from the style).
   Progressive enhancement: if the library cannot load (offline, blocked
   CDN), the styled placeholder panels keep working untouched. */

(function () {
  const LIB_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
  const LIB_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
  const STYLES = {
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
  };
  const theme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";

  let loading = null;
  function loadLib() {
    if (window.maplibregl) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = LIB_CSS;
      document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = LIB_JS; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("maplibre blocked"));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error("maplibre timeout")), 8000);
    });
    return loading;
  }

  function pinEl(p, mini) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "map-pin num";
    el.dataset.id = p.id;
    el.style.position = "relative";
    el.style.transform = "none";
    el.textContent = mini ? "●" : fmtShort(p.price);
    el.setAttribute("aria-label", `${p.address}, ${p.city}, ${fmtPrice(p.price)}`);
    return el;
  }

  /* ---------- search page: live results map ---------- */
  function initSearchMap() {
    const host = document.getElementById("map");
    if (!host) return;
    let map = null, markers = [], pending = null;

    function render(list) {
      if (!map) { pending = list; return; }
      markers.forEach(m => m.remove());
      markers = [];
      const pts = list.filter(p => p.lat && p.lng);
      pts.forEach(p => {
        const el = pinEl(p);
        el.addEventListener("click", () => quickView(p));
        el.addEventListener("mouseenter", () => document.querySelector(`.property-card[data-id="${p.id}"]`)?.classList.add("is-hot"));
        el.addEventListener("mouseleave", () => document.querySelector(`.property-card[data-id="${p.id}"]`)?.classList.remove("is-hot"));
        markers.push(new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(map));
      });
      if (pts.length) {
        const b = new maplibregl.LngLatBounds();
        pts.forEach(p => b.extend([p.lng, p.lat]));
        map.fitBounds(b, { padding: 56, maxZoom: 11, duration: 700 });
      }
    }

    document.addEventListener("hv:results", e => {
      const list = e.detail || [];
      if (map || window.HV_MAP_LIVE === false) { render(list); return; }
      pending = list;
      loadLib().then(() => {
        window.HV_MAP_LIVE = true;
        host.innerHTML = "";
        host.removeAttribute("role");
        host.style.height = "380px";
        map = new maplibregl.Map({
          container: host,
          style: STYLES[theme()],
          center: [-96, 37.5],
          zoom: 3.4,
          attributionControl: { compact: true }
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => render(pending));
      }).catch(() => { window.HV_MAP_LIVE = false; });
    });
  }

  /* ---------- property page: mini location map ---------- */
  function initMiniMap() {
    const host = document.querySelector(".prop-section .map-panel");
    if (!host || document.getElementById("map")) return;
    const p = byId(new URLSearchParams(location.search).get("id") || "");
    if (!p || !p.lat) return;
    loadLib().then(() => {
      host.innerHTML = "";
      host.removeAttribute("role");
      const map = new maplibregl.Map({
        container: host,
        style: STYLES[theme()],
        center: [p.lng, p.lat],
        zoom: 12.5,
        attributionControl: { compact: true }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      new maplibregl.Marker({ element: pinEl(p), anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(map);
    }).catch(() => { /* placeholder stays */ });
  }

  initSearchMap();
  /* the property page builds its DOM after scripts run; wait a beat */
  setTimeout(initMiniMap, 400);
})();
