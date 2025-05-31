import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox.js";

import physicsEngine from "./lib/physics/PhysicsEngine.js";
import RigidBody from "./lib/physics/RigidBody.js";








async function main () {
    camera.position.set(0,8,8);
    
    /*
    const objectModel = await modelLoader.loadAsync('assets/model/terrain/scene.gltf');
    const object3D = objectModel.scene;
    //object3D.scale.set(0.01,0.01,0.01);
    const object = new RigidBody(object3D,0.0,0.5,0.8,"convex");
    physicsEngine.addBody(object);
    */


    const terrain3D = new THREE.Mesh(
        new THREE.BoxGeometry(25,1,25),
        new THREE.MeshBasicMaterial({color: 0xFF0000})
    );
    const terrain = new RigidBody(terrain3D,0.0,1.0,0.5,"convex");
    physicsEngine.addBody(terrain);




    const sphere3D = new THREE.Mesh(
        new THREE.SphereGeometry(0.25),
        new THREE.MeshBasicMaterial({color: 0x0000FF})
    );

    const box3D = new THREE.Mesh(
        new THREE.BoxGeometry(0.25,0.25,0.25),
        new THREE.MeshBasicMaterial({color: 0xFF0000})
    );
    
    
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 's':
                const sphere = new RigidBody(sphere3D.clone(),1,0.5,0.8,"convex");
                sphere.representation.position.set(0,6,0);
                physicsEngine.addBody(sphere);
                break;
            case 'b':
                const box = new RigidBody(box3D.clone(),1,0.5,0.8,"convex");
                box.representation.position.set(0,6,0);
                physicsEngine.addBody(box);
                break;
            default:
                break;
        }
    });


    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.updateProjectionMatrix();

    const clock = new THREE.Clock();
    function animate(time) {
        const helperGroup = new THREE.Group();
        helperGroup.name = 'HelperVisualization';
        scene.add(helperGroup);

        //object.representation.scale.set(0.01,0.01,0.01);
        terrain.representation.rotateX(MathUtils.degToRad(0.025));
        //camera.lookAt(shell.representation.position);
        //camera.updateProjectionMatrix();

        //shell.addForce(new THREE.Vector3(1000, 0, 0));

        const delta = clock.getDelta();
        physicsEngine.update(delta/3);

        renderer.render( scene, camera );
        scene.remove(helperGroup);
    }
    renderer.setAnimationLoop( animate );
}
main();