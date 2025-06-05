import * as THREE from "three";
import { GJK } from "./algorithm/GJK.js";
import { EPA } from "./algorithm/EPA.js";
import { visualizeContact } from "../../renderer/Helpers.js";


export function getContact(A, B) {
  if (!earlyTest(A,B)) return null;

  const simplex = GJK(A,B);
  if (simplex) {
    const contact = EPA(simplex,A,B);
    if (contact) visualizeContact(contact);
    return contact
  }

  return null;
}


function earlyTest(A, B) {
  const sa = new THREE.Sphere().setFromPoints(A.collider).applyMatrix4(A.representation.matrixWorld);
  const sb = new THREE.Sphere().setFromPoints(B.collider).applyMatrix4(B.representation.matrixWorld);
  return sa.intersectsSphere(sb);
}