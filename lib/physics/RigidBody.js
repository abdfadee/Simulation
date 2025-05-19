import * as THREE from 'three';
import {scene} from "../renderer/Initialize";


class RigidBody {
    constructor(object3D, mass = 1.0, restitution = 0.5, friction = 0.4) {
        this.representation = object3D.clone();
        this.representation.generateBVH();
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

        this.sleepThreshold = 0.25; // velocity magnitude below which sleep can start
        this.sleepTime = 0;         // how long velocity has been low
        this.sleepTimeThreshold = 0.25; // seconds to be considered sleeping
        this.isSleeping = false;
    }

    addForce(force) {
    if (this.isSleeping) this.isSleeping = false;
    if (this.mass !== 0.0) {
      this.forceAccum.add(force);
    }
  }

    addForceAtPoint(force, point) {
        if (this.isSleeping) this.isSleeping = false;
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
        if (this.mass === 0.0 || deltaTime <= 0.0 || this.isSleeping) return;

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

}

export default RigidBody;
