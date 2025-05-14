import * as THREE from "three";

function generateMeshAABBColliders (mesh) {
    mesh.updateMatrixWorld(true);
    mesh.traverse(function (child) {
        if (child.isMesh) {
        child.updateMatrixWorld(true,false);
        child.collider = new THREE.Box3().setFromObject(child,true);
        }
    });
}


function generateMeshSphereColliders (mesh) {
    mesh.updateMatrixWorld(true);
    mesh.traverse(function (child) {
        if (child.isMesh) {
            child.updateMatrixWorld(true);
            child.geometry.computeBoundingSphere();
            const sphere = child.geometry.boundingSphere.clone();
            sphere.applyMatrix4(child.matrixWorld);
            child.collider = sphere;
        }
    });
}

export {generateMeshAABBColliders,generateMeshSphereColliders}