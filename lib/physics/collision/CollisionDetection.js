import * as THREE from "three";
import {ExtendedTriangle} from 'three-mesh-bvh';
import {getMatrixToA} from "../Utility.js";
import {scene} from "../../renderer/Initialize.js";
import { GJK } from "../../algorithm/GJK.js";
import { EPA } from "../../algorithm/EPA.js";
import { visualizeSimplex } from "../../algorithm/SimplexHelper.js";


export function getContacts(A, B) {
  const aType = A.colliderType;
  const bType = B.colliderType;

  const pair = `${aType}_${bType}`;
  const flippedPair = `${bType}_${aType}`;
  
  switch (pair) {
    case "bvh_bvh":
      return getBVHContact(A, B);

    case "convex_convex":
      return getConvexContact(A, B);

    case "bvh_convex":
      return getBVHBoxContact(A, B);
  }

  // Handle flipped cases
  switch (flippedPair) {
    case "convex_bvh": {
      const contacts = getBVHSphereContact(B, A);
      contacts.forEach(contact => contact.contactNormal.negate());
      return contacts;
    }
  }

  console.warn(`No collision handler for ${pair}`);
  return null;
}




/* BVH */
function getBVHContact(A, B) {
  const meshA = A.representation;
  const meshB = B.representation;
  const matrixToA = getMatrixToA(meshA,meshB);

  const geomA = A.bvh;
  const geomB = B.bvh;

  const triA = new ExtendedTriangle();
  const triB = new ExtendedTriangle();

  const contacts = [];

  geomB.boundsTree.shapecast({
    intersectsBounds: (box) => geomA.boundsTree.intersectsBox(box, matrixToA),

    intersectsTriangle: (triangleB) => {
      triB.copy(triangleB);
      triB.a.applyMatrix4(matrixToA);
      triB.b.applyMatrix4(matrixToA);
      triB.c.applyMatrix4(matrixToA);

      geomA.boundsTree.shapecast({
        intersectsBounds: (box) => triB.intersectsBox(box),

        intersectsTriangle: (triangleA) => {
          triA.copy(triangleA);

          if (!triA.intersectsTriangle(triB)) return false;

          const pointsA = [triB.a, triB.b, triB.c].map(p => {
            const closest = new THREE.Vector3();
            triA.closestPointToPoint(p, closest);
            return { a: closest, b: p };
          });

          const pointsB = [triA.a, triA.b, triA.c].map(p => {
            const closest = new THREE.Vector3();
            triB.closestPointToPoint(p, closest);
            return { a: p, b: closest };
          });

          const allPairs = pointsA.concat(pointsB);

          for (const pair of allPairs) {
            const distSq = pair.a.distanceToSquared(pair.b);
            if (distSq < 1e-8) continue;

            const penetrationDepth = Math.sqrt(distSq);
            const contactPoint = pair.a.clone().add(pair.b).multiplyScalar(0.5).applyMatrix4(meshA.matrixWorld);

            const triANormal = triA.getNormal(new THREE.Vector3());
            const triBNormal = triB.getNormal(new THREE.Vector3());

            let contactNormal = triANormal.dot(pair.b.clone().sub(pair.a)) < 0
              ? triANormal.clone()
              : triBNormal.clone().negate();

            const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshA.matrixWorld);
            contactNormal.applyMatrix3(normalMatrix).normalize();

            contacts.push({
              contactPoint,
              contactNormal,
              penetrationDepth
            });
          }

          return false;
        }
      });

      return false;
    }
  });

  // Sort by penetration depth (descending), and return up to 4
  contacts.sort((a, b) => b.penetrationDepth - a.penetrationDepth);
  const bestContacts = contacts.slice(0, 4);

  bestContacts.forEach((e) => {visualizeContact(e)});
  return bestContacts;
}


/* Convex */
function getConvexContact(A, B) {
  A.representation.updateMatrixWorld(true);
  B.representation.updateMatrixWorld(true);

  const geomA = A.convex.clone().applyMatrix4(A.representation.matrixWorld);
  const geomB = B.convex.clone().applyMatrix4(B.representation.matrixWorld);
  

  const simplex = GJK(geomA,geomB);

  if (simplex) {
    //visualizeSimplex(simplex);
}

  if (simplex) {
    const contact = EPA(simplex,geomA,geomB);
    //visualizeContact(contact)
    return contact
  }

  return null;
}


  /*
  const contact = {
    contactPoint,
    contactNormal,
    penetrationDepth
  }
  */







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