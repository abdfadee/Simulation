import * as THREE from "three";
import { getPointsBuffer } from '../Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';


export function computeConvexCollider (geometry) {
    const points = getPointsBuffer(geometry);
    const convex = new ConvexGeometry(points);
    return getPointsBuffer(convex);
}


export function createConvexHelper (convex) {
    return new THREE.Mesh(
        new ConvexGeometry(convex),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true,transparent: false })
    );
}