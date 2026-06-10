let scene, camera, renderer, avatar;

// Scene
scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 3);

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Load Avatar
const loader = new THREE.GLTFLoader();

loader.load(
  "models/avatar_style.glb",
  (gltf) => {
    avatar = gltf.scene;
    avatar.scale.set(1, 1, 1);
    scene.add(avatar);
    console.log("Avatar loaded ✔");
  },
  undefined,
  (err) => console.error(err)
);

// API للـ AI
window.playGesture = function (name) {
  if (!avatar) return;

  if (name === "hello") {
    avatar.rotation.y += 0.5;
  }
};

// Animate
function animate() {
  requestAnimationFrame(animate);

  if (avatar) {
    avatar.rotation.y += 0.003; // اختبار
  }

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
