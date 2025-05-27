import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export function getMatrixToA (meshA,meshB) {
    meshA.updateMatrixWorld(true);
    meshB.updateMatrixWorld(true);
    const matrixToA = new THREE.Matrix4()
        .copy(meshA.matrixWorld)
        .invert()
        .multiply(meshB.matrixWorld);
    return matrixToA;
}


export function computeMergedGeometry (mesh) {
    const geometries = [];
    mesh.traverse(function (child) {
    if (child.isMesh) {
        const clonedGeo = child.geometry.clone(true);

        //child.updateMatrixWorld(true);
        clonedGeo.applyMatrix4(child.matrix);

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
    return BufferGeometryUtils.mergeGeometries(geometries,false);
}


export function getPointsBuffer (geometry) {
    const points = [];
    const posAttr = geometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
    points.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
    }
    return points;
}