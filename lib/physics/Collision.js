import * as THREE from "three";
import {
	computeBoundsTree, disposeBoundsTree,
	computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
	MeshBVH, MeshBVHHelper, SAH , ExtendedTriangle
} from 'three-mesh-bvh';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import RigidBody from "./RigidBody.js";
import {scene} from "../renderer/Initialize";



function $generateCollisionMesh () {
	const mesh = this;
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

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
        strategy: SAH,
        maxLeafTris: 1,
    });

    const mergedMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ wireframe: true,visible:false }));
    mesh.collider = mergedMesh;

    const helper = new MeshBVHHelper(mergedMesh,10);
    helper.children[0].material.color.set(0xff0000);
    helper.children[0].material.transparent = true
    //scene.add(helper);
}


function $getGeometryToBVH (meshA , meshB) {
    meshA.updateMatrixWorld(true);
    meshB.updateMatrixWorld(true);
    const matrixToA = new THREE.Matrix4()
        .copy(meshA.matrixWorld)
        .invert()
        .multiply(meshB.matrixWorld);
    return matrixToA;
}


export function getContact (bodyA , bodyB) {
	const meshA = bodyA.representation;
	const meshB = bodyB.representation;
	const matrixToA = $getGeometryToBVH(meshA.collider,meshB.collider);

    const geomA = meshA.collider.geometry;
    const geomB = meshB.collider.geometry;

     // Helper function to get triangle from geometry's attributes and index
  function getTriangle(geometry, index, targetTriangle) {
    const posAttr = geometry.attributes.position;
    const i0 = geometry.index.getX(index * 3);
    const i1 = geometry.index.getX(index * 3 + 1);
    const i2 = geometry.index.getX(index * 3 + 2);

    targetTriangle.a.fromBufferAttribute(posAttr, i0);
    targetTriangle.b.fromBufferAttribute(posAttr, i1);
    targetTriangle.c.fromBufferAttribute(posAttr, i2);
  }

  let contactFound = false;

  // Cache triangle objects to avoid creating new ones each time
  const triA = new ExtendedTriangle();
  const triB = new ExtendedTriangle();

  geomB.boundsTree.shapecast({
    intersectsBounds: (box, isLeaf, score, depth, nodeIndex) => {
      return geomA.boundsTree.intersectsBox(box, matrixToA);
    },

    intersectsTriangle: (triangle, triangleIndex, contained, depth) => {
      // Get triangle B in world space
      triB.copy(triangle);

      // Transform triangle B into A's local space
      triB.a.applyMatrix4(matrixToA);
      triB.b.applyMatrix4(matrixToA);
      triB.c.applyMatrix4(matrixToA);

      // For each triangle in A that intersects bounds, check triangle-triangle
      geomA.boundsTree.shapecast({
        intersectsBounds: (box) => triB.intersectsBox(box),
        intersectsTriangle: (triangleA) => {
          triA.copy(triangleA);

          if (triA.intersectsTriangle(triB)) {
            contactFound = true;
            // Optionally, you can store contact info here or return immediately
            return true; // stop shapecast early
          }
          return false;
        },
      });

      return contactFound;
    },
  });

  return contactFound;
}



function $intersects (body) {
	const meshA = this.representation;
	const meshB = body.representation;
	const matrixToA = $getGeometryToBVH(meshA.collider,meshB.collider);

	// Use boundsTree from meshA to check against meshB's geometry
	const intersects = meshA.collider.geometry.boundsTree.intersectsGeometry(
		meshB.collider.geometry,
		matrixToA
	);

	return intersects;
}



// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
THREE.BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
THREE.BatchedMesh.prototype.raycast = acceleratedRaycast;

THREE.Object3D.prototype.generateCollisionMesh = $generateCollisionMesh;
RigidBody.prototype.intersects = $intersects;