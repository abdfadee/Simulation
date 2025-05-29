import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';
import { computeMergedGeometry } from '../Utility';
import { scene } from "../../../renderer/Initialize";


export function computeBoxGeometry (object) {
    const mergedGeometry = computeMergedGeometry(object);
    mergedGeometry.computeBoundingBox();
    const obb = new OBB().fromBox3(mergedGeometry.boundingBox);
    //obb.center.set(0,0,0);
    return obb;
}


export function createBoxHelper (body) {
    const obb = body.box.clone();

    body.representation.updateMatrixWorld(true);
    const worldMatrix = body.representation.matrixWorld;

    const size = new THREE.Vector3();
    obb.getSize(size);

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const mesh = new THREE.Mesh(boxGeo, boxMat);

    mesh.scale.copy(size);
    mesh.position.copy(obb.center);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(obb.rotation));

    /* Method 2 */
    mesh.applyMatrix4(worldMatrix)

    const helperGroup = scene.getObjectByName('HelperVisualization');
    helperGroup.add(mesh);
}