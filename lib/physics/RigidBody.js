import * as THREE from 'three';
import {scene} from "../renderer/Initialize";


class RigidBody {
    constructor(object3D, mass = 1.0, restitution = 0.5, friction = 0.4) {
        this.representation = object3D.clone();
        this.representation.collider = object3D.collider.clone();
        this.representation.add(this.representation.collider);
        scene.add(this.representation);

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        this.mass = mass;
        this.inverseMass = (mass !== 0.0) ? 1.0 / mass : 0.0;
        this.restitution = restitution;
        this.friction = friction;

        this.forceAccum = new THREE.Vector3(0, 0, 0);
        this.torqueAccum = new THREE.Vector3(0, 0, 0);
    }

    addForce(force) {
        if (this.mass !== 0.0) {
            this.forceAccum.add(force);
        }
    }

    addForceAtPoint(force, point) {
        if (this.mass !== 0.0) {
            this.forceAccum.add(force);
            const r = new THREE.Vector3().subVectors(point, this.position);
            const torque = new THREE.Vector3().crossVectors(r, force);
            this.torqueAccum.add(torque);
        }
    }

    clearForces() {
        this.forceAccum.set(0, 0, 0);
        this.torqueAccum.set(0, 0, 0);
    }

    integrate(deltaTime) {
        if (this.mass === 0.0 || deltaTime <= 0.0) return;

        // Linear integration
        const acceleration = this.forceAccum.clone().multiplyScalar(this.inverseMass);
        this.velocity.addScaledVector(acceleration, deltaTime);
        this.representation.position.addScaledVector(this.velocity, deltaTime);

        // Angular integration (simplified)
        if (this.angularVelocity.lengthSq() > 0.0) {
            const angularChange = new THREE.Quaternion(
                this.angularVelocity.x * 0.5 * deltaTime,
                this.angularVelocity.y * 0.5 * deltaTime,
                this.angularVelocity.z * 0.5 * deltaTime,
                0.0
            );
            angularChange.multiply(this.orientation);
            this.representation.orientation.x += angularChange.x;
            this.representation.orientation.y += angularChange.y;
            this.representation.orientation.z += angularChange.z;
            this.representation.orientation.w += angularChange.w;
            this.representation.orientation.normalize();
        }

        this.clearForces();
    }
}

export default RigidBody;
