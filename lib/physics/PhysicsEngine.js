import * as THREE from 'three';
import {getContact} from "./collision/CollisionDetection"
import { resolveCollision, applyPositionalCorrection } from './collision/CollisionResponse';


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
    
        // Optional: Apply damping before integration
        for (const body of this.bodies) {
            body.velocity.multiplyScalar(0.990);
            body.angularVelocity.multiplyScalar(0.990);
        }
    
        // Step 2: Integrate full timestep
        for (const body of this.bodies) {
            body.integrate(deltaTime);
        }
        
        
        // Step 3: Collision Detection
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const A = this.bodies[i];
                const B = this.bodies[j];

                if (A.mass === 0.0 && B.mass === 0.0) continue;
                
                // 🧭 Get contact info
                const contact = getContact(A, B);
        
                if (contact) {
                    // 💥 Collision response
                    resolveCollision(A, B, contact);
                    applyPositionalCorrection(A, B, contact);
                }
            }
        }
        
    }
}

const physicsEngine = new PhysicsEngine();
export default physicsEngine;
