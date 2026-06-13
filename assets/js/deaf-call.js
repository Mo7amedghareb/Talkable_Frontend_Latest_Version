// ===== deaf-call.js =====
// صفحة الشخص الصم — بيعمل حركات وتتترجم لكلام عند الطرف التاني
// ===== Avatar From Speech (Three.js) =====
const API_BASE_AVATAR = "https://ciliary-pasquale-overhead.ngrok-free.dev"; // زي API_BASE في speech-to-gesture.js

let avatarReady = false;
let sceneA, camA, rendA, clockA;
let loadedModelsA = {};
let currentModelA = null;
let currentMixerA = null;
let currentActionA = null;
let scaleCalibratedA = false;
let globalScaleA = 0.02;
let globalYOffsetA = 0.0;

// function initAvatar() {
//     const container = document.getElementById("avatar-container");
//     if (!container || typeof THREE === "undefined") {
//         console.warn("Avatar container or THREE not found");
//         return;
//     }

//     sceneA = new THREE.Scene();
//     sceneA.background = new THREE.Color(0xeeeeee);

//     camA = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
//     camA.position.set(0, 2.2, 3.0);
//     camA.lookAt(0, 2.0, 0);

//     rendA = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     rendA.setSize(200, 200);            // أصغر من صفحة الترجمة العادية
//     container.appendChild(rendA.domElement);

//     sceneA.add(new THREE.AmbientLight(0xffffff, 2));
//     const dir = new THREE.DirectionalLight(0xffffff, 3);
//     dir.position.set(5, 10, 5);
//     sceneA.add(dir);

//     clockA = new THREE.Clock();
//     avatarReady = true;

//     (function loop() {
//         requestAnimationFrame(loop);
//         const dt = clockA.getDelta();
//         if (currentMixerA) currentMixerA.update(dt);
//         rendA.render(sceneA, camA);
//     })();
// }

function initAvatar() {
    const container = document.getElementById("avatar-container");
    if (!container) { console.warn("avatar-container not found"); return; }
    if (typeof THREE === "undefined") { console.warn("THREE not loaded"); return; }

    sceneA = new THREE.Scene();
    sceneA.background = new THREE.Color(0xeeeeee);

    camA = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camA.position.set(0, 2.2, 3.0);
    camA.lookAt(0, 2.0, 0);

    rendA = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendA.setSize(220, 220);   // ← نفس حجم الـ container
    container.innerHTML = "";  // ← امسح أي محتوى قديم
    container.appendChild(rendA.domElement);

    sceneA.add(new THREE.AmbientLight(0xffffff, 2));
    const dir = new THREE.DirectionalLight(0xffffff, 3);
    dir.position.set(5, 10, 5);
    sceneA.add(dir);

    clockA = new THREE.Clock();
    avatarReady = true;
    console.log("✅ Avatar ready");

    (function loop() {
        requestAnimationFrame(loop);
        const dt = clockA.getDelta();
        if (currentMixerA) currentMixerA.update(dt);
        rendA.render(sceneA, camA);
    })();
}



function applyModelTransformA(model, isFirst) {
    if (isFirst) {
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);

        globalScaleA = 0.02;
        globalYOffsetA = -center.y * globalScaleA;
        scaleCalibratedA = true;
    }

    model.scale.set(globalScaleA, globalScaleA, globalScaleA);
    model.position.set(0, globalYOffsetA, 0);
}

async function loadGLBCachedA(url) {
    if (url.startsWith("/")) url = API_BASE_AVATAR + url;
    if (loadedModelsA[url]) return loadedModelsA[url];

    const res = await fetch(url, {
        headers: { "ngrok-skip-browser-warning": "69420" }  // ← أضف
    });
    if (!res.ok) throw new Error("فشل تحميل الملف");
    // ... باقي الكود زي ما هو

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) throw new Error("السيرفر رجّع HTML");

    const buf = await res.arrayBuffer();

    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.parse(buf, "", (gltf) => {
            const model = gltf.scene;
            applyModelTransformA(model, !scaleCalibratedA);

            model.visible = false;
            sceneA.add(model);

            model.traverse(obj => {
                if (obj.isMesh) obj.material.emissive?.setHex(0x111111);
            });

            const entry = { model, clips: gltf.animations || [] };
            loadedModelsA[url] = entry;
            resolve(entry);
        }, reject);
    });
}

