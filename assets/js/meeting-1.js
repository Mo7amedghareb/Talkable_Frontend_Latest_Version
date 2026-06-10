document.addEventListener("DOMContentLoaded", () => {
  // زر الرجوع
  const backBtn = document.getElementById("button1");
  backBtn?.addEventListener("click", () => {
    window.location.href = "home-page.html";
  });

  // Videos
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo"); // لحد ما WebRTC يشتغل

  // Bottom nav buttons
  const btnMic = document.getElementById("btnMic");
  const btnCam = document.getElementById("btnCam");
  const btnSwitch = document.getElementById("btnSwitch");
  const btnCaptions = document.getElementById("btnCaptions");
  const btnChat = document.getElementById("btnChat");

  // End buttons (فوق/تحت/أو واحد منهم)
  const btnEnd = document.getElementById("btnEnd");           // لو عندك زرار اسمه كده
  const endBtnTop = document.getElementById("endBtnTop");     // زر الإنهاء اللي فوق
  const btnEndBottom = document.getElementById("btnEndBottom"); // زر الإنهاء اللي تحت

  let localStream = null;
  let currentVideoDeviceId = null;

  async function startLocal(deviceId) {
    // اقفل القديم
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    const constraints = {
      audio: true,
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (localVideo) localVideo.srcObject = localStream;

    const vTrack = localStream.getVideoTracks()[0];
    if (vTrack) {
      const settings = vTrack.getSettings();
      currentVideoDeviceId = settings.deviceId || null;
    }
  }

  function toggleTrack(kind) {
    if (!localStream) return;

    const track = kind === "audio"
      ? localStream.getAudioTracks()[0]
      : localStream.getVideoTracks()[0];

    if (!track) return;
    track.enabled = !track.enabled;
    return track.enabled;
  }

  async function switchCamera() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === "videoinput");
    if (cams.length <= 1) return;

    const idx = cams.findIndex(c => c.deviceId === currentVideoDeviceId);
    const next = cams[(idx + 1) % cams.length];
    await startLocal(next.deviceId);
  }

  function endCall() {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    localStream = null;

    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null; // placeholder

    // اختياري: ترجع لصفحة
    // window.location.href = "home-page.html";
  }

  // Events
  btnMic?.addEventListener("click", () => {
    const enabled = toggleTrack("audio");
    btnMic.classList.toggle("active", enabled === false);
  });

  btnCam?.addEventListener("click", () => {
    const enabled = toggleTrack("video");
    btnCam.classList.toggle("active", enabled === false);
  });

  btnSwitch?.addEventListener("click", switchCamera);

  btnCaptions?.addEventListener("click", () => {
    alert("Captions لاحقًا");
  });

  btnChat?.addEventListener("click", () => {
    alert("Chat لاحقًا");
  });

  [btnEnd, endBtnTop, btnEndBottom].filter(Boolean).forEach(el => {
    el.addEventListener("click", endCall);
  });

  // Start camera
  startLocal().catch(err => {
    console.error(err);
    alert("مفيش صلاحية كاميرا/مايك أو الجهاز مش متاح.");
  });
});