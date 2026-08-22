import * as THREE from 'three';
import { loadModel } from './objects.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

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

// CSS3D RENDERER (for diegetic HUD panels living in 3D space)
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);

// LIGHTING
const ambient = new THREE.AmbientLight(0x1a1a2e, 2);
scene.add(ambient);

const cyanLight = new THREE.DirectionalLight(0x00ffff, 1.5);
cyanLight.position.set(5, 10, 5);
scene.add(cyanLight);

const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
pinkLight.position.set(-5, 5, 5);
scene.add(pinkLight);


// RED BLINKING LED
const ledGeo = new THREE.SphereGeometry(0.10, 8, 8);
const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const led = new THREE.Mesh(ledGeo, ledMat);
led.position.set(3.58, 2.7, -4.7); // roughly matches phone's position, slightly in front


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

// LEFT PANEL — images/screenshots
const leftDiv = document.createElement('div');
leftDiv.style.width = '300px';
leftDiv.style.height = '400px';
leftDiv.style.background = 'blue';
leftDiv.style.color = 'white';
leftDiv.style.display = 'flex';
leftDiv.style.alignItems = 'center';
leftDiv.style.justifyContent = 'center';
leftDiv.style.fontFamily = 'sans-serif';
leftDiv.innerText = 'LEFT PANEL';

const leftPanel = new CSS3DObject(leftDiv);
leftPanel.scale.set(0.008, 0.008, 0.008);
leftPanel.position.set(-1, 3, -5);       // to the left of the phone (phone sits around x=3)
leftPanel.rotation.y = Math.PI / 6;      // angled ~30° to face inward, toward the phone
leftDiv.style.opacity = '0.5';
leftPanel.visible = false;
scene.add(leftPanel);

// RIGHT PANEL — description
const rightDiv = document.createElement('div');
rightDiv.style.width = '300px';
rightDiv.style.height = '400px';
rightDiv.style.background = 'blue';
rightDiv.style.color = 'white';
rightDiv.style.display = 'flex';
rightDiv.style.alignItems = 'center';
rightDiv.style.justifyContent = 'center';
rightDiv.style.fontFamily = 'sans-serif';
rightDiv.innerText = 'RIGHT PANEL';

const rightPanel = new CSS3DObject(rightDiv);
rightPanel.scale.set(0.008, 0.008, 0.008);
rightPanel.position.set(7, 3, -5);      // to the right of the phone
rightPanel.rotation.y = -Math.PI / 6;   // angled the opposite way, also facing inward
rightDiv.style.opacity = '0.5';
rightPanel.visible = false;
scene.add(rightPanel);

// RAYCASTER
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [box1, box2, box3, backButtonMesh];

let phoneModel = null;
loadModel(`${import.meta.env.BASE_URL}Models/Phone.fbx`, scene, { position: [3, 2, -5], scale: 0.05 })
.then((model) => {
    phoneModel = model;
    model.scale.set(0.01, 0.01, 0.01);

    model.add(led);
    led.scale.set(100, 100, 100);
    led.position.set(70.8, 90.0, -40);
    
    clickableObjects.push(model);
    scene.remove(box1); 

    const index = clickableObjects.indexOf(box1);
    if (index !== -1) {
      clickableObjects.splice(index, 1);
    }
  })
  .catch((err) => console.error('Failed to load FBX:', err));


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
  leftPanel.visible = false;
  rightPanel.visible = false;
}

// CLICK HANDLER
document.addEventListener('click', (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, true); // recursive: true - needed to detect clicks on the phone model's child meshes

  if (intersects.length === 0) return;

  const target = intersects[0].object;

  if (target === backButtonMesh) {
    resetCamera();
    return;
  }

  // Figure out if we clicked a child mesh belonging to the phone model
  let clickedRoot = target;
  if (phoneModel && phoneModel.getObjectById(target.id)) {
    clickedRoot = phoneModel;
  }

  if (target === box1) activeSection = 'projects';
  if (target === box2) activeSection = 'about';
  if (target === box3) activeSection = 'contact';
  if (clickedRoot === phoneModel) {
    activeSection = 'projects';
    leftPanel.visible = true;
    rightPanel.visible = true;
  }

  const worldPos = new THREE.Vector3();
  clickedRoot.getWorldPosition(worldPos);

  const offset = new THREE.Vector3(0, 0, 4);
  cameraTargetPosition = worldPos.clone().add(offset);
  isFocused = true;

  backButtonMesh.visible = true;
});

// RESIZE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
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

  if (phoneModel) {
    phoneModel.rotation.y += 0.01;
  }

  if (cameraTargetPosition) {
    camera.position.lerp(cameraTargetPosition, 0.08);

    if (camera.position.distanceTo(cameraTargetPosition) < 0.05) {
      camera.position.copy(cameraTargetPosition);
      cameraTargetPosition = null;
    }
  }


    // BLINK THE LED
  const blink = Math.sin(Date.now() * 0.005) > 0;
  led.material.color.setHex(blink ? 0xff0000 : 0x330000);

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
  cssRenderer.render(scene, camera);
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