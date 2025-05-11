import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";
import {scene} from "./Initialize.js";


const textureLoader = new THREE.TextureLoader();

// Ground
const floorGeometry = new THREE.PlaneGeometry(100,100,1000,1000);

const floorAlbedo = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Color.jpg");
const floorNormal = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_NormalGL.jpg");
const floorDisplacement = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Displacement.jpg");
const floorRoughness = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Roughness.jpg");
const floorAo = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_AmbientOcclusion.jpg");
floorAlbedo.colorSpace = THREE.SRGBColorSpace;

const textures = [floorAlbedo,floorNormal,floorDisplacement,floorRoughness,floorAo];
textures.forEach((e) => {
e.wrapS = THREE.RepeatWrapping;
e.wrapT = THREE.RepeatWrapping; 
e.repeat.set(30, 30);
});

const floorMaterial = new THREE.MeshPhysicalMaterial({
map: floorAlbedo,
normalMap: floorNormal,
displacementMap: floorDisplacement,
displacementScale: 0.2,
roughnessMap: floorRoughness,
aoMap: floorAo
});

const floor = new THREE.Mesh(floorGeometry,floorMaterial);
floor.rotateX(MathUtils.degToRad(-90.0));
floor.receiveShadow = true;
scene.add(floor);