function playEntryA(entry) {
    return new Promise((resolve) => {
        if (currentModelA) currentModelA.visible = false;
        if (currentMixerA) {
            currentMixerA.stopAllAction();
            currentMixerA = null;
            currentActionA = null;
        }

        const { model, clips } = entry;
        model.visible = true;
        currentModelA = model;

        if (!clips.length) {
            setTimeout(resolve, 600);
            return;
        }

        const mixer = new THREE.AnimationMixer(model);
        currentMixerA = mixer;

        const action = mixer.clipAction(clips[0]);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().play();
        currentActionA = action;

        mixer.addEventListener("finished", () => resolve());
    });
}

const FADE_MS_A = 180;

function playEntryCrossfadeA(prevMixer, prevAction, nextEntry) {
    return new Promise((resolve) => {
        if (prevMixer && prevAction) {
            setTimeout(() => { prevMixer.stopAllAction(); }, FADE_MS_A);
        }

        if (currentModelA) currentModelA.visible = false;

        const { model, clips } = nextEntry;
        model.visible = true;
        currentModelA = model;

        if (!clips.length) {
            setTimeout(resolve, 600);
            return;
        }

        const mixer = new THREE.AnimationMixer(model);
        currentMixerA = mixer;

        const action = mixer.clipAction(clips[0]);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().play();
        currentActionA = action;

        mixer.addEventListener("finished", () => resolve());
    });
}

