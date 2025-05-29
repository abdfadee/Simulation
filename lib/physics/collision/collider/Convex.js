import * as THREE from "three";
import { getPointsBuffer } from '../../Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { scene } from "../../../renderer/Initialize";


export function computeConvexCollider (geometry) {
    const points = getPointsBuffer(geometry);
    return new ConvexGeometry(points);
}


export function createConvexHelper (body) {
    const convex = body.convex.clone();

    body.representation.updateMatrixWorld(true);
    const worldMatrix = body.representation.matrixWorld;

    convex.applyMatrix4(worldMatrix)

    const mesh = new THREE.Mesh(
        convex,
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );

    const helperGroup = scene.getObjectByName('HelperVisualization');
    helperGroup.add(mesh);
}