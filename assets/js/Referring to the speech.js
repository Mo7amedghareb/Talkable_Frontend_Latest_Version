document.addEventListener("DOMContentLoaded", async () => {
  const video = document.getElementById("camVideo");
  const canvasElement = document.getElementById("outputCanvas");
  const canvasCtx = canvasElement.getContext("2d");
  const translatedEl = document.getElementById("translatedText");
  const speakBtn = document.getElementById("speakBtn");
  const resetBtn = document.querySelector(".reset-btn");

  let audioQueue = [];
  let isSpeaking = false;




  let sentence = [];
  let lastWord = "";
  let lastTime = 0;
  const COOLDOWN = 300;

  let startDetectionTime = null;
  const START_DELAY = 2000;

  let isProcessing = false;
  let lastSendTime = 0;
  const SEND_INTERVAL = 400;

  let predictionBuffer = [];
  const BUFFER_SIZE = 25;

  // =========================
  // 🔊 AUDIO FIX (IMPORTANT)
  // =========================
  let audioUnlocked = false;
  let voices = [];

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    console.log("voices loaded:", voices);
  }

  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;

  function unlockAudio() {
    if (audioUnlocked) return;

    const utter = new SpeechSynthesisUtterance("test");
    utter.volume = 0; // silent unlock
    speechSynthesis.speak(utter);

    audioUnlocked = true;
    console.log("🔊 Audio Unlocked");
  }

  window.addEventListener("click", unlockAudio, { once: true });

  // =========================
  // MediaPipe
  // =========================
  const holistic = new Holistic({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
  });

  holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  holistic.onResults((results) => {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: "#00FF00",
      lineWidth: 3,
    });

    drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
      color: "#FF0000",
      lineWidth: 3,
    });

    drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
      color: "#FF0000",
      lineWidth: 3,
    });

    // ⏱ delay start
    if (!startDetectionTime) {
      startDetectionTime = Date.now();
      return;
    }

    if (Date.now() - startDetectionTime < START_DELAY) return;

    const now = Date.now();
    if (now - lastSendTime < SEND_INTERVAL || isProcessing) return;

    if (results.rightHandLandmarks || results.leftHandLandmarks) {
      isProcessing = true;
      lastSendTime = now;

      const features = extractFeatures(results);
      sendToAPI(features);
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      await holistic.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  camera.start();

  // =========================
  // Extract
  // =========================
  function extractFeatures(results) {
    let features = [];

    if (results.rightHandLandmarks) {
      const h = results.rightHandLandmarks;
      const cx = h[0].x, cy = h[0].y;
      const scale = Math.sqrt((h[9].x - cx) ** 2 + (h[9].y - cy) ** 2) || 1;
      h.forEach(lm => {
        features.push((lm.x - cx) / scale, (lm.y - cy) / scale, lm.z / scale);
      });
    } else features.push(...Array(63).fill(0));

    if (results.leftHandLandmarks) {
      const h = results.leftHandLandmarks;
      const cx = h[0].x, cy = h[0].y;
      const scale = Math.sqrt((h[9].x - cx) ** 2 + (h[9].y - cy) ** 2) || 1;
      h.forEach(lm => {
        features.push((lm.x - cx) / scale, (lm.y - cy) / scale, lm.z / scale);
      });
    } else features.push(...Array(63).fill(0));

    if (results.poseLandmarks) {
      const p = results.poseLandmarks;
      const cx = (p[11].x + p[12].x) / 2;
      const cy = (p[11].y + p[12].y) / 2;
      const scale = Math.sqrt((p[11].x - p[12].x) ** 2 + (p[11].y - p[12].y) ** 2) || 1;
      for (let i = 0; i < 33; i++) {
        features.push((p[i].x - cx) / scale, (p[i].y - cy) / scale, p[i].z / scale);
      }
    } else features.push(...Array(99).fill(0));

    return features;
  }

  // =========================
  // API
  // =========================

  async function sendToAPI(features) {
    try {
      const res = await fetch("https://lair-budget-sureness.ngrok-free.dev/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      const data = await res.json();


      console.log(`Prediction: ${data.text} | Confidence: ${data.confidence}`);
      if (data.confidence < 0.7) return;

      predictionBuffer.push(data.text);
      if (predictionBuffer.length > BUFFER_SIZE) predictionBuffer.shift();

      const stabilized = getMostCommon(predictionBuffer);
      const now = Date.now();

      if (
        stabilized &&
        stabilized !== lastWord &&
        now - lastTime > COOLDOWN &&
        predictionBuffer.length >= 10
      ) {
        lastWord = stabilized;
        lastTime = now;

        sentence.push(stabilized);
        translatedEl.textContent = sentence.join(" ");

      }
    } catch (err) {
      console.error(err);
    } finally {
      isProcessing = false;
    }
      console.log("WEB features sample:", features.slice(0, 10));
  }

  // =========================
  // Most common
  // =========================
  function getMostCommon(arr) {
    let map = {}, max = 0, res = null;

    arr.forEach(v => {
      map[v] = (map[v] || 0) + 1;
      if (map[v] > max) {
        max = map[v];
        res = v;
      }
    });

    return res;
  }

  // =========================
  // 🔊 FIXED SPEECH
  // =========================
  function speakArabic(text) {
    if (!text) return;

    audioQueue.push(text);
    processQueue();
  }

  function processQueue() {
    if (isSpeaking) return;
    if (audioQueue.length === 0) return;

    isSpeaking = true;

    const text = audioQueue.shift();

    const utter = new SpeechSynthesisUtterance(text);

    const arabicVoice =
      voices.find(v => v.lang.includes("ar")) ||
      voices.find(v => v.lang.includes("en"));

    if (arabicVoice) {
      utter.voice = arabicVoice;
    }

    utter.lang = "ar-SA";
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    utter.onend = () => {
      isSpeaking = false;
      processQueue(); // يشغل اللي بعده
    };

    speechSynthesis.speak(utter);
  }

  // =========================
  // Buttons
  // =========================
  speakBtn.addEventListener("click", () => {
    unlockAudio();

    if (!sentence.length) return;

    const text = sentence.join(" ");

    audioQueue = []; // امسح أي صوت قديم
    isSpeaking = false;

    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    const arabicVoice =
      voices.find(v => v.lang.includes("ar")) ||
      voices[0];

    utter.voice = arabicVoice;
    utter.lang = "ar-SA";

    speechSynthesis.speak(utter);
  });

  resetBtn.addEventListener("click", () => {
    sentence = [];
    lastWord = "";
    predictionBuffer = [];
    startDetectionTime = null;
    translatedEl.textContent = "تم المسح...";
  });
});