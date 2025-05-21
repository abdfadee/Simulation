import * as THREE from 'three';
import {testEarlyCheck,getContacts} from "./collision/CollisionDetection"
import { resolveCollision, applyPositionalCorrection } from './collision/CollisionResponse';
import { sweptSphereCollision } from './collision/CCD';


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
        
        // Step 3: Continuous Collision Detection (CCD) & collision response with TOI
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const A = this.bodies[i];
                const B = this.bodies[j];
                
                const toi = sweptSphereCollision(A, B,250); // returns fraction [0-1] of deltaTime
                if (toi != null) {
                    // ⬅️ Rewind positions
                    A.representation.position.lerpVectors(A.prevPosition, A.representation.position, toi);
                    B.representation.position.lerpVectors(B.prevPosition, B.representation.position, toi);
            
                    // 🧭 Get contact info
                    const contact = getContacts(A, B);
                    if (!contact) continue;
            
                    // 💥 Collision response
                    resolveCollision(A, B, contact);
                    applyPositionalCorrection(A, B, contact);
            
                    // ✅ Move forward for rest of deltaTime
                    const remainingTime = 1 - toi;
                    A.integrate(remainingTime * deltaTime);
                    B.integrate(remainingTime * deltaTime);
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
