import * as THREE from 'three';
import {scene} from "../renderer/Initialize";
import "./collision/collider/BVH.js";
import "./collision/collider/Sphere.js";
import "./collision/collider/Box.js";



class RigidBody {

    constructor(object3D, mass , restitution , friction , colliderType = "bvh") {
        this.colliderType = colliderType;
        this.setRepresentation(object3D);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        this.mass = mass;
        this.inverseMass = (mass !== 0.0) ? (1.0 / mass) : 0.0;
        this.restitution = restitution;
        this.friction = friction;

        this.forceAccum = new THREE.Vector3(0, 0, 0);
        this.torqueAccum = new THREE.Vector3(0, 0, 0);

        this.sleepThreshold = 0.05; // velocity magnitude below which sleep can start
        this.sleepTime = 0;         // how long velocity has been low
        this.sleepTimeThreshold = 0.005; // seconds to be considered sleeping
        this.isSleeping = false;

        this.prevPosition = this.representation.position.clone();
    }

    setRepresentation (object3D) {
        // Clone and assign
        const clone = object3D.clone();

        object3D.generateBVHGeometry();
        clone.bvh = object3D.bvh;

        object3D.generateSphereGeometry();
        clone.sphere = object3D.sphere;

        object3D.generateBoxGeometry();
        clone.box = object3D.box;
        
        if (this.colliderType === "bvh") {
            clone.createBVHHelper();
        } else if (this.colliderType === "sphere") {
            clone.createSphereHelper();
        } else if (this.colliderType === "box") {
            clone.createBoxHelper();
        } else {
            throw new Error(`Unknown collider type: ${this.colliderType}`);
        }

        this.representation = clone;
        scene.add(this.representation);
    }

    addForce(force) {
        if (this.isSleeping) this.isSleeping = false;
        if (this.mass !== 0.0) {
            this.forceAccum.add(force);
        }
    }

    addTorque(force, point) {
        if (this.isSleeping) this.isSleeping = false;
        if (this.mass !== 0.0) {
        const r = new THREE.Vector3().subVectors(point, this.position);
        const torque = new THREE.Vector3().crossVectors(r, force);
        this.torqueAccum.add(torque);
        }
    }

    addImpulse(impulse) {
        if (this.mass === 0.0) return;
    
        // Linear impulse: update linear velocity
        this.velocity.addScaledVector(impulse, this.inverseMass);
    
        if (this.isSleeping) {
            this.isSleeping = false;
        }
    }

    addTorqueImpulse(impulse, contactPoint) {
        if (this.mass === 0.0) return;
    
        // Angular impulse: update angular velocity (if point provided and not at center of mass)
        const r = new THREE.Vector3().subVectors(contactPoint, this.representation.position);
            const angularImpulse = new THREE.Vector3().crossVectors(r, impulse);
    
            // Approximate moment of inertia for uniform sphere (can be adapted per shape)
            const inertia = (2 / 5) * this.mass;
            const inverseInertia = 1 / inertia;
    
            this.angularVelocity.addScaledVector(angularImpulse, inverseInertia);
    
        if (this.isSleeping) {
            this.isSleeping = false;
        }
    }
    

    clearForces() {
        this.forceAccum.set(0, 0, 0);
        this.torqueAccum.set(0, 0, 0);
    }

    integrate(deltaTime) {
        if (this.mass === 0.0 || deltaTime <= 0.0 || this.isSleeping) return;

        // Linear integration
        const acceleration = this.forceAccum.clone().multiplyScalar(this.inverseMass);
        this.velocity.addScaledVector(acceleration, deltaTime);
        this.representation.position.addScaledVector(this.velocity, deltaTime);

        // Angular integration (simplified)
        if (this.angularVelocity.lengthSq() > 0.0) {
            const orientation = this.representation.quaternion;
            const spin = new THREE.Quaternion( 
                this.angularVelocity.x * 0.5 * deltaTime,
                this.angularVelocity.y * 0.5 * deltaTime,
                this.angularVelocity.z * 0.5 * deltaTime,
                0
            );
            spin.multiply(orientation);
            orientation.x += spin.x;
            orientation.y += spin.y;
            orientation.z += spin.z;
            orientation.w += spin.w;
            orientation.normalize();
        }

        this.clearForces();
    }


    // Call this every frame after velocity integration
    trySleep(deltaTime) {
        if (this.velocity.length() < this.sleepThreshold &&
            this.angularVelocity.length() < this.sleepThreshold) {
            this.sleepTime += deltaTime;
            if (this.sleepTime > this.sleepTimeThreshold) {
                this.isSleeping = true;
                this.velocity.set(0, 0, 0);
                this.angularVelocity.set(0, 0, 0);
            }
        } else {
            this.sleepTime = 0;
            this.isSleeping = false;
        }
    }

    savePreviousState() {
        this.prevPosition.copy(this.representation.position);
    }

}

export default RigidBody;
