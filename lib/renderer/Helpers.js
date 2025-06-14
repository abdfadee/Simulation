import * as THREE from "three";
import { scene } from "../renderer/Initialize";

export function visualizePoint (point) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshBasicMaterial({ color:0xff0000 })
    );
    sphere.position.copy(point);
    scene.add(sphere);
}


export function createConvexHelper (convex) {
    return new THREE.Mesh(
        convex,
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true,transparent: false })
    );
}


export function visualizeContact(contact, size = 0.02, color = 0xff0000) {
    const contactGroup = new THREE.Group();
  
    const { contactPoint, contactNormal, penetrationDepth } = contact;
  
      // Point Marker
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      sphere.position.copy(contactPoint);
      contactGroup.add(sphere);
  
      // Normal Line
      const normalLine = new THREE.ArrowHelper(
        contactNormal,
        contactPoint,
        0.5,
        0x00ff00
      );
      contactGroup.add(normalLine);
  
    
    // Optionally, clear old ones first
    const old = scene.getObjectByName('ContactVisualization');
    if (old) scene.remove(old);
    
  
    contactGroup.name = 'ContactVisualization';
    scene.add(contactGroup);
}


export function visualizeSimplex(points) {
  const simplex = points.map(e => e.point.clone());

  // Remove old simplex visuals (optional if you want real-time updates)
  const old = scene.getObjectByName("simplexHelper");
  if (old) scene.remove(old);

  const group = new THREE.Group();
  group.name = "simplexHelper";

  const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);

  for (const point of simplex) {
      const sphere = new THREE.Mesh(sphereGeometry, pointMaterial);
      sphere.position.copy(point);
      group.add(sphere);
  }

  if (simplex.length >= 2) {
      const points = [];
      for (let i = 0; i < simplex.length; i++) {
          points.push(simplex[i]);
          points.push(simplex[(i + 1) % simplex.length]);
      }

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lines = new THREE.LineSegments(lineGeometry, material);
      group.add(lines);
  }

  // If it's a tetrahedron (4 points), draw its faces
  if (simplex.length === 4) {
      const faceMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          side: THREE.DoubleSide,
          opacity: 0.3,
          transparent: true,
      });

      const indices = [
          [0, 1, 2],
          [0, 2, 3],
          [0, 3, 1],
          [1, 3, 2]
      ];

      for (const [a, b, c] of indices) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
              simplex[a], simplex[b], simplex[c]
          ]);
          geometry.setIndex([0, 1, 2]);
          geometry.computeVertexNormals();

          const mesh = new THREE.Mesh(geometry, faceMaterial);
          group.add(mesh);
      }
  }

  scene.add(group);
}