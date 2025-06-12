import * as THREE from 'three';

export function applyWind(body, windVector = new THREE.Vector3(5, 0, 0)) {
    if (body.mass === 0) return;
    body.addForce(windVector.clone());
}