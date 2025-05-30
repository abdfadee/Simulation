import * as THREE from "three";
import { getSupport } from "./Support";


export function EPA(simplex, shape1, shape2) {
    // Initialize polytope with simplex points
    const polytope = simplex.map(p => p.clone());
    const faces = [
        0, 1, 2,
        0, 3, 1,
        0, 2, 3,
        1, 3, 2
    ];

    // list: vec4(normal, distance), index: min distance
	let [normals, minFace] = GetFaceNormals(polytope, faces);

    let minNormal = new THREE.Vector3();
    let minDistance = Infinity;

    while (minDistance === Infinity) {
        minNormal.copy(normals[minFace].normal);
        minDistance = normals[minFace].distance;
        
        const support = getSupport(shape1, shape2, minNormal);
        const sDistance = minNormal.dot(support);
        
        if (Math.abs(sDistance - minDistance) > 0.001) {
            minDistance = Infinity;

            const uniqueEdges = [];

            for (let i = 0; i < normals.length; i++) {
                const { normal } = normals[i];

                // Face is visible if the support point is in the same direction as the normal
                if (sameDirection(normal, support)) {
                    const f = i * 3;

                    // Add edges (in clockwise order) and check for uniqueness
                    addIfUniqueEdge(uniqueEdges, faces, f,     f + 1);
                    addIfUniqueEdge(uniqueEdges, faces, f + 1, f + 2);
                    addIfUniqueEdge(uniqueEdges, faces, f + 2, f    );

                    // Remove face by replacing with last 3 indices and popping
                    faces[f + 2] = faces[faces.length - 1]; faces.pop();
                    faces[f + 1] = faces[faces.length - 1]; faces.pop();
                    faces[f    ] = faces[faces.length - 1]; faces.pop();

                    // Remove corresponding normal
                    normals[i] = normals[normals.length - 1];
                    normals.pop();

                    i--; // re-check the swapped-in normal
                }
            }

            const newFaces = [];

            // Add new triangles (edges + support point)
            for (const [i1, i2] of uniqueEdges) {
                newFaces.push(i1, i2, polytope.length); // form new triangle
            }

            // Add the new support point to the polytope
            polytope.push(support);

            // Recalculate normals and find new closest face
            const { normals: newNormals, minFace: newMinFace } = getFaceNormals(polytope, newFaces);

            let oldMinDistance = Infinity;
            for (let i = 0; i < normals.length; i++) {
            if (normals[i].distance < oldMinDistance) {
                oldMinDistance = normals[i].distance;
                minFace = i;
            }
            }

            if (newNormals[newMinFace].distance < oldMinDistance) {
            minFace = newMinFace + normals.length;
            }

            // Merge new data
            faces.push(...newFaces);
            normals.push(...newNormals);
        }
    }

    const collisionPoints = {
        normal: minNormal.clone(), // THREE.Vector3
        penetrationDepth: minDistance + 0.001,
        hasCollision: true,
    };
        
    return collisionPoints;

}


function GetFaceNormals(polytope, faces) {
    const normals = [];
    let minTriangle = 0;
    let minDistance = Infinity;

    for (let i = 0; i < faces.length; i += 3) {
        const a = polytope[faces[i]];
        const b = polytope[faces[i + 1]];
        const c = polytope[faces[i + 2]];

        const ab = new THREE.Vector3().subVectors(b, a);
        const ac = new THREE.Vector3().subVectors(c, a);
        const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();

        let distance = normal.dot(a);

        if (distance < 0) {
        normal.negate();
        distance = -distance;
        }

        normals.push({ normal, distance });

        if (distance < minDistance) {
        minDistance = distance;
        minTriangle = i / 3;
        }
    }

    return { normals, minFace: minTriangle };
}


function addIfUniqueEdge(edges, faces, a, b) {
    const edge = [faces[a], faces[b]];
    const reverseEdge = [faces[b], faces[a]];

    // Search for reverse edge
    const reverseIndex = edges.findIndex(
        ([e1, e2]) => e1 === reverseEdge[0] && e2 === reverseEdge[1]
    );

    if (reverseIndex !== -1) {
        edges.splice(reverseIndex, 1); // remove shared edge
    } else {
        edges.push(edge); // add unique edge
    }
}