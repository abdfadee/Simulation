import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

//import { OBB } from 'three/examples/jsm/math/OBB.js';
import { OBB } from 'three/addons/math/OBB.js';




  function createOBBHelper(obb, color = 0xff0000) {
    const geometry = new THREE.BoxGeometry(
      obb.halfSize.x * 2,
      obb.halfSize.y * 2,
      obb.halfSize.z * 2
    );
  
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color });
    const wireframe = new THREE.LineSegments(edges, material);
  
    // Create a matrix from rotation and center
    const matrix = new THREE.Matrix4();
  
    // Convert 3x3 rotation matrix to 4x4
    const rotationMatrix = new THREE.Matrix4().setFromMatrix3(obb.rotation);
  
    // Set position
    matrix.makeTranslation(obb.center.x, obb.center.y, obb.center.z);
  
    // Combine rotation and translation
    wireframe.applyMatrix4(rotationMatrix);
    wireframe.applyMatrix4(matrix);
  
    return wireframe;
  }



  var colliders = [];
  var helpers = [];


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

    cannon.updateWorldMatrix(true);
    const worldMatrix = cannon.matrixWorld.clone();
    cannon.scale.set(1,1,1);
    cannon.rotation.set(0, 0, 0);
    cannon.position.set(0,0,0);

    cannon.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;

        child.updateWorldMatrix(true);

        let obb = new OBB();
        const box = new THREE.Box3().setFromObject(child,false);
        obb.fromBox3(box);
        colliders.push(obb);
    }
    });
    scene.add(cannon);
    cannon.applyMatrix4(worldMatrix);

    

    const shellModel = await modelLoader.loadAsync('Assets/model/cannonball/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(2.5,2.5,2.5);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;

        // Compute bounding box collider
        child.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(child,true);
        const helper = new THREE.Box3Helper(box, 0x00ff00);
        scene.add(helper);
    }
    });
    scene.add(shell);
    

    

    /* Physics */
    //const pshell = new RigidBody(shell,1.0,0.5,0.4);
    //physicsEngine.addBody(pshell);





    const clock = new THREE.Clock();

    function animate(time) {
        //pshell.addForce(new THREE.Vector3(5, 0, 0));

        helpers = [];
        cannon.updateWorldMatrix(true);
        const worldMatrix = cannon.matrixWorld.clone();
        for (let collider of colliders) {
        const obb = new OBB();
        obb.copy(collider);
        obb.applyMatrix4(worldMatrix)
        const obbHelper = createOBBHelper(obb);
        helpers.push(helpers);
        scene.add(obbHelper);
        }


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