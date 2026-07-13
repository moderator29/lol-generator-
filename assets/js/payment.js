/* Checkout: down payment or full payment on a property.
   Tries the live Stripe path via the create-checkout Edge Function; until
   the owner's Stripe key is deployed, runs a clearly-labeled test mode
   that exercises the exact same flow and ledger. */

renderNav("");
renderFooter();

const MIN_DOWN = 30000;
const params = new URLSearchParams(location.search);
const prop = byId(params.get("id") || "");
let kind = params.get("kind") === "full" ? "full_payment" : "down_payment";

const root = $("#pay-root");
const ribbon = $("#mode-ribbon");

const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.6l5 5L19.5 6.4"/></svg>';
const LOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const SPIN_ICON = '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/></svg>';

if (!prop) {
  $("#crumbs").textContent = "Checkout";
  root.innerHTML = `
    <div class="empty card">${ICONS.home}
      <b>Pick a home to continue</b>
      <p>Checkout starts from a listing. Browse the market and choose your haven.</p>
      <a class="btn btn-brass" href="search.html">Browse homes</a>
    </div>`;
} else {
  boot(prop);
}

function amountFor(p) {
  return kind === "full_payment" ? p.price : Math.max(MIN_DOWN, +($("#amount")?.value || p.downPayment));
}

function boot(p) {
  document.title = `Checkout · ${p.address} · Havnora`;
  $("#crumbs").innerHTML = `
    <a href="search.html">Buy</a> · <a href="property.html?id=${p.id}">${p.address}</a> · <span aria-current="page">Checkout</span>`;
  ribbon.hidden = false;
  renderForm(p);
}

function renderForm(p) {
  const user = store.get("user", null);
  const down = kind === "down_payment";
  root.innerHTML = `
    <h1 style="font-size:clamp(26px,3.4vw,36px); margin:18px 0 4px">Secure your haven</h1>
    <p class="muted" style="margin-bottom:6px">${p.address} · ${p.neighborhood}, ${p.city}, ${p.state}</p>
    <div class="pay-grid">
      <section class="card glass" aria-label="Payment details">
        <div class="kind-seg" role="group" aria-label="Payment type">
          <button type="button" id="k-down" aria-pressed="${down}">Down Payment</button>
          <button type="button" id="k-full" aria-pressed="${!down}">Full Payment</button>
        </div>

        ${down ? `
        <label class="field" style="margin-bottom:14px">
          <span>Down payment amount (minimum ${fmtPrice(MIN_DOWN)})</span>
          <input id="amount" class="num" type="number" inputmode="numeric" min="${MIN_DOWN}" max="${p.price}" step="500" value="${p.downPayment}" />
        </label>
        <p class="small muted" id="amount-note" style="margin:-6px 0 16px"></p>` : ""}

        <div class="form-grid" style="margin-bottom:14px">
          <label class="field"><span>Full name</span><input id="buyer-name" autocomplete="name" value="${(user?.name || "").replace(/"/g, "&quot;")}" placeholder="Your legal name" /></label>
          <label class="field"><span>Email</span><input id="buyer-email" type="email" autocomplete="email" value="${(user?.email || "").replace(/"/g, "&quot;")}" placeholder="you@example.com" /></label>
        </div>

        <b class="small" style="display:block; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); margin-bottom:8px">Payment method</b>
        <div class="method-tiles" role="group" aria-label="Payment method">
          <button type="button" class="method-tile" id="m-card" aria-pressed="true"><b>Card / Bank</b><span>Secured by Stripe checkout</span></button>
          <button type="button" class="method-tile" disabled aria-pressed="false" title="Coming soon"><b>Wire transfer</b><span>Available at launch</span></button>
        </div>

        <label class="check" style="margin:10px 0 16px">
          <input type="checkbox" id="terms" />
          I understand this reserves the property subject to contract, inspection, and closing.
        </label>
        <p class="notice-error" id="pay-error" hidden></p>

        <button class="btn btn-brass btn-glow btn-block btn-pay" id="pay-btn">
          Pay ${fmtPrice(down ? p.downPayment : p.price)} securely
        </button>
        <p class="secure-line">${LOCK_ICON} Encrypted checkout · Refundable per your purchase agreement</p>
      </section>

      <aside class="card glass" aria-label="Order summary">
        <div class="order-media ${toneOf(p)}">
          ${p.images?.front ? `<img src="${p.images.front.replace("w=1600", "w=1000")}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
        </div>
        <div class="order-rows num">
          <div class="order-row"><span>Property</span><b>${p.address}</b></div>
          <div class="order-row"><span>List price</span><b>${fmtPrice(p.price)}</b></div>
          <div class="order-row"><span>Payment type</span><b id="sum-kind">${down ? "Down payment" : "Full payment"}</b></div>
          ${down ? `<div class="order-row"><span>Remaining after deposit</span><b id="sum-remaining">${fmtPrice(p.price - p.downPayment)}</b></div>` : ""}
          <div class="order-row total"><span>Due today</span><b id="sum-total">${fmtPrice(down ? p.downPayment : p.price)}</b></div>
        </div>
        <p class="small muted" style="margin:14px 0 0">Every payment lands in your ledger with a receipt. Your Havnora manager confirms next steps within the hour. ${typeof helpBtn === "function" ? helpBtn("mortgage-calculator") : ""}</p>
      </aside>
    </div>`;

  $("#k-down").addEventListener("click", () => { kind = "down_payment"; syncKindURL(); renderForm(p); });
  $("#k-full").addEventListener("click", () => { kind = "full_payment"; syncKindURL(); renderForm(p); });
  $("#m-card").addEventListener("click", () => { /* single live method for now */ });

  const amountInput = $("#amount");
  if (amountInput) {
    const note = $("#amount-note");
    const sync = () => {
      const v = Math.min(p.price, Math.max(MIN_DOWN, +amountInput.value || 0));
      const pct = Math.round((v / p.price) * 100);
      note.textContent = `${fmtPrice(v)} is ${pct}% of the list price.`;
      $("#sum-total").textContent = fmtPrice(v);
      $("#sum-remaining").textContent = fmtPrice(p.price - v);
      $("#pay-btn").textContent = `Pay ${fmtPrice(v)} securely`;
    };
    amountInput.addEventListener("input", sync);
    amountInput.addEventListener("change", () => {
      amountInput.value = Math.min(p.price, Math.max(MIN_DOWN, +amountInput.value || MIN_DOWN));
      sync();
    });
    sync();
  }

  $("#pay-btn").addEventListener("click", () => submit(p));
}

function syncKindURL() {
  const q = new URLSearchParams(location.search);
  q.set("kind", kind === "full_payment" ? "full" : "down");
  history.replaceState(null, "", "?" + q);
}

function fail(msg) {
  const el = $("#pay-error");
  el.textContent = msg;
  el.hidden = false;
}

async function submit(p) {
  $("#pay-error").hidden = true;
  const name = $("#buyer-name").value.trim();
  const email = $("#buyer-email").value.trim();
  if (!name) return fail("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Enter a valid email address.");
  if (!$("#terms").checked) return fail("Please confirm you understand the reservation terms.");
  const amount = amountFor(p);
  if (kind === "down_payment" && amount < MIN_DOWN) return fail(`Minimum down payment is ${fmtPrice(MIN_DOWN)}.`);

  const btn = $("#pay-btn");
  btn.disabled = true;
  btn.innerHTML = `${SPIN_ICON} Contacting secure checkout`;

  /* live path first: real Stripe checkout via the Edge Function */
  const live = await hvApi.createCheckout(p.id, kind, amount);
  if (live.live && live.url) { location.href = live.url; return; }

  /* test mode: same flow, clearly labeled, no real charge */
  renderProcessing(p, amount);
}

function renderProcessing(p, amount) {
  root.innerHTML = `
    <div class="card glass pay-state" style="max-width:560px; margin:40px auto">
      <div class="ring">${SPIN_ICON}</div>
      <h2>Processing test payment</h2>
      <p class="muted">Running the exact live flow with no real charge.</p>
    </div>`;
  setTimeout(() => complete(p, amount), 1600);
}

function complete(p, amount) {
  const receipt = "HV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const payment = {
    id: "p" + Date.now(),
    receipt,
    propertyId: p.id,
    kind,
    amount,
    status: "test",
    provider: "demo",
    createdAt: Date.now()
  };
  addLocalPayment(payment);
  hvApi.recordTestPayment(payment);

  root.innerHTML = `
    <div class="card glass pay-state" style="max-width:600px; margin:40px auto">
      <div class="ring">${CHECK_ICON}</div>
      <h2>Test payment recorded</h2>
      <p class="muted" style="max-width:420px; margin-inline:auto">${fmtPrice(amount)} ${kind === "full_payment" ? "full payment" : "down payment"} for ${p.address}, ${p.city}. Your manager has been notified and will confirm next steps.</p>
      <span class="receipt-code num">${receipt}</span>
      <p class="small muted" style="margin:12px 0 22px"><b>Test mode:</b> no real money moved. This receipt will process for real once Stripe is connected.</p>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap">
        <a class="btn btn-brass btn-glow" href="dashboard.html?view=payments">View in your ledger</a>
        <button class="btn" id="msg-manager">Message the manager</button>
        <a class="btn btn-ghost" href="property.html?id=${p.id}">Back to listing</a>
      </div>
    </div>`;
  $("#msg-manager").addEventListener("click", () => messageManagerAbout(p.id));
  toast("Receipt saved to your ledger");
}
