import * as THREE from 'three';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a18);
scene.fog = new THREE.FogExp2(0x0a0a18, 0.035);

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
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// LIGHTING (Dreamy Cyber Setup)
const ambient = new THREE.AmbientLight(0x1a1a2e, 2);
scene.add(ambient);

const cyanLight = new THREE.DirectionalLight(0x00ffff, 1.5);
cyanLight.position.set(5, 10, 5);
scene.add(cyanLight);

const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
pinkLight.position.set(-5, 5, 5);
scene.add(pinkLight);

// PLATFORM
const platformGeo = new THREE.BoxGeometry(10, 0.5, 10);
const platformMat = new THREE.MeshToonMaterial({ color: 0x222244 });
const platform = new THREE.Mesh(platformGeo, platformMat);
scene.add(platform);

// FLOATING OBJECT FACTORY
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

// DEPTH LAYERS
const box1 = createFloatingBox(3, 2, -5, 0xff00ff);   // Projects
const box2 = createFloatingBox(-4, 1, -15, 0x00ffff); // About  
const box3 = createFloatingBox(0, 3, -25, 0xffaa00);  // Contact

const clickableObjects = [box1, box2, box3];

// STATE
let cameraTargetPosition = null;
let activeSection = null;
let isFocused = false;

// UI ELEMENTS
const panel = document.getElementById('panel');
const panelTitle = document.getElementById('panel-title');
const panelContent = document.getElementById('panel-content');
const backButton = document.getElementById('back-button');

// MOUSE DRIFT
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
});

// RAYCASTER
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// CLICK HANDLING
document.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0 && !isFocused) {
    const target = intersects[0].object;
    handleClickTarget(target);
  }
});

function handleClickTarget(target) {
  if (target === box1) activeSection = 'projects';
  if (target === box2) activeSection = 'about';
  if (target === box3) activeSection = 'contact';

  const offset = new THREE.Vector3(0, 0, 4);
  cameraTargetPosition = target.position.clone().add(offset);
  isFocused = true;
}

// RESET FUNCTION
function resetCamera() {
  activeSection = null;
  isFocused = false;
  cameraTargetPosition = initialCameraPosition.clone();
  
  if (panel) panel.classList.add('hidden');
}

// BACK BUTTON
if (backButton) {
  backButton.addEventListener('click', resetCamera);
}

// RESIZE HANDLER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// SHOW PANEL CONTENT
function showSectionPanel(section) {
  if (!section || !panel || !panelTitle || !panelContent) return;

  if (section === 'projects') {
    panelTitle.textContent = 'Projects';
    panelContent.innerHTML = `
      <p>Game dev & web projects with Bomb Rush / JSR energy.</p>
      <ul>
        <li><strong>SFML Game</strong> – Low poly capstone shooter</li>
        <li><strong>SvelteKit App</strong> – Calendar API integration</li>
        <li><strong>More coming...</strong></li>
      </ul>
    `;
  } else if (section === 'about') {
    panelTitle.textContent = 'About';
    panelContent.innerHTML = `
      <p>Student dev from Dublin. Building weird, expressive digital spaces with C++/SFML, SvelteKit, and Three.js.</p>
      <p>Currently: Game dev capstone + web portfolio experiments.</p>
    `;
  } else if (section === 'contact') {
    panelTitle.textContent = 'Contact';
    panelContent.innerHTML = `
      <p><strong>Email:</strong> josh@example.com</p>
      <p><strong>GitHub:</strong> /yourusername</p>
      <p><strong>LinkedIn:</strong> /in/yourprofile</p>
    `;
  }

  panel.classList.remove('hidden');
}

// ANIMATE LOOP
function animate() {
  requestAnimationFrame(animate);

  // Animate objects
  box1.rotation.x += 0.01;
  box2.rotation.y += 0.01;
  box3.rotation.z += 0.01;
  platform.position.y = Math.sin(Date.now() * 0.001) * 0.2;

  // Camera logic
  if (cameraTargetPosition) {
    // Lerp to target
    camera.position.lerp(cameraTargetPosition, 0.08);

    if (camera.position.distanceTo(cameraTargetPosition) < 0.05) {
      camera.position.copy(cameraTargetPosition);
      cameraTargetPosition = null;
      
      // Look at active box
      const lookAtTarget = activeSection === 'projects' ? box1.position :
                         activeSection === 'about' ? box2.position :
                         activeSection === 'contact' ? box3.position :
                         new THREE.Vector3(0, 0, -10);
      
      camera.lookAt(lookAtTarget);
      
      // Show panel
      showSectionPanel(activeSection);
    }
  } else if (!isFocused) {
    // Normal mouse drift
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, -10);
  } else {
    // Stay focused on active box (no drift)
    const lookAtTarget = activeSection === 'projects' ? box1.position :
                        activeSection === 'about' ? box2.position :
                        activeSection === 'contact' ? box3.position :
                        new THREE.Vector3(0, 0, -10);
    camera.lookAt(lookAtTarget);
  }

  renderer.render(scene, camera);
}

animate();
