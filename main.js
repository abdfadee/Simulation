import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";








async function main () {
    camera.position.set(0,8,8);
    

    /* Rendering */
    const terrainModel = await modelLoader.loadAsync('assets/model/terrain/scene.gltf');
    const terrain3D = terrainModel.scene;
    terrain3D.scale.set(1,1,1);
    terrain3D.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });


    const shellModel = await modelLoader.loadAsync('assets/model/cannonball/scene.gltf');
    const shell3D = shellModel.scene;
    shell3D.scale.set(3,3,3);
    shell3D.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;
    }
    });




    
    /* Physics */
    const terrain = new RigidBody(terrain3D,0.0,1.0,0.4);
    physicsEngine.addBody(terrain);

    const shell = new RigidBody(shell3D,100,0.5,0.4,"sphere");
    shell.representation.position.set(-2,16,0);
    physicsEngine.addBody(shell);

    /*
    const shell2 = new RigidBody(shell3D,1,0.5,0.4);
    shell2.representation.position.copy(new THREE.Vector3(-2,6,0));
    physicsEngine.addBody(shell2);

    const shell3 = new RigidBody(shell3D,1,0.5,0.4);
    shell3.representation.position.copy(new THREE.Vector3(2,6,0));
    physicsEngine.addBody(shell3);
    */


    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.updateProjectionMatrix();

    const clock = new THREE.Clock();
    function animate(time) {
        camera.lookAt(shell.representation.position);
        camera.updateProjectionMatrix();

        shell.addForce(new THREE.Vector3(0, -5000, 0));

        console.log(shell.velocity.length());

        const delta = clock.getDelta();
        physicsEngine.update(delta/4);

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();