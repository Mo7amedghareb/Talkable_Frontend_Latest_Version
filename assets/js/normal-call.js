// ===== normal-call.js =====
document.addEventListener("DOMContentLoaded", async () => {
    const HUB_URL = "https://ciliary-pasquale-overhead.ngrok-free.dev/callhub";
    const API_BASE = "https://ciliary-pasquale-overhead.ngrok-free.dev";

    // ===== Room UI =====
    const roomPill = document.getElementById("roomPill");
    const roomCodeEl = document.getElementById("roomCode");
    const copyRoomBtn = document.getElementById("copyRoomBtn");
    const copyRoomLinkBtn = document.getElementById("copyRoomLinkBtn");
    const toastEl = document.getElementById("toast");

    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg; toastEl.hidden = false;
        setTimeout(() => (toastEl.hidden = true), 1600);
    }
    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); toast("تم النسخ"); }
        catch {
            const t = document.createElement("textarea");
            t.value = text; document.body.appendChild(t); t.select();
            document.execCommand("copy"); t.remove(); toast("تم النسخ");
        }
    }
    function setRoomUI(id) {
        if (!roomPill || !roomCodeEl) return;
        roomCodeEl.textContent = id || "---"; roomPill.hidden = false;
    }
    copyRoomBtn?.addEventListener("click", () => { const c = roomCodeEl?.textContent?.trim(); if (c && c !== "---") copyText(c); });
    copyRoomLinkBtn?.addEventListener("click", () => copyText(location.href));

    // ===== UI Elements =====
    const captionBox = document.getElementById("captionBox");
    const speechDisplay = document.getElementById("speechDisplay");  // textarea كلام الشخص العادي
    const micDot = document.getElementById("micDot");
    const micStatus = document.getElementById("micStatus");
    const avatarWordDisplay = document.getElementById("avatarWordDisplay");
    const avatarLoaderCall = document.getElementById("avatar-loader-call");

    // عرض caption overlay فوق الفيديو
    let captionTimer = null;
    function showCaption(text) {
        if (!text || !captionBox) return;
        captionBox.textContent = text;
        captionBox.style.display = "block";
        clearTimeout(captionTimer);
        captionTimer = setTimeout(() => { captionBox.style.display = "none"; }, 3500);
    }

    // تحديث الـ textarea بكلام الشخص العادي
    function appendSpeech(text) {
        if (!speechDisplay || !text) return;
        const current = speechDisplay.value.trim();
        speechDisplay.value = current ? current + " " + text : text;
        speechDisplay.scrollTop = speechDisplay.scrollHeight;
    }

    // ===== Avatar (Three.js) — نفس منطق صفحة الترجمة =====
    const API_BASE_AVATAR = API_BASE;

    let avatarReady = false;
    let sceneA, camA, rendA, clockA;
    let loadedModels = {}, currentModelA = null, currentMixerA = null;
    let scaleCalibrated = false, globalScale = 0.02, globalYOffset = 0;

    function initAvatar() {
        const container = document.getElementById("avatar-container-call");
        if (!container || typeof THREE === "undefined") return;

        sceneA = new THREE.Scene();
        sceneA.background = new THREE.Color(0x12102a);

        camA = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camA.position.set(0, 2.2, 3.0);
        camA.lookAt(0, 2.0, 0);

        rendA = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendA.setSize(200, 200);
        container.appendChild(rendA.domElement);

        sceneA.add(new THREE.AmbientLight(0xffffff, 2));
        const dir = new THREE.DirectionalLight(0xffffff, 3);
        dir.position.set(5, 10, 5); sceneA.add(dir);

        clockA = new THREE.Clock();
        avatarReady = true;

        (function loop() {
            requestAnimationFrame(loop);
            const dt = clockA.getDelta();
            if (currentMixerA) currentMixerA.update(dt);
            rendA.render(sceneA, camA);
        })();
    }

    function applyTransform(model, isFirst) {
        if (isFirst) {
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            globalScale = 0.02;
            globalYOffset = -center.y * globalScale;
            scaleCalibrated = true;
        }
        model.scale.set(globalScale, globalScale, globalScale);
        model.position.set(0, globalYOffset, 0);
    }

    async function loadGLBCached(url) {
        if (url.startsWith("/")) url = API_BASE_AVATAR + url;
        if (loadedModels[url]) return loadedModels[url];

        const res = await fetch(url, {
            headers: { "ngrok-skip-browser-warning": "69420" }  // ← أضف
        });
        // ... باقي الكود
        if (!res.ok) throw new Error("فشل التحميل");
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) throw new Error("السيرفر رجّع HTML");
        const buf = await res.arrayBuffer();
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.parse(buf, "", gltf => {
                const model = gltf.scene;
                applyTransform(model, !scaleCalibrated);
                model.visible = false;
                sceneA.add(model);
                model.traverse(obj => { if (obj.isMesh) obj.material.emissive?.setHex(0x111111); });
                const entry = { model, clips: gltf.animations || [] };
                loadedModels[url] = entry;
                resolve(entry);
            }, reject);
        });
    }

    function playEntry(entry) {
        return new Promise(resolve => {
            if (currentModelA) currentModelA.visible = false;
            if (currentMixerA) { currentMixerA.stopAllAction(); currentMixerA = null; }
            const { model, clips } = entry;
            model.visible = true; currentModelA = model;
            if (!clips.length) { setTimeout(resolve, 500); return; }
            const mixer = new THREE.AnimationMixer(model);
            currentMixerA = mixer;
            const action = mixer.clipAction(clips[0]);
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.reset().play();
            mixer.addEventListener("finished", resolve);
        });
    }

    async function fetchWordUrl(word) {
        try {
            const r = await fetch(
                `${API_BASE_AVATAR}/api/Avatar?word=${encodeURIComponent(word)}`,
                {
                    headers: {
                        Accept: "application/json",
                        "ngrok-skip-browser-warning": "69420"  // ← أضف
                    }
                }
            );
            if (!r.ok) return null;
            const d = await r.json();
            return d.url || d.animationPath || null;
        } catch { return null; }
    }

    const wordQueue = [];
    let isPlayingAvatar = false;

    async function processQueue() {
        if (isPlayingAvatar || !wordQueue.length || !avatarReady) return;
        isPlayingAvatar = true;

        const word = wordQueue.shift();
        if (avatarWordDisplay) avatarWordDisplay.textContent = word;
        if (avatarLoaderCall) avatarLoaderCall.classList.remove("hidden");

        try {
            const url = await fetchWordUrl(word);
            if (avatarLoaderCall) avatarLoaderCall.classList.add("hidden");
            if (url) await playEntry(await loadGLBCached(url));
        } catch (e) {
            console.warn("Avatar error:", e);
            if (avatarLoaderCall) avatarLoaderCall.classList.add("hidden");
        }

        isPlayingAvatar = false;
        if (wordQueue.length) processQueue();
    }

    // استقبل caption من الشخص الصم — اعرض نص + شغّل أفاتار
    function onCaptionReceived(caption) {
        showCaption(caption);
        if (avatarReady) {
            caption.trim().split(/\s+/).filter(Boolean).forEach(w => wordQueue.push(w));
            processQueue();
        }
    }

    // ===== Call UI =====
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    const btnMic = document.getElementById("btnMic");
    const btnCam = document.getElementById("btnCam");
    const btnSwitch = document.getElementById("btnSwitch");
    const endBtnTop = document.getElementById("endBtnTop");
    const btnEndBottom = document.getElementById("btnEndBottom");

    let userId = localStorage.getItem("userId");
    if (!userId) { userId = crypto.randomUUID?.() || String(Date.now()); localStorage.setItem("userId", userId); }

    let roomId = new URLSearchParams(location.search).get("room");
    if (roomId) setRoomUI(roomId);

    let connection, peer, localStream;
    let isCreator = false, currentVideoDeviceId = null;
    const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const pendingCandidates = [];
    let remoteDescSet = false;

    // ===== Speech Recognition — مع معالجة صح لـ no-speech =====
    let recognition = null, isRecognizing = false;

    function startSpeechRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            if (micStatus) micStatus.textContent = "المتصفح مش بيدعم التعرف على الكلام";
            return;
        }

        recognition = new SR();
        recognition.lang = "ar-SA";
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            if (micDot) micDot.classList.add("active");
            if (micStatus) micStatus.textContent = "جاري الاستماع...";
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (!transcript) return;

            // اعرض الكلام في الـ textarea
            appendSpeech(transcript);

            // ابعت كل كلمة للشخص الصم عبر SignalR
            for (const word of transcript.split(/\s+/).filter(Boolean)) {
                try { await connection?.invoke("SendCaption", word); }
                catch (e) { console.warn("SendCaption failed:", e); }
            }
        };

        recognition.onerror = (e) => {
            // no-speech = مفيش صوت — مش error حقيقي، بنتجاهله وبيعيد تلقائيًا
            if (e.error === "no-speech") return;

            // aborted = بيحصل لما بنوقفه احنا — مش error
            if (e.error === "aborted") return;

            console.warn("Speech error:", e.error);
            if (micStatus) micStatus.textContent = `خطأ: ${e.error}`;
        };

        recognition.onend = () => {
            // إعادة التشغيل تلقائيًا لو مش وقفناه احنا
            if (isRecognizing) {
                try { recognition.start(); }
                catch (e) { console.warn("recognition restart failed:", e); }
            } else {
                if (micDot) micDot.classList.remove("active");
                if (micStatus) micStatus.textContent = "متوقف";
            }
        };

        isRecognizing = true;
        try { recognition.start(); }
        catch (e) { console.warn("recognition start failed:", e); }
    }

    function stopSpeechRecognition() {
        isRecognizing = false;
        try { recognition?.stop(); } catch { }
        if (micDot) micDot.classList.remove("active");
        if (micStatus) micStatus.textContent = "متوقف";
    }

    // ===== WebRTC =====
    async function startLocalMedia(deviceId) {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true, video: deviceId ? { deviceId: { exact: deviceId } } : true
        });
        if (localVideo) localVideo.srcObject = localStream;
        const vt = localStream.getVideoTracks()[0];
        if (vt) currentVideoDeviceId = vt.getSettings().deviceId || null;
    }

    function createPeer() {
        peer = new RTCPeerConnection(rtcConfig);
        localStream.getTracks().forEach(t => peer.addTrack(t, localStream));
        peer.ontrack = e => { if (remoteVideo) { remoteVideo.srcObject = e.streams[0]; remoteVideo.play?.().catch(() => { }); } };
        peer.onicecandidate = e => { if (e.candidate) connection.invoke("SendIceCandidate", JSON.stringify(e.candidate)).catch(console.error); };
    }

    async function makeOffer() {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await connection.invoke("SendOffer", JSON.stringify(peer.localDescription));
    }

    async function handleOffer(s) {
        await peer.setRemoteDescription(JSON.parse(s)); remoteDescSet = true;
        while (pendingCandidates.length) await peer.addIceCandidate(pendingCandidates.shift()).catch(() => { });
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await connection.invoke("SendAnswer", JSON.stringify(peer.localDescription));
    }

    async function handleAnswer(s) {
        await peer.setRemoteDescription(JSON.parse(s)); remoteDescSet = true;
        while (pendingCandidates.length) await peer.addIceCandidate(pendingCandidates.shift()).catch(() => { });
    }

    async function handleCandidate(s) {
        const c = JSON.parse(s);
        if (!remoteDescSet) { pendingCandidates.push(c); return; }
        await peer.addIceCandidate(c).catch(() => { });
    }

    function toggle(kind) {
        if (!localStream) return;
        const t = kind === "audio" ? localStream.getAudioTracks()[0] : localStream.getVideoTracks()[0];
        if (!t) return; t.enabled = !t.enabled; return t.enabled;
    }

    async function switchCamera() {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter(d => d.kind === "videoinput");
        if (cams.length <= 1) return;
        const idx = cams.findIndex(c => c.deviceId === currentVideoDeviceId);
        await startLocalMedia(cams[(idx + 1) % cams.length].deviceId);
        const sender = peer?.getSenders?.().find(s => s.track?.kind === "video");
        const newTrack = localStream.getVideoTracks()[0];
        if (sender && newTrack) sender.replaceTrack(newTrack);
    }

    async function endCall() {
        stopSpeechRecognition();
        try { await connection?.invoke("LeaveRoom"); } catch { }
        if (peer) { peer.close(); peer = null; }
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        if (localVideo) localVideo.srcObject = null;
        if (remoteVideo) remoteVideo.srcObject = null;
        remoteDescSet = false; pendingCandidates.length = 0;
    }

    btnMic?.addEventListener("click", () => { const e = toggle("audio"); btnMic.classList.toggle("active", e === false); });
    btnCam?.addEventListener("click", () => { const e = toggle("video"); btnCam.classList.toggle("active", e === false); });
    btnSwitch?.addEventListener("click", switchCamera);
    [endBtnTop, btnEndBottom].filter(Boolean).forEach(b => b.addEventListener("click", endCall));

    try { await startLocalMedia(); }
    catch (e) { console.error(e); alert("مش قادر أشغل الكاميرا/المايك."); return; }

    // ===== SignalR =====
    connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, { withCredentials: false })
        .withAutomaticReconnect().build();

    connection.on("JoinRoomNotification", async () => { if (!peer) createPeer(); if (isCreator) await makeOffer().catch(console.error); });
    connection.on("ReceiveOffer", async s => { if (!peer) createPeer(); await handleOffer(s).catch(console.error); });
    connection.on("ReceiveAnswer", async s => { await handleAnswer(s).catch(console.error); });
    connection.on("ReceiveIceCandidate", async s => { await handleCandidate(s).catch(console.error); });
    connection.on("LeaveRoomNotification", () => {
        if (remoteVideo) remoteVideo.srcObject = null;
        if (peer) { peer.close(); peer = null; }
        remoteDescSet = false; pendingCandidates.length = 0;
    });

    // ✅ استقبال الإشارة المترجمة
    connection.on("ReceiveCaption", (text) => {
        appendSpeech(text);      // يكتب في text box
        showCaption(text);       // (اختياري) يظهر فوق الفيديو
    });

    try {
        await connection.start();
        console.log(
            await connection.invoke("TestMethod")
        );

        console.log(
            await connection.invoke("SendCaption", "test")
        );
        console.log("SignalR Connected");
    }
    catch (e) {
        console.error("Connection Error:", e);
        alert("فشل الاتصال.");
        return;
    }

    if (!peer) createPeer();

    if (roomId) {
        const res = await connection.invoke("JoinRoom", userId, roomId);
        if (res !== roomId) { alert(res); return; }
        isCreator = false; setRoomUI(roomId); toast("تم الانضمام");
    } else {
        roomId = await connection.invoke("CreateRoom", userId);
        isCreator = true;
        history.replaceState({}, "", `${location.pathname}?room=${encodeURIComponent(roomId)}`);
        setRoomUI(roomId); toast("تم إنشاء غرفة");
    }

    // ✅ شغّل الاتنين بعد الاتصال
    startSpeechRecognition();
    initAvatar(); // Three.js محمّل في الـ HTML
});