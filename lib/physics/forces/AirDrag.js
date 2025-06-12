import * as THREE from 'three';
import convexHull from 'monotone-convex-hull-2d';


export function getProjectedArea (body) {
    const projectedPoints = projectVerticesToPlane(body.vertices,body.velocity.clone().negate());
    const hullIndices = convexHull(projectedPoints);
    const polygon = hullIndices.map(i => projectedPoints[i]);
    return polygonArea(polygon);
}


// Projects 3D vertices onto a 2D plane perpendicular to the given direction.
function projectVerticesToPlane(vertices, direction) {
    const dir = direction.clone().normalize();

    // Choose basis vectors for the projection plane
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dir.dot(up)) > 0.99) up.set(1, 0, 0); // avoid parallel
    const basisX = new THREE.Vector3().crossVectors(up, dir).normalize();
    const basisY = new THREE.Vector3().crossVectors(dir, basisX).normalize();

    const projectedPoints = [];
    for (const _vertex of vertices) {

        // Project onto the plane using basis vectors
        const x = _vertex.dot(basisX);
        const y = _vertex.dot(basisY);
        projectedPoints.push([x, y]);
    }

    return projectedPoints;
}


// polygonPoints is an array of [x, y] pairs in order
function polygonArea(polygonPoints) {
    let area = 0;
    const n = polygonPoints.length;

    for (let i = 0; i < n; i++) {
        const [x0, y0] = polygonPoints[i];
        const [x1, y1] = polygonPoints[(i + 1) % n];
        area += x0 * y1 - x1 * y0;
    }

    return Math.abs(area / 2);
}