import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';
import { computeMergedGeometry } from '../Utility';


export function computeBoxGeometry (object) {
    //object.updateMatrixWorld(true,true);
    const mergedGeometry = computeMergedGeometry(object);
    //mergedGeometry.applyMatrix4(object.matrixWorld);
    mergedGeometry.computeBoundingBox();
    const obb = new OBB().fromBox3(mergedGeometry.boundingBox);
    //obb.applyMatrix4(object.matrixWorld);
    //const obb = new OBB().fromBox3(new THREE.Box3().setFromObject(object));
    return obb;
}


export function createBoxHelper (obb) {
    const size = new THREE.Vector3();
    obb.getSize(size);

    const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const mesh = new THREE.Mesh(boxGeo, boxMat);

    mesh.position.copy(obb.center);
    mesh.rotation.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(obb.rotation));

    return mesh;
}