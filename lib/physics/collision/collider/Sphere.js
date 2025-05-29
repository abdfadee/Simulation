import * as THREE from "three";
import { scene } from "../../../renderer/Initialize";


export function computeSphereCollider (geometry) {
    geometry.computeBoundingSphere();
    return geometry.boundingSphere;
}


export function createSphereHelper (body) {
    const sphere = body.sphere.clone();

    body.representation.updateMatrixWorld(true);
    const worldMatrix = body.representation.matrixWorld;

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(sphere.radius),
        new THREE.MeshBasicMaterial({wireframe: true})
    );
    mesh.applyMatrix4(worldMatrix)

    const helperGroup = scene.getObjectByName('HelperVisualization');
    helperGroup.add(mesh);
}