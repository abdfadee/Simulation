import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

import { OBB } from 'three/addons/math/OBB.js';
import { generateMeshAABBColliders , generateMeshSphereColliders} from './lib/physics/Collider.js';


  





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
    


    const shellModel = await modelLoader.loadAsync('Assets/model/shell/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(0.001,0.001,0.001);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(shell);
    



    /* Physics */
    //const pshell = new RigidBody(shell,1.0,0.5,0.4);
    //physicsEngine.addBody(pshell);




    const clock = new THREE.Clock();


    function animate(time) {
        //pshell.addForce(new THREE.Vector3(5, 0, 0));

        //shell.rotateY(MathUtils.degToRad(1));
        //cannon.rotateZ(MathUtils.degToRad(1));

        let helpers = [];

        
        generateMeshAABBColliders(cannon);
        cannon.traverse(function (child) {

            if (child.isMesh) {
                const helper = new THREE.Box3Helper(child.collider,0xFF0000);
                scene.add(helper);
                helpers.push(helper);
            }

        });


        generateMeshSphereColliders(shell);
        shell.traverse(function (child) {

            if (child.isMesh) {
            const sphere = child.collider;
            const helper = new THREE.Mesh(
            new THREE.SphereGeometry(sphere.radius, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            );
            helper.position.copy(sphere.center);
            scene.add(helper);
            helpers.push(helper);
            }

        });
        

        //const delta = clock.getDelta();
        //physicsEngine.update(delta/10);

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