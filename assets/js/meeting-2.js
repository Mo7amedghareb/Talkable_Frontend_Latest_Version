// الزر الأول
document.getElementById("button1").addEventListener("click", function() {
    window.location.href = "home-page.html"; // رابط الصفحة الأولى
});
document.addEventListener("DOMContentLoaded", () => {
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  const btnMic = document.getElementById("btnMic");
  const btnCam = document.getElementById("btnCam");
  const btnSwitch = document.getElementById("btnSwitch");
  const btnCaptions = document.getElementById("btnCaptions");
  const btnChat = document.getElementById("btnChat");

  const endBtnTop = document.getElementById("endBtnTop");
  const btnEndBottom = document.getElementById("btnEndBottom");

  let localStream = null;
  let currentVideoDeviceId = null;

  async function startLocal(deviceId) {
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    const constraints = {
      audio: true,
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;

    const vTrack = localStream.getVideoTracks()[0];
    if (vTrack) currentVideoDeviceId = vTrack.getSettings().deviceId || null;
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

    localVideo.srcObject = null;
    remoteVideo.srcObject = null; // placeholder لحد WebRTC
  }

  btnMic?.addEventListener("click", () => {
    const enabled = toggleTrack("audio");
    btnMic.classList.toggle("active", enabled === false);
  });

  btnCam?.addEventListener("click", () => {
    const enabled = toggleTrack("video");
    btnCam.classList.toggle("active", enabled === false);
  });

  btnSwitch?.addEventListener("click", switchCamera);

  btnCaptions?.addEventListener("click", () => alert("Captions لاحقًا"));
  btnChat?.addEventListener("click", () => alert("Chat لاحقًا"));

  endBtnTop?.addEventListener("click", endCall);
  btnEndBottom?.addEventListener("click", endCall);

  startLocal().catch(err => {
    console.error(err);
    alert("مفيش صلاحية كاميرا/مايك أو الجهاز مش متاح. اعمل Allow من المتصفح.");
  });
});