import * as THREE from "three";
import {scene} from "../../renderer/Initialize";


function generateMeshSphereColliders (mesh) {
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
            child.updateWorldMatrix(true);
            child.geometry.computeBoundingSphere();
            const sphere = child.geometry.boundingSphere.clone();
            
            sphere.applyMatrix4(child.matrixWorld);
            sphere.applyMatrix4(matrix);
            
            const helper = new THREE.Mesh(
            new THREE.SphereGeometry(sphere.radius, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            );
            helper.position.copy(sphere.center);
            scene.add(helper);
        }
    });

    mesh.position.copy(pos);
    mesh.quaternion.copy(quat);
    mesh.scale.copy(scale);
    //mesh.applyMatrix4(worldMatrix);
}




function createSphereHelper(obb, color = 0xff0000) {
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

export {generateMeshSphereColliders,createSphereHelper}