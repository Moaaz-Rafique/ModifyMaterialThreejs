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

let selectedMesh = null;

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
const colorsDiv = document.querySelector("#colors");

const loader = new GLTFLoader(loadingManager);
loader.manager = loadingManager;
loader.load("./models/sampleModel/scene.gltf", function (gltf) {
  const model = gltf.scene;

  scene.add(model);

  let objectsHover = [];

  colorsDiv.innerHTML = "";
  model.traverse((child) => {
    if (child.children.length === 0) {
      // Add only objects widthout children
      if (child.material) {
        child.material = child.material.clone();
        child.userData.initialEmissive = child.material.emissive.clone();
        child.material.emissiveIntensity = 0.5;
      }
      objectsHover.push(child);
      // colorsDiv.innerHTML += `<input type="color" id="${child?.name}" class="color" name="${child?.name}" value="#f6b73c">
      //                         <label for="${child?.name}">${child?.name}</label>`;
      colorsDiv.innerHTML+=`<button class="color" > kill me${objectsHover.length} <button>`
      try {
        const colorWells = document.querySelectorAll(`.color`);
        colorWells.forEach((colorWell, i) => {
          // console.log( objectsHover.length == i+1, child.name)
          if (objectsHover.length != i+1)return
          console.log( objectsHover.length == i+1, child.name)
          colorWell.addEventListener(
            "click",
            (event) => {
              console.log(child.name)
              return
              selectedMesh = child;
              try {
                // console.log(event.target.value)
                let currentColor = event.target.value;
                // console.log(selectedMesh.material.color )
                selectedMesh.material.color.set(currentColor) ||
                  console.log("Failed to set hex");
                // selectedMesh.object.material.colorsNeedUpdate = true;
              } catch (e) {
                console.log(e);
              }
            },
            false
          );
          colorWell.addEventListener(
            "change",
            (event) => {
              console.log(event.target.value);
            },
            false
          );
        });
      } catch (e) {
        console.log(e);
      }
      // interactionManager.add(child);
      //   /*

      // child.addEventListener("mouseover", (event) => {
      //   console.log(event);
      //   // event.stopPropagation();
      //   if (!objectsHover.includes(event.target))
      //     objectsHover.push(event.target);

      //   document.body.style.cursor = "pointer";

      //   const path = getPath(event.target);
      //   logDiv.innerHTML =
      //     '<span style="color: #ff0000">' + path + " – mouseover</span>";

      //   // if (child.material) {
      //   //   child.userData.materialEmissiveHex = child.material.emissive.getHex();
      //   //   child.material.emissive.setHex(0xff0000);
      //   //   child.material.emissiveIntensity = 0.5;
      //   // }
      // });

      // child.addEventListener("mouseout", (event) => {
      //   console.log(event);
      //   // event.stopPropagation();

      //   objectsHover = objectsHover.filter((n) => n !== event.target);
      //   if (objectsHover.length > 0) {
      //     const o = objectsHover[objectsHover.length - 1];
      //     o.material.emissive.setHex(0xff0000);
      //     logDiv.innerHTML = getPath(o);
      //   } else {
      //     logDiv.innerHTML = "";
      //   }

      //   document.body.style.cursor = "default";

      // if (child.material) {
      //   child.material.emissive.setHex(child.userData.materialEmissiveHex);
      // }
      // });

      // child.addEventListener("mousedown", (event) => {
      //   console.log(event);
      //   console.log(event.target.name);
      //   event.stopPropagation();
      //   selectedMesh = child;
      //   if (child.material) {
      //     child.material.emissive.setHex(0x0000ff);
      //   }

      //   const path = getPath(event.target);
      //   logDiv.innerHTML =
      //     '<span style="color: #0000ff">' + path + " – mousedown</span>";
      //   selectedDiv.innerHTML =
      //     '<span style="color: #00ff00">' + path + " – mousedown</span>";
      // });
      //   */
    }
  });
});

let selectedColor = 0x0000ff;

const onColorChange = () => {
  try {
    selectedMesh?.object?.material?.setHex(selectedColor);
    selectedMesh.object.material.colorsNeedUpdate = true;
  } catch (e) {
    console.log(e);
  }
};

const animate = (time) => {
  requestAnimationFrame(animate);

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
