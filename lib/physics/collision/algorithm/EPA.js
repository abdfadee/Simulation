import * as THREE from "three";
import { getSupport } from "./Support";


///////////////////////////////////
// EPA algorithm
///////////////////////////////////
const MAX_ITERATIONS = 64;
const TOLERANCE = Number.EPSILON;

export function EPA(polytope, shape1, shape2) {
    const faces = [
        0, 1, 2,
        0, 3, 1,
        0, 2, 3,
        1, 3, 2
    ];

	let {normals, minFace} = getFaceNormals(polytope, faces);

    let minNormal = new THREE.Vector3();
    let minDistance = Infinity;

    let iterations = 0;

    while (minDistance === Infinity && iterations++ < MAX_ITERATIONS) {
        minNormal.copy(normals[minFace].normal);
        minDistance = normals[minFace].distance;
        
        const support = getSupport(shape1, shape2, minNormal);
        const sDistance = minNormal.dot(support.point.clone());
        
        if (Math.abs(sDistance - minDistance) > 0.001) {
            minDistance = Infinity;

            const uniqueEdges = [];

            for (let i = 0; i < normals.length; i++) {
                const { normal } = normals[i];

                // Face is visible if the support point is in the same direction as the normal
                if ( normal.dot(support.point) > normal.dot(polytope[faces[i*3]].point)) {
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

            if (newNormals.length === 0 || newMinFace < 0 || newMinFace >= newNormals.length) {
                // Handle the error gracefully - e.g.:
                // You can skip merging or break the loop, or try some fallback.
                console.warn("EPA: No valid new face normals found");
                return null; // Or handle otherwise
            }

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

    const contactPoint = calculateContactPoint(polytope, faces, minFace);

    const collisionPoints = {
        contactPoint,
        contactNormal: minNormal.clone(), // THREE.Vector3
        penetrationDepth: minDistance + 0.001,
        hasCollision: true,
    };
        
    return collisionPoints;

}


function getFaceNormals(polytope, faces) {
    const normals = [];
    let minTriangle = 0;
    let minDistance = Infinity;

    for (let i = 0; i < faces.length; i += 3) {
        // Check valid indices
        if (faces[i] === undefined || faces[i + 1] === undefined || faces[i + 2] === undefined) continue;
        if (!polytope[faces[i]] || !polytope[faces[i + 1]] || !polytope[faces[i + 2]]) continue;

        const a = polytope[faces[i]].point.clone();
        const b = polytope[faces[i + 1]].point.clone();
        const c = polytope[faces[i + 2]].point.clone();

        const ab = new THREE.Vector3().subVectors(b, a);
        const ac = new THREE.Vector3().subVectors(c, a);
        const normal = new THREE.Vector3().crossVectors(ab, ac);
        const area = normal.lengthSq();
        if (area < TOLERANCE) continue; // Skip invalid face

        normal.normalize();

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


function sameDirection(direction, ao) {
	return direction.dot(ao) > TOLERANCE;
}



// Given the polytope, faces, and the minFace index,
// calculate the contact point on the Minkowski difference closest to the origin
// Then convert that to a contact point on shape1 (or shape2) using barycentric weights

function calculateContactPoint(polytope, faces, minFace) {
    // Get the indices of the face vertices
    const i0 = faces[minFace * 3];
    const i1 = faces[minFace * 3 + 1];
    const i2 = faces[minFace * 3 + 2];

    const p0 = polytope[i0].point.clone();
    const p1 = polytope[i1].point.clone();
    const p2 = polytope[i2].point.clone();

    // Project origin onto triangle p0,p1,p2 using barycentric coordinates
    const contactOnMinkowski = closestPointOnTriangleToOrigin(p0, p1, p2);

    // Now calculate barycentric coordinates of contactOnMinkowski relative to p0, p1, p2
    const bary = barycentricCoordinates(contactOnMinkowski, p0, p1, p2);

    // Use barycentric weights to get contact points on original shapes
    // polytope vertices store supportA and supportB points from shapes

    const supportA0 = polytope[i0].supportA;
    const supportA1 = polytope[i1].supportA;
    const supportA2 = polytope[i2].supportA;

    // Contact point on shape1
    const contactPoint = new THREE.Vector3()
        .set(0, 0, 0)
        .addScaledVector(supportA0, bary.u)
        .addScaledVector(supportA1, bary.v)
        .addScaledVector(supportA2, bary.w);

    return contactPoint;
}


// Helper: Get barycentric coordinates (u,v,w) for point p in triangle abc
function barycentricCoordinates(p, a, b, c) {
    const v0 = b.clone().sub(a);
    const v1 = c.clone().sub(a);
    const v2 = p.clone().sub(a);

    const d00 = v0.dot(v0);
    const d01 = v0.dot(v1);
    const d11 = v1.dot(v1);
    const d20 = v2.dot(v0);
    const d21 = v2.dot(v1);

    const denom = d00 * d11 - d01 * d01;

    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1.0 - v - w;

    return { u, v, w };
}

// Helper: find closest point on triangle abc to origin
function closestPointOnTriangleToOrigin(a, b, c) {
    // Using Ericson's Real-Time Collision Detection algorithm for closest point
    // Code adapted and simplified for origin (0,0,0)

    // Check vertices
    const zero = new THREE.Vector3(0,0,0);
    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const ap = zero.clone().sub(a);

    const d1 = ab.dot(ap);
    const d2 = ac.dot(ap);
    if (d1 <= 0 && d2 <= 0) return a; // bary (1,0,0)

    const bp = zero.clone().sub(b);
    const d3 = ab.dot(bp);
    const d4 = ac.dot(bp);
    if (d3 >= 0 && d4 <= d3) return b; // bary (0,1,0)

    const vc = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
        const v = d1 / (d1 - d3);
        return a.clone().add(ab.multiplyScalar(v)); // bary (1-v,v,0)
    }

    const cp = zero.clone().sub(c);
    const d5 = ab.dot(cp);
    const d6 = ac.dot(cp);
    if (d6 >= 0 && d5 <= d6) return c; // bary (0,0,1)

    const vb = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
        const w = d2 / (d2 - d6);
        return a.clone().add(ac.multiplyScalar(w)); // bary (1-w,0,w)
    }

    const va = d3 * d6 - d5 * d4;
    if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
        const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
        return b.clone().add(c.clone().sub(b).multiplyScalar(w)); // bary (0,1-w,w)
    }

    // Otherwise inside face region
    const denom = 1 / (va + vb + vc);
    const v = vb * denom;
    const w = vc * denom;

    return a.clone()
        .add(ab.multiplyScalar(v))
        .add(ac.multiplyScalar(w));
}
