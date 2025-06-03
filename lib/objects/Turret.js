import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";
import {modelLoader, scene} from "../renderer/Initialize";

const turretModel = await modelLoader.loadAsync('assets/model/turret/scene.gltf');
const turret = turretModel.scene;
turret.scale.set(0.01,0.01,0.01);
turret.position.set(0,0.45,0)
scene.add(turret);

let armature;
let head;

turret.traverse((child) => {
    if (child.isSkinnedMesh) {
        const skeleton = child.skeleton;
        armature = skeleton.bones.find(b => b.name === "turret_01") ?? armature;
        head = skeleton.bones.find(b => b.name === "head_02") ?? head;
    }
});

let headRotation = 0.0;
let armatureRotation = 0.0;
const headMaxRotation = 45.0;

armature.rotation.set(0,0,0);
head.rotation.set(MathUtils.degToRad(90.0),0,0);

// Create the arrow helper
const pivot = new THREE.Vector3(0, 2.4, 0);
const origin = new THREE.Vector3(0, 2.4, 0);
const point = new THREE.Vector3();
const direction = new THREE.Vector3(0, 0, 1);
const pointer = new THREE.Vector3();
const arrowHelper = new THREE.ArrowHelper(direction, origin, 1.5, 0xffff00);
scene.add(arrowHelper);

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            armatureRotation += 5;
            break;
        case 'ArrowRight':
            armatureRotation -= 5;
            break;
        case 'ArrowUp':
            headRotation -= 1;
            break;
        case 'ArrowDown':
            headRotation += 1;
            break;
    }
    headRotation = MathUtils.clamp(headRotation, -headMaxRotation , headMaxRotation);

    armature.rotation.set(0,MathUtils.degToRad(armatureRotation),0);
    head.rotation.set(MathUtils.degToRad(90.0 + headRotation),0,0);
    
    point.copy(origin);
    point.sub(pivot);
    point.applyAxisAngle(new THREE.Vector3(1,0,0), MathUtils.degToRad(headRotation));
    point.add(pivot);

    pointer.copy(direction);
    pointer.applyAxisAngle(new THREE.Vector3(1,0,0), MathUtils.degToRad(headRotation));
    pointer.applyAxisAngle(new THREE.Vector3(0,1,0), MathUtils.degToRad(armatureRotation));

    arrowHelper.setDirection(pointer);
    arrowHelper.position.copy(point);
});