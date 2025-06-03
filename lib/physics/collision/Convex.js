import * as THREE from "three";
import { getPointsBuffer } from '../Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';


export function computeConvexCollider (geometry) {
    const points = getPointsBuffer(geometry);
    return new ConvexGeometry(points);
}


export function createConvexHelper (convex) {
    return new THREE.Mesh(
        convex,
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true,transparent: false })
    );
}