import * as THREE from "three";
import {ExtendedTriangle} from 'three-mesh-bvh';
import {getMatrixToA} from "../Utility.js";
import RigidBody from "../RigidBody.js";
import {scene} from "../../renderer/Initialize.js";












function getContacts(body) {
  const meshA = this.representation;
  const meshB = body.representation;
  const matrixToA = getMatrixToA(meshA.collider, meshB.collider);

  const geomA = meshA.collider.geometry;
  const geomB = meshB.collider.geometry;

  const triA = new ExtendedTriangle();
  const triB = new ExtendedTriangle();

  let bestContact = null;
  let maxDepth = -Infinity;

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

          // Closest point pairs from B → A
          const pointsA = [triB.a, triB.b, triB.c].map(p => {
            const closest = new THREE.Vector3();
            triA.closestPointToPoint(p, closest);
            return { a: closest, b: p };
          });

          // Closest point pairs from A → B
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
            if (penetrationDepth <= maxDepth) continue;

            const contactPoint = pair.a.clone().add(pair.b).multiplyScalar(0.5).applyMatrix4(meshA.matrixWorld);

            // Compute better normal
            const triANormal = triA.getNormal(new THREE.Vector3());
            const triBNormal = triB.getNormal(new THREE.Vector3());

            // Use A's normal if penetration goes "into" A, otherwise flip B's normal
            let contactNormal = triANormal.dot(pair.b.clone().sub(pair.a)) < 0
              ? triANormal.clone()
              : triBNormal.clone().negate();

            const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshA.matrixWorld);
            contactNormal.applyMatrix3(normalMatrix).normalize();

            bestContact = {
              contactPoint,
              contactNormal,
              penetrationDepth
            };

            maxDepth = penetrationDepth;
          }

          return false;
        }
      });

      return false;
    }
  });

  if (bestContact) {
    visualizeContact(bestContact);
  }

  return bestContact;
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
        Math.max(penetrationDepth * 1.2, 0.5),
        0x00ff00 // green
      );
      contactGroup.add(normalLine);
  
    
    // Optionally, clear old ones first
    const old = scene.getObjectByName('ContactVisualization');
    if (old) scene.remove(old);
    
  
    contactGroup.name = 'ContactVisualization';
    scene.add(contactGroup);
}





THREE.Object3D.prototype.generateBVH = generateBVH;
RigidBody.prototype.getContacts = getContacts;