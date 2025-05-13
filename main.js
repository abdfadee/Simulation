import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

import { OBB } from 'three/addons/math/OBB.js';
import { generateMeshOOBColliders , createOBBHelper } from './lib/physics/Collider.js';




  





async function main () {
    camera.position.set(0,8,8);
    


    /* Rendering */
    
    // Ground
    /*
    const floorGeometry = new THREE.PlaneGeometry(100,100,1000,1000);

    const floorAlbedo = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Color.jpg");
    const floorNormal = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_NormalGL.jpg");
    const floorDisplacement = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Displacement.jpg");
    const floorRoughness = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_Roughness.jpg");
    const floorAo = textureLoader.load("./assets/texture/PavingStones115/PavingStones115B_1K-JPG_AmbientOcclusion.jpg");
    floorAlbedo.colorSpace = THREE.SRGBColorSpace;

    const textures = [floorAlbedo,floorNormal,floorDisplacement,floorRoughness,floorAo];
    textures.forEach((e) => {
    e.wrapS = THREE.RepeatWrapping;
    e.wrapT = THREE.RepeatWrapping; 
    e.repeat.set(30, 30);
    });

    const floorMaterial = new THREE.MeshPhysicalMaterial({
    map: floorAlbedo,
    normalMap: floorNormal,
    displacementMap: floorDisplacement,
    displacementScale: 0.2,
    roughnessMap: floorRoughness,
    aoMap: floorAo
    });

    const floor = new THREE.Mesh(floorGeometry,floorMaterial);
    floor.rotateX(MathUtils.degToRad(-90.0));
    floor.receiveShadow = true;
    scene.add(floor);
    */


    
    const cannonModel = await modelLoader.loadAsync('Assets/model/cannon/scene.gltf');
    const cannon = cannonModel.scene;
    cannon.scale.set(0.001,0.001,0.001);
    cannon.rotateY(MathUtils.degToRad(90));
    cannon.rotateX(MathUtils.degToRad(15));
    cannon.position.set(0,0.4,0);
    cannon.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(cannon);
    generateMeshOOBColliders(cannon);
    


    const shellModel = await modelLoader.loadAsync('Assets/model/cannonball/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(2.5,2.5,2.5);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(shell);
    generateMeshOOBColliders(shell);



    /* Physics */
    //const pshell = new RigidBody(shell,1.0,0.5,0.4);
    //physicsEngine.addBody(pshell);



    let helpers = [];

    const clock = new THREE.Clock();

    function animate(time) {
        //pshell.addForce(new THREE.Vector3(5, 0, 0));

        shell.rotateY(MathUtils.degToRad(1));
        cannon.rotateZ(MathUtils.degToRad(1));

        helpers = [];
        shell.updateWorldMatrix(true);

        const cannonWorldMatrix = cannon.matrixWorld.clone();
        const shellWorldMatrix = shell.matrixWorld.clone();

        cannon.traverse(function (child) {
        if (child.isMesh) {
            const obb = new OBB();
            obb.copy(child.collider);
            obb.applyMatrix4(cannonWorldMatrix);
            const obbHelper = createOBBHelper(obb);
            helpers.push(obbHelper);
            scene.add(obbHelper);
        }
        });

        shell.traverse(function (child) {
        if (child.isMesh) {
            const obb = new OBB();
            obb.copy(child.collider);
            obb.applyMatrix4(shellWorldMatrix);
            const obbHelper = createOBBHelper(obb);
            helpers.push(obbHelper);
            scene.add(obbHelper);
        }
        });

        const delta = clock.getDelta();
        physicsEngine.update(delta/10);

        //camera.lookAt(0,5,0);
        //camera.updateProjectionMatrix();

        renderer.render( scene, camera );

        for (let helper of helpers) {
            scene.remove(helper);
        }
    }
    renderer.setAnimationLoop( animate );
}
main();