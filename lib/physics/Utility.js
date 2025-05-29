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
            const normalAttr = geometry.attributes.normal;
            const skinIndexAttr = geometry.attributes.skinIndex;
            const skinWeightAttr = geometry.attributes.skinWeight;

            if (!skinIndexAttr || !skinWeightAttr) {
                console.warn(`Skipping SkinnedMesh "${child.name}" with missing skin attributes`);
                return;
            }

            const boneMatrices = skeleton.boneMatrices;
            const vertex = new THREE.Vector3();
            const normal = new THREE.Vector3();
            const skinned = new THREE.Vector3();
            const skinnedNormal = new THREE.Vector3();
            const boneMatrix = new THREE.Matrix4();
            const normalMatrix = new THREE.Matrix3();

            const skinIndices = new THREE.Vector4();
            const skinWeights = new THREE.Vector4();

            const skinnedPositions = new Float32Array(positionAttr.count * 3);
            const skinnedNormals = normalAttr ? new Float32Array(normalAttr.count * 3) : null;

            for (let i = 0; i < positionAttr.count; i++) {
                vertex.fromBufferAttribute(positionAttr, i);
                if (normalAttr) normal.fromBufferAttribute(normalAttr, i);

                skinIndices.fromBufferAttribute(skinIndexAttr, i);
                skinWeights.fromBufferAttribute(skinWeightAttr, i);

                skinned.set(0, 0, 0);
                skinnedNormal.set(0, 0, 0);

                for (let j = 0; j < 4; j++) {
                    const weight = skinWeights.getComponent(j);
                    if (weight === 0) continue;

                    const boneIndex = skinIndices.getComponent(j);
                    if (boneIndex < 0 || boneIndex >= skeleton.bones.length) continue;

                    boneMatrix.fromArray(boneMatrices, boneIndex * 16);

                    skinned.add(vertex.clone().applyMatrix4(boneMatrix).multiplyScalar(weight));

                    if (normalAttr) {
                        normalMatrix.setFromMatrix4(boneMatrix);
                        const transformedNormal = normal.clone().applyMatrix3(normalMatrix).normalize().multiplyScalar(weight);
                        skinnedNormal.add(transformedNormal);
                    }
                }

                skinnedPositions.set([skinned.x, skinned.y, skinned.z], i * 3);
                if (normalAttr) skinnedNormals.set([skinnedNormal.x, skinnedNormal.y, skinnedNormal.z], i * 3);
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(skinnedPositions, 3));
            if (normalAttr) {
                geometry.setAttribute('normal', new THREE.BufferAttribute(skinnedNormals, 3));
            } else {
                geometry.computeVertexNormals();
            }
        }
        else {
            geometry.applyMatrix4(child.matrixWorld);
        }

        // Strip unwanted attributes
        for (const name of Object.keys(geometry.attributes)) {
            if (name !== 'position' && name !== 'normal') {
                geometry.deleteAttribute(name);
            }
        }

        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
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