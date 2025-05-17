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

    // Optional: Positional correction to prevent sinking
    const percent = 0.2; // usually 20%
    const slop = 0.01;   // small penetration allowance
    const correctionMag = Math.max(contact.penetrationDepth - slop, 0) / (A.inverseMass + B.inverseMass) * percent;
    const correction = normal.clone().multiplyScalar(correctionMag);

    if (A.mass !== 0.0) A.representation.position.addScaledVector(correction, -A.inverseMass);
    if (B.mass !== 0.0) B.representation.position.addScaledVector(correction, B.inverseMass);
}