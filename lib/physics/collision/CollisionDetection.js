import * as THREE from "three";
import {ExtendedTriangle} from 'three-mesh-bvh';
import {getMatrixToA} from "../Utility.js";
import RigidBody from "../RigidBody.js";
import {scene} from "../../renderer/Initialize.js";



export function getContacts(A, B) {
  const aType = A.colliderType;
  const bType = B.colliderType;

  const pair = `${aType}_${bType}`;
  const flippedPair = `${bType}_${aType}`;
  
  switch (pair) {
    case "bvh_bvh":
      return getBVHContact(A, B);

    case "bvh_sphere":
      return getBVHSphereContact(A, B);

    case "bvh_box":
      return getBVHBoxContact(A, B);

    case "sphere_sphere":
      return getSphereContact(A, B);

    case "sphere_box":
      return getSphereBoxContact(A, B);

    case "box_box":
      return getBoxContact(A, B);
  }

  // Handle flipped cases
  switch (flippedPair) {
    case "bvh_sphere": {
      const contact = getBVHSphereContact(B, A);
      if (contact) contact.contactNormal.negate();
      return contact;
    }

    case "bvh_box": {
      const contact = getBVHBoxContact(B, A);
      if (contact) contact.contactNormal.negate();
      return contact;
    }

    case "sphere_box": {
      const contact = getSphereBoxContact(B, A);
      if (contact) contact.contactNormal.negate();
      return contact;
    }
  }

  console.warn(`No collision handler for ${pair}`);
  return null;
}



function getBVHContact(A,B) {
  const meshA = A.representation;
  const meshB = B.representation;
  const matrixToA = meshA.getMatrixToA(meshB);

  const geomA = meshA.bvh;
  const geomB = meshB.bvh;

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



function getBVHSphereContact(A, B) {
  const meshA = A.representation;
  const meshB = B.representation;
  const matrixToA = meshA.getMatrixToA(meshB);
  const sphere = B.representation.sphere.clone();
  sphere.applyMatrix4(matrixToA); // Move sphere to meshA's local space

  let closestPoint = new THREE.Vector3();
  let minDistSq = Infinity;
  let bestContact = null;

  meshA.bvh.boundsTree.shapecast({
    intersectsBounds: box => box.distanceToPoint(sphere.center) <= sphere.radius,
    intersectsTriangle: tri => {
      const triangle = new ExtendedTriangle().copy(tri);
      const pt = new THREE.Vector3();
      triangle.closestPointToPoint(sphere.center, pt);

      const distSq = pt.distanceToSquared(sphere.center);
      if (distSq < sphere.radius * sphere.radius && distSq < minDistSq) {
        minDistSq = distSq;

        const contactNormal = new THREE.Vector3().subVectors(sphere.center, pt).normalize();
        const penetrationDepth = sphere.radius - Math.sqrt(distSq);

        // Convert point and normal back to world space
        const contactPoint = pt.clone().applyMatrix4(meshA.matrixWorld);
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshA.matrixWorld);
        const worldNormal = contactNormal.clone().applyMatrix3(normalMatrix).normalize();

        bestContact = {
          contactPoint,
          contactNormal: worldNormal,
          penetrationDepth
        };
      }
    }
  });

  if (bestContact) visualizeContact(bestContact);
  return bestContact;
}



function getBVHBoxContact(A, B) {
  const meshA = A.representation;
  const meshB = B.representation;

  // Transform B's box into A's local space
  let matrixToA = meshA.getMatrixToA(meshB);
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  matrixToA.decompose(pos, new THREE.Quaternion(), scale);
  matrixToA = new THREE.Matrix4().compose(pos, new THREE.Quaternion(), scale);

  const box = B.representation.box.clone();
  box.applyMatrix4(matrixToA); // Box is now in A's local space

  let bestContact = null;
  let minDistSq = Infinity;

  const tri = new ExtendedTriangle();
  const ptOnTri = new THREE.Vector3();
  const ptOnBox = new THREE.Vector3();

  meshA.bvh.boundsTree.shapecast({
    intersectsBounds: boundsBox => boundsBox.intersectsBox(box),

    intersectsTriangle: triIn => {
      tri.copy(triIn);

      // Triangle midpoint as proxy
      const triCenter = tri.getMidpoint(new THREE.Vector3());

      // Clamp triangle center to box to get point on box
      const clampedToBox = box.clampPoint(triCenter, ptOnBox);

      // Closest point on triangle to that point
      tri.closestPointToPoint(ptOnBox, ptOnTri);

      const distSq = ptOnBox.distanceToSquared(ptOnTri);
      if (distSq > 1e-8 && distSq < minDistSq) {
        minDistSq = distSq;

        const penetrationDepth = Math.sqrt(distSq);
        const contactNormal = ptOnBox.clone().sub(ptOnTri).normalize();

        const contactPointLocal = ptOnTri.clone();
        const contactPointWorld = contactPointLocal.applyMatrix4(meshA.matrixWorld);

        const normalMatrix = new THREE.Matrix3().getNormalMatrix(meshA.matrixWorld);
        const worldNormal = contactNormal.clone().applyMatrix3(normalMatrix).normalize();

        bestContact = {
          contactPoint: contactPointWorld,
          contactNormal: worldNormal,
          penetrationDepth
        };
      }
    }
  });

  if (bestContact) visualizeContact(bestContact);
  return bestContact;
}




function getSphereContact(A, B) {
  const a = A.representation.sphere;
  const b = B.representation.sphere;

  const posA = a.center.clone().applyMatrix4(A.representation.matrixWorld);
  const posB = b.center.clone().applyMatrix4(B.representation.matrixWorld);

  const delta = new THREE.Vector3().subVectors(posB, posA);
  const dist = delta.length();
  const penetration = a.radius + b.radius - dist;

  if (penetration > 0) {
    const contactNormal = delta.normalize();
    const contactPoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);

    const contact = {
      contactPoint,
      contactNormal,
      penetrationDepth: penetration
    };

    visualizeContact(contact);
    return contact;
  }

  return null;
}



function getSphereBoxContact(A, B) {
  const sphere = A.representation.sphere.clone();
  sphere.center.applyMatrix4(A.representation.matrixWorld);

  const box = B.representation.box.clone(); // Box3
  box.applyMatrix4(B.representation.matrixWorld);

  const closestPoint = sphere.center.clone().clamp(box.min, box.max);
  const distSq = closestPoint.distanceToSquared(sphere.center);

  if (distSq < sphere.radius * sphere.radius) {
    const dist = Math.sqrt(distSq);
    const penetrationDepth = sphere.radius - dist;
    const contactNormal = new THREE.Vector3().subVectors(sphere.center, closestPoint).normalize();

    const contact = {
      contactPoint: closestPoint,
      contactNormal,
      penetrationDepth
    };

    visualizeContact(contact);
    return contact;
  }

  return null;
}



function getBoxContact(A, B) {
  const boxA = A.representation.box.clone().applyMatrix4(A.representation.matrixWorld);
  const boxB = B.representation.box.clone().applyMatrix4(B.representation.matrixWorld);

  if (!boxA.intersectsBox(boxB)) return null;

  const overlap = new THREE.Vector3(
    Math.min(boxA.max.x, boxB.max.x) - Math.max(boxA.min.x, boxB.min.x),
    Math.min(boxA.max.y, boxB.max.y) - Math.max(boxA.min.y, boxB.min.y),
    Math.min(boxA.max.z, boxB.max.z) - Math.max(boxA.min.z, boxB.min.z)
  );

  const axis = ['x', 'y', 'z'].reduce((minAxis, key) =>
    overlap[key] < overlap[minAxis] ? key : minAxis, 'x'
  );

  const contactNormal = new THREE.Vector3();
  contactNormal[axis] = boxA.getCenter(new THREE.Vector3())[axis] < boxB.getCenter(new THREE.Vector3())[axis] ? -1 : 1;

  const contactPoint = boxA.getCenter(new THREE.Vector3()).add(boxB.getCenter(new THREE.Vector3())).multiplyScalar(0.5);
  const contact = {
    contactPoint,
    contactNormal,
    penetrationDepth: overlap[axis]
  };

  visualizeContact(contact);
  return contact;
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