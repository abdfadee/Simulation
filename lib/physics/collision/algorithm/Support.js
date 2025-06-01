import * as THREE from "three";
import { getPointsBuffer } from "../../Utility";


export function getSupport(shape1, shape2, d)
{
	const direction = d.clone().normalize();
	const supportA = findFurthestPoint(shape1, direction);
	const supportB = findFurthestPoint(shape2, direction.clone().negate());
	return {
		point: supportA.clone().sub(supportB),
		supportA: supportA.clone(),
		supportB: supportB.clone(),
	};
}


function findFurthestPoint(shape, direction) {
	const vertices = getPointsBuffer(shape);
	let maxPoint = null;
	let maxDistance = -Infinity;
	for (const vertex of vertices) {
			const distance = vertex.dot(direction);
			if (distance > maxDistance) {
			maxDistance = distance;
			maxPoint = vertex;
		}
	}
	return maxPoint ? maxPoint.clone() : new THREE.Vector3(); // Safe fallback
}