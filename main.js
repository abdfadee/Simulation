import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

import {} from "./lib/physics/Collision.js";
import { MeshBVH , MeshBVHHelper , SAH } from 'three-mesh-bvh';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';



function generateCollisionMesh (mesh) {
    const geometries = [];

    mesh.traverse(function (child) {
    if (child.isMesh) {
        child.updateMatrixWorld(true);
        const clonedGeo = child.geometry.clone();
        clonedGeo.applyMatrix4(child.matrixWorld);
        clonedGeo.deleteAttribute('tangent');
        geometries.push(clonedGeo);
    }
    });

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
        strategy: SAH,
        maxLeafTris: 1,
    });

    const mergedMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ wireframe: true,visible:false }));
    mesh.collider = mergedMesh;
    mesh.add(mesh.collider);

    const helper = new MeshBVHHelper(mergedMesh,10);
    helper.children[0].material.color.set(0xff0000);
    helper.children[0].material.transparent = true
    //scene.add(helper);
}


function getGeometryToBVH (meshA , meshB) {
    const matrixToB = new THREE.Matrix4()
        .copy(meshB.matrixWorld)
        .invert()
        .multiply(meshA.matrixWorld);
    return matrixToB;
}


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



    const terrainModel = await modelLoader.loadAsync('assets/model/terrain/scene.gltf');
    const terrain = terrainModel.scene;
    terrain.scale.set(1,1,1);
    //terrain.rotateY(MathUtils.degToRad(90));
    //terrain.rotateX(MathUtils.degToRad(15));
    terrain.position.set(0,0.4,0);
    terrain.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(terrain);
    generateCollisionMesh(terrain);




    const shellModel = await modelLoader.loadAsync('assets/model/cannonball/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(3,3,3);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(shell);
    generateCollisionMesh(shell);



    /* Physics */
    const pshell = new RigidBody(shell,1.0,0.5,0.4);
    physicsEngine.addBody(pshell);




    const clock = new THREE.Clock();
    function animate(time) {
        const matrixToB = getGeometryToBVH(shell.collider,terrain.collider);

        // Use boundsTree from meshA to check against meshB's geometry
        const intersects = terrain.collider.geometry.boundsTree.intersectsGeometry(
            shell.collider.geometry,
            matrixToB
        );

        if (intersects) {
        console.log('Collision detected!');
        } else {
        console.log('No collision.');
        }


        //shell.rotateY(MathUtils.degToRad(1));

        //terrain.rotateZ(MathUtils.degToRad(1));
        //terrain.updateMatrixWorld(true);

        //terrain.translateY(-0.001);

        //camera.lookAt(shell.position);
        //camera.updateProjectionMatrix();

        pshell.addForce(new THREE.Vector3(5, 0, 0));
        const delta = clock.getDelta();
        physicsEngine.update(delta/10);

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();