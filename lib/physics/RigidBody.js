import * as THREE from 'three';
import {scene} from "../renderer/Initialize";
import { computeMergedGeometry } from './Utility';
import {computeConvexGeometry , computeSurfaceArea, computeVolumetricProperties, createConvexHelper} from "./Convex.js";
import { getPointsBuffer } from './Utility';



class RigidBody {

    constructor(object3D , mass = 0.0 , restitution = 0.5 , friction = 0.4 , centerOfMass = new THREE.Vector3()) {
        this.setRepresentation(object3D);

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        this.mass = mass;
        this.inverseMass = (mass !== 0.0) ? (1.0 / mass) : 0.0;
        this.area = computeSurfaceArea(this.convex);
        const {volume , density , inertiaTensor} = computeVolumetricProperties(this.convex,mass,centerOfMass);
        this.volume = volume;
        this.density = density;
        this.inertiaTensor = inertiaTensor      // Matrix3;
        this.invInertiaTensor = new THREE.Matrix3().copy(inertiaTensor).invert();
        this.restitution = restitution;
        this.friction = friction;
        this.centerOfMass = centerOfMass;

        this.forceAccum = new THREE.Vector3(0, 0, 0);
        this.torqueAccum = new THREE.Vector3(0, 0, 0);
    }

    setRepresentation (object3D) {
        this.mergedGeometry = computeMergedGeometry(object3D);          // BufferGeometry
        this.convex = computeConvexGeometry(this.mergedGeometry);       // ConvexGeometry
        this.collider = getPointsBuffer(this.convex);       // Array[Vector3]

        const wrapper = new THREE.Object3D();
        wrapper.add(object3D);
        wrapper.add(createConvexHelper(this.convex));

        this.representation = wrapper;
        scene.add(this.representation);
    }

    addForce(force) {
        if (this.mass !== 0.0) {
            this.forceAccum.add(force);
        }
    }

    addTorque(force, point) {
        if (this.mass !== 0.0) {
        const r = new THREE.Vector3().subVectors(point, this.representation.position);
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
    
        const r = new THREE.Vector3().subVectors(contactPoint, this.representation.position);
        const angularImpulse = new THREE.Vector3().crossVectors(r, impulse);
    
        const inertia = (2 / 5) * this.mass; // same as in integrate
        const angularAcc = angularImpulse.clone().multiplyScalar(1 / inertia);
        this.angularVelocity.add(angularAcc);
    }
    

    clearForces() {
        this.forceAccum.set(0, 0, 0);
        this.torqueAccum.set(0, 0, 0);
    }

    integrate(deltaTime) {
        if (this.mass === 0.0 || deltaTime <= 0.0) return;
    
        // --- Linear ---
        const acceleration = this.forceAccum.clone().multiplyScalar(this.inverseMass);
        this.velocity.addScaledVector(acceleration, deltaTime);
        this.representation.position.addScaledVector(this.velocity, deltaTime);
    
        // --- Angular: Apply torque to angular velocity ---
        if (this.torqueAccum.lengthSq() > 0.0) {
            const inertia = (2 / 5) * this.mass; // Approximate for sphere
            const angularAcc = this.torqueAccum.clone().multiplyScalar(1 / inertia);
            this.angularVelocity.addScaledVector(angularAcc, deltaTime);
        }
    
        // --- Angular: Rotate orientation based on angular velocity ---
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

}

export default RigidBody;
