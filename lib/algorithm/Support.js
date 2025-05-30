import { getPointsBuffer } from "../physics/Utility";


export function getSupport(shape1, shape2, d) // vertices of shape 1 and 2 and direction
{
	// Get some point on the minkowski sum (difference really)
	// Do this by getting the farthest point in d
	var dir = d.clone().normalize();

	var p1 = getFarthestPoint(shape1, dir);
	var p2 = getFarthestPoint(shape2, dir.negate());

	return p1.clone().sub(p2);
}



function getFarthestPoint(shape, d) // vertices of shape and direction (normalized)
{
	var vertices = getPointsBuffer(shape);

	// Project all vertices onto shape and get the longest
	var p = vertices[0].clone();
	var l = p.dot(d);

	for(var i = 1; i < vertices.length; ++i)
	{
		var q = vertices[i].clone();
		var proj = q.dot(d);

		if(proj > l)
		{
			p = q;
			l = proj;
		}
	}

	return p;
}