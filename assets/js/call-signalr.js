document.addEventListener("DOMContentLoaded", async () => {
  const HUB_URL = "https://ciliary-pasquale-overhead.ngrok-free.dev/callhub";

  // ===== Room UI =====
  const roomPill = document.getElementById("roomPill");
  const roomCodeEl = document.getElementById("roomCode");
  const copyRoomBtn = document.getElementById("copyRoomBtn");
  const copyRoomLinkBtn = document.getElementById("copyRoomLinkBtn");
  const toastEl = document.getElementById("toast");

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    setTimeout(() => (toastEl.hidden = true), 1600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("تم النسخ");
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      toast("تم النسخ");
    }
  }

  function setRoomUI(id) {
    if (!roomPill || !roomCodeEl) return;
    roomCodeEl.textContent = id || "---";
    roomPill.hidden = false;
  }

  copyRoomBtn?.addEventListener("click", () => {
    const code = roomCodeEl?.textContent?.trim();
    if (!code || code === "---") return;
    copyText(code);
  });

  copyRoomLinkBtn?.addEventListener("click", () => copyText(location.href));

  // ===== Call UI =====
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  const btnMic = document.getElementById("btnMic");
  const btnCam = document.getElementById("btnCam");
  const btnSwitch = document.getElementById("btnSwitch");
  const endBtnTop = document.getElementById("endBtnTop");
  const btnEndBottom = document.getElementById("btnEndBottom");

  // userId
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = (crypto.randomUUID?.() || String(Date.now()));
    localStorage.setItem("userId", userId);
  }

  let roomId = new URLSearchParams(location.search).get("room");
  if (roomId) setRoomUI(roomId); // اعرضه فورًا لو داخل Join

  let connection;
  let peer;
  let localStream;
  let isCreator = false;
  let currentVideoDeviceId = null;

  const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const pendingCandidates = [];
  let remoteDescSet = false;

  async function startLocalMedia(deviceId) {
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: deviceId ? { deviceId: { exact: deviceId } } : true
    });

    if (localVideo) localVideo.srcObject = localStream;

    const vt = localStream.getVideoTracks()[0];
    if (vt) currentVideoDeviceId = vt.getSettings().deviceId || null;
  }

  function createPeer() {
    peer = new RTCPeerConnection(rtcConfig);

    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

    peer.ontrack = (event) => {
      if (!remoteVideo) return;
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.play?.().catch(() => {});
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        connection.invoke("SendIceCandidate", JSON.stringify(event.candidate)).catch(console.error);
      }
    };
  }

  async function makeOffer() {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await connection.invoke("SendOffer", JSON.stringify(peer.localDescription));
  }

  async function handleOffer(offerStr) {
    const offer = JSON.parse(offerStr);
    await peer.setRemoteDescription(offer);
    remoteDescSet = true;

    while (pendingCandidates.length) {
      await peer.addIceCandidate(pendingCandidates.shift()).catch(() => {});
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await connection.invoke("SendAnswer", JSON.stringify(peer.localDescription));
  }

  async function handleAnswer(answerStr) {
    const answer = JSON.parse(answerStr);
    await peer.setRemoteDescription(answer);
    remoteDescSet = true;

    while (pendingCandidates.length) {
      await peer.addIceCandidate(pendingCandidates.shift()).catch(() => {});
    }
  }

  async function handleCandidate(candidateStr) {
    const cand = JSON.parse(candidateStr);
    if (!remoteDescSet) {
      pendingCandidates.push(cand);
      return;
    }
    await peer.addIceCandidate(cand).catch(() => {});
  }

  function toggle(kind) {
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

    await startLocalMedia(next.deviceId);

    const sender = peer?.getSenders?.().find(s => s.track?.kind === "video");
    const newTrack = localStream.getVideoTracks()[0];
    if (sender && newTrack) sender.replaceTrack(newTrack);
  }

  async function endCall() {
    try { await connection?.invoke("LeaveRoom"); } catch {}

    if (peer) { peer.close(); peer = null; }

    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }

    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    remoteDescSet = false;
    pendingCandidates.length = 0;
  }

  // UI events
  btnMic?.addEventListener("click", () => {
    const enabled = toggle("audio");
    btnMic.classList.toggle("active", enabled === false);
  });

  btnCam?.addEventListener("click", () => {
    const enabled = toggle("video");
    btnCam.classList.toggle("active", enabled === false);
  });

  btnSwitch?.addEventListener("click", switchCamera);
  [endBtnTop, btnEndBottom].filter(Boolean).forEach(b => b.addEventListener("click", endCall));

  // Start camera
  try {
    await startLocalMedia();
  } catch (e) {
    console.error(e);
    alert("مش قادر أشغل الكاميرا/المايك. اعمل Allow من المتصفح.");
    return;
  }

  // SignalR connect
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { withCredentials: false })
    .withAutomaticReconnect()
    .build();

  connection.on("JoinRoomNotification", async () => {
    if (!peer) createPeer();
    if (isCreator) await makeOffer().catch(console.error);
  });

  connection.on("ReceiveOffer", async (offerStr) => {
    if (!peer) createPeer();
    await handleOffer(offerStr).catch(console.error);
  });

  connection.on("ReceiveAnswer", async (answerStr) => {
    await handleAnswer(answerStr).catch(console.error);
  });

  connection.on("ReceiveIceCandidate", async (candidateStr) => {
    await handleCandidate(candidateStr).catch(console.error);
  });

  connection.on("LeaveRoomNotification", () => {
    if (remoteVideo) remoteVideo.srcObject = null;
    if (peer) { peer.close(); peer = null; }
    remoteDescSet = false;
    pendingCandidates.length = 0;
  });

  try {
    await connection.start();
    console.log("Connected to hub:", HUB_URL);
  } catch (e) {
    console.error("SignalR start failed:", e);
    alert("فشل الاتصال بسيرفر المكالمة.");
    return;
  }

  // Create or Join room
  if (!peer) createPeer();

  if (roomId) {
    const res = await connection.invoke("JoinRoom", userId, roomId);
    if (res !== roomId) {
      alert(res);
      return;
    }
    isCreator = false;
    setRoomUI(roomId);
    toast("تم الانضمام للغرفة");
  } else {
    roomId = await connection.invoke("CreateRoom", userId);
    isCreator = true;

    history.replaceState({}, "", `${location.pathname}?room=${encodeURIComponent(roomId)}`);
    setRoomUI(roomId);
    toast("تم إنشاء غرفة. انسخ الكود وابعته للطرف التاني");
  }
});