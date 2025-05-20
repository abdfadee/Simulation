import * as THREE from 'three';
import { computeTOI } from './CCD.js';
import { resolveCollision, applyPositionalCorrection } from './CollisionResponse.js';

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
        // Step 0: Store previous positions (used in CCD)
        for (const body of this.bodies) {
            body.prevPosition.copy(body.representation.position);
        }

        // Step 1: Apply gravity
        for (const body of this.bodies) {
            if (!body.isSleeping) {
                const gravityForce = this.gravity.clone().multiplyScalar(body.mass);
                body.addForce(gravityForce);
            }
        }

        // Optional: Apply damping before integration
        for (const body of this.bodies) {
            body.velocity.multiplyScalar(0.990);
            body.angularVelocity.multiplyScalar(0.990);
        }

        // Step 2: Integrate full timestep
        for (const body of this.bodies) {
            body.integrate(deltaTime);
        }

        // Step 3: TOI-based collision detection and response
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const A = this.bodies[i];
                const B = this.bodies[j];
                if (A.isSleeping && B.isSleeping) continue;

                const result = computeTOI(A, B, deltaTime);
                if (!result) continue;

                const { toiTime } = result;

                // Save current positions
                const A_curr = A.representation.position.clone();
                const B_curr = B.representation.position.clone();

                // Interpolate to TOI
                A.representation.position.lerpVectors(A.prevPosition, A_curr, toiTime / deltaTime);
                B.representation.position.lerpVectors(B.prevPosition, B_curr, toiTime / deltaTime);

                // Custom collision detection
                const contact = A.getContacts(B);
                if (contact) {
                    resolveCollision(A, B, contact);
                    applyPositionalCorrection(A, B, contact);
                }

                // Restore positions (optional, could continue from TOI if desired)
                A.representation.position.copy(A_curr);
                B.representation.position.copy(B_curr);

                // Integrate remaining time
                const remainingTime = deltaTime - toiTime;
                if (remainingTime > 0) {
                    A.integrate(remainingTime);
                    B.integrate(remainingTime);
                }
            }
        }

        // Step 4: Sleep logic
        for (const body of this.bodies) {
            body.trySleep(deltaTime);
        }
    }
}

const physicsEngine = new PhysicsEngine();
export default physicsEngine;
