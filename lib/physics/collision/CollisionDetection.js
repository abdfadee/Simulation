import * as THREE from "three";
import {ExtendedTriangle} from 'three-mesh-bvh';
import {getMatrixToA} from "../Utility.js";
import {scene} from "../../renderer/Initialize.js";


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

  const pointsA = getPointsFromGeometry(geomA);
  const pointsB = getPointsFromGeometry(geomB);

  const normalsA = getFaceNormals(geomA);
  const normalsB = getFaceNormals(geomB);

  const axes = normalsA.concat(normalsB);

  let minPenetration = Infinity;
  let bestAxis = null;

  for (let axis of axes) {
    const projA = projectPointsOntoAxis(pointsA, axis);
    const projB = projectPointsOntoAxis(pointsB, axis);

    if (!projectionsOverlap(projA, projB)) {
      return null; // No collision
    }

    const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
    if (overlap < minPenetration) {
      minPenetration = overlap;
      bestAxis = axis.clone();
      // Flip normal if B is "behind" A
      if (projB.max < projA.max) bestAxis.negate();
    }
  }

  // Estimate contact point: center of deepest points on both
  const centerA = getCentroid(pointsA);
  const centerB = getCentroid(pointsB);
  const contactPoint = centerA.clone().add(centerB).multiplyScalar(0.5);

  const contact = {
    contactPoint,
    contactNormal: bestAxis.clone(),
    penetrationDepth: minPenetration
  };

  visualizeContact(contact);
  return contact;
}

// Helpers:

function getPointsFromGeometry(geometry) {
  const pos = geometry.attributes.position;
  const points = [];
  for (let i = 0; i < pos.count; i++) {
    const point = new THREE.Vector3();
    point.fromBufferAttribute(pos, i);
    points.push(point);
  }
  return points;
}

function getFaceNormals(geometry) {
  const normals = [];
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();
    normals.push(normal);
  }
  return normals;
}

function projectPointsOntoAxis(points, axis) {
  let min = axis.dot(points[0]);
  let max = min;
  for (let i = 1; i < points.length; i++) {
    const d = axis.dot(points[i]);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

function projectionsOverlap(projA, projB) {
  return projA.max >= projB.min && projB.max >= projA.min;
}

function getCentroid(points) {
  const centroid = new THREE.Vector3();
  for (const p of points) centroid.add(p);
  return centroid.multiplyScalar(1 / points.length);
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