async function fetchWordUrlA(word) {
    try {
        const res = await fetch(
            `${API_BASE_AVATAR}/api/Avatar?word=${encodeURIComponent(word)}`,
            {
                headers: {
                    Accept: "application/json",
                    "ngrok-skip-browser-warning": "69420"  // ← أضف
                }
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.url || data.animationPath || null;
    } catch {
        return null;
    }
}

// Queue للكلمات اللي جايه من الشخص الطبيعي
const wordQueueA = [];
let isPlayingAvatarA = false;

async function processQueueA() {
    if (!avatarReady || isPlayingAvatarA || !wordQueueA.length) return;

    isPlayingAvatarA = true;

    const word = wordQueueA.shift();   // خُد الكلمة الأولى في الطابور
    try {
        const url = await fetchWordUrlA(word);
        if (url) {
            const entry = await loadGLBCachedA(url);
            // ممكن نضيف Crossfade بين الحركات المتتالية، بس هنا هنشغلها عادي:
            await playEntryA(entry);
        }
    } catch (e) {
        console.warn("Avatar error:", e);
    }

    isPlayingAvatarA = false;
    if (wordQueueA.length) processQueueA();
}
document.addEventListener("DOMContentLoaded", async () => {
    const HUB_URL = "https://ciliary-pasquale-overhead.ngrok-free.dev/callhub";
    const AI_API = "https://lair-budget-sureness.ngrok-free.dev/predict";

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
        try { await navigator.clipboard.writeText(text); toast("تم النسخ"); }
        catch {
            const t = document.createElement("textarea");
            t.value = text; document.body.appendChild(t); t.select();
            document.execCommand("copy"); t.remove(); toast("تم النسخ");
        }
    }

    function setRoomUI(id) {
        if (!roomPill || !roomCodeEl) return;
        roomCodeEl.textContent = id || "---";
        roomPill.hidden = false;
    }

    copyRoomBtn?.addEventListener("click", () => {
        const code = roomCodeEl?.textContent?.trim();
        if (code && code !== "---") copyText(code);
    });
    copyRoomLinkBtn?.addEventListener("click", () => copyText(location.href));

    // ===== Caption Box — يعرض الكلام اللي جاي من الشخص العادي =====
    let captionBox = document.getElementById("captionBox");
    if (!captionBox) {
        captionBox = document.createElement("div");
        captionBox.id = "captionBox";
        Object.assign(captionBox.style, {
            position: "fixed",
            bottom: "90px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.82)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "20px",
            fontSize: "1.3rem",
            fontFamily: "Arial, sans-serif",
            maxWidth: "80%",
            textAlign: "center",
            zIndex: "9999",
            display: "none",
            direction: "rtl",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            transition: "opacity 0.3s"
        });
        document.body.appendChild(captionBox);
    }

    // ===== My Translation Box — يعرض للشخص الصم الكلمة اللي اتترجمت من حركاته =====
    let myTranslationBox = document.getElementById("myTranslationBox");
    if (!myTranslationBox) {
        myTranslationBox = document.createElement("div");
        myTranslationBox.id = "myTranslationBox";
        Object.assign(myTranslationBox.style, {
            position: "fixed",
            bottom: "160px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(91,60,196,0.9)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "20px",
            fontSize: "1rem",
            fontFamily: "Arial, sans-serif",
            maxWidth: "80%",
            textAlign: "center",
            zIndex: "9999",
            display: "none",
            direction: "rtl",
            boxShadow: "0 4px 15px rgba(91,60,196,0.5)"
        });
        document.body.appendChild(myTranslationBox);
    }

    let captionTimer = null;
    let myTransTimer = null;

    function showCaption(text) {
        if (!text) return;
        captionBox.textContent = text;
        captionBox.style.display = "block";
        clearTimeout(captionTimer);
        captionTimer = setTimeout(() => { captionBox.style.display = "none"; }, 3500);
    }

    function showMyTranslation(text, confidence) {
        if (!text) return;
        const pct = confidence ? ` (${Math.round(confidence * 100)}%)` : "";
        myTranslationBox.textContent = `🤟 ${text}${pct}`;
        myTranslationBox.style.display = "block";
        clearTimeout(myTransTimer);
        myTransTimer = setTimeout(() => { myTranslationBox.style.display = "none"; }, 3000);
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
    let isCreator = false;
    let currentVideoDeviceId = null;
    const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const pendingCandidates = [];
    let remoteDescSet = false;

    // ===== MediaPipe — Sign Detection =====
    let holistic = null;
    let isProcessing = false;
    let lastSendTime = 0;
    const SEND_INTERVAL = 400;
    let predictionBuffer = [];
    const BUFFER_SIZE = 15;
    let lastWord = "";
    let startDetectionTime = null;
    const START_DELAY = 2000;

    function initMediaPipe() {
        if (typeof Holistic === "undefined") { console.warn("MediaPipe not loaded"); return; }

        holistic = new Holistic({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`
        });
        holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        holistic.onResults(onResults);

        if (typeof Camera !== "undefined" && localVideo) {
            const cam = new Camera(localVideo, {
                onFrame: async () => { if (holistic) await holistic.send({ image: localVideo }); },
                width: 640, height: 480
            });
            cam.start();
        }
    }

    function onResults(results) {
        if (!startDetectionTime) { startDetectionTime = Date.now(); return; }
        if (Date.now() - startDetectionTime < START_DELAY) return;
        const now = Date.now();
        if (now - lastSendTime < SEND_INTERVAL || isProcessing) return;
        if (results.rightHandLandmarks || results.leftHandLandmarks) {
            isProcessing = true;
            lastSendTime = now;
            sendToAI(extractFeatures(results));
        }
    }

    function extractFeatures(results) {
        let f = [];
        if (results.rightHandLandmarks) {
            const h = results.rightHandLandmarks;
            const cx = h[0].x, cy = h[0].y;
            const s = Math.sqrt((h[9].x - cx) ** 2 + (h[9].y - cy) ** 2) || 1;
            h.forEach(lm => f.push((lm.x - cx) / s, (lm.y - cy) / s, lm.z / s));
        } else f.push(...Array(63).fill(0));

        if (results.leftHandLandmarks) {
            const h = results.leftHandLandmarks;
            const cx = h[0].x, cy = h[0].y;
            const s = Math.sqrt((h[9].x - cx) ** 2 + (h[9].y - cy) ** 2) || 1;
            h.forEach(lm => f.push((lm.x - cx) / s, (lm.y - cy) / s, lm.z / s));
        } else f.push(...Array(63).fill(0));

        if (results.poseLandmarks) {
            const p = results.poseLandmarks;
            const cx = (p[11].x + p[12].x) / 2, cy = (p[11].y + p[12].y) / 2;
            const s = Math.sqrt((p[11].x - p[12].x) ** 2 + (p[11].y - p[12].y) ** 2) || 1;
            for (let i = 0; i < 33; i++) f.push((p[i].x - cx) / s, (p[i].y - cy) / s, p[i].z / s);
        } else f.push(...Array(99).fill(0));
        return f;
    }

    function getMostCommon(arr) {
        let map = {}, max = 0, res = null;
        arr.forEach(v => { map[v] = (map[v] || 0) + 1; if (map[v] > max) { max = map[v]; res = v; } });
        return res;
    }

    async function sendToAI(features) {
        try {
            const res = await fetch(AI_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features })
            });
            const data = await res.json();

            // ✅ الـ API بيرجع "text" مش "predicted_text"
            const text = data.text || data.predicted_text;
            const confidence = data.confidence;

            if (!text || confidence < 0.75) { predictionBuffer = []; return; }

            predictionBuffer.push(text);
            if (predictionBuffer.length > BUFFER_SIZE) predictionBuffer.shift();

            const stabilized = getMostCommon(predictionBuffer);
            if (stabilized && stabilized !== lastWord && predictionBuffer.length >= 8) {
                lastWord = stabilized;
                predictionBuffer = [];

                // ✅ اعرض الترجمة للشخص الصم نفسه عشان يعرف إيه اللي اتبعت
                showMyTranslation(stabilized, confidence);

                // ✅ ابعت الكلمة للطرف العادي عبر SignalR
                try { await connection?.invoke("SendCaption", stabilized); }
                catch (e) { console.warn("SendCaption failed:", e); }
            }
        } catch (e) {
            console.error("AI error:", e);
        } finally {
            isProcessing = false;
        }
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
        peer.ontrack = e => {
            if (remoteVideo) { remoteVideo.srcObject = e.streams[0]; remoteVideo.play?.().catch(() => { }); }
        };
        peer.onicecandidate = e => {
            if (e.candidate) connection.invoke("SendIceCandidate", JSON.stringify(e.candidate)).catch(console.error);
        };
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
        .withAutomaticReconnect()
        .build();

    connection.on("JoinRoomNotification", async () => {
        if (!peer) createPeer();
        if (isCreator) await makeOffer().catch(console.error);
    });
    connection.on("ReceiveOffer", async s => { if (!peer) createPeer(); await handleOffer(s).catch(console.error); });
    connection.on("ReceiveAnswer", async s => { await handleAnswer(s).catch(console.error); });
    connection.on("ReceiveIceCandidate", async s => { await handleCandidate(s).catch(console.error); });
    connection.on("LeaveRoomNotification", () => {
        if (remoteVideo) remoteVideo.srcObject = null;
        if (peer) { peer.close(); peer = null; }
        remoteDescSet = false; pendingCandidates.length = 0;
    });

    // ✅ الشخص الصم بيستقبل كلام من الطرف العادي ويعرضه + يشغّل الأفاتار
    connection.on("ReceiveCaption", (text) => {
        showCaption(text);
        if (!text) return;

        text.trim().split(/\s+/).filter(Boolean).forEach(word => {
            wordQueueA.push(word);
        });

        // لو الأفاتار جاهز شغّله، لو لأ استنى ثانية وحاول تاني
        if (avatarReady) {
            processQueueA();
        } else {
            const retry = setInterval(() => {
                if (avatarReady) {
                    clearInterval(retry);
                    processQueueA();
                }
            }, 500);
        }
    });

    try { await connection.start(); }
    catch (e) { console.error(e); alert("فشل الاتصال."); return; }
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

    // ✅ شغّل MediaPipe + Avatar بعد ما كل حاجة جاهزة
    initMediaPipe();
    initAvatar();   // مهم: يجهز Three.js و الـ canvas
});
