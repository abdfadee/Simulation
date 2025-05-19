import * as THREE from 'three';

export function computeTimeOfImpact(bodyA, bodyB, deltaTime) {
    const start = bodyA.previousPosition;
    const end = bodyA.representation.position;

    const motion = new THREE.Vector3().subVectors(end, start);
    const motionLength = motion.length();

    if (motionLength < 1e-5) return null;

    const direction = motion.clone().normalize();
    const ray = new THREE.Ray(start.clone(), direction);

    // Transform ray into B’s local space
    const matrixToB = new THREE.Matrix4().copy(bodyB.representation.matrixWorld).invert();
    const localRay = ray.clone();
    localRay.origin.applyMatrix4(matrixToB);
    localRay.direction.transformDirection(matrixToB);

    // Perform raycast against B’s BVH
    const hit = bodyB.representation.collider.geometry.boundsTree.raycastFirst(localRay);

    if (!hit || hit.distance > motionLength) return null;

    const toi = hit.distance / motionLength;
    return {
        toi,
        contactPoint: hit.point.applyMatrix4(bodyB.representation.matrixWorld),
        hit
    };
}
