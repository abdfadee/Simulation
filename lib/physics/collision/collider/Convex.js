import * as THREE from "three";
import { getPointsBuffer } from '../../Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { scene } from "../../../renderer/Initialize";


export function computeConvexCollider (geometry) {
    const points = getPointsBuffer(geometry);
    return new ConvexGeometry(points);
}


export function createConvexHelper (body) {
    return new THREE.Mesh(
        body.convex.clone(),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true,transparent: false })
    );
}