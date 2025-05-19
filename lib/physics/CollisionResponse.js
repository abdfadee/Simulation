import * as THREE from "three";


export function resolveCollision(A, B, contact) {
    const normal = contact.contactNormal;
    const pA = contact.contactPoint;

    const relVel = new THREE.Vector3().subVectors(B.velocity, A.velocity);
    const contactVel = relVel.dot(normal);

    // Only resolve if moving toward each other
    if (contactVel > 0) return;

    const restitution = Math.min(A.restitution, B.restitution);
    const impulseMag = -(1 + restitution) * contactVel / (A.inverseMass + B.inverseMass);

    const impulse = normal.clone().multiplyScalar(impulseMag);

    // Apply impulse
    if (A.mass !== 0.0) A.velocity.addScaledVector(impulse, -A.inverseMass);
    if (B.mass !== 0.0) B.velocity.addScaledVector(impulse, B.inverseMass);
}


export function applyPositionalCorrection(A, B, contact) {
    const slop = 0.01;
    const percent = 0.1; // more aggressive than Baumgarte

    const depth = Math.max(contact.penetrationDepth - slop, 0);
    if (depth <= 0) return;

    const correction = contact.contactNormal.clone()
        .multiplyScalar(depth / (A.inverseMass + B.inverseMass) * percent);

    if (A.mass !== 0.0) A.representation.position.addScaledVector(correction, -A.inverseMass);
    if (B.mass !== 0.0) B.representation.position.addScaledVector(correction, B.inverseMass);
}