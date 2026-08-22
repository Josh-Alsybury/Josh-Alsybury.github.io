import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const loader = new FBXLoader();

export function loadModel(path, scene, { position = [0, 0, 0], scale = 1 } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (object) => {
        object.position.set(...position);
        object.scale.setScalar(scale);
        scene.add(object);
        resolve(object);
      },
      undefined,
      (error) => reject(error)
    );
  });
}