import * as THREE from "three";

const mount = document.getElementById("heroMascot");
if (!mount) throw new Error("Hero mascot mount not found");

// Tweak the mascot here: size, 3D position, and cursor orbit response.
const MASCOT_CONFIG = {
  scale: 0.32,
  position: { x: 0, y: 0.8, z: 0 },
  orbitStrength: { horizontal: 0.85, vertical: 0.28 },
  cameraDistance: 8.35,
  cameraDamping: 0.055,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
const cameraTarget = new THREE.Vector3(
  MASCOT_CONFIG.position.x,
  0.15,
  MASCOT_CONFIG.position.z,
);
const visualTarget = new THREE.Vector3(0, 0.15, 0);
camera.position.set(
  cameraTarget.x,
  3.3,
  cameraTarget.z + MASCOT_CONFIG.cameraDistance,
);
camera.lookAt(visualTarget);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-hidden", "true");
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb0b0aa, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 4);
key.position.set(4, 7, 6);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 20;
key.shadow.radius = 4;
key.shadow.bias = -0.0005;
scene.add(key);
const rim = new THREE.DirectionalLight(0xf5ff00, 1.1);
rim.position.set(-4, 3, -5);
scene.add(rim);

const yellow = new THREE.MeshStandardMaterial({
  color: 0xf5ff00,
  emissive: 0xd8cf00,
  emissiveIntensity: 2.1,
  metalness: 0.18,
  roughness: 0.22,
});
const dark = new THREE.MeshStandardMaterial({
  color: 0x171717,
  metalness: 0.78,
  roughness: 0.25,
});
const white = new THREE.MeshStandardMaterial({
  color: 0xe8e8e2,
  metalness: 0.35,
  roughness: 0.35,
});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xdfe2df,
  transparent: true,
  opacity: 0.045,
  roughness: 0.2,
  metalness: 0.1,
  side: THREE.DoubleSide,
});

const node = new THREE.Group();
node.position.set(
  MASCOT_CONFIG.position.x,
  MASCOT_CONFIG.position.y,
  MASCOT_CONFIG.position.z,
);
node.scale.setScalar(MASCOT_CONFIG.scale);
scene.add(node);

const cage = new THREE.Group();
node.add(cage);
const size = 3.15;
const half = size / 2;
const frame = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
  new THREE.LineBasicMaterial({
    color: 0x777772,
    transparent: true,
    opacity: 0.8,
  }),
);
cage.add(frame);
cage.add(new THREE.Mesh(new THREE.BoxGeometry(3.02, 3.02, 3.02), glass));

function rod(a, b, material = white, radius = 0.055) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  mesh.castShadow = true;
  cage.add(mesh);
}

const corners = [
  [-half, -half, -half],
  [half, -half, -half],
  [-half, half, -half],
  [half, half, -half],
  [-half, -half, half],
  [half, -half, half],
  [-half, half, half],
  [half, half, half],
];

const fadeCanvas = document.createElement("canvas");
fadeCanvas.width = 128;
fadeCanvas.height = 128;
const fadeContext = fadeCanvas.getContext("2d");
const fadeImage = fadeContext.createImageData(128, 128);
for (let index = 0; index < fadeImage.data.length; index += 4) {
  const pixel = index / 4;
  const x = pixel % 128;
  const y = Math.floor(pixel / 128);
  const distance = Math.hypot(x - 63.5, y - 63.5);
  const edge = (63.5 - distance) / 14;
  fadeImage.data[index] = 255;
  fadeImage.data[index + 1] = 255;
  fadeImage.data[index + 2] = 255;
  fadeImage.data[index + 3] = Math.round(
    255 * THREE.MathUtils.clamp(edge, 0, 1),
  );
}
fadeContext.putImageData(fadeImage, 0, 0);
const fadeTexture = new THREE.CanvasTexture(fadeCanvas);

