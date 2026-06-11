
// ===== Config =====
const API_BASE = "http://localhost:5298";

// ===== Scene Setup =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.set(0, 2.2, 3.0);
camera.lookAt(0, 2.0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(400, 400);
document.getElementById("avatar-container").appendChild(renderer.domElement);

// ===== Lights =====
scene.add(new THREE.AmbientLight(0xffffff, 2));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ===== Loader =====
const loader = new THREE.GLTFLoader();
const clock = new THREE.Clock();

// ===== State =====
const loadedModels = {};
let currentModel = null;
let currentMixer = null;
let currentAction = null;
let idleRotation = 0;
let isPlaying = false;
let scaleCalibrated = false;
let globalScale = 1.0;
let globalYOffset = 0.0;

// ===== UI =====
const translateBtn = document.getElementById("translateBtn");
const textInput = document.getElementById("textInput");
const loaderSpinner = document.getElementById("loader");
const statusMessage = document.getElementById("statusMessage");

// ===== ✅ لو جاي من صفحة PDF — حط النص تلقائياً =====
window.addEventListener("DOMContentLoaded", () => {
  const fromPdf = localStorage.getItem("fromPdf");
  if (fromPdf === "true") {
    const ocrText = localStorage.getItem("ocrText") || "";
    if (ocrText && textInput) {
      textInput.value = ocrText;
    }
    // امسح العلامة عشان مترجعش تاني
    localStorage.removeItem("fromPdf");
  }
});

// ===== Scale =====
function applyModelTransform(model, isFirst) {
  if (isFirst) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    globalScale = 0.02;

    const center = new THREE.Vector3();
    box.getCenter(center);
    globalYOffset = -center.y * globalScale;

    console.log(`[Avatar] Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
    console.log(`[Avatar] Scale: ${globalScale.toFixed(3)}, Y offset: ${globalYOffset.toFixed(3)}`);

    scaleCalibrated = true;
  }

  model.scale.set(globalScale, globalScale, globalScale);
  model.position.set(0, globalYOffset, 0);
}

// ===== Load GLB (cached) =====
async function loadGLBCached(modelUrl) {
  if (modelUrl.startsWith("/")) modelUrl = API_BASE + modelUrl;

  if (loadedModels[modelUrl]) return loadedModels[modelUrl];

  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error("فشل تحميل الملف");

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) throw new Error("السيرفر رجّع HTML");

  const buffer = await res.arrayBuffer();

  return new Promise((resolve, reject) => {
    loader.parse(buffer, "", (gltf) => {
      const model = gltf.scene;

      const isFirst = !scaleCalibrated;
      applyModelTransform(model, isFirst);

      model.visible = false;
      scene.add(model);

      const entry = { model, clips: gltf.animations || [] };
      loadedModels[modelUrl] = entry;

      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.material.emissive?.setHex(0x111111);
        }
      });

      resolve(entry);
    }, reject);
  });
}

// ===== Play one entry =====
function playEntry(entry) {
  return new Promise((resolve) => {
    if (currentModel) currentModel.visible = false;
    if (currentMixer) {
      currentMixer.stopAllAction();
      currentMixer = null;
      currentAction = null;
    }

    const { model, clips } = entry;
    model.visible = true;
    currentModel = model;

    if (clips.length === 0) {
      setTimeout(resolve, 600);
      return;
    }

    const mixer = new THREE.AnimationMixer(model);
    currentMixer = mixer;

    const action = mixer.clipAction(clips[0]);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().play();
    currentAction = action;

    mixer.addEventListener("finished", () => resolve());
  });
}

// ===== Crossfade =====
const FADE_MS = 180;

function playEntryCrossfade(prevMixer, prevAction, nextEntry) {
  return new Promise((resolve) => {
    if (prevMixer && prevAction) {
      setTimeout(() => { prevMixer.stopAllAction(); }, FADE_MS);
    }

    if (currentModel) currentModel.visible = false;

    const { model, clips } = nextEntry;
    model.visible = true;
    currentModel = model;

    if (clips.length === 0) {
      setTimeout(resolve, 600);
      return;
    }

    const mixer = new THREE.AnimationMixer(model);
    currentMixer = mixer;

    const action = mixer.clipAction(clips[0]);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset().play();
    currentAction = action;

    mixer.addEventListener("finished", () => resolve());
  });
}

// ===== Fetch animation URL =====
async function fetchWordUrl(word) {
  try {
    const res = await fetch(
      `${API_BASE}/api/Avatar?word=${encodeURIComponent(word)}`,
      { method: "GET", headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || data.animationPath || null;
  } catch {
    return null;
  }
}

// ===== Main Sequence Player =====
async function playSequence(urls) {
  isPlaying = true;
  translateBtn.disabled = true;

  statusMessage.textContent = "جاري تحميل الحركات...";
  loaderSpinner.classList.remove("hidden");

  const entries = [];
  await Promise.all(
    urls.map(async (url, i) => {
      if (!url) { entries[i] = null; return; }
      try {
        entries[i] = await loadGLBCached(url);
      } catch (e) {
        console.warn(`فشل تحميل كلمة ${i + 1}:`, e);
        entries[i] = null;
      }
    })
  );

  loaderSpinner.classList.add("hidden");

  const validEntries = entries.filter(Boolean);
  if (validEntries.length === 0) {
    statusMessage.textContent = "لم يتم العثور على حركات ❌";
    isPlaying = false;
    translateBtn.disabled = false;
    return;
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;

    statusMessage.textContent = `${i + 1} / ${urls.filter(Boolean).length}`;

    const prevMixer = currentMixer;
    const prevAction = currentAction;

    if (i === 0) {
      await playEntry(entry);
    } else {
      await playEntryCrossfade(prevMixer, prevAction, entry);
    }
  }

  statusMessage.textContent = "";
  isPlaying = false;
  translateBtn.disabled = false;
}

// ===== Translate Button =====
translateBtn.addEventListener("click", async () => {
  if (isPlaying) return;

  const rawText = textInput.value.trim();
  if (!rawText) return;

  const words = rawText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  statusMessage.textContent = "جاري الترجمة...";
  translateBtn.disabled = true;

  const urls = await Promise.all(words.map(fetchWordUrl));

  const foundCount = urls.filter(Boolean).length;
  if (foundCount === 0) {
    statusMessage.textContent = "لا توجد حركات لأي كلمة ❌";
    translateBtn.disabled = false;
    return;
  }

  await playSequence(urls);
});

// ===== Render Loop =====
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  for (const { model } of Object.values(loadedModels)) {
    if (model.visible) {
      const mixer = currentMixer && currentModel === model ? currentMixer : null;
      if (mixer) mixer.update(delta);
    }
  }

  renderer.render(scene, camera);
}

animate();