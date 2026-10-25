import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * Clouds.js - Raft-Style Soft Fluffy Cloud Engine
 * Uses MeshLambertMaterial to catch sunlight and atmosphere naturally.
 * Zero unlit glow / blown-out emissive artifacts.
 */

export class CloudManager {
  constructor(scene, cloudCount = 14) {
    this.scene = scene;
    this.cloudCount = cloudCount;
    this.cloudClusters = [];
    this.cloudGroup = new THREE.Group();

    this.initClouds();
    this.scene.add(this.cloudGroup);
  }

  initClouds() {
    const puffTexture = TextureGenerator.createCloudPuffTexture();

    // Sửa Mây Chói Hơn Mặt Trời:
    // Đổi vật liệu sang MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false })
    // Đảm bảo thuộc tính emissive được xóa bỏ hoặc đặt thành 0x000000.
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      emissive: 0x000000,
      map: puffTexture,
      side: THREE.DoubleSide
    });
    this.cloudMaterial = cloudMat;

    const quadGeo = new THREE.PlaneGeometry(1, 1);

    for (let i = 0; i < this.cloudCount; i++) {
      const cluster = new THREE.Group();
      const puffCount = 8 + Math.floor(Math.random() * 5); // 8-12 overlapping puffs

      for (let p = 0; p < puffCount; p++) {
        const mesh = new THREE.Mesh(quadGeo, cloudMat.clone());
        const scale = 40 + Math.random() * 30;
        mesh.scale.set(scale, scale * (0.62 + Math.random() * 0.32), 1);

        mesh.position.set(
          (Math.random() - 0.5) * 55,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 45
        );

        // Lay mostly horizontal with gentle natural billow tilt
        mesh.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        mesh.rotation.z = Math.random() * Math.PI * 2;

        cluster.add(mesh);
      }

      // Spread high in the sky (y = 125 - 155)
      const angle = (i / this.cloudCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 60 + Math.random() * 180;

      cluster.position.set(
        Math.cos(angle) * dist,
        125 + Math.random() * 25,
        Math.sin(angle) * dist
      );

      cluster.userData.speed = 1.1 + Math.random() * 1.5;
      this.cloudGroup.add(cluster);
      this.cloudClusters.push(cluster);
    }
  }

  setCloudColor(color, opacity = 0.6) {
    this.cloudClusters.forEach(cluster => {
      cluster.children.forEach(mesh => {
        if (mesh.material) {
          mesh.material.color.copy(color);
          mesh.material.opacity = opacity;
          if (mesh.material.emissive) {
            mesh.material.emissive.set(0x000000);
          }
        }
      });
    });
  }

  update(delta) {
    // Drift clouds across the ocean sky
    this.cloudClusters.forEach(cluster => {
      cluster.position.x += cluster.userData.speed * delta;
      if (cluster.position.x > 340) {
        cluster.position.x = -340;
      }
    });
  }
}
