import * as THREE from 'three';

export function applyQuadraticDrag(body, airDensity = 1.2, dragCoefficient = 0.47, area = 1.0) {
    const speed = body.velocity.length();
    if (speed === 0) return;

    const dragMagnitude = 0.5 * airDensity * speed * speed * dragCoefficient * area;
    const dragForce = body.velocity.clone().normalize().multiplyScalar(-dragMagnitude);
    body.addForce(dragForce);
}


export function applyWind(body, windVector = new THREE.Vector3(5, 0, 0)) {
    if (body.mass === 0) return;
    body.addForce(windVector.clone());
}