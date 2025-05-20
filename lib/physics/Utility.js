import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export function mergeGeometries (mesh) {
  const geometries = [];

    mesh.traverse(function (child) {
    if (child.isMesh) {
        child.updateMatrixWorld(true);
        const clonedGeo = child.geometry.clone();
        clonedGeo.applyMatrix4(child.matrixWorld);
        clonedGeo.deleteAttribute('tangent');
        geometries.push(clonedGeo);
    }
    });

    return BufferGeometryUtils.mergeGeometries(geometries, true);
}


export function getPointsBuffer (mesh) {
    const geometry = mergeGeometries(mesh);
    const points = [];
    const posAttr = geometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
    points.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
    }
    return points;
}


export function getMatrixToA (meshA , meshB) {
    meshA.updateMatrixWorld(true);
    meshB.updateMatrixWorld(true);
    const matrixToA = new THREE.Matrix4()
        .copy(meshA.matrixWorld)
        .invert()
        .multiply(meshB.matrixWorld);
    return matrixToA;
}