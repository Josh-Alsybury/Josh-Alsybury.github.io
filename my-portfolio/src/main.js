import * as THREE from 'three';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x00001a); 
scene.fog = new THREE.FogExp2(0x00001a, 0.02);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const initialCameraPosition = new THREE.Vector3(0, 0, 8);
camera.position.copy(initialCameraPosition);

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(0.4);
renderer.domElement.style.imageRendering = 'pixelated';
document.body.appendChild(renderer.domElement);

// LIGHTING
const ambient = new THREE.AmbientLight(0x1a1a2e, 2);
scene.add(ambient);

const cyanLight = new THREE.DirectionalLight(0x00ffff, 1.5);
cyanLight.position.set(5, 10, 5);
scene.add(cyanLight);

const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
pinkLight.position.set(-5, 5, 5);
scene.add(pinkLight);


// FLOATING BOX FACTORY
function createFloatingBox(x, y, z, color) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshToonMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.4
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

const box1 = createFloatingBox(3, 2, -5, 0xff00ff);
const box2 = createFloatingBox(-4, 1, -8, 0x00ffff);
const box3 = createFloatingBox(2, 3, -12, 0xffaa00);

// WORLD BACK BUTTON
const backGeo = new THREE.PlaneGeometry(1.5, 0.6);
const backMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9
});
const backButtonMesh = new THREE.Mesh(backGeo, backMat);
backButtonMesh.visible = false;
scene.add(backButtonMesh);

// RAYCASTER
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [box1, box2, box3, backButtonMesh];

// CAMERA STATE
let cameraTargetPosition = null;
let activeSection = null;
let isFocused = false;

// RESET CAMERA
function resetCamera() {
  activeSection = null;
  isFocused = false;
  cameraTargetPosition = initialCameraPosition.clone();
  backButtonMesh.visible = false;
}

// CLICK HANDLER
document.addEventListener('click', (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length === 0) return;

  const target = intersects[0].object;

  if (target === backButtonMesh) {
    resetCamera();
    return;
  }

  if (target === box1) activeSection = 'projects';
  if (target === box2) activeSection = 'about';
  if (target === box3) activeSection = 'contact';

  const offset = new THREE.Vector3(0, 0, 4);
  cameraTargetPosition = target.position.clone().add(offset);
  isFocused = true;

  backButtonMesh.visible = true;
});

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// MOUSE DRIFT
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

// ANIMATE
function animate() {
  requestAnimationFrame(animate);

  box1.rotation.x += 0.01;
  box2.rotation.y += 0.01;
  box3.rotation.z += 0.01;

  if (cameraTargetPosition) {
    camera.position.lerp(cameraTargetPosition, 0.08);

    if (camera.position.distanceTo(cameraTargetPosition) < 0.05) {
      camera.position.copy(cameraTargetPosition);
      cameraTargetPosition = null;
    }
  }

  if (!isFocused) {
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -10);
  } else {

    const lookAtTarget =
      activeSection === 'projects'
        ? box1.position
        : activeSection === 'about'
        ? box2.position
        : box3.position;

    camera.lookAt(lookAtTarget);

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    backButtonMesh.position.copy(camera.position)
      .add(forward.multiplyScalar(2))
      .add(new THREE.Vector3(0, -1.2, 0));

    backButtonMesh.lookAt(camera.position);
  }

  renderer.render(scene, camera);
}

// STARS
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 200;
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
  opacity: 0.8
});

const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

animate();
