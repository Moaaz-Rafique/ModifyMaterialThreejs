import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { GLTFLoader } from "GLTFLoader";
import { RGBELoader } from "RGBELoader";

import { InteractionManager } from "./three.interactive.js";

const stats = new Stats();
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.dom.style.top = "auto";
stats.dom.style.bottom = "0";
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("container").appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0.1, 2.0, 10.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.minDistance = 0.1;
controls.maxDistance = 10000;
controls.target.set(0, 0, 0);
controls.update();

const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById("progress-bar");
if (progressBar) {
  loadingManager.onProgress = function (item, loaded, total) {
    // console.log((loaded / total) * 100 + "%");
    progressBar.style.width = (loaded / total) * 100 + "%";
  };

  loadingManager.onLoad = function () {
    progressBar.style.width = "100%";
    setTimeout(() => {
      progressBar.style.display = "none";
    }, 500);
  };
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const rgbeLoader = new RGBELoader();
rgbeLoader.load("textures/skybox_512px.hdr", (texture) => {
  let envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  texture.dispose();
});

rgbeLoader.manager = loadingManager;

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

const logDiv = document.querySelector("#title .log");
const selectedDiv = document.querySelector("#title .selected");
let vertices = [];
const size = 10;

const home = [
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    -.3,    -.3,    0,
    
]


for (let i = 0; i < 20; i++) {
  const x = (Math.random() * size + Math.random() * size) / 2 - size / 2;
  const y = (Math.random() * size + Math.random() * size) / 2 - size / 2;
  const z = (Math.random() * size + Math.random() * size) / 2 - size / 2;

  vertices.push(x, y, z);
}
var geometry = new THREE.BufferGeometry();
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);

let colors = [];

for (let i = 0; i < 20; i++) {
  const x = Math.random();
  const y = Math.random();
  const z = Math.random();

  colors.push(x, y, z);
}
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);
geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: .5,
//   color: 0,
  vertexColors: true,

});

const particles = new THREE.Points(geometry, material);
scene.add(particles);
const line = new THREE.Line(geometry, material);
scene.add(line);

// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const updateGeometry = () => {
  for (let i = 0; i < vertices.length; i += 1) {
    vertices[i] = vertices[i] + (Math.random() - 0.5) * 0.02;
    // vertices[i] = vertices[i]+(Math.random()-.5)*0.02
    // vertices[i] = vertices[i]+(Math.random()-.5)*0.02
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
};

const animate = (time) => {
  requestAnimationFrame(animate);

  updateGeometry();
  controls.update();

  interactionManager.update();

  renderer.render(scene, camera);

  stats.update();
};

animate();

window.addEventListener("resize", handleWindowResize, false);

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function getPath(object) {
  const string = object.name + " [" + object.type + "]";

  if (object.parent) {
    return getPath(object.parent) + " > " + string;
  } else {
    return string;
  }
}
