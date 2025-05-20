import * as THREE from "three";
import {
	computeBoundsTree, disposeBoundsTree,
	computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
	MeshBVH, MeshBVHHelper, SAH
} from 'three-mesh-bvh';
import {mergeGeometries} from "../Utility.js"
import {scene} from "../../renderer/Initialize.js";


export function generateBVH (mesh) {
    const mergedGeometry = mergeGeometries(mesh);
    mesh.boundsTree = new MeshBVH(mergedGeometry, {
        strategy: SAH,
        maxLeafTris: 1,
    });

    const helper = new MeshBVHHelper(mesh,10);
    helper.children[0].material.color.set(0xff0000);
    helper.children[0].material.transparent = true
    scene.add(helper);
}



// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
THREE.BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
THREE.BatchedMesh.prototype.raycast = acceleratedRaycast;