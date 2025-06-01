import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";
import {modelLoader} from "../renderer/Initialize";
import physicsEngine from "../physics/PhysicsEngine.js";
import RigidBody from "..//physics/RigidBody.js";

const turretModel = await modelLoader.loadAsync('assets/model/turret/scene.gltf');
const turret3D = turretModel.scene;
turret3D.scale.set(0.01,0.01,0.01);
const turret = new RigidBody(turret3D,0.0,0.5,0.8,false);
turret.representation.position.set(0,0.45,0);
physicsEngine.addBody(turret);

let armature;
let head;

turret3D.traverse((child) => {
    if (child.isSkinnedMesh) {
        const skeleton = child.skeleton;
        armature = skeleton.bones.find(b => b.name === "turret_01") ?? armature;
        head = skeleton.bones.find(b => b.name === "head_02") ?? head;
    }
});

armature.rotation.set(0,0,0);
head.rotation.set(MathUtils.degToRad(90.0),0,0);