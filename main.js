import * as THREE from "three";

import {renderer,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";
import "./lib/renderer/World.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";


async function main () {
    camera.position.set(0,8,8);
    


    /* Rendering */

    
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
    cannon.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;

        child.updateWorldMatrix(true, false);
        // Compute bounding box collider
      const box = new THREE.Box3().setFromObject(child);

      // Optional: Visualize it
      const helper = new THREE.Box3Helper(box, 0x00ff00);
      scene.add(helper);
    }
    });
    scene.add(cannon);
    

    

    const shellModel = await modelLoader.loadAsync('Assets/model/cannonball/scene.gltf');
    const shell = shellModel.scene;
    shell.scale.set(2.5,2.5,2.5);
    shell.position.set(0,5,0);
    shell.traverse(function (child) {
    if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.side = THREE.BackSide;

        // Force world matrix update
        child.updateWorldMatrix(true, false);

        // Get bounding box in local space
        child.geometry.computeBoundingBox();
        const localBox = child.geometry.boundingBox;

        // Clone the box and apply the world matrix to it
        const worldBox = localBox.clone();
        worldBox.applyMatrix4(child.matrixWorld);

        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        worldBox.getSize(size);
        worldBox.getCenter(center);

        const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        boxGeo.translate(center.x, center.y, center.z);

        const collider = new THREE.Mesh(
        boxGeo,
        new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
        );

        scene.add(collider);
    }
    });
    scene.add(shell);
    


    /*
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1),
        new THREE.MeshBasicMaterial()
    );
    mesh.geometry.computeBoundingBox();
    scene.add(mesh);
    */


    /* Physics */
    //const pshell = new RigidBody(shell,1.0,0.5,0.4);
    //physicsEngine.addBody(pshell);





    const clock = new THREE.Clock();

    function animate(time) {
        //pshell.addForce(new THREE.Vector3(5, 0, 0));

        const delta = clock.getDelta();
        physicsEngine.update(delta/10);

        //camera.lookAt(0,5,0);
        //camera.updateProjectionMatrix();

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();