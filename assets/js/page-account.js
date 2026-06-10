// profile.js
(() => {
  // ====== عدّل دول حسب مشروعك ======
  const API_BASE = ""; // مثال: "https://example.com" أو اتركه فاضي لو نفس الدومين
  const ENDPOINTS = {
    me: "/api/me",
    updateMe: "/api/me",              // PUT
    changePassword: "/api/me/password", // PUT
    avatar: "/api/me/avatar",         // PUT (اختياري)
  };

  // لو التوكن عندك باسم مختلف عدله
  const getToken = () => localStorage.getItem("token");

  // ====== Helpers ======
  const $ = (sel) => document.querySelector(sel);

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? "—";
  }

  function setSrc(id, value, fallback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.src = value || fallback;
  }

  async function api(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});
    // لو بتستخدم Cookies بدل JWT شيل Authorization وخلي credentials
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // لو البودي JSON و المستخدم ماحددش Content-Type
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(API_BASE + path, {
      ...options,
      headers,
      // لو شغال Cookies فعّل دول:
      // credentials: "include",
    });

    // تعامل سريع مع عدم تسجيل الدخول
    if (res.status === 401) {
      // عدّلها حسب نظامك
      // window.location.href = "/login";
      throw new Error("غير مصرح (401) - محتاج تسجيل دخول");
    }

    // حاول تقرأ JSON لو موجود
    const text = await res.text();
    const data = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Request failed: ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  function safeJsonParse(text) {
    try { return JSON.parse(text); } catch { return null; }
  }

  // ====== Modal بسيط (يتولد من الـ JS) ======
  function openModal({ title, bodyHTML, onSubmit, submitText = "حفظ" }) {
    closeModal();

    const overlay = document.createElement("div");
    overlay.id = "appModalOverlay";
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,.35);
      display: grid; place-items: center;
      z-index: 9999; padding: 18px;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      width: min(520px, 100%);
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 18px 50px rgba(0,0,0,.18);
      overflow: hidden;
      direction: rtl;
      font-family: system-ui, Arial;
    `;

    modal.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid #eee;">
        <div style="font-weight:800">${title}</div>
        <button type="button" id="appModalClose" style="border:0;background:#f3f4f6;border-radius:10px;padding:6px 10px;cursor:pointer;">إغلاق</button>
      </div>

      <form id="appModalForm" style="padding: 14px 16px; display:grid; gap:12px;">
        ${bodyHTML}
        <div style="display:flex; gap:10px; justify-content:flex-start; padding-top: 6px;">
          <button type="submit" style="border:0;background:#3b5bdb;color:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;">${submitText}</button>
          <button type="button" id="appModalCancel" style="border:0;background:#f3f4f6;border-radius:10px;padding:10px 14px;cursor:pointer;">إلغاء</button>
        </div>
        <div id="appModalError" style="color:#b91c1c;font-size:13px;display:none;"></div>
      </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeBtn = $("#appModalClose");
    const cancelBtn = $("#appModalCancel");
    const form = $("#appModalForm");
    const errorBox = $("#appModalError");

    function showError(msg) {
      errorBox.style.display = "block";
      errorBox.textContent = msg;
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";
      try {
        await onSubmit(new FormData(form));
        closeModal();
      } catch (err) {
        showError(err?.message || "حصل خطأ");
      }
    });
  }

  function closeModal() {
    const overlay = document.getElementById("appModalOverlay");
    if (overlay) overlay.remove();
  }

  // ====== ربط البيانات بالصفحة ======
  async function loadProfile() {
    const user = await api(ENDPOINTS.me, { method: "GET" });

    // عدّل أسماء الحقول لو الـ API عندك مختلفة
    setSrc("avatar", user?.avatarUrl, "default-avatar.png");

    setText("fullNameTop", user?.fullName);
    setText("userTypeTop", user?.userType);

    setText("fullName", user?.fullName);
    setText("email", user?.email);
    setText("userType", user?.userType);

    return user;
  }

  // ====== Actions ======
  function bindEvents() {
    const editInfoBtn = document.getElementById("editInfo");
    const editPasswordBtn = document.getElementById("editPassword");
    const editHeaderBtn = document.getElementById("editHeader");

    if (editInfoBtn) {
      editInfoBtn.addEventListener("click", async () => {
        // نجيب الحالي عشان نملأ الفورم
        const current = await api(ENDPOINTS.me, { method: "GET" });

        openModal({
          title: "تعديل معلومات الملف الشخصي",
          bodyHTML: `
            <label style="display:grid; gap:6px;">
              <span>الاسم الكامل</span>
              <input name="fullName" value="${escapeHtml(current?.fullName || "")}" required
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>

            <label style="display:grid; gap:6px;">
              <span>البريد الإلكتروني</span>
              <input type="email" name="email" value="${escapeHtml(current?.email || "")}" required
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>

            <label style="display:grid; gap:6px;">
              <span>نوع المستخدم</span>
              <input name="userType" value="${escapeHtml(current?.userType || "")}" required
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>
          `,
          onSubmit: async (fd) => {
            const payload = {
              fullName: fd.get("fullName"),
              email: fd.get("email"),
              userType: fd.get("userType"),
            };

            await api(ENDPOINTS.updateMe, {
              method: "PUT",
              body: JSON.stringify(payload),
            });

            await loadProfile();
          },
        });
      });
    }

    if (editPasswordBtn) {
      editPasswordBtn.addEventListener("click", () => {
        openModal({
          title: "تغيير كلمة المرور",
          bodyHTML: `
            <label style="display:grid; gap:6px;">
              <span>كلمة المرور الحالية</span>
              <input type="password" name="currentPassword" required
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>

            <label style="display:grid; gap:6px;">
              <span>كلمة المرور الجديدة</span>
              <input type="password" name="newPassword" required minlength="6"
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>

            <label style="display:grid; gap:6px;">
              <span>تأكيد كلمة المرور الجديدة</span>
              <input type="password" name="confirmPassword" required minlength="6"
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;">
            </label>
          `,
          submitText: "تغيير",
          onSubmit: async (fd) => {
            const currentPassword = fd.get("currentPassword");
            const newPassword = fd.get("newPassword");
            const confirmPassword = fd.get("confirmPassword");

            if (newPassword !== confirmPassword) {
              throw new Error("تأكيد كلمة المرور غير مطابق");
            }

            await api(ENDPOINTS.changePassword, {
              method: "PUT",
              body: JSON.stringify({ currentPassword, newPassword }),
            });
          },
        });
      });
    }

    // (اختياري) تغيير الصورة
    if (editHeaderBtn) {
      editHeaderBtn.addEventListener("click", () => {
        openModal({
          title: "تغيير الصورة",
          bodyHTML: `
            <label style="display:grid; gap:6px;">
              <span>اختار صورة</span>
              <input type="file" name="avatar" accept="image/*" required
                     style="padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff;">
            </label>
            <div style="font-size:12px;color:#555">لو ما عندك endpoint للصورة، احذف الجزء ده.</div>
          `,
          submitText: "رفع",
          onSubmit: async (fd) => {
            // يرسل multipart/form-data
            await api(ENDPOINTS.avatar, {
              method: "PUT",
              body: fd,
            });

            await loadProfile();
          },
        });
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ====== Init ======
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      bindEvents();
      await loadProfile();
    } catch (err) {
      console.error(err);
      // اعمل هنا UI رسالة خطأ لو حابب
    }
  });
})();

// الزر الأول
document.getElementById("button1").addEventListener("click", function() {
    window.location.href = "home-page.html"; // رابط الصفحة الأولى
});

