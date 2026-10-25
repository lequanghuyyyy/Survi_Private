import * as THREE from 'three';
import { getTerrainHeight } from './Island.js';
import { TextureGenerator } from './TextureGenerator.js';
import { soundFX } from './SoundFX.js';
import { ITEM_DEFS } from './Inventory.js';
import { RECIPES } from './Crafting.js';

/**
 * Building.js - Hologram placement preview and interactive placed structures:
 * Campfire, Shelter, Rain Catcher, Raft Foundation, Wooden Stairs, Wooden Wall
 */

export class BuildingManager {
  constructor(scene, inventory, survivalStats, dayNightCycle) {
    this.scene = scene;
    this.inventory = inventory;
    this.survivalStats = survivalStats;
    this.dayNightCycle = dayNightCycle;

    this.activeBuildings = []; // { type, mesh, position, data, update(delta, time) }
    this.worldColliders = [];  // Solid collision meshes for physics step-up and blocking

    // Hologram preview container
    this.hologramGroup = new THREE.Group();
    this.hologramGroup.visible = false;
    this.scene.add(this.hologramGroup);

    this.currentBuildType = null;
    this.isValidPlacement = false;
    this.targetPlacementPos = new THREE.Vector3();
    this.hologramRotationY = 0; // Building placement rotation angle around Y axis

    // Cache model builders
    this.structureBuilders = {
      campfire: () => this.createCampfireModel(),
      shelter: () => this.createShelterModel(),
      water_collector: () => this.createWaterCollectorModel(),
      raft_foundation: () => this.createRaftFoundationModel(),
      wooden_stairs: () => this.createWoodenStairsModel(),
      wooden_wall: () => this.createWoodenWallModel()
    };

    // Spawn authentic starter Raft off the shoreline
    this.spawnStarterRaft();
  }

  /* ================= 3D MODELS BUILDERS ================= */