[
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [4, 5],
  [5, 7],
  [7, 6],
  [6, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
].forEach(([a, b]) => rod(corners[a], corners[b]));

corners.forEach((position) => {
  const clamp = new THREE.Group();
  clamp.position.set(...position);
  clamp.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), dark));
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.42), yellow);
  band.position.y = 0.09;
  clamp.add(band);
  cage.add(clamp);
});

const core = new THREE.Group();
node.add(core);
const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 2), yellow);
shell.scale.set(1, 0.98, 0.94);
shell.castShadow = true;
core.add(shell);
const inner = new THREE.Mesh(
  new THREE.SphereGeometry(0.56, 24, 24),
  new THREE.MeshBasicMaterial({
    color: 0xffff75,
    transparent: true,
    opacity: 0.25,
  }),
);
core.add(inner);

const rings = [];
for (let index = 0; index < 4; index += 1) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.02 + index * 0.07, 0.025, 8, 72),
    index % 2 ? dark : yellow,
  );
  ring.rotation.set(0.25 + index * 0.72, 0.4 + index * 0.55, index * 0.65);
  core.add(ring);
  rings.push(ring);
}
core.add(
  new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.835, 1)),
    new THREE.LineBasicMaterial({
      color: 0x8b8b82,
      transparent: true,
      opacity: 0.42,
    }),
  ),
);

const particles = new THREE.Group();
node.add(particles);
for (let index = 0; index < 16; index += 1) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xf5ff00 }),
  );
  particle.userData = {
    angle: Math.random() * Math.PI * 2,
    radius: 1.75 + Math.random() * 1.15,
    phase: Math.random() * 6.28,
    speed: 0.5 + Math.random(),
  };
  particles.add(particle);
}

const arcs = [];
const arcGroup = new THREE.Group();
node.add(arcGroup);
for (let index = 0; index < 5; index += 1) {
  const line = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0xf5ff00,
      transparent: true,
      opacity: 0.7,
    }),
  );
  arcGroup.add(line);
  arcs.push({ line, phase: Math.random() * 6.28, offset: index });
}

node.traverse((child) => {
  if (child.isMesh) child.castShadow = true;
});

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(8, 96),
  new THREE.MeshStandardMaterial({
    color: 0xf0f0ec,
    alphaMap: fadeTexture,
    transparent: true,
    opacity: 0.72,
    roughness: 1,
    side: THREE.DoubleSide,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const mobileViewport = window.matchMedia("(max-width: 800px)");
const syncMobileMascot = () => {
  const showFloor = !mobileViewport.matches;
  floor.visible = showFloor;
};
syncMobileMascot();
mobileViewport.addEventListener("change", syncMobileMascot);

function updateArcs(time, pressure) {
  arcs.forEach((arc, index) => {
    const points = [];
    const angle = (index / 5) * Math.PI * 2 + time * 0.12;
    const start = 0.82;
    const end = 1.45 + Math.sin(time * 1.5 + index) * 0.16;
    for (let pointIndex = 0; pointIndex < 7; pointIndex += 1) {
      const progress = pointIndex / 6;
      const radius = THREE.MathUtils.lerp(start, end, progress);
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(time * 7 + pointIndex * 2.7 + index) *
            0.16 *
            (1 - progress) +
            Math.sin(time * 1.7 + index) * 0.25,
          Math.sin(angle) * radius,
        ),
      );
    }
    arc.line.geometry.dispose();
    arc.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    arc.line.material.opacity =
      (0.25 + 0.55 * ((Math.sin(time * (3 + pressure * 8) + index) + 1) / 2)) *
      (0.25 + pressure * 0.9);
  });
}

const clock = new THREE.Clock();
let pointerX = 0;
let pointerY = 0;
let targetPressure = 18;
let pressure = 18;
let hoverEnergy = 0;
let lastPointerMove = performance.now();
const targetCameraPosition = new THREE.Vector3();

window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / window.innerWidth) * 2 - 1;
  pointerY = -(event.clientY / window.innerHeight) * 2 + 1;
  lastPointerMove = performance.now();
  hoverEnergy = Math.min(1, hoverEnergy + 0.035);
});
window.addEventListener("wheel", (event) => {
  targetPressure = Math.min(
    100,
    targetPressure + Math.min(Math.abs(event.deltaY) / 1200, 16),
  );
});

function pressureColor(value) {
  const yellowColor = new THREE.Color(0xf5ff00);
  const amber = new THREE.Color(0xff8a00);
  const red = new THREE.Color(0xff1717);
  const hot = new THREE.Color(0xffffff);
  if (value < 55) return yellowColor.lerp(amber, value / 55);
  if (value < 88) return amber.lerp(red, (value - 55) / 33);
  return red.lerp(hot, (value - 88) / 12);
}

function resize() {
  const width = mount.clientWidth;
  const height = mount.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const idle = Math.min((performance.now() - lastPointerMove) / 4000, 1);
  const proximity =
    1 - Math.min(Math.hypot(pointerX * 0.82, pointerY * 0.82), 1);
  targetPressure =
    18 +
    proximity * 32 +
    hoverEnergy * 24 +
    Math.min(time / 75, 1) * 22 +
    Math.sin(time * 0.75) * 3;
  if (idle > 0.75) targetPressure -= idle * 18;
  targetPressure = THREE.MathUtils.clamp(targetPressure, 8, 100);
  pressure = THREE.MathUtils.lerp(pressure, targetPressure, 0.035);
  hoverEnergy *= 0.994;
  const normalizedPressure = pressure / 100;
  const orbitAzimuth =
    0.615 + pointerX * MASCOT_CONFIG.orbitStrength.horizontal;
  const orbitElevation =
    0.405 + pointerY * MASCOT_CONFIG.orbitStrength.vertical;
  const orbitRadius = MASCOT_CONFIG.cameraDistance;
  targetCameraPosition.set(
    cameraTarget.x +
      Math.sin(orbitAzimuth) * Math.cos(orbitElevation) * orbitRadius,
    cameraTarget.y + Math.sin(orbitElevation) * orbitRadius,
    cameraTarget.z +
      Math.cos(orbitAzimuth) * Math.cos(orbitElevation) * orbitRadius,
  );
  camera.position.lerp(targetCameraPosition, MASCOT_CONFIG.cameraDamping);
  camera.lookAt(visualTarget);
  const color = pressureColor(pressure);
  shell.material.color.copy(color);
  shell.material.emissive.copy(color);
  shell.material.emissiveIntensity = 1.5 + normalizedPressure * 4.5;
  inner.material.color.copy(color);
  const pulse = 0.025 + normalizedPressure * 0.09;
  const breathe = 1 + Math.sin(time * (1.1 + normalizedPressure * 3)) * pulse;
  core.scale.set(
    breathe,
    1 + Math.sin(time * (1.1 + normalizedPressure * 3) + 0.7) * pulse * 1.15,
    breathe,
  );
  shell.rotation.x = time * 0.16;
  shell.rotation.y = time * 0.28;
  rings.forEach((ring, index) => {
    ring.rotation.x += 0.002 + index * 0.0007;
    ring.rotation.y += 0.003;
  });
  particles.children.forEach((particle) => {
    const data = particle.userData;
    const radius =
      data.radius +
      Math.sin(time * data.speed + data.phase) *
        (0.12 + normalizedPressure * 0.28);
    particle.position.set(
      Math.cos(data.angle + time * (0.07 + normalizedPressure * 0.1)) * radius,
      Math.sin(time * data.speed + data.phase) *
        (1.15 + normalizedPressure * 0.7),
      Math.sin(data.angle + time * (0.07 + normalizedPressure * 0.1)) * radius,
    );
  });
  node.rotation.y = time * (0.035 + normalizedPressure * 0.018);
  node.rotation.x =
    Math.sin(time * (0.25 + normalizedPressure * 0.45)) *
    (0.018 + normalizedPressure * 0.025);
  updateArcs(time, normalizedPressure);
  renderer.render(scene, camera);
}

resize();
window.addEventListener("resize", resize);
const mascotResizeObserver = new ResizeObserver(resize);
mascotResizeObserver.observe(mount);
animate();
