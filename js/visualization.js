// js/visualization.js

export let stickFigure;

export function initThreeJS() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff);
  document.body.appendChild(renderer.domElement);

  stickFigure = createStickFigure();
  scene.add(stickFigure);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

function createStickFigure() {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });

  // Define geometry for the head and limbs.
  const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const headMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const headMesh = new THREE.Mesh(headGeometry, headMaterial);
  headMesh.position.set(0, 1, 0);

  const neck = new THREE.Vector3(0, 0.5, 0);
  const torso = new THREE.Vector3(0, 0, 0);
  const leftLegEnd = new THREE.Vector3(-0.5, -1, 0);
  const rightLegEnd = new THREE.Vector3(0.5, -1, 0);
  const leftArmStart = new THREE.Vector3(-0.5, 0.5, 0);
  const leftArmEnd = new THREE.Vector3(-1, 0, 0);
  const rightArmStart = new THREE.Vector3(0.5, 0.5, 0);
  const rightArmEnd = new THREE.Vector3(1, 0, 0);

  const headLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, 0), neck]), material);
  const torsoLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([neck, torso]), material);
  const leftLeg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([torso, leftLegEnd]), material);
  const rightLeg = new THREE.Line(new THREE.BufferGeometry().setFromPoints([torso, rightLegEnd]), material);
  const leftArm = new THREE.Line(new THREE.BufferGeometry().setFromPoints([leftArmStart, leftArmEnd]), material);
  const rightArm = new THREE.Line(new THREE.BufferGeometry().setFromPoints([rightArmStart, rightArmEnd]), material);

  const stickFigureGroup = new THREE.Group();
  stickFigureGroup.add(headMesh);
  stickFigureGroup.add(headLine);
  stickFigureGroup.add(torsoLine);
  stickFigureGroup.add(leftLeg);
  stickFigureGroup.add(rightLeg);
  stickFigureGroup.add(leftArm);
  stickFigureGroup.add(rightArm);

  // Store references for animation.
  stickFigureGroup.leftLeg = leftLeg;
  stickFigureGroup.rightLeg = rightLeg;
  return stickFigureGroup;
}

// Listen for kick events dispatched from the WebRTC module.
export function setupKickListener() {
  document.addEventListener('kickEvent', e => {
    simulateKick(e.detail);
  });
}

function simulateKick(direction) {
  const kickRotation = Math.PI / 2;
  if (direction === "left_kick") {
    stickFigure.leftLeg.rotation.x = kickRotation;
  } else if (direction === "right_kick") {
    stickFigure.rightLeg.rotation.x = -kickRotation;
  }
  setTimeout(() => {
    stickFigure.leftLeg.rotation.x = 0;
    stickFigure.rightLeg.rotation.x = 0;
  }, 300);
}