  createCampfireModel(isHologram = false) {
    const group = new THREE.Group();

    // Ring of stones
    const stoneGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const stoneMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x686c75, roughness: 0.9, flatShading: true });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(Math.cos(angle) * 0.7, 0.12, Math.sin(angle) * 0.7);
      stone.scale.set(1 + Math.random() * 0.4, 0.8, 1 + Math.random() * 0.3);
      stone.castShadow = !isHologram;
      group.add(stone);
    }

    // Crossed logs
    const logGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.1, 8);
    const logMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0x8d5c32,
          map: TextureGenerator.createWoodTexture(),
          roughness: 0.82
        });

    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.rotation.z = Math.PI / 2.6;
      log.rotation.y = (i / 4) * Math.PI * 2;
      log.position.y = 0.22;
      log.castShadow = !isHologram;
      group.add(log);
    }

    // Smoldering red-hot ember coal bed underneath (Đáy than hồng rực đỏ âm ỉ)
    const coalGeo = new THREE.SphereGeometry(0.35, 8, 8);
    coalGeo.scale(1.0, 0.25, 1.0);
    const coalMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0x1f1412,
          emissive: 0xff3300,
          emissiveIntensity: 1.2,
          roughness: 0.90
        });
    const coalBed = new THREE.Mesh(coalGeo, coalMat);
    coalBed.position.set(0, 0.08, 0);
    coalBed.castShadow = !isHologram;
    group.add(coalBed);

    // Fire flame meshes, light & flying spark embers (only if not hologram)
    let fireLight = null;
    const flames = [];
    let embersMesh = null;
    let emberData = null;

    if (!isHologram) {
      // Warm flickering point light (PointLight 0xff7700, 2.5, 14)
      fireLight = new THREE.PointLight(0xff7700, 2.5, 14);
      fireLight.position.set(0, 0.8, 0);
      fireLight.castShadow = true;
      group.add(fireLight);

      // 3 Crossed fire flame planes (0°, 60°, 120°) - nhìn rõ cả ban ngày lẫn ban đêm
      const softGlowTex = TextureGenerator.createSoftGlowTexture();
      const flameMat = new THREE.MeshBasicMaterial({
        map: softGlowTex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.NormalBlending, // Nhìn rõ cả ban ngày
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const flameGeo = new THREE.PlaneGeometry(0.75, 1.05);
      flameGeo.translate(0, 0.525, 0);

      const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
      for (let i = 0; i < 3; i++) {
        const flameMesh = new THREE.Mesh(flameGeo, flameMat);
        flameMesh.position.y = 0.45; // Nâng cao vượt lên trên các thanh củi
        flameMesh.rotation.y = angles[i];
        flameMesh.userData.noCollision = true;
        flameMesh.raycast = () => {};
        group.add(flameMesh);
        flames.push(flameMesh);
      }

      // Flying Sparks / Embers Particle System (50 swirling glowing particles with soft circular texture and vertex colors)
      const emberCount = 50;
      const emberPositions = new Float32Array(emberCount * 3);
      const emberColors = new Float32Array(emberCount * 3);
      emberData = [];

      for (let i = 0; i < emberCount; i++) {
        const r = Math.random() * 0.32;
        const th = Math.random() * Math.PI * 2;
        const baseY = 0.20;
        const maxHeight = 1.6 + Math.random() * 1.0;
        const y = baseY + Math.random() * (maxHeight - baseY);

        emberPositions[i * 3] = Math.cos(th) * r;
        emberPositions[i * 3 + 1] = y;
        emberPositions[i * 3 + 2] = Math.sin(th) * r;

        const prog = Math.min(1.0, Math.max(0.0, (y - baseY) / (maxHeight - baseY)));
        emberColors[i * 3] = 1.0 - prog * 0.15;
        emberColors[i * 3 + 1] = 0.85 - prog * 0.65;
        emberColors[i * 3 + 2] = 0.20 - prog * 0.15;

        emberData.push({
          angle: th,
          radius: r,
          baseY: baseY,
          y: y,
          vy: 0.75 + Math.random() * 0.75,
          rotSpeed: (Math.random() - 0.5) * 2.2,
          maxHeight: maxHeight
        });
      }

      const emberGeo = new THREE.BufferGeometry();
      emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
      emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));

      const emberMat = new THREE.PointsMaterial({
        size: 0.12,
        map: TextureGenerator.createSparkTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
      });
      embersMesh = new THREE.Points(emberGeo, emberMat);
      embersMesh.userData.noCollision = true;
      embersMesh.raycast = () => {};
      group.add(embersMesh);
    }

    return { group, fireLight, flames, embersMesh, emberData, coalBed };
  }

  createShelterModel(isHologram = false) {
    const group = new THREE.Group();

    const woodMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0x8d5c32,
          map: TextureGenerator.createWoodTexture(),
          roughness: 0.82
        });

    const leafMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85, side: THREE.DoubleSide });

    // 4 Main A-frame support poles
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.1, 2.6, 8);

    // Front arch
    const pole1 = new THREE.Mesh(poleGeo, woodMat);
    pole1.position.set(-0.85, 1.1, 1.0);
    pole1.rotation.z = -0.55;
    pole1.castShadow = !isHologram;
    group.add(pole1);

    const pole2 = new THREE.Mesh(poleGeo, woodMat);
    pole2.position.set(0.85, 1.1, 1.0);
    pole2.rotation.z = 0.55;
    pole2.castShadow = !isHologram;
    group.add(pole2);

    // Back arch
    const pole3 = new THREE.Mesh(poleGeo, woodMat);
    pole3.position.set(-0.85, 1.1, -1.0);
    pole3.rotation.z = -0.55;
    pole3.castShadow = !isHologram;
    group.add(pole3);

    const pole4 = new THREE.Mesh(poleGeo, woodMat);
    pole4.position.set(0.85, 1.1, -1.0);
    pole4.rotation.z = 0.55;
    pole4.castShadow = !isHologram;
    group.add(pole4);

    // Ridge beam across top
    const ridgeGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
    const ridge = new THREE.Mesh(ridgeGeo, woodMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.set(0, 2.1, 0);
    ridge.castShadow = !isHologram;
    group.add(ridge);

    // Palm leaf thatch roof (slanted sides)
    const roofGeo = new THREE.BoxGeometry(2.3, 0.08, 2.2);

    const roofL = new THREE.Mesh(roofGeo, leafMat);
    roofL.position.set(-0.75, 1.1, 0);
    roofL.rotation.z = 0.95;
    roofL.castShadow = !isHologram;
    group.add(roofL);

    const roofR = new THREE.Mesh(roofGeo, leafMat);
    roofR.position.set(0.75, 1.1, 0);
    roofR.rotation.z = -0.95;
    roofR.castShadow = !isHologram;
    group.add(roofR);

    // Sleeping bed of dried leaves inside
    const bedGeo = new THREE.BoxGeometry(1.0, 0.12, 1.6);
    const bedMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x8b7d3b, roughness: 1.0 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0, 0.06, 0);
    group.add(bed);

    return { group };
  }

  createWaterCollectorModel(isHologram = false) {
    const group = new THREE.Group();

    const woodMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 0.85 });

    // 4 Corner upright posts
    const postGeo = new THREE.CylinderGeometry(0.07, 0.08, 1.8, 8);
    const postPositions = [
      [-0.6, 0.9, -0.6],
      [0.6, 0.9, -0.6],
      [-0.6, 0.9, 0.6],
      [0.6, 0.9, 0.6]
    ];

    postPositions.forEach(([x, y, z]) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(x, y, z);
      post.castShadow = !isHologram;
      group.add(post);
    });

    // Catchment tarp / inverted pyramid funnel
    const tarpGeo = new THREE.ConeGeometry(0.9, 0.6, 4);
    tarpGeo.rotateX(Math.PI);
    const tarpMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x2e6b35, roughness: 0.7, side: THREE.DoubleSide });
    const tarp = new THREE.Mesh(tarpGeo, tarpMat);
    tarp.position.set(0, 1.45, 0);
    tarp.castShadow = !isHologram;
    group.add(tarp);

    // Collection basin
    const basinGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.5, 12);
    const basin = new THREE.Mesh(basinGeo, woodMat);
    basin.position.set(0, 0.25, 0);
    basin.castShadow = !isHologram;
    group.add(basin);

    let waterMesh = null;
    if (!isHologram) {
      const waterGeo = new THREE.CircleGeometry(0.42, 12);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x00b4d8,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88
      });
      waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(0, 0.42, 0);
      waterMesh.name = 'waterMesh';
      waterMesh.userData.isWater = true;
      waterMesh.userData.noCollision = true;
      waterMesh.raycast = () => {};
      group.add(waterMesh);
    }

    return { group, waterMesh };
  }

  /**
   * RAFT WOODEN FOUNDATION (Matching Raft Reference Image 1)
   * 8 individual wooden deck planks with natural gaps, cross beams,
   * buoyant float barrels, and corner rope lashings.
   */
  createRaftFoundationModel(isHologram = false) {
    const group = new THREE.Group();
    const woodTex = TextureGenerator.createRaftPlankTexture();

    const woodMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          map: woodTex,
          color: 0xdfbe8c,
          roughness: 0.75,
          metalness: 0.02
        });

    const timberMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0x7c4f28,
          roughness: 0.82
        });

    const barrelMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0x206378,
          roughness: 0.55,
          metalness: 0.3
        });

    // 8 Individual wooden deck planks with natural gaps
    const plankWidth = 0.44;
    const plankLength = 3.6;
    const plankThickness = 0.08;
    for (let i = 0; i < 8; i++) {
      const zOffset = (i - 3.5) * (plankWidth + 0.015);
      const plankGeo = new THREE.BoxGeometry(plankLength, plankThickness, plankWidth);
      const plank = new THREE.Mesh(plankGeo, woodMat);
      plank.position.set(0, 0.04, zOffset);
      plank.userData.isRaftFloor = true;
      plank.castShadow = !isHologram;
      plank.receiveShadow = !isHologram;
      group.add(plank);
    }

    // 2 Longitudinal cross-support timber beams underneath
    [-1.2, 1.2].forEach(xOffset => {
      const beamGeo = new THREE.BoxGeometry(0.14, 0.16, 3.7);
      const beam = new THREE.Mesh(beamGeo, timberMat);
      beam.position.set(xOffset, -0.08, 0);
      beam.castShadow = !isHologram;
      beam.receiveShadow = !isHologram;
      group.add(beam);
    });

    // 2 Buoyant float barrels underneath
    [-0.9, 0.9].forEach(zOffset => {
      const barrelGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.4, 12);
      barrelGeo.rotateZ(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(0, -0.28, zOffset);
      barrel.castShadow = !isHologram;
      barrel.receiveShadow = !isHologram;
      group.add(barrel);
    });

    // Corner rope lashings
    const ropeMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.9 });
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([rx, rz]) => {
      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 6, 10), ropeMat);
      rope.position.set(rx, 0.04, rz);
      rope.rotation.x = Math.PI / 2;
      group.add(rope);
    });

    return { group };
  }

  /**
   * RAFT WOODEN STAIRS (Matching Raft Reference Image 1)
   */
  createWoodenStairsModel(isHologram = false) {
    const group = new THREE.Group();
    const woodTex = TextureGenerator.createWoodTexture();

    const woodMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          map: woodTex,
          color: 0xc89f68,
          roughness: 0.75
        });

    const treadMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          color: 0xd9b382,
          roughness: 0.72
        });

    // Slanted side stringers
    const stringerGeo = new THREE.BoxGeometry(0.09, 0.18, 3.8);
    [-0.75, 0.75].forEach(xOff => {
      const stringer = new THREE.Mesh(stringerGeo, woodMat);
      stringer.position.set(xOff, 1.25, 1.25);
      stringer.rotation.x = -Math.PI / 4;
      stringer.castShadow = !isHologram;
      group.add(stringer);
    });

    // 7 Step treads with beveled wooden planks
    for (let s = 0; s < 7; s++) {
      const t = s / 6;
      const stepY = t * 2.3 + 0.15;
      const stepZ = t * 2.4 + 0.1;

      const treadGeo = new THREE.BoxGeometry(1.4, 0.06, 0.32);
      const tread = new THREE.Mesh(treadGeo, treadMat);
      tread.position.set(0, stepY, stepZ);
      tread.castShadow = !isHologram;
      tread.receiveShadow = !isHologram;
      group.add(tread);
    }

    // Handrail
    const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 3.8, 8);
    const postGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.95, 8);
    [-0.78, 0.78].forEach(xOff => {
      const rail = new THREE.Mesh(railGeo, woodMat);
      rail.position.set(xOff, 2.05, 1.25);
      rail.rotation.x = -Math.PI / 4;
      rail.castShadow = !isHologram;
      group.add(rail);

      [0.2, 1.25, 2.3].forEach(zPos => {
        const yPos = (zPos / 2.4) * 2.3 + 0.48;
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(xOff, yPos, zPos);
        post.castShadow = !isHologram;
        group.add(post);
      });
    });

    return { group };
  }

  /**
   * RAFT WOODEN WALL WITH WINDOW & CLOTH PANELS (Matching Raft Reference Image 1)
   */
  createWoodenWallModel(isHologram = false) {
    const group = new THREE.Group();
    const woodTex = TextureGenerator.createWoodTexture();
    const fabricTex = TextureGenerator.createCanvasFabricTexture();

    const woodMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          map: woodTex,
          color: 0x8d5c32,
          roughness: 0.78
        });

    const clothMat = isHologram
      ? this.getHoloMaterial()
      : new THREE.MeshStandardMaterial({
          map: fabricTex,
          color: 0xd8ceb8,
          roughness: 0.9,
          side: THREE.DoubleSide
        });

    // 2 Vertical support corner pillars with 45-degree angle brackets
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.8, 10);
    [-1.7, 1.7].forEach(xOff => {
      const pillar = new THREE.Mesh(pillarGeo, woodMat);
      pillar.position.set(xOff, 1.4, 0);
      pillar.castShadow = !isHologram;
      pillar.receiveShadow = !isHologram;
      group.add(pillar);

      // 45-degree angle bracket supports
      const braceGeo = new THREE.BoxGeometry(0.06, 0.42, 0.06);
      const b1 = new THREE.Mesh(braceGeo, woodMat);
      b1.position.set(xOff + (xOff < 0 ? 0.15 : -0.15), 2.5, 0);
      b1.rotation.z = xOff < 0 ? -Math.PI / 4 : Math.PI / 4;
      group.add(b1);
    });

    // Top and Bottom horizontal crossbeams
    const beamGeo = new THREE.BoxGeometry(3.6, 0.10, 0.12);
    [0.15, 2.7].forEach(yPos => {
      const beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(0, yPos, 0);
      beam.castShadow = !isHologram;
      group.add(beam);
    });

    // Mid crossbeam defining window aperture
    const midBeam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.10), woodMat);
    midBeam.position.set(0, 1.15, 0);
    midBeam.castShadow = !isHologram;
    group.add(midBeam);

    // Weathered canvas / cloth shade panels
    const panelGeo1 = new THREE.PlaneGeometry(1.6, 0.9);
    const panelGeo2 = new THREE.PlaneGeometry(1.6, 0.9);
    [-0.85, 0.85].forEach((xOff) => {
      const pLow = new THREE.Mesh(panelGeo1, clothMat);
      pLow.position.set(xOff, 0.65, 0);
      pLow.castShadow = !isHologram;
      group.add(pLow);

      const pHigh = new THREE.Mesh(panelGeo2, clothMat);
      pHigh.position.set(xOff, 2.15, 0);
      pHigh.castShadow = !isHologram;
      group.add(pHigh);
    });

    return { group };
  }

  getHoloMaterial(isValid = true) {
    return new THREE.MeshBasicMaterial({
      color: isValid ? 0x00f2fe : 0xff3366,
      transparent: true,
      opacity: 0.5,
      wireframe: false
    });
  }

  /* ================= HOLOGRAM PREVIEW & ROTATION ================= */

  rotateHologram(angle) {
    this.hologramRotationY = (this.hologramRotationY + angle) % (Math.PI * 2);
    if (this.hologramRotationY < 0) this.hologramRotationY += Math.PI * 2;
    this.hologramGroup.rotation.y = this.hologramRotationY;
  }

  rotateHologramStep(dir = 1) {
    this.rotateHologram(dir * (Math.PI / 4));
  }

  setTerrainMesh(terrainMesh) {
    this.terrainMesh = terrainMesh;
  }

  setBuildPreview(buildType) {
    if (this.currentBuildType === buildType) return;

    this.currentBuildType = buildType;
    this.clearHologram();
    this.hologramRotationY = 0;
    this.hologramGroup.rotation.y = 0;

    if (!buildType) {
      this.hologramGroup.visible = false;
      return;
    }

    const builder = this.structureBuilders[buildType];
    if (builder) {
      const result = builder(true);
      // Xóa bỏ va chạm của Ghost Mesh: Tắt raycast và gắn cờ không va chạm
      result.group.traverse(child => {
        child.raycast = () => {};
        child.userData.noCollision = true;
        child.userData.isHologram = true;
      });
      this.hologramGroup.add(result.group);
      this.hologramGroup.visible = true;
    }
  }

  clearHologram() {
    while (this.hologramGroup.children.length > 0) {
      this.hologramGroup.remove(this.hologramGroup.children[0]);
    }
  }

  updateHologram(cameraPos, cameraDir) {
    if (!this.currentBuildType) return;

    if (!this.placementRaycaster) {
      this.placementRaycaster = new THREE.Raycaster();
    }
    this.placementRaycaster.set(cameraPos, cameraDir);
    this.placementRaycaster.far = 10.0;

    // Cho phép bắt điểm đặt trên cả Địa hình đảo VÀ Sàn bè gỗ / Công trình đã xây
    const terrain = this.terrainMesh || window.terrainMesh;
    const validSurfaces = [];
    if (terrain) validSurfaces.push(terrain);

    if (window.raftFloorMeshes && window.raftFloorMeshes.length > 0) {
      for (const rfm of window.raftFloorMeshes) {
        if (rfm && rfm.isMesh && !validSurfaces.includes(rfm)) validSurfaces.push(rfm);
      }
    }

    // Đưa toàn bộ các khối bề mặt của công trình hiện hữu (Bè khởi đầu, mảng bè mở rộng, sàn, vách, cầu thang) vào danh sách bắt điểm
    for (const b of this.activeBuildings) {
      if (b && b.mesh) {
        b.mesh.traverse(child => {
          if (
            child.isMesh &&
            !child.userData.isHologram &&
            !child.userData.noCollision &&
            !child.userData.isOutline &&
            !child.name.includes('Collider') &&
            child.geometry &&
            !validSurfaces.includes(child)
          ) {
            validSurfaces.push(child);
          }
        });
      }
    }

    const intersects = validSurfaces.length > 0 ? this.placementRaycaster.intersectObjects(validSurfaces, true) : [];

    if (intersects.length > 0) {
      const hit = intersects[0];
      // Đặt vị trí Ghost Mesh ngay tại điểm chạm
      this.targetPlacementPos.copy(hit.point);
      this.hologramGroup.position.copy(this.targetPlacementPos);
      this.hologramGroup.rotation.y = this.hologramRotationY;
      this.hologramGroup.visible = true;
      this.isValidPlacement = true;
    } else {
      // Cho phép đặt raft_foundation nổi trên mặt biển khi ngắm xuống nước
      if (this.currentBuildType === 'raft_foundation' && cameraDir.y < -0.05 && cameraPos.y > 0.15) {
        const waterDist = (cameraPos.y - 0.15) / -cameraDir.y;
        if (waterDist > 0 && waterDist < 9.5) {
          const wx = cameraPos.x + cameraDir.x * waterDist;
          const wz = cameraPos.z + cameraDir.z * waterDist;
          this.targetPlacementPos.set(wx, 0.15, wz);
          this.hologramGroup.position.copy(this.targetPlacementPos);
          this.hologramGroup.rotation.y = this.hologramRotationY;
          this.hologramGroup.visible = true;
          this.isValidPlacement = true;
        } else {
          this.hologramGroup.visible = false;
          this.isValidPlacement = false;
        }
      } else {
        // Fallback kiểm tra địa hình đảo phía trước (khoảng cách 3.5 - 5.0m)
        const forwardDist = 4.0;
        const targetX = cameraPos.x + cameraDir.x * forwardDist;
        const targetZ = cameraPos.z + cameraDir.z * forwardDist;
        const groundY = getTerrainHeight(targetX, targetZ);

        if (groundY >= -0.3 && Math.hypot(targetX, targetZ) < 140) {
          this.targetPlacementPos.set(targetX, Math.max(0.0, groundY), targetZ);
          this.hologramGroup.position.copy(this.targetPlacementPos);
          this.hologramGroup.rotation.y = this.hologramRotationY;
          this.hologramGroup.visible = true;
          this.isValidPlacement = true;
        } else {
          this.hologramGroup.visible = false;
          this.isValidPlacement = false;
        }
      }
    }

    const colorHex = this.isValidPlacement ? 0x00f2fe : 0xff3366;
    this.hologramGroup.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.color.setHex(colorHex);
      }
    });
  }

  /* ================= CONFIRM PLACEMENT ================= */

  placeStructure() {
    if (!this.currentBuildType || !this.isValidPlacement) return false;

    const buildType = this.currentBuildType;

    // Resolve itemId from buildType
    let targetItemId = null;
    for (const [id, def] of Object.entries(ITEM_DEFS)) {
      if (def.buildType === buildType) {
        targetItemId = id;
        break;
      }
    }
    if (!targetItemId) targetItemId = buildType;

    // Check if player actually has the required building in backpack or hotbar
    if (!this.inventory.hasItem(targetItemId, 1)) {
      // Fallback: Kiểm tra và tiêu hao nguyên liệu từ công thức chế tạo nếu chưa tạo sẵn item
      const recipe = RECIPES.find(r => r.resultId === targetItemId || r.id === targetItemId);
      if (recipe && recipe.ingredients) {
        let hasIngredients = true;
        for (const req of recipe.ingredients) {
          if (this.inventory.getCount(req.id) < req.count) {
            hasIngredients = false;
            break;
          }
        }
        if (hasIngredients) {
          for (const req of recipe.ingredients) {
            this.inventory.removeItem(req.id, req.count);
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      // Consume 1 item from inventory
      this.inventory.removeItem(targetItemId, 1);
    }

    const pos = this.targetPlacementPos.clone();

    soundFX.playBuild();
    this.survivalStats.structuresBuilt += 1;

    let structData = null;

    if (buildType === 'campfire') {
      const result = this.createCampfireModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'campfire',
        name: 'Lửa Trại',
        mesh: result.group,
        position: pos,
        fireLight: result.fireLight,
        flames: result.flames,
        embersMesh: result.embersMesh,
        emberData: result.emberData,
        coalBed: result.coalBed,
        isLit: true,
        setLit: function(lit) {
          this.isLit = lit;
          if (this.fireLight) this.fireLight.visible = lit;
          if (this.flames) this.flames.forEach(f => f.visible = lit);
          if (this.embersMesh) this.embersMesh.visible = lit;
        },
        update: (delta, time) => {
          if (!structData.isLit) return;
          // Dynamic PointLight intensity with subtle natural flicker (PointLight 0xff7700, 2.5, 14)
          if (result.fireLight) {
            result.fireLight.intensity = 2.5 + Math.sin(time * 15.0) * 0.35 + (Math.random() - 0.5) * 0.2;
          }
          // Smoldering coal bed pulsing with breath-like cycle
          if (result.coalBed && result.coalBed.material) {
            result.coalBed.material.emissiveIntensity = 1.2 + Math.sin(time * 3.5) * 0.35;
          }
          // Soft dancing flame scale
          if (result.flames) {
            result.flames.forEach((f, idx) => {
              f.scale.y = 1.0 + Math.sin(time * (14 + idx * 4)) * 0.22;
              f.scale.x = 1.0 + Math.cos(time * (10 + idx * 3)) * 0.12;
            });
          }
          // Rising swirling ember sparks with gradient color shift from gold-orange to dark ember red
          if (result.embersMesh && result.emberData) {
            const posAttr = result.embersMesh.geometry.attributes.position;
            const colAttr = result.embersMesh.geometry.attributes.color;
            for (let i = 0; i < result.emberData.length; i++) {
              const ed = result.emberData[i];
              ed.y += ed.vy * delta;
              ed.angle += ed.rotSpeed * delta;
              if (ed.y > ed.maxHeight) {
                ed.y = ed.baseY;
                ed.radius = Math.random() * 0.32;
              }
              posAttr.setXYZ(i, Math.cos(ed.angle) * ed.radius, ed.y, Math.sin(ed.angle) * ed.radius);
              const prog = Math.min(1.0, Math.max(0.0, (ed.y - ed.baseY) / (ed.maxHeight - ed.baseY)));
              colAttr.setXYZ(i, 1.0 - prog * 0.15, 0.85 - prog * 0.65, 0.20 - prog * 0.15);
            }
            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
          }
        }
      };
    } else if (buildType === 'shelter') {
      const result = this.createShelterModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'shelter',
        name: 'Lều Trú Ẩn',
        mesh: result.group,
        position: pos,
        update: () => {}
      };
    } else if (buildType === 'water_collector') {
      const result = this.createWaterCollectorModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'water_collector',
        name: 'Máy Hứng Nước',
        mesh: result.group,
        position: pos,
        waterLevel: 50,
        waterMesh: result.waterMesh,
        update: (delta) => {
          structData.waterLevel = Math.min(100, structData.waterLevel + 0.33 * delta);
          if (result.waterMesh) {
            const h = 0.15 + (structData.waterLevel / 100) * 0.29;
            result.waterMesh.position.y = h;
          }
        }
      };
    } else if (buildType === 'raft_foundation') {
      const result = this.createRaftFoundationModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'raft_foundation',
        name: 'Mảng Bè Gỗ',
        mesh: result.group,
        position: pos,
        update: () => {}
      };
    } else if (buildType === 'wooden_stairs') {
      const result = this.createWoodenStairsModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'wooden_stairs',
        name: 'Cầu Thang Gỗ',
        mesh: result.group,
        position: pos,
        update: () => {}
      };
    } else if (buildType === 'wooden_wall') {
      const result = this.createWoodenWallModel(false);
      result.group.position.copy(pos);
      result.group.rotation.y = this.hologramRotationY;
      this.scene.add(result.group);

      structData = {
        type: 'wooden_wall',
        name: 'Vách Gỗ Cửa Sổ',
        mesh: result.group,
        position: pos,
        update: () => {}
      };
    }

    if (structData) {
      if (structData.type === 'campfire') {
        structData.setLit(true);
      }
      structData.mesh.traverse(child => {
        if (child.isMesh) {
          child.userData.building = structData;
          child.userData.type = (structData.type === 'campfire') ? 'campfire' : 'structure';
          if (structData.type === 'campfire') {
            Object.defineProperty(child.userData, 'isLit', {
              get: () => structData.isLit,
              set: (v) => { structData.setLit(v); },
              configurable: true
            });
          }
        }
      });
      this.registerCollidersFromGroup(structData.mesh, buildType);
      this.activeBuildings.push(structData);
    }

    return true;
  }

  /**
   * Spawns an authentic starter Raft moored just off the starting beach (x=75, z=26)
   * matching Reference Image 1 from Raft:
   * - 4 Foundation raft tiles (8x8m floating platform)
   * - Support pillars with 45-degree angle brackets
   * - Wooden stairs up to observation deck
   * - Window wall with canvas panels
   * - Gentle wave bobbing dynamics
   */
  spawnStarterRaft() {
    const raftRoot = new THREE.Group();
    raftRoot.name = 'StarterRaft';

    // Base position in shallow turquoise water right off player beach spawn
    const baseX = 75;
    const baseZ = 26;
    raftRoot.position.set(baseX, 0.15, baseZ);

    // 4 Raft Foundation tiles in a 2x2 grid (7.2 x 7.2m deck)
    const offsets = [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8]
    ];

    offsets.forEach(([ox, oz]) => {
      const tile = this.createRaftFoundationModel(false).group;
      tile.position.set(ox, 0, oz);
      raftRoot.add(tile);
    });

    // Window wall along left perimeter
    const wall = this.createWoodenWallModel(false).group;
    wall.position.set(-3.6, 0, 0);
    wall.rotation.y = Math.PI / 2;
    raftRoot.add(wall);

    // Support pillars & upper ceiling frame (matching Reference Image 1)
    const pillarGeo = new THREE.CylinderGeometry(0.09, 0.10, 3.2, 10);
    const woodTex = TextureGenerator.createWoodTexture();
    const pillarMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x8d5c32,
      roughness: 0.78
    });

    [[-2.2, 2.2], [2.2, 2.2], [-2.2, -2.2], [2.2, -2.2]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 1.6, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      raftRoot.add(pillar);

      // Angled corner brackets
      const braceGeo = new THREE.BoxGeometry(0.06, 0.45, 0.06);
      const b = new THREE.Mesh(braceGeo, pillarMat);
      b.position.set(px + (px > 0 ? -0.16 : 0.16), 2.9, pz);
      b.rotation.z = px > 0 ? Math.PI / 4 : -Math.PI / 4;
      raftRoot.add(b);
    });

    // Wooden stairs leading to upper level
    const stairs = this.createWoodenStairsModel(false).group;
    stairs.position.set(1.2, 0, -1.2);
    stairs.rotation.y = -Math.PI / 2;
    raftRoot.add(stairs);

    // Raft canopy roof slats above
    const roofPlankTex = TextureGenerator.createRaftPlankTexture();
    const roofMat = new THREE.MeshStandardMaterial({
      map: roofPlankTex,
      color: 0xbaa176,
      roughness: 0.82
    });
    const roofGeo = new THREE.BoxGeometry(7.2, 0.06, 3.8);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.15, 0.8);
    roof.userData.isRaftFloor = true;
    roof.castShadow = true;
    raftRoot.add(roof);

    this.scene.add(raftRoot);

    const raftBuilding = {
      type: 'raft_starter',
      name: 'Bè Sinh Tồn Khởi Đầu',
      mesh: raftRoot,
      position: new THREE.Vector3(baseX, 0.15, baseZ),
      update: (delta, time) => {
        // Gentle realistic ocean bobbing & tilt
        const bob = Math.sin(time * 1.4) * 0.045;
        const tiltX = Math.sin(time * 0.9) * 0.015;
        const tiltZ = Math.cos(time * 1.1) * 0.015;
        raftRoot.position.y = 0.15 + bob;
        raftRoot.rotation.x = tiltX;
        raftRoot.rotation.z = tiltZ;
      }
    };

    raftRoot.traverse(child => {
      if (child.isMesh) {
        child.userData.building = raftBuilding;
        child.userData.type = 'structure';
      }
    });

    this.registerCollidersFromGroup(raftRoot, 'raft_starter');
    this.activeBuildings.push(raftBuilding);
  }

  registerCollidersFromGroup(group, type) {
    if (!window.worldColliders) window.worldColliders = [];
    if (!window.raftFloorMeshes) window.raftFloorMeshes = [];

    group.traverse(child => {
      if (
        child.isMesh &&
        !child.userData.isOutline &&
        !child.userData.isWater &&
        !child.userData.noCollision &&
        !child.userData.isHologram &&
        child.name !== 'waterMesh' &&
        child.name !== 'Ocean' &&
        child.geometry
      ) {
        child.userData.colliderType = type;
        this.worldColliders.push(child);
        window.worldColliders.push(child);
        if (child.userData.isRaftFloor) {
          window.raftFloorMeshes.push(child);
        }
      }
    });
  }

  getWorldColliders() {
    return this.worldColliders;
  }

  /* ================= UPDATE LOOP ================= */

  update(delta, time, playerPos) {
    let nearFire = false;

    for (const b of this.activeBuildings) {
      if (b.update) {
        b.update(delta, time);
      }

      if (b.type === 'campfire' && b.isLit) {
        const dist = b.position.distanceTo(playerPos);
        if (dist < 5.0) {
          nearFire = true;
        }
      }
    }

    this.survivalStats.isNearCampfire = nearFire;
  }

  getBuildingAtDistance(rayOrigin, rayDir, maxDist = 3.5) {
    for (const b of this.activeBuildings) {
      const dist = b.position.distanceTo(rayOrigin);
      if (dist <= maxDist + 1.0) {
        const toB = b.position.clone().sub(rayOrigin).normalize();
        const dot = rayDir.dot(toB);
        if (dot > 0.8) {
          return b;
        }
      }
    }
    return null;
  }
}
