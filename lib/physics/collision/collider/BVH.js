import * as THREE from "three";
import {
	computeBoundsTree, disposeBoundsTree,
	computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
	MeshBVH, MeshBVHHelper, SAH
} from 'three-mesh-bvh';
import { scene } from "../../../renderer/Initialize";


// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
THREE.BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
THREE.BatchedMesh.prototype.raycast = acceleratedRaycast;


export function computeBVHCollider (geometry) {
    geometry.boundsTree = new MeshBVH(geometry, {
        strategy: SAH,
        maxLeafTris: 1,
    });
    return geometry;
}


export function createBVHHelper (body) {
    const bvh = body.bvh;

    body.representation.updateMatrixWorld(true);
    const worldMatrix = body.representation.matrixWorld;

    const mesh = new THREE.Mesh(
        bvh,
        new THREE.MeshBasicMaterial({visible: false})
    );
    mesh.applyMatrix4(worldMatrix)

    const helper = new MeshBVHHelper(mesh,10);
    helper.children[0].material.color.set(0xff0000);
    helper.children[0].material.transparent = true

    const helperGroup = scene.getObjectByName('HelperVisualization');
    helperGroup.add(helper);
}