import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";
import {modelLoader} from "../renderer/Initialize";
import physicsEngine from "../physics/PhysicsEngine.js";
import RigidBody from "..//physics/RigidBody.js";


const cannonModel = await modelLoader.loadAsync('assets/model/cannon/scene.gltf');
const cannon3D = cannonModel.scene;
cannon3D.scale.set(0.001,0.001,0.001);
const cannon = new RigidBody(cannon3D,0.0,0.5,0.8,false);
cannon.representation.position.set(0,0.85,0);
physicsEngine.addBody(cannon);


let barrel;
let wheels = [];
cannon3D.traverse((child) => {
    if (child.isSkinnedMesh) {
        const skeleton = child.skeleton;
        barrel = skeleton.bones.find(b => b.name === "Bone005_05") ?? barrel;
        wheels[0] = skeleton.bones.find(b => b.name === "Bone001_01") ?? wheels[0];
        wheels[1] = skeleton.bones.find(b => b.name === "Bone002_02") ?? wheels[1];
        wheels[2] = skeleton.bones.find(b => b.name === "Bone003_03") ?? wheels[2];
        wheels[3] = skeleton.bones.find(b => b.name === "Bone004_04") ?? wheels[3];
    }
});