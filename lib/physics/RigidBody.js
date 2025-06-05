import * as THREE from 'three';
import {scene} from "../renderer/Initialize";
import { computeMergedGeometry } from './Utility';
import {computeConvexGeometry , computeProperties} from "./Convex.js";
import { getPointsBuffer } from './Utility';
import { createConvexHelper, visualizePoint } from '../renderer/Helpers.js';



class RigidBody {

    constructor(object3D , mass = 0.0 , restitution = 0.5 , friction = 0.4 , centerOfMass = new THREE.Vector3()) {
        this.mergedGeometry = computeMergedGeometry(object3D);          // BufferGeometry
        this.convex = computeConvexGeometry(this.mergedGeometry);       // ConvexGeometry
        this.collider = getPointsBuffer(this.convex);       // Array[Vector3]

        const wrapper = new THREE.Object3D();
        wrapper.add(object3D);
        wrapper.add(createConvexHelper(this.convex));       // Debugging Collider

        this.representation = wrapper;
        scene.add(this.representation);

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);

        this.mass = mass;
        this.inverseMass = (mass !== 0.0) ? (1.0 / mass) : 0.0;
        const {area , volume , density} = computeProperties(this.convex,mass);
        this.area = area;
        this.volume = volume;
        this.density = density;
        this.inertiaTensor = (2 / 5) * mass;
        this.invInertiaTensor = 1 / this.inertiaTensor;
        this.restitution = restitution;
        this.friction = friction;

        this.centerOfMass = centerOfMass.applyMatrix4(object3D.matrixWorld);    // In Local Space
        this.centerOfMassWorld = new THREE.Vector3().copy(this.centerOfMass).applyMatrix4(wrapper.matrixWorld);    // In World Space

        this.forceAccum = new THREE.Vector3(0, 0, 0);
        this.torqueAccum = new THREE.Vector3(0, 0, 0);
    }

    addForce(force,point) {
        if (this.mass === 0.0) return;

        if (point == null) point = this.centerOfMassWorld;

        // Linear
        this.forceAccum.add(force);

        // Angular
        const r = new THREE.Vector3().subVectors(point, this.representation.position);
        const torque = new THREE.Vector3().crossVectors(r, force);
        this.torqueAccum.add(torque);
    }


    addImpulse(impulse , point) {
        if (this.mass === 0.0) return;

        if (point == null) point = this.centerOfMassWorld;

        // Linear
        this.velocity.addScaledVector(impulse, this.inverseMass);

        // Angular
        const r = new THREE.Vector3().subVectors(point, this.representation.position);
        const angularImpulse = new THREE.Vector3().crossVectors(r, impulse);
        const angularAcc = angularImpulse.clone().multiplyScalar(this.invInertiaTensor);
        this.angularVelocity.add(angularAcc);
    }
    

    clearForces() {
        this.forceAccum.set(0, 0, 0);
        this.torqueAccum.set(0, 0, 0);
    }

    integrate(deltaTime) {
        if (this.mass === 0.0 || deltaTime <= 0.0) return;

        this.centerOfMassWorld = this.centerOfMassWorld.copy(this.centerOfMass).applyMatrix4(this.representation.matrixWorld);
        //visualizePoint(this.centerOfMassWorld);
    
        // --- Linear ---
        const acceleration = this.forceAccum.clone().multiplyScalar(this.inverseMass);
        this.velocity.addScaledVector(acceleration, deltaTime);
        this.representation.position.addScaledVector(this.velocity, deltaTime);
    
        // --- Angular: Apply torque to angular velocity ---
        if (this.torqueAccum.lengthSq() > 0.0) {
            const angularAcc = this.torqueAccum.clone().multiplyScalar(this.invInertiaTensor);
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
