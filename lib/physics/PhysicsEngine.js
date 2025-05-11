import * as THREE from 'three';

class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
    }

    addBody(body) {
        this.bodies.push(body);
    }

    setGravity(newGravity) {
        this.gravity.copy(newGravity);
    }

    update(deltaTime) {
        // Apply gravity as a force to each body
        for (const body of this.bodies) {
            const gravityForce = this.gravity.clone().multiplyScalar(body.mass);
            body.addForce(gravityForce);
        }

        // Integrate motion
        for (const body of this.bodies) {
            body.integrate(deltaTime);
        }
    }
}

const physicsEngine = new PhysicsEngine();
export default physicsEngine;