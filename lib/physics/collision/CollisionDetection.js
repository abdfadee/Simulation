import * as THREE from "three";
import {ExtendedTriangle} from 'three-mesh-bvh';
import {getMatrixToA} from "../Utility.js";
import {scene} from "../../renderer/Initialize.js";
import { GJK } from "./algorithm/GJK.js";
import { EPA } from "./algorithm/EPA.js";
import { getPointsBuffer } from "../Utility.js";


export function getContacts(A, B) {
  const aType = A.colliderType;
  const bType = B.colliderType;

  const pair = `${aType}_${bType}`;
  const flippedPair = `${bType}_${aType}`;
  
  switch (pair) {
    case "convex_convex":
      return getConvexContact(A, B);

    case "bvh_convex":
      return getBVHConvexContact(A, B);
  }

  // Handle flipped cases
  switch (flippedPair) {
    case "convex_bvh": {
      const contact = getBVHConvexContact(B, A);
      contact.contactNormal.negate()
      return contact;
    }
  }

  console.warn(`No collision handler for ${pair}`);
  return null;
}




/* BVH */
function getBVHConvexContact(A, B) {
  A.representation.updateMatrixWorld(true);
  B.representation.updateMatrixWorld(true);

  const meshA = A.representation;
  const meshB = B.representation;

  const bvh = A.bvh.boundsTree;
  const convexGeom = B.convex;

  const convexWorld = convexGeom.clone().applyMatrix4(meshB.matrixWorld);
  const convexBounds = new THREE.Box3().setFromBufferAttribute(convexWorld.getAttribute('position'));

  const triPoints = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const bestContact = { depth: -Infinity };

  bvh.shapecast({
    intersectsBounds: (box) => box.intersectsBox(convexBounds),
    intersectsTriangle: (tri) => {
      triPoints[0].copy(tri.a);
      triPoints[1].copy(tri.b);
      triPoints[2].copy(tri.c);

      // Convert triangle into a convex BufferGeometry
      const triangleGeom = new THREE.BufferGeometry().setFromPoints(triPoints).applyMatrix4(meshA.matrixWorld);
      triangleGeom.setIndex([0, 1, 2]);

      // Run GJK
      const simplex = GJK(triangleGeom, convexWorld);
      if (!simplex) return false;

      // Run EPA for contact info
      const contact = EPA(simplex, triangleGeom, convexWorld);
      if (contact && contact.penetrationDepth > bestContact.depth) {
        bestContact.contactPoint = contact.contactPoint;
        bestContact.contactNormal = contact.contactNormal;
        bestContact.penetrationDepth = contact.penetrationDepth;
        bestContact.depth = contact.penetrationDepth; // internal tracking
      }

      return false;
    }
  });

  if (bestContact.depth > 0) {
    visualizeContact(bestContact);
    return {
      contactPoint: bestContact.contactPoint,
      contactNormal: bestContact.contactNormal,
      penetrationDepth: bestContact.penetrationDepth
    };
  }

  return null;
}



/* Convex */
function getConvexContact(A, B) {
  A.representation.updateMatrixWorld(true);
  B.representation.updateMatrixWorld(true);

  const geomA = A.convex.clone().applyMatrix4(A.representation.matrixWorld);
  const geomB = B.convex.clone().applyMatrix4(B.representation.matrixWorld);
  
  const simplex = GJK(geomA,geomB);

  if (simplex) {
    const contact = EPA(simplex,geomA,geomB);
    visualizeContact(contact)
    console.log(contact);
    return contact
  }

  return null;
}




function visualizeContact(contact, size = 0.02, color = 0xff0000) {
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
        contactNormal,
        contactPoint,
        0.5,
        0x00ff00
      );
      contactGroup.add(normalLine);
  
    
    // Optionally, clear old ones first
    const old = scene.getObjectByName('ContactVisualization');
    if (old) scene.remove(old);
    
  
    contactGroup.name = 'ContactVisualization';
    scene.add(contactGroup);
}