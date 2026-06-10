document.addEventListener("DOMContentLoaded", () => {
  const startMeetingBtn = document.getElementById("startMeetingBtn");
  const roomInput = document.getElementById("roomInput"); // لو موجود
  const copyRoomBtn = document.getElementById("copyRoomBtn"); // لو موجود
  const backBtn = document.getElementById("button1");

  backBtn?.addEventListener("click", () => (window.location.href = "home-page.html"));

  function getRole() {
    const selected = document.querySelector('input[name="user"]:checked');
    return selected?.value || null; // "normal" | "deaf"
  }

  function targetPage(role) {
    // حسب نظامك: meeting-1 = صم وبكم ، meeting-2 = طبيعي
    if (role === "deaf") return "meeting-1.html";
    if (role === "normal") return "meeting-2.html";
    return null;
  }

  function updateStartState() {
    const role = getRole();
    startMeetingBtn.disabled = !role;
  }

  document.querySelectorAll('input[name="user"]').forEach(r => {
    r.addEventListener("change", updateStartState);
  });

  copyRoomBtn?.addEventListener("click", async () => {
    const txt = (roomInput?.value || "").trim();
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      alert("تم نسخ الكود");
    } catch {
      roomInput.select();
      document.execCommand("copy");
      alert("تم نسخ الكود");
    }
  });

  startMeetingBtn?.addEventListener("click", () => {
    const role = getRole();
    if (!role) return alert("اختار نوع المستخدم");

    const page = targetPage(role);
    if (!page) return alert("نوع مستخدم غير معروف");

    const roomId = (roomInput?.value || "").trim();

    // لو فيه كود → join
    // لو مفيش → create جوه الميتنج
    const url = roomId ? `${page}?room=${encodeURIComponent(roomId)}` : page;
    window.location.href = url;
  });

  updateStartState();
});


document.addEventListener("DOMContentLoaded", () => {
  const roomInput = document.getElementById("roomInput");
  const createRoomBtn = document.getElementById("createRoomBtn");
  const joinRoomBtn = document.getElementById("joinRoomBtn");

  function getRole() {
    return document.querySelector('input[name="user"]:checked')?.value || null;
  }

  function targetPage(role) {
    // حسب نظامك: meeting-1 = صم وبكم ، meeting-2 = طبيعي
    if (role === "deaf") return "Deaf_and_Mute_Meeting_Page.html";
    if (role === "normal") return "Normal_people_Meeting.html";
    return null;
  }

  createRoomBtn?.addEventListener("click", () => {
    const role = getRole();
    if (!role) return alert("اختار نوع المستخدم");
    const page = targetPage(role);
    window.location.href = page; // بدون room -> الميتنج يعمل CreateRoom من الباك
  });

  joinRoomBtn?.addEventListener("click", () => {
    const role = getRole();
    if (!role) return alert("اختار نوع المستخدم");
    const page = targetPage(role);

    const roomId = (roomInput?.value || "").trim();
    if (!roomId) return alert("اكتب كود الغرفة");

    window.location.href = `${page}?room=${encodeURIComponent(roomId)}`;
  });
});