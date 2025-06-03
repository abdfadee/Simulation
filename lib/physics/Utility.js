import * as THREE from "three";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export function getMatrixToA (meshA,meshB) {
    meshA.updateMatrixWorld(true);
    meshB.updateMatrixWorld(true);
    const matrixToA = new THREE.Matrix4()
        .copy(meshA.matrixWorld)
        .invert()
        .multiply(meshB.matrixWorld);
    return matrixToA;
}


export function computeMergedGeometry(root) {
    const geometries = [];

    root.updateMatrixWorld(true,true);
    root.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;

        const geometry = child.geometry.clone();

        // SKINNED MESH HANDLING
         if (child.isSkinnedMesh) {
            const skeleton = child.skeleton;
            skeleton.update();

            const positionAttr = geometry.attributes.position;
            const skinIndexAttr = geometry.attributes.skinIndex;
            const skinWeightAttr = geometry.attributes.skinWeight;

            if (!skinIndexAttr || !skinWeightAttr) {
                console.warn(`Skipping SkinnedMesh "${child.name}" with missing skin attributes`);
                return;
            }

            const boneMatrices = skeleton.boneMatrices;
            const vertex = new THREE.Vector3();
            const skinned = new THREE.Vector3();
            const boneMatrix = new THREE.Matrix4();

            const skinIndices = new THREE.Vector4();
            const skinWeights = new THREE.Vector4();

            const skinnedPositions = new Float32Array(positionAttr.count * 3);

            for (let i = 0; i < positionAttr.count; i++) {
                vertex.fromBufferAttribute(positionAttr, i);

                skinIndices.fromBufferAttribute(skinIndexAttr, i);
                skinWeights.fromBufferAttribute(skinWeightAttr, i);

                skinned.set(0, 0, 0);

                for (let j = 0; j < 4; j++) {
                    const weight = skinWeights.getComponent(j);
                    if (weight === 0) continue;

                    const boneIndex = skinIndices.getComponent(j);
                    if (boneIndex < 0 || boneIndex >= skeleton.bones.length) continue;

                    boneMatrix.fromArray(boneMatrices, boneIndex * 16);
                    skinned.add(vertex.clone().applyMatrix4(boneMatrix).multiplyScalar(weight));
                }

                skinnedPositions.set([skinned.x, skinned.y, skinned.z], i * 3);
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(skinnedPositions, 3));
        }
        else {
            geometry.applyMatrix4(child.matrixWorld);
        }

        // Strip unwanted attributes
        for (const name of Object.keys(geometry.attributes)) {
            if (name !== 'position') {
                geometry.deleteAttribute(name);
            }
        }

        geometry.morphTargetsRelative = false;
        geometry.morphAttributes = {};
        geometries.push(geometry);
    });

    return BufferGeometryUtils.mergeGeometries(geometries, false);
}


export function getPointsBuffer (geometry) {
    const points = [];
    const posAttr = geometry.getAttribute('position');
    for (let i = 0; i < posAttr.count; i++) {
    points.push(new THREE.Vector3().fromBufferAttribute(posAttr, i));
    }
    return points;
}