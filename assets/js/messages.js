/* Havnora messages page: two-pane chat with the Havnora Property Manager.
   Local-first via store ("conversations"); syncs through hvApi when a
   Supabase session exists. */

(function () {
  "use strict";

  renderNav("");
  /* app screen: intentionally no footer */

  /* ---------- state ---------- */
  let activeId = new URLSearchParams(location.search).get("c") || null;
  const pendingReplies = new Set();
  const isMobile = () => matchMedia("(max-width: 899px)").matches;

  const shell = byIdEl("msg-shell");
  const listBox = byIdEl("convo-list");
  const thread = byIdEl("thread");
  const input = byIdEl("msg-input");

  function byIdEl(id) { return document.getElementById(id); }

  byIdEl("chat-ava").innerHTML = LOGO_MARK;
  byIdEl("chat-empty-mark").innerHTML = LOGO_MARK;
  const emptyMarkSvg = byIdEl("chat-empty-mark").querySelector("svg");
  if (emptyMarkSvg) { emptyMarkSvg.style.width = "52px"; emptyMarkSvg.style.height = "52px"; emptyMarkSvg.style.margin = "0 auto 14px"; emptyMarkSvg.style.color = "var(--brass)"; }

  /* ---------- manager reply templates (rotated per conversation) ---------- */
  const REPLIES_PROP = [
    a => `Thanks for reaching out about ${a}. I can walk you through the down payment plan or set up a viewing, which works best?`,
    a => `Happy to help with ${a}. Would you like the full pricing breakdown, or should I hold a tour slot for you this week?`,
    a => `Good timing. ${a} is drawing steady interest, so I would suggest a viewing soon. Want me to check the calendar for you?`,
    a => `Noted, thank you. Most buyers start with the down payment option on ${a}, and I am glad to walk through both plans whenever suits you.`
  ];
  const REPLIES_GEN = [
    () => "Thanks for reaching out. Tell me a little about what you are looking for and I will line up a few homes worth your time.",
    () => "Happy to help. Are you exploring a specific city or budget? I can share matching listings and their down payment plans.",
    () => "Great question. I will gather the details and get back to you shortly. Meanwhile, would you like me to set up a viewing for any home you have saved?",
    () => "Noted, thank you. I am here whenever you want to talk pricing, tours, or the buying process."
  ];

  /* ---------- small utils ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  function relTime(ts) {
    const d = Date.now() - ts;
    if (d < 60e3) return "now";
    if (d < 3600e3) return Math.floor(d / 60e3) + "m";
    if (d < 86400e3) return Math.floor(d / 3600e3) + "h";
    const date = new Date(ts);
    if (d < 7 * 86400e3) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function dayLabel(ts) {
    const d = new Date(ts), now = new Date();
    const startOf = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((startOf(now) - startOf(d)) / 86400e3);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function msgTime(ts) {
    return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function lastMsg(c) { return c.messages[c.messages.length - 1] || null; }
  function isUnread(c) {
    const last = lastMsg(c);
    return !!last && last.sender === "manager" && (!c.lastSeen || c.lastSeen < last.at);
  }
  function findConvo(id, list) { return (list || getConversations()).find(c => c.id === id); }
  function setUrl(url) {
    try { history.replaceState(null, "", url); } catch { /* file: sandbox */ }
  }

  /* ---------- conversation list ---------- */
  function renderList() {
    const list = getConversations();
    if (!list.length) {
      listBox.innerHTML = `
        <li class="ml-empty">
          <div class="empty">
            ${ICONS.home}
            <b>No conversations yet</b>
            <p style="font-size:14px">Message the manager from any listing.</p>
            <a class="btn btn-brass" href="search.html">Browse homes</a>
          </div>
        </li>`;
      return;
    }
    listBox.innerHTML = list.map(c => {
      const p = c.propertyId ? byId(c.propertyId) : null;
      const last = lastMsg(c);
      const preview = last ? (last.sender === "user" ? "You: " : "") + last.body : "New conversation";
      const thumb = p
        ? `<span class="cv-thumb ${toneOf(p)}">${p.images && p.images.front ? `<img src="${p.images.front.replace("w=1600", "w=200")}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`
        : `<span class="cv-thumb cv-thumb-brand" aria-hidden="true">${LOGO_MARK}</span>`;
      return `<li>
        <button class="cv-row ${c.id === activeId ? "is-active" : ""}" type="button" data-id="${c.id}" ${c.id === activeId ? 'aria-current="true"' : ""}>
          ${thumb}
          <span class="cv-main">
            <b>${esc(c.subject || "General inquiry")}</b>
            <span class="cv-prev">${esc(preview)}</span>
          </span>
          <span class="cv-meta">
            <time>${relTime(last ? last.at : c.createdAt)}</time>
            ${isUnread(c) ? '<i class="cv-dot" role="img" aria-label="Unread"></i>' : ""}
          </span>
        </button>
      </li>`;
    }).join("");
  }

  /* ---------- chat pane ---------- */
  function renderChat() {
    const convo = activeId ? findConvo(activeId) : null;
    byIdEl("chat-empty").hidden = !!convo;
    byIdEl("chat-ui").hidden = !convo;
    if (!convo) return;
    const p = convo.propertyId ? byId(convo.propertyId) : null;
    byIdEl("chat-prop-slot").innerHTML = p
      ? `<a class="chat-prop" href="property.html?id=${p.id}">${ICONS.home}<span>${esc(p.address)}</span></a>`
      : "";
    renderThread(convo);
  }

  function renderThread(convo) {
    let html = "";
    if (!convo.messages.length) {
      html += `<div class="thread-note">This is the start of your conversation${convo.propertyId ? " about " + esc(convo.subject) : ""}. The Havnora Property Manager typically replies in minutes.</div>`;
    }
    let lastDay = "";
    for (const m of convo.messages) {
      const day = dayLabel(m.at);
      if (day !== lastDay) { html += `<div class="day-sep">${day}</div>`; lastDay = day; }
      html += `<div class="msg ${m.sender === "user" ? "msg-user" : "msg-mgr"}">
        <div class="bubble">${esc(m.body)}</div>
        <time>${msgTime(m.at)}</time>
      </div>`;
    }
    if (pendingReplies.has(convo.id)) {
      html += `<div class="msg msg-mgr"><div class="bubble typing" role="img" aria-label="The manager is typing"><i></i><i></i><i></i></div></div>`;
    }
    thread.innerHTML = html;
    thread.scrollTop = thread.scrollHeight;
  }

  /* ---------- open / navigate ---------- */
  function openConvo(id) {
    const list = getConversations();
    const convo = findConvo(id, list);
    if (!convo) { activeId = null; renderList(); renderChat(); return; }
    activeId = id;
    convo.lastSeen = Date.now();
    saveConversations(list);
    setUrl("messages.html?c=" + encodeURIComponent(id));
    renderList();
    renderChat();
    if (isMobile()) shell.classList.add("show-chat");
    else input.focus();
  }

  function backToList() {
    shell.classList.remove("show-chat");
    setUrl("messages.html");
  }

  /* ---------- sending ---------- */
  function autoGrow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 118) + "px";
  }

  function send() {
    const body = input.value.trim();
    if (!body || !activeId) return;
    const list = getConversations();
    const convo = findConvo(activeId, list);
    if (!convo) return;
    const msg = { sender: "user", body, at: Date.now() };
    convo.messages.push(msg);
    convo.lastSeen = msg.at;
    saveConversations(list);
    input.value = "";
    autoGrow();
    renderThread(convo);
    renderList();
    syncSend(convo.id, convo.propertyId, convo.subject, body);
    scheduleReply(convo.id);
  }

  async function syncSend(convoId, propertyId, subject, body) {
    if (typeof hvApi === "undefined" || !hvApi.userId()) return;
    try {
      let convo = findConvo(convoId);
      if (!convo) return;
      let remoteId = convo.remoteId;
      if (!remoteId) {
        const remote = await hvApi.startConversation(propertyId, subject);
        if (!remote) return;
        remoteId = remote.id;
        const list = getConversations();
        const c = findConvo(convoId, list);
        if (c) { c.remoteId = remoteId; saveConversations(list); }
      }
      await hvApi.sendMessage(remoteId, body);
    } catch { /* local copy remains source of truth */ }
  }

  /* ---------- manager placeholder replies ---------- */
  function scheduleReply(id) {
    if (pendingReplies.has(id)) return;
    pendingReplies.add(id);
    if (activeId === id) {
      const c = findConvo(id);
      if (c) renderThread(c);
    }
    setTimeout(() => {
      pendingReplies.delete(id);
      const list = getConversations();
      const convo = findConvo(id, list);
      if (!convo) return;
      const p = convo.propertyId ? byId(convo.propertyId) : null;
      const templates = p ? REPLIES_PROP : REPLIES_GEN;
      const idx = convo.replyIdx || 0;
      const body = templates[idx % templates.length](p ? `${p.address}` : null);
      convo.replyIdx = idx + 1;
      const msg = { sender: "manager", body, at: Date.now() };
      convo.messages.push(msg);
      if (activeId === id) convo.lastSeen = msg.at;
      saveConversations(list);
      if (activeId === id) renderThread(convo);
      renderList();
    }, 1200);
  }

  /* ---------- new general conversation ---------- */
  function startGeneral() {
    const list = getConversations();
    let convo = list.find(c => !c.propertyId && !c.messages.length);
    if (!convo) {
      convo = { id: "c" + Date.now(), propertyId: null, subject: "General inquiry", createdAt: Date.now(), messages: [] };
      list.unshift(convo);
      saveConversations(list);
      if (typeof hvApi !== "undefined" && hvApi.userId()) {
        hvApi.startConversation(null, convo.subject).then(remote => {
          if (!remote) return;
          const l = getConversations();
          const c = findConvo(convo.id, l);
          if (c) { c.remoteId = remote.id; saveConversations(l); }
        });
      }
    }
    openConvo(convo.id);
  }

  /* ---------- wiring ---------- */
  listBox.addEventListener("click", e => {
    const btn = e.target.closest(".cv-row");
    if (btn) openConvo(btn.dataset.id);
  });
  byIdEl("new-msg").addEventListener("click", startGeneral);
  byIdEl("chat-back").addEventListener("click", backToList);
  byIdEl("composer").addEventListener("submit", e => { e.preventDefault(); send(); });
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  /* leaving mobile chat view keeps state sane when the viewport grows */
  matchMedia("(min-width: 900px)").addEventListener("change", ev => {
    if (ev.matches) shell.classList.remove("show-chat");
  });

  /* ---------- init ---------- */
  if (activeId && !findConvo(activeId)) activeId = null;
  if (!activeId && !isMobile()) {
    const first = getConversations()[0];
    if (first) activeId = first.id;
  }
  renderList();
  if (activeId) openConvo(activeId);
  else renderChat();
})();
