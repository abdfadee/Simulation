import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";

import {getContact} from "./lib/physics/Collision.js";







async function main () {
    camera.position.set(0,8,8);
    

    /* Rendering */
    const terrainModel = await modelLoader.loadAsync('assets/model/terrain/scene.gltf');
    const terrain3D = terrainModel.scene;
    terrain3D.scale.set(1,1,1);
    terrain3D.position.set(0,0.4,0);
    terrain3D.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    terrain3D.generateCollisionMesh();


    const shellModel = await modelLoader.loadAsync('assets/model/cannonball/scene.gltf');
    const shell3D = shellModel.scene;
    shell3D.scale.set(3,3,3);
    shell3D.position.set(0,5,0);
    shell3D.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    shell3D.generateCollisionMesh();




    /* Physics */
    const terrain = new RigidBody(terrain3D,0.0,0.5,0.4);
    physicsEngine.addBody(terrain);

    const shell = new RigidBody(shell3D,1.0,0.5,0.4);
    physicsEngine.addBody(shell);




    const clock = new THREE.Clock();
    function animate(time) {
        //camera.lookAt(shell.position);
        //camera.updateProjectionMatrix();
        
        shell.addForce(new THREE.Vector3(5, 0, 0));

        const delta = clock.getDelta();
        physicsEngine.update(delta/10);

        /*
        const intersects = shell.intersects(terrain);
        if (intersects) {
        console.log('Collision detected!');
        } else {
        console.log('No collision.');
        }
        */

        const contact = getContact(shell,terrain);
        console.log(contact);

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();