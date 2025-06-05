import * as THREE from "three";
import { getPointsBuffer } from './Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';


export function computeConvexGeometry (geometry) {
    const points = getPointsBuffer(geometry);
    return new ConvexGeometry(points);
}


// Compute Surface Area by Summing Triangle Areas
export function computeProperties(geometry,mass) {
    const position = geometry.attributes.position;
    const index = geometry.index ? geometry.index.array : null;

    let area = 0;
    let volume = 0;
    const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
    const edge1 = new THREE.Vector3(), edge2 = new THREE.Vector3(), cross = new THREE.Vector3();

    const triangleCount = index ? index.length / 3 : position.count / 3;

    for (let i = 0; i < triangleCount; i++) {
        if (index) {
        v0.fromBufferAttribute(position, index[i * 3]);
        v1.fromBufferAttribute(position, index[i * 3 + 1]);
        v2.fromBufferAttribute(position, index[i * 3 + 2]);
        } else {
        v0.fromBufferAttribute(position, i * 3);
        v1.fromBufferAttribute(position, i * 3 + 1);
        v2.fromBufferAttribute(position, i * 3 + 2);
        }

        // Triangle area = 0.5 * |(v1 - v0) x (v2 - v0)|
        edge1.subVectors(v1, v0);
        edge2.subVectors(v2, v0);
        cross.crossVectors(edge1, edge2);
        area += 0.5 * cross.length();

        // Tetrahedron formed by (0,0,0), v0, v1, v2
        const vol = v0.dot(v1.clone().cross(v2)) / 6;
        volume += vol;
    }

    const density = mass / volume;

    return {
        area,
        volume,
        density
    };
}