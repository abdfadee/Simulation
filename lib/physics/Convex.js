import * as THREE from "three";
import { getPointsBuffer } from './Utility';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';


export function computeConvexGeometry (geometry) {
    const points = getPointsBuffer(geometry);
    return new ConvexGeometry(points);
}


export function createConvexHelper (convex) {
    return new THREE.Mesh(
        convex,
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true,transparent: false })
    );
}


// Compute Surface Area by Summing Triangle Areas
export function computeSurfaceArea(geometry) {
const position = geometry.attributes.position;
const index = geometry.index ? geometry.index.array : null;

let area = 0;
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
}

return area;
}


export function computeVolumetricProperties (geometry, mass , COM) {
const translationMatrix = new THREE.Matrix4().makeTranslation(-COM.x, -COM.y, -COM.z);
geometry = geometry.clone().applyMatrix4(translationMatrix);

const pos = geometry.attributes.position;
const index = geometry.index ? geometry.index.array : null;

let volume = 0;
let inertia = new THREE.Matrix3();

const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const tempInertia = new THREE.Matrix3();

const triangleCount = index ? index.length / 3 : pos.count / 3;

for (let i = 0; i < triangleCount; i++) {
        if (index) {
        v0.fromBufferAttribute(pos, index[i * 3]);
        v1.fromBufferAttribute(pos, index[i * 3 + 1]);
        v2.fromBufferAttribute(pos, index[i * 3 + 2]);
        } else {
        v0.fromBufferAttribute(pos, i * 3);
        v1.fromBufferAttribute(pos, i * 3 + 1);
        v2.fromBufferAttribute(pos, i * 3 + 2);
        }

        // Tetrahedron formed by (0,0,0), v0, v1, v2
        const vol = v0.dot(v1.clone().cross(v2)) / 6;
        volume += vol;

        // Approximate inertia tensor of tetrahedron about origin
        const Ixx = vol * (v0.y**2 + v0.y*v1.y + v1.y**2 + v0.y*v2.y + v1.y*v2.y + v2.y**2 +
                            v0.z**2 + v0.z*v1.z + v1.z**2 + v0.z*v2.z + v1.z*v2.z + v2.z**2) / 60;
        const Iyy = vol * (v0.x**2 + v0.x*v1.x + v1.x**2 + v0.x*v2.x + v1.x*v2.x + v2.x**2 +
                            v0.z**2 + v0.z*v1.z + v1.z**2 + v0.z*v2.z + v1.z*v2.z + v2.z**2) / 60;
        const Izz = vol * (v0.x**2 + v0.x*v1.x + v1.x**2 + v0.x*v2.x + v1.x*v2.x + v2.x**2 +
                            v0.y**2 + v0.y*v1.y + v1.y**2 + v0.y*v2.y + v1.y*v2.y + v2.y**2) / 60;

        tempInertia.set(Ixx, 0, 0, 0, Iyy, 0, 0, 0, Izz);
        inertia.elements[0] += tempInertia.elements[0];
        inertia.elements[4] += tempInertia.elements[4];
        inertia.elements[8] += tempInertia.elements[8];
    }

    const density = mass / volume;
    inertia.multiplyScalar(density);

    return {
        inertiaTensor: inertia,
        volume: volume,
        density
    };
}  