import * as THREE from 'three';

/**
 * Computes Time of Impact (TOI) between two moving RigidBodies.
 * Uses raycasting in both directions (A→B and B→A).
 * Returns the earliest TOI if collision occurs within deltaTime.
 *
 * @param {RigidBody} A
 * @param {RigidBody} B
 * @param {number} deltaTime
 * @returns {{ toiTime: number, from: 'AtoB' | 'BtoA' } | null}
 */
export function computeTOI(A, B, deltaTime) {
    const toiAtoB = raycastTOI(A, B, deltaTime, 'AtoB');
    const toiBtoA = raycastTOI(B, A, deltaTime, 'BtoA');

    if (!toiAtoB && !toiBtoA) return null;

    if (toiAtoB && toiBtoA) {
        return toiAtoB.toiTime < toiBtoA.toiTime ? toiAtoB : toiBtoA;
    }

    return toiAtoB || toiBtoA;
}

/**
 * Computes TOI from bodyA toward bodyB using relative velocity and raycast.
 *
 * @param {RigidBody} bodyA
 * @param {RigidBody} bodyB
 * @param {number} deltaTime
 * @param {'AtoB' | 'BtoA'} label
 * @returns {{ toiTime: number, from: 'AtoB' | 'BtoA' } | null}
 */
function raycastTOI(bodyA, bodyB, deltaTime, label) {
    if (bodyA.inverseMass === 0 && bodyB.inverseMass === 0) return null;

    const vA = bodyA.velocity.clone();
    const vB = bodyB.velocity.clone();
    const relativeVelocity = vA.clone().sub(vB);
    const movement = relativeVelocity.clone().multiplyScalar(deltaTime);

    if (movement.lengthSq() === 0) return null;

    const start = bodyA.prevPosition.clone();
    const end = start.clone().add(movement);
    const direction = end.clone().sub(start).normalize();
    const distance = start.distanceTo(end);

    const raycaster = new THREE.Raycaster(start, direction, 0, distance);

    const collider = bodyB.representation.collider;
    const hits = raycaster.intersectObject(collider, true);

    if (hits.length === 0) return null;

    const hit = hits[0];
    const toiTime = (hit.distance / distance) * deltaTime;

    if (toiTime < 0 || toiTime > deltaTime) return null;

    return { toiTime, from: label };
}
