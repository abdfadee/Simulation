import * as THREE from "three";
import {modelLoader, scene} from "../renderer/Initialize";
import physicsEngine from "../physics/PhysicsEngine.js";
import RigidBody from "..//physics/RigidBody.js";


const terrainModel = await modelLoader.loadAsync('assets/model/t/scene.gltf');
const terrain3D = terrainModel.scene;
terrain3D.scale.set(1,1,1);
const terrain = new RigidBody(terrain3D,0.0,0.5,0.8);
physicsEngine.addBody(terrain);