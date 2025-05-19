import * as THREE from 'three';
import { resolveCollision , applyPositionalCorrection } from './CollisionResponse';


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
        // Step 1: Apply gravity
        for (const body of this.bodies) {
            if (!body.isSleeping) {
                const gravityForce = this.gravity.clone().multiplyScalar(body.mass);
                body.addForce(gravityForce);
            }
        }
    
        for (const body of this.bodies) {
            body.velocity.multiplyScalar(0.998);
            body.angularVelocity.multiplyScalar(0.998);
        }

        // Step 2: Integrate motion
        for (const body of this.bodies) {
            body.integrate(deltaTime);
        }
    
        // Step 3: Handle collisions (naive N² check)
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const A = this.bodies[i];
                const B = this.bodies[j];

                if (A.isSleeping && B.isSleeping) continue;
    
                const contact = A.getContacts(B);
                if (contact === null) continue;
    
                resolveCollision(A, B, contact);

                // After resolving impulses
                    applyPositionalCorrection(A, B, contact);
            }
        }

        // Try to put bodies to sleep after collisions resolved
        for (const body of this.bodies) {
            //body.trySleep(deltaTime);
        }
    }

}

const physicsEngine = new PhysicsEngine();
export default physicsEngine;