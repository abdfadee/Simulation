import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';


function generateMeshOOBColliders (mesh) {
    mesh.updateWorldMatrix(true);

    const worldMatrix = mesh.matrixWorld.clone();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    worldMatrix.decompose(pos, quat, scale);

    mesh.scale.set(1,1,1);
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0,0,0);

    mesh.traverse(function (child) {
        if (child.isMesh) {
            $calculateMeshOOBCollider(child);
        }
    });

    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    mesh.scale.copy(scale);
    //mesh.applyMatrix4(worldMatrix);
}


function $calculateMeshOOBCollider (mesh) {
    mesh.updateWorldMatrix(true);
    mesh.collider = new OBB().fromBox3(new THREE.Box3().setFromObject(mesh,false));
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

export {generateMeshOOBColliders,createOBBHelper}