import * as THREE from "three";
import {scene} from "../../renderer/Initialize.js";
import { GJK } from "./algorithm/GJK.js";
import { EPA } from "./algorithm/EPA.js";


export function getContact(A, B) {
  A.representation.updateMatrixWorld(true);
  B.representation.updateMatrixWorld(true);

  const geomA = A.convex.clone().applyMatrix4(A.representation.matrixWorld);
  const geomB = B.convex.clone().applyMatrix4(B.representation.matrixWorld);
  
  const simplex = GJK(geomA,geomB);

  if (simplex) {
    const contact = EPA(simplex,geomA,geomB);
    visualizeContact(contact)
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