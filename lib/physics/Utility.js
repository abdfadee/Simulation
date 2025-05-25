import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export function getMatrixToA (meshB) {
    const meshA = this;
    meshA.updateMatrixWorld(true);
    meshB.updateMatrixWorld(true);
    const matrixToA = new THREE.Matrix4()
        .copy(meshA.matrixWorld)
        .invert()
        .multiply(meshB.matrixWorld);
    return matrixToA;
}


export function getMergedGeometry () {
    const mesh = this;
    if (!mesh.mergedGeometries) computeMergedGeometry(mesh);
    return mesh.mergedGeometries;
}


function computeMergedGeometry (mesh) {
    const geometries = [];
    mesh.traverse(function (child) {
    if (child.isMesh) {
        const clonedGeo = child.geometry.clone(true);

        // Strip all attributes except position and normal
        for (const name of Object.keys(clonedGeo.attributes)) {
            if (name !== 'position' && name !== 'normal') {
                clonedGeo.deleteAttribute(name);
            }
        }

        // Ensure normals are present (may be missing after strip)
        if (!clonedGeo.attributes.normal) {
            clonedGeo.computeVertexNormals();
        }

        geometries.push(clonedGeo);
    }
    });
    mesh.mergedGeometries = BufferGeometryUtils.mergeGeometries(geometries, true);
}


export function getPointsBuffer (geometry) {
    const points = [];
    const posAttr = geometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
    points.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
    }
    return points;
}


THREE.Object3D.prototype.getMatrixToA = getMatrixToA;
THREE.Object3D.prototype.getMergedGeometry = getMergedGeometry;