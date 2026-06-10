(() => {
  // ====== State ======
  const state = {
    me: { id: "me", name: "أنا" },
    peer: { id: "u2", name: "Mohamed" },
    messages: [],
    typingTimeout: null,
    openReactionForId: null
  };

  // ====== Elements ======
  const elMessages = document.getElementById("messages");
  const elBody = document.getElementById("chatBody");
  const elInput = document.getElementById("messageInput");
  const elSend = document.getElementById("btnSend");
  const elTyping = document.getElementById("typing");
  const elTypingName = document.getElementById("typingName");
  const elPeerName = document.getElementById("peerName");
  const elPeerStatus = document.getElementById("peerStatus");
  const elReactionsPop = document.getElementById("reactionsPop");

  // ====== Utils ======
  const fmtTime = (d) =>
    new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(d);

  function scrollToBottom(force = false) {
    // لو المستخدم قريب من تحت خليها تنزل تلقائي
    const nearBottom = elBody.scrollHeight - elBody.scrollTop - elBody.clientHeight < 220;
    if (force || nearBottom) elBody.scrollTop = elBody.scrollHeight;
  }

  function setTyping(isTyping, name = state.peer.name) {
    elTypingName.textContent = name;
    elTyping.hidden = !isTyping;
    if (isTyping) scrollToBottom();
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ====== Render ======
  function render() {
    elMessages.innerHTML = state.messages.map(renderMessage).join("");
    bindMessageEvents();
    scrollToBottom(true);
  }

  function renderMessage(m) {
    const isMe = m.senderId === state.me.id;
    const cls = isMe ? "me" : "other";
    const avatarCls = isMe ? "avatar me" : "avatar other";
    const reactionsHTML = m.reaction
      ? `<div class="reaction"><span class="pill">${escapeHtml(m.reaction)} <span style="opacity:.8">1</span></span></div>`
      : "";

    const status = isMe ? (m.status === "seen" ? "تمت المشاهدة" : m.status === "sent" ? "تم الإرسال" : "جارٍ الإرسال") : "";

    return `
      <div class="msg ${cls}" data-id="${m.id}">
        <div class="${avatarCls}" title="${isMe ? state.me.name : state.peer.name}"></div>

        <div>
          <div class="bubble" role="button" tabindex="0" title="اضغط لإضافة تفاعل">
            ${escapeHtml(m.text)}
            <div class="meta">
              <span>${fmtTime(new Date(m.createdAt))}</span>
              ${isMe ? `<span>•</span><span>${status}</span>` : ""}
            </div>
          </div>
          ${reactionsHTML}
        </div>
      </div>
    `;
  }

  function bindMessageEvents() {
    // فتح قائمة الرياكشن عند الضغط على البابل
    document.querySelectorAll(".msg .bubble").forEach((bubble) => {
      bubble.addEventListener("click", (e) => {
        const msgEl = e.currentTarget.closest(".msg");
        const id = msgEl.dataset.id;
        openReactionsFor(id, e.currentTarget);
      });

      bubble.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const msgEl = e.currentTarget.closest(".msg");
          openReactionsFor(msgEl.dataset.id, e.currentTarget);
        }
      });
    });
  }

  function openReactionsFor(messageId, anchorEl) {
    state.openReactionForId = messageId;

    const rect = anchorEl.getBoundingClientRect();
    elReactionsPop.hidden = false;

    // مكان القائمة فوق الرسالة
    const top = Math.max(10, rect.top - 56);
    const left = Math.min(window.innerWidth - elReactionsPop.offsetWidth - 10, rect.left);

    elReactionsPop.style.top = `${top}px`;
    elReactionsPop.style.left = `${left}px`;
  }

  function closeReactions() {
    state.openReactionForId = null;
    elReactionsPop.hidden = true;
  }

  // ====== Actions ======
  function addMessage({ senderId, text, status = "sending" }) {
    const msg = {
      id: crypto.randomUUID(),
      senderId,
      text,
      createdAt: Date.now(),
      status,
      reaction: null,
    };
    state.messages.push(msg);
    render();
    return msg;
  }

  async function sendMessage() {
    const text = elInput.value.trim();
    if (!text) return;

    elInput.value = "";
    const msg = addMessage({ senderId: state.me.id, text, status: "sending" });

    // === هنا مكان الإرسال الحقيقي للسيرفر (API / Socket) ===
    // mock: بعد شوية نعتبرها اتبعتت واتشافت
    await wait(350);
    updateStatus(msg.id, "sent");
    await wait(600);
    updateStatus(msg.id, "seen");

    // mock رد الطرف التاني
    mockPeerReply(text);
  }

  function updateStatus(id, status) {
    const m = state.messages.find(x => x.id === id);
    if (!m) return;
    m.status = status;
    // ريرندر سريع بدون إعادة binding كبير ممكن، بس هنا بسيط
    render();
  }

  function setReaction(messageId, reaction) {
    const m = state.messages.find(x => x.id === messageId);
    if (!m) return;
    m.reaction = reaction;
    render();
  }

  function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // ====== Mock dynamic behaviour ======
  async function mockLoadConversation() {
    elPeerName.textContent = state.peer.name;
    elPeerStatus.textContent = "متصل الآن";

    state.messages = [
      {
        id: crypto.randomUUID(),
        senderId: state.peer.id,
        text: "أهلًا، إزّيك؟",
        createdAt: Date.now() - 1000 * 60 * 7,
        status: "sent",
        reaction: null,
      },
      {
        id: crypto.randomUUID(),
        senderId: state.me.id,
        text: "يا محمد أنا جاهز! ابعت اللي محتاجه.",
        createdAt: Date.now() - 1000 * 60 * 6,
        status: "seen",
        reaction: "🔥",
      },
      {
        id: crypto.randomUUID(),
        senderId: state.peer.id,
        text: "تمام.. خلينا نبدأ في الشات الدينامك.",
        createdAt: Date.now() - 1000 * 60 * 5,
        status: "sent",
        reaction: null,
      },
    ];

    render();
  }

  async function mockPeerReply(userText) {
    // يظهر typing
    setTyping(true, state.peer.name);
    await wait(900);
    setTyping(false);

    const replies = [
      "تمام جدًا.",
      "وصلتني 👌",
      "ممكن توضح أكتر؟",
      "حلو! خلينا نكمل.",
      "ده ممتاز."
    ];
    const pick = replies[Math.floor(Math.random() * replies.length)];

    addMessage({ senderId: state.peer.id, text: pick, status: "sent" });
  }

  // ====== Events ======
  elSend.addEventListener("click", sendMessage);
  elInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
    // mock typing for peer (مش لازم)
  });

  // إغلاق قائمة الرياكشن عند الضغط برا
  document.addEventListener("click", (e) => {
    if (elReactionsPop.hidden) return;
    const inside = elReactionsPop.contains(e.target);
    const bubble = e.target.closest?.(".bubble");
    if (!inside && !bubble) closeReactions();
  });

  // اختيار رياكشن
  elReactionsPop.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-r]");
    if (!btn) return;
    const r = btn.dataset.r;
    if (state.openReactionForId) {
      setReaction(state.openReactionForId, r);
    }
    closeReactions();
  });

  // رجوع (غيره حسب routing عندك)
  document.getElementById("btnBack").addEventListener("click", () => history.back());

  // ====== Init ======
  mockLoadConversation();
})();