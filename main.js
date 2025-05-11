import * as THREE from "three";

import {renderer,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";
import "./lib/renderer/World.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";


async function main () {
    camera.position.set(0,8,8);
    camera.lookAt(0,5,0);
    camera.updateProjectionMatrix();


    /* Rendering */

    /*
    const cannonModel = await modelLoader.loadAsync('Assets/model/cannon/scene.gltf');
    const cannon = cannonModel.scene;
    cannon.scale.set(0.001,0.001,0.001);
    cannon.position.set(0,0.4,0);
    cannon.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });
    scene.add(cannon);
    */

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






    /* Physics */
    const pshell = new RigidBody(shell,1.0,0.5,0.4);
    physicsEngine.addBody(pshell);





    const clock = new THREE.Clock();

    function animate(time) {
        pshell.addForce(new THREE.Vector3(5, 0, 0));

        const delta = clock.getDelta();
        physicsEngine.update(delta/10);


        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();