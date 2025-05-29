import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';
import { scene } from "../../../renderer/Initialize";


export function computeBoxCollider (geometry) {
    geometry.computeBoundingBox();
    return new OBB().fromBox3(geometry.boundingBox);
}


export function createBoxHelper (body) {
    const obb = body.box.clone();

    body.representation.updateMatrixWorld(true);
    const worldMatrix = body.representation.matrixWorld;

    const size = new THREE.Vector3();
    obb.getSize(size);

    const boxGeo = new THREE.BoxGeometry(size.x, size.y , size.z);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const mesh = new THREE.Mesh(boxGeo, boxMat);

    mesh.position.copy(obb.center);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(obb.rotation));

    mesh.applyMatrix4(worldMatrix)

    const helperGroup = scene.getObjectByName('HelperVisualization');
    helperGroup.add(mesh);
}