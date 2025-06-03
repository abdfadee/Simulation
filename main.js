import * as THREE from "three";
import * as MathUtils from "three/src/math/MathUtils";

import {renderer,textureLoader,modelLoader,scene,camera} from "./lib/renderer/Initialize";
import "./lib/renderer/Skybox";

import physicsEngine from "./lib/physics/PhysicsEngine";
import RigidBody from "./lib/physics/RigidBody";
import { applyQuadraticDrag, applyWind } from "./lib/physics/Forces";

import "./lib/objects/Terrain";
//import "./lib/objects/Turret";







async function main () {
    camera.position.set(0,8,8);

    const objects = [];

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
                const sphere = new RigidBody(sphere3D.clone(),1,0.8,0.8);
                sphere.representation.position.set(0,6,0);
                physicsEngine.addBody(sphere);
                objects.push(sphere);
                break;
            case 'b':
                const box = new RigidBody(box3D.clone(),1,0.8,0.8);
                box.representation.position.set(0,6,0);
                physicsEngine.addBody(box);
                objects.push(box);
                break;
            default:
                break;
        }
    });


    camera.lookAt(new THREE.Vector3(0,0,0));
    camera.updateProjectionMatrix();

    const clock = new THREE.Clock();
    function animate(time) {

        /*
        for (const object of objects) {
            applyQuadraticDrag(object);
            applyWind(object);
        }
        //shell.addForce(new THREE.Vector3(1000, 0, 0));
        */

        //camera.lookAt(shell.representation.position);
        //camera.updateProjectionMatrix();


        const delta = clock.getDelta();
        physicsEngine.update(delta);

        renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
}
main();