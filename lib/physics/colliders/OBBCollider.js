import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';


function generateMeshOBBColliders (mesh) {
    mesh.updateMatrix();

    const matrix = mesh.matrix.clone();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    matrix.decompose(pos, quat, scale);

    mesh.scale.set(1,1,1);
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0,0,0);

    mesh.traverse(function (child) {
        if (child.isMesh) {
            child.collider = computeLocalAABB(child);
        }
    });

    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    mesh.scale.copy(scale);
}


function computeLocalAABB (mesh) {
    mesh.updateMatrix();

    const matrix = mesh.matrix.clone();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    matrix.decompose(pos, quat, scale);

    mesh.scale.set(1,1,1);
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0,0,0);

    const obb = new OBB().fromBox3(new THREE.Box3().setFromObject(mesh,false));
    obb.applyMatrix4(matrix);

    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    mesh.scale.copy(scale);

    return obb;
}


function createOBBHelper(obb, color = 0xff0000) {
    const geometry = new THREE.BoxGeometry(
      obb.halfSize.x * 2,
      obb.halfSize.y * 2,
      obb.halfSize.z * 2
    );
  
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color });
    const wireframe = new THREE.LineSegments(edges, material);
  
    // Create a matrix from rotation and center
    const matrix = new THREE.Matrix4();
  
    // Convert 3x3 rotation matrix to 4x4
    const rotationMatrix = new THREE.Matrix4().setFromMatrix3(obb.rotation);
  
    // Set position
    matrix.makeTranslation(obb.center.x, obb.center.y, obb.center.z);
  
    // Combine rotation and translation
    wireframe.applyMatrix4(rotationMatrix);
    wireframe.applyMatrix4(matrix);
  
    return wireframe;
}


export {generateMeshOBBColliders,createOBBHelper}