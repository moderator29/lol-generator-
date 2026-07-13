/* Havnora backend client: Supabase auth + data over plain fetch.
   Local-first: every feature works from local data and localStorage; when a
   user is signed in, favorites, bookings, messages, and inquiries sync to
   Supabase. The publishable key below is safe to ship in a browser; row
   level security governs all access. */

const HV_SUPA = {
  url: "https://pldwfguodowelswglxyi.supabase.co",
  key: "sb_publishable_5hf4zZ6SL0pIDjGFs4A8nA_cv8w4Mb3"
};

const hvSession = {
  get: () => store.get("session", null),
  set: s => store.set("session", s),
  clear: () => store.set("session", null),
  user() { return this.get()?.user || null; }
};

async function hvAuthFetch(path, options = {}) {
  const session = hvSession.get();
  const res = await fetch(`${HV_SUPA.url}${path}`, {
    ...options,
    headers: {
      "apikey": HV_SUPA.key,
      "Content-Type": "application/json",
      ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
      ...(options.headers || {})
    }
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(body?.msg || body?.message || body?.error_description || `Request failed (${res.status})`), { status: res.status, body });
  return body;
}

const hvAuth = {
  async signUp(email, password, fullName) {
    const body = await hvAuthFetch("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data: { full_name: fullName || "" } })
    });
    if (body?.access_token) hvSession.set(body);
    return body; /* without a session, email confirmation is pending */
  },
  async signIn(email, password) {
    const body = await hvAuthFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    hvSession.set(body);
    return body;
  },
  async signOut() {
    try { await hvAuthFetch("/auth/v1/logout", { method: "POST" }); } catch { /* session may be stale */ }
    hvSession.clear();
    store.set("user", null);
  }
};

/* PostgREST helpers; every call silently no-ops when signed out so the
   local-first UI keeps working. */
const hvDb = {
  async insert(table, rows) {
    if (!hvSession.get()) return null;
    return hvAuthFetch(`/rest/v1/${table}`, {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify(rows)
    });
  },
  async select(table, query = "") {
    if (!hvSession.get()) return null;
    return hvAuthFetch(`/rest/v1/${table}?${query}`);
  },
  async remove(table, query) {
    if (!hvSession.get()) return null;
    return hvAuthFetch(`/rest/v1/${table}?${query}`, { method: "DELETE" });
  }
};

/* local payments ledger (mirrors what syncs to Supabase) */
function getPayments() { return store.get("payments", []); }
function addLocalPayment(payment) {
  const list = getPayments();
  list.unshift(payment);
  store.set("payments", list);
  return payment;
}

const hvApi = {
  userId: () => hvSession.user()?.id || null,

  async syncFavorite(propertyId, added) {
    const uid = this.userId();
    if (!uid) return;
    try {
      if (added) await hvDb.insert("favorites", [{ user_id: uid, property_id: propertyId }]);
      else await hvDb.remove("favorites", `user_id=eq.${uid}&property_id=eq.${propertyId}`);
    } catch { /* offline or RLS: local copy remains source of truth */ }
  },

  async bookViewing(propertyId, date, time, note) {
    const uid = this.userId();
    if (!uid) return null;
    try {
      return await hvDb.insert("bookings", [{ user_id: uid, property_id: propertyId, viewing_date: date, viewing_time: time, note: note || null }]);
    } catch { return null; }
  },

  async startConversation(propertyId, subject) {
    const uid = this.userId();
    if (!uid) return null;
    try {
      const rows = await hvDb.insert("conversations", [{ user_id: uid, property_id: propertyId || null, subject: subject || null }]);
      return rows?.[0] || null;
    } catch { return null; }
  },

  async sendMessage(conversationId, body) {
    if (!this.userId()) return null;
    try {
      const rows = await hvDb.insert("messages", [{ conversation_id: conversationId, sender: "user", body }]);
      return rows?.[0] || null;
    } catch { return null; }
  },

  /* ---------- payments ----------
     Live path: the create-checkout Edge Function (requires the owner's
     Stripe secret key on the server). Until that is deployed and keyed,
     checkout runs in clearly-labeled test mode. */
  async createCheckout(propertyId, kind, amount) {
    const session = hvSession.get();
    if (!session) return { live: false, reason: "signed-out" };
    try {
      const res = await fetch(`${HV_SUPA.url}/functions/v1/create-checkout`, {
        method: "POST",
        headers: {
          "apikey": HV_SUPA.key,
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          propertyId, kind, amount,
          successUrl: location.origin + location.pathname + `?id=${propertyId}&kind=${kind}&paid=1`,
          cancelUrl: location.href
        })
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.url) return { live: true, url: body.url, receipt: body.receipt };
      return { live: false, reason: body?.error || "not-configured" };
    } catch { return { live: false, reason: "offline" }; }
  },

  async recordTestPayment(payment) {
    const uid = this.userId();
    if (!uid) return;
    try {
      await hvDb.insert("payments", [{
        user_id: uid, property_id: payment.propertyId, kind: payment.kind,
        amount: payment.amount, status: "test", provider: "demo",
        receipt_code: payment.receipt
      }]);
    } catch { /* local record remains */ }
  },

  async sendInquiry({ propertyId, name, email, message }) {
    try {
      await fetch(`${HV_SUPA.url}/rest/v1/inquiries`, {
        method: "POST",
        headers: { "apikey": HV_SUPA.key, "Content-Type": "application/json" },
        body: JSON.stringify([{ property_id: propertyId || null, user_id: this.userId(), name, email, message }])
      });
      return true;
    } catch { return false; }
  }
};
