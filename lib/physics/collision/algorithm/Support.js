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
	let vertex = new THREE.Vector3();
	let maxPoint = new THREE.Vector3();
	let maxDistance = -Infinity;
	for (const v of shape.convex) {
			vertex.copy(v);
			vertex.applyMatrix4(shape.representation.matrixWorld);
			const distance = vertex.dot(direction);
			if (distance > maxDistance) {
			maxDistance = distance;
			maxPoint.copy(vertex);
		}
	}
	return maxPoint
}