import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

// Patch THREE to support BVH raycasting
THREE.Mesh.prototype.raycast = acceleratedRaycast;

class MeshCollider {
  constructor(mesh) {
    if (!(mesh instanceof THREE.Mesh)) {
      throw new Error('MeshCollider requires a THREE.Mesh');
    }

    this.mesh = mesh;
    this.geometry = mesh.geometry;

    // Build BVH
    if (!this.geometry.boundsTree) {
      computeBoundsTree(this.geometry);
    }
  }

  // Fast ray-mesh intersection
  intersectsRay(origin, direction) {
    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, Infinity);
    const hits = raycaster.intersectObject(this.mesh, true);
    return hits.length > 0 ? hits : null;
  }

  // Fast point-to-mesh distance using BVH
  closestPointDistance(point) {
    const target = new THREE.Vector3();
    const geometry = this.geometry;
    let minDistSq = Infinity;

    geometry.boundsTree.closestPointToPoint(
      this.mesh,
      point,
      target,
      () => true // no filtering
    );

    return target.distanceTo(point);
  }

  // Fast mesh-to-mesh triangle intersection
  intersectsMesh(otherCollider) {
    const meshA = this.mesh;
    const meshB = otherCollider.mesh;

    let intersects = false;

    MeshBVH.intersectsGeometry(
      meshA.geometry.boundsTree,
      meshB.geometry,
      meshA.matrixWorld,
      meshB.matrixWorld,
      {
        intersectsTriangles: () => {
          intersects = true;
          return true; // stop at first hit
        }
      }
    );

    return intersects;
  }

  // Optional: Dispose BVH to free memory
  dispose() {
    disposeBoundsTree(this.geometry);
  }
}

export {MeshCollider};