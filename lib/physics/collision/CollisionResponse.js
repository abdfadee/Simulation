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
    if (A.mass !== 0.0) A.addImpulse(impulse.clone().negate());
    if (B.mass !== 0.0) B.addImpulse(impulse);
}


export function applyPositionalCorrection(A, B, contact) {
    const totalInvMass = A.inverseMass + B.inverseMass;
    if (totalInvMass === 0) return;

    // Industry-standard parameters
    const allowedPenetration = 0.01; // tolerance slop
    const correctionPercent = 0.2;   // strong correction (80%)

    // Only correct if depth exceeds slop
    const depth = contact.penetrationDepth - allowedPenetration;
    if (depth <= 0) return;

    const correctionMagnitude = (depth / totalInvMass) * correctionPercent;
    const correction = contact.contactNormal.clone().multiplyScalar(correctionMagnitude);

    if (A.mass !== 0.0) A.representation.position.addScaledVector(correction, -A.inverseMass);
    if (B.mass !== 0.0) B.representation.position.addScaledVector(correction, B.inverseMass);
}