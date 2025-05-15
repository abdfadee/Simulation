import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

import {} from "./lib/physics/Collision.js";
import { MeshBVH , MeshBVHHelper } from 'three-mesh-bvh';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

  





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


    

    

    const terrainModel = await modelLoader.loadAsync('Assets/model/g/scene.gltf');
    const terrain = terrainModel.scene;
    terrain.scale.set(1,1,1);
    //terrain.rotateY(MathUtils.degToRad(90));
    //terrain.rotateX(MathUtils.degToRad(15));
    terrain.position.set(0,0.4,0);
    const terrainGeometries = [];
    terrain.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;

        child.updateMatrixWorld(true);

        child.geometry.computeBoundsTree();

        const clonedGeo = child.geometry.clone();
        clonedGeo.applyMatrix4(child.matrixWorld); // move to world space
        clonedGeo.deleteAttribute('tangent');
        terrainGeometries.push(clonedGeo);

        //child.visualizer = new MeshBVHHelper(child , 10); // Visualize 10 BVH levels
        //scene.add(child.visualizer);
    }
    });
    scene.add(terrain);

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(terrainGeometries, false);
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry);

    const debugMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ wireframe: true }));
    scene.add(debugMesh);




    const shellModel = await modelLoader.loadAsync('Assets/model/cannonball/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(3,3,3);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
        child.geometry.computeBoundsTree();

        child.visualizer = new MeshBVHHelper(child, 10); // Visualize 10 BVH levels
        scene.add(child.visualizer);
    }
    });
    scene.add(shell);
    

    


    /* Physics */
    const pshell = new RigidBody(shell,1.0,0.5,0.4);
    physicsEngine.addBody(pshell);




    const clock = new THREE.Clock();


    function animate(time) {
        //shell.rotateY(MathUtils.degToRad(1));

        //terrain.rotateZ(MathUtils.degToRad(1));
        //terrain.updateMatrixWorld(true);

        debugMesh.matrix.copy(terrain.matrixWorld); // Copies the world transform
        debugMesh.matrixAutoUpdate = false; // Disable auto-update so the matrix is used directly

        //camera.lookAt(0,5,0);
        //camera.updateProjectionMatrix();

        //pshell.addForce(new THREE.Vector3(5, 0, 0));
        const delta = clock.getDelta();
        physicsEngine.update(delta/10);

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();