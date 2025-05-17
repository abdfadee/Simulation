import * as THREE from "three";
import {
	computeBoundsTree, disposeBoundsTree,
	computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
	MeshBVH, MeshBVHHelper, SAH , ExtendedTriangle
} from 'three-mesh-bvh';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import RigidBody from "./RigidBody.js";
import {scene} from "../renderer/Initialize.js";



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


function $getContacts(body,maxContacts = 4) {
    const meshA = this.representation;
    const meshB = body.representation;
    const matrixToA = $getGeometryToBVH(meshA.collider, meshB.collider);
  
    const geomA = meshA.collider.geometry;
    const geomB = meshB.collider.geometry;
  
    const triA = new ExtendedTriangle();
    const triB = new ExtendedTriangle();
  
    const contacts = [];

  geomB.boundsTree.shapecast({
    intersectsBounds: (box) => geomA.boundsTree.intersectsBox(box, matrixToA),

    intersectsTriangle: (triangleB, triangleIndexB) => {
      triB.copy(triangleB);
      triB.a.applyMatrix4(matrixToA);
      triB.b.applyMatrix4(matrixToA);
      triB.c.applyMatrix4(matrixToA);

      geomA.boundsTree.shapecast({
        intersectsBounds: (box) => triB.intersectsBox(box),
        intersectsTriangle: (triangleA, triangleIndexA) => {
          triA.copy(triangleA);

          if (!triA.intersectsTriangle(triB)) return false;

          // Closest points approach
          const pointsA = [triB.a, triB.b, triB.c].map(p => {
            const closest = new THREE.Vector3();
            triA.closestPointToPoint(p, closest);
            return { a: closest.clone(), b: p.clone() };
          });

          const pointsB = [triA.a, triA.b, triA.c].map(p => {
            const closest = new THREE.Vector3();
            triB.closestPointToPoint(p, closest);
            return { a: p.clone(), b: closest.clone() };
          });

          const allPairs = pointsA.concat(pointsB);

          for (const pair of allPairs) {
            const distSq = pair.a.distanceToSquared(pair.b);
            if (distSq < 1e-8) continue; // Skip noise

            const penetrationDepth = Math.sqrt(distSq);

            // Compute contact normal in world space
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshA.matrixWorld);
            const localNormal = pair.b.clone().sub(pair.a);
            const contactNormal = localNormal.applyMatrix3(normalMatrix).normalize();

            // Contact point in world space
            const contactPoint = pair.a.clone().add(pair.b).multiplyScalar(0.5).applyMatrix4(meshA.matrixWorld);

            // Filter duplicates: simple distance threshold from existing contacts
            const tooClose = contacts.some(c => c.contactPoint.distanceToSquared(contactPoint) < 1e-4);
            if (tooClose) continue;

            contacts.push({
              triangleAIndex: triangleIndexA,
              triangleBIndex: triangleIndexB,
              contactPoint,
              contactNormal,
              penetrationDepth
            });

            // Limit manifold size
            if (contacts.length >= maxContacts) return true; // stop shapecast early
          }

          return false;
        }
      });

      return false;
    }
  });

  // Optionally prune to best contacts (e.g., sort by penetrationDepth descending)
  contacts.sort((a, b) => b.penetrationDepth - a.penetrationDepth);

  for (let contact of contacts) {
    //$visualizeContact(scene, contact);
  }

  return contacts.slice(0, maxContacts);
}


function $visualizeContact(scene, contact, size = 0.02, color = 0xff0000) {
    const contactGroup = new THREE.Group();
  
    const { contactPoint, contactNormal, penetrationDepth } = contact;
  
      // Point Marker
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      sphere.position.copy(contactPoint);
      contactGroup.add(sphere);
  
      // Normal Line
      const normalLine = new THREE.ArrowHelper(
        contactNormal.negate(),
        contactPoint,
        Math.max(penetrationDepth * 1.2, 0.5),
        0x00ff00 // green
      );
      contactGroup.add(normalLine);
  
    /*
    // Optionally, clear old ones first
    const old = scene.getObjectByName('ContactVisualization');
    if (old) scene.remove(old);
    */
  
    contactGroup.name = 'ContactVisualization';
    scene.add(contactGroup);
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
RigidBody.prototype.getContacts = $getContacts;