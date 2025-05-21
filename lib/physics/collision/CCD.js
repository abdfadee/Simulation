import * as THREE from 'three';

export function sweptSphereCollision(A, B, steps = 10) {
    const meshA = A.representation;
    const meshB = B.representation;

    const matrixToA = meshA.getMatrixToA(meshB);
    const sphere = meshB.sphere.clone();
    sphere.applyMatrix4(matrixToA); // Move sphere to meshA's local space
    const start = B.prevPosition;
    const end = meshB.position;
    const radius = sphere.radius;

    const direction = new THREE.Vector3().subVectors(end,start);
    const distance = direction.length();

    if (distance === 0) return null; // No movement

    direction.normalize();
    const stepSize = distance / steps;
    const stepVector = direction.clone().multiplyScalar(stepSize);

    let currentPosition = start.clone();

    for (let i = 1; i <= steps; i++) {
        const sphere = new THREE.Sphere(currentPosition.clone(), radius);
        const hit = meshA.bvh.boundsTree.intersectsSphere(sphere);
        if (hit) return (i - 1) / steps;
        currentPosition.add(stepVector);
    }

    return null; // No collision detected
}
