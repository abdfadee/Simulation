import * as THREE from "three";
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { getPointsBuffer } from "../../Utility";


export function generateConvexGeometry () {
    if (!this.convex) computeConvexGeometry(this);
}


function computeConvexGeometry (mesh) {
    const mergedGeometry = mesh.getMergedGeometry().clone();
    const points = getPointsBuffer(mergedGeometry);
    const hullGeometry = new ConvexGeometry(points);
    mesh.convex = hullGeometry;
}


export function createConvexHelper () {
    const helperMesh = new THREE.Mesh(
        this.convex,
        new THREE.MeshBasicMaterial({wireframe: true})
    );
    this.add(helperMesh);
}


THREE.Object3D.prototype.generateConvexGeometry = generateConvexGeometry;
THREE.Object3D.prototype.createConvexHelper = createConvexHelper;