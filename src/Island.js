import * as THREE from 'three';
import { createStylizedOcean } from './Ocean.js';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * Procedural Island Height Function
 * Used across the engine for terrain vertex displacement,
 * player ground collision, resource placement, and building alignment.
 */
export function getTerrainHeight(x, z) {
  const dist = Math.hypot(x, z);
  const maxRadius = 145;

  if (dist >= maxRadius) {
    return -16; // Deep sea floor
  }

  // Smooth radial falloff from center outwards to beach
  const islandFactor = Math.max(0, 1 - Math.pow(dist / 105, 2.2));

  // Multi-frequency procedural landscape harmonics
  let h = 0;
  // Primary gentle hills
  h += Math.sin(x * 0.035 + 1.2) * Math.cos(z * 0.035 + 0.9) * 11.0;
  // Secondary rolling ridges
  h += Math.sin(x * 0.075 - z * 0.065) * 5.5;
  // Subtle surface bumps
  h += Math.cos(x * 0.15 + z * 0.13) * 2.2;
  h += Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.8;

  // Scenic central / ridge peak
  const peakDist = Math.hypot(x - 18, z - 12);
  const mountainPeak = Math.max(0, 1 - peakDist / 50) * 16.0;

  let totalHeight = (h + mountainPeak + 5.0) * islandFactor - (1 - islandFactor) * 14.0;

  // Chỉ làm thoai thoải bãi cát trên bờ cạn (y > 0.0), dưới nước giữ nguyên độ sâu âm:
  if (totalHeight > 0.0 && totalHeight < 2.5) {
    totalHeight = totalHeight * 0.8 + 0.1;
  }

  return totalHeight;
}

/**
 * Authentic Stylized Tropical Palm Tree Builder (Raft Art Style)
 * Features:
 * - Natural gently curving trunk divided into distinct segmented bark rings
 * - Organic randomized lean angle & direction
 * - Crown with 7-8 broadly arching, softly drooping tropical palm fronds
 * - Cluster of ripe brown coconuts nestled at the frond base
 */
export function createPalmTreeModel(customScale = 1.0) {
  const treeGroup = new THREE.Group();
  treeGroup.name = 'PalmTree';

  // Materials
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x8d6e63, // Warm medium-tan bark
    roughness: 0.85,
    metalness: 0.0,
    flatShading: true
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037, // Darker annular ring groove
    roughness: 0.90,
    metalness: 0.0,
    flatShading: true
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x6d4c41, // Sturdy root flare
    roughness: 0.90,
    metalness: 0.0,
    flatShading: true
  });

  // 1. ROOT FLARE BASE
  const rootGeo = new THREE.CylinderGeometry(0.48 * customScale, 0.78 * customScale, 0.7 * customScale, 10);
  const rootMesh = new THREE.Mesh(rootGeo, baseMat);
  rootMesh.position.y = 0.35 * customScale;
  rootMesh.castShadow = true;
  rootMesh.receiveShadow = true;
  treeGroup.add(rootMesh);

  // 2. CURVED SEGMENTED TRUNK WITH PROMINENT RINGS
  const segmentCount = 11;
  const segHeight = 0.75 * customScale;
  let currentPos = new THREE.Vector3(0, 0.65 * customScale, 0);

  // Random natural lean direction and strength
  const leanDirection = Math.random() * Math.PI * 2;
  const leanAmount = 0.08 + Math.random() * 0.07; // Natural curve
  const leanDirVec = new THREE.Vector3(Math.cos(leanDirection), 0, Math.sin(leanDirection));

  for (let s = 0; s < segmentCount; s++) {
    const progress = s / segmentCount;
    const rBottom = THREE.MathUtils.lerp(0.42, 0.22, Math.pow(progress, 0.8)) * customScale;
    const rTop = THREE.MathUtils.lerp(0.42, 0.22, Math.pow((s + 1) / segmentCount, 0.8)) * customScale;

    // Segment barrel
    const segGeo = new THREE.CylinderGeometry(rTop, rBottom, segHeight, 9);
    const segMesh = new THREE.Mesh(segGeo, trunkMat);
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;

    // Position and orient segment along the curve
    const curveOffset = Math.pow(progress, 1.4) * leanAmount;
    currentPos.x += leanDirVec.x * curveOffset * segHeight;
    currentPos.z += leanDirVec.z * curveOffset * segHeight;
    currentPos.y += segHeight * 0.5;

    segMesh.position.copy(currentPos);
    segMesh.rotation.y = s * 0.45;
    segMesh.rotation.x = leanDirVec.z * (progress * leanAmount * 2.5);
    segMesh.rotation.z = -leanDirVec.x * (progress * leanAmount * 2.5);
    treeGroup.add(segMesh);

    // Annular joint ring (creating distinct segmented palm trunk look)
    const ringGeo = new THREE.TorusGeometry(rBottom * 1.05, 0.024 * customScale, 5, 10);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(currentPos);
    ringMesh.position.y -= segHeight * 0.48;
    ringMesh.rotation.x = Math.PI / 2;
    treeGroup.add(ringMesh);

    currentPos.y += segHeight * 0.5;
  }

  // 3. PALM CROWN
  const crownGroup = new THREE.Group();
  crownGroup.position.copy(currentPos);
  treeGroup.add(crownGroup);

  // Tropical Warm Sunlit Frond Greens (#66bb6a, roughness: 0.6, DoubleSide)
  const leafMatUpper = new THREE.MeshStandardMaterial({
    color: 0x66bb6a, // Fresh tropical palm green (#66bb6a)
    roughness: 0.60, // Gentle sunlight sheen
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: false
  });

  const leafMatLower = new THREE.MeshStandardMaterial({
    color: 0x57a75b, // Slightly deeper underside green
    roughness: 0.60,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: false
  });

  /**
   * Builds an authentically arching, gracefully drooping palm frond
   * High step count (22 steps) for a smooth curved silhouette without angular creases
   */
  function createPalmFrond(length, width, droop, material) {
    const frondGroup = new THREE.Group();
    frondGroup.name = 'palmFrond';

    // Arched spine curve: rises then droops gracefully with 22 smooth segments
    const steps = 22;
    const positions = [];
    const indices = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = t * length;
      // Arch curve: starts up, arches at 35%, droops towards the tip
      const y = Math.sin(t * Math.PI * 0.70) * 0.90 - Math.pow(t, 2.1) * 2.3 * droop;
      // Width profile (tapering at base and tip smoothly)
      const w = Math.sin(Math.pow(t, 0.65) * Math.PI) * width;

      // Spine vertex
      positions.push(0, y + 0.03, z);
      // Left edge
      positions.push(-w, y - 0.08 * t, z);
      // Right edge
      positions.push(w, y - 0.08 * t, z);
    }

    for (let i = 0; i < steps; i++) {
      const r1 = i * 3;
      const r2 = (i + 1) * 3;
      // Left quad
      indices.push(r1, r1 + 1, r2 + 1);
      indices.push(r1, r2 + 1, r2);
      // Right quad
      indices.push(r1, r2 + 2, r1 + 2);
      indices.push(r1, r2, r2 + 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    frondGroup.add(mesh);

    // Frond wind sway user data
    frondGroup.userData = {
      swaySpeed: 1.8 + Math.random() * 0.8,
      swayOffset: Math.random() * Math.PI * 2,
      baseAngleZ: 0
    };

    return frondGroup;
  }

  // Exactly 7 to 8 broad palm fronds radiating out, drooping softly downwards
  const frondCount = 7 + (Math.random() > 0.5 ? 1 : 0);
  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const isUpper = f % 2 === 0;
    const length = (4.4 + Math.random() * 0.8) * customScale;
    const width = (0.95 + Math.random() * 0.25) * customScale;
    const droop = isUpper ? 0.95 : 1.35;
    const mat = isUpper ? leafMatUpper : leafMatLower;

    const frond = createPalmFrond(length, width, droop, mat);
    frond.rotation.y = angle;
    frond.rotation.x = isUpper ? 0.12 : -0.18;
    frond.userData.baseAngleZ = frond.rotation.z;
    crownGroup.add(frond);
  }

  // 4. CLUSTER OF RIPE BROWN COCONUTS AT FROND BASE
  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b, // Ripe coconut dark brown
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true
  });

  const nutCount = 3 + Math.floor(Math.random() * 3); // 3 to 5 coconuts
  for (let c = 0; c < nutCount; c++) {
    const nutRadius = (0.20 + Math.random() * 0.05) * customScale;
    const nutGeo = new THREE.DodecahedronGeometry(nutRadius, 1);
    nutGeo.scale(1.0, 1.25, 1.0);
    const nutMesh = new THREE.Mesh(nutGeo, coconutMat);

    const cAngle = (c / nutCount) * Math.PI * 2 + Math.random() * 0.4;
    const cDist = 0.28 * customScale;
    nutMesh.position.set(
      Math.cos(cAngle) * cDist,
      -0.12 * customScale,
      Math.sin(cAngle) * cDist
    );
    nutMesh.castShadow = true;
    crownGroup.add(nutMesh);
  }

  // Collider cylinder along trunk for raycast harvesting
  const trunkHitGeo = new THREE.CylinderGeometry(0.65 * customScale, 0.85 * customScale, 8.5 * customScale, 8);
  const trunkHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const trunkHitMesh = new THREE.Mesh(trunkHitGeo, trunkHitMat);
  trunkHitMesh.position.set(0, 4.25 * customScale, 0);
  trunkHitMesh.name = 'trunkCollider';
  treeGroup.add(trunkHitMesh);

  return treeGroup;
}

/**
 * Procedural Warm Slate-Grey Rock Boulder (Raft Aesthetic)
 * Uses irregular DodecahedronGeometry / IcosahedronGeometry with flatShading
 */
export function createRockModel(scale = 1.0) {
  const group = new THREE.Group();

  // Warm slate-grey / teal-grey rock material (#78909c)
  const rockMatBase = new THREE.MeshStandardMaterial({
    color: 0x78909c, // Warm light slate/blue-grey
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true
  });

  const rockMatTop = new THREE.MeshStandardMaterial({
    color: 0x90a4ae, // Sunlit top facet
    roughness: 0.84,
    metalness: 0.02,
    flatShading: true
  });

  // Primary faceted body with randomized vertex jitter for irregular boulder shape
  const rockGeo = new THREE.DodecahedronGeometry(scale * 1.35, 0);
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    // Non-uniform organic deformation
    const jitter = 0.90 + Math.sin(vx * 3.0 + vy * 2.0) * 0.15;
    pos.setXYZ(i, vx * 1.25 * jitter, vy * 0.85 * jitter, vz * 1.15 * jitter);
  }
  rockGeo.computeVertexNormals();

  const mainMesh = new THREE.Mesh(rockGeo, rockMatBase);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  mainMesh.position.y = scale * 0.65;
  mainMesh.rotation.set(
    (Math.random() - 0.5) * 0.4,
    Math.random() * Math.PI * 2,
    (Math.random() - 0.5) * 0.4
  );
  group.add(mainMesh);

  // Stepped top ledge facet
  const topGeo = new THREE.IcosahedronGeometry(scale * 0.72, 0);
  topGeo.scale(1.2, 0.55, 1.1);
  const topMesh = new THREE.Mesh(topGeo, rockMatTop);
  topMesh.position.set(scale * 0.1, scale * 1.0, scale * 0.1);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // Secondary side accent boulder for natural clustering
  if (scale > 0.85) {
    const subGeo = new THREE.DodecahedronGeometry(scale * 0.75, 0);
    subGeo.scale(1.15, 0.75, 0.95);
    const subMesh = new THREE.Mesh(subGeo, rockMatBase);
    subMesh.position.set(scale * 0.92, scale * 0.35, scale * 0.3);
    subMesh.rotation.set(0.2, Math.random() * Math.PI, -0.1);
    subMesh.castShadow = true;
    subMesh.receiveShadow = true;
    group.add(subMesh);
  }

  return group;
}

/**
 * Procedural Warm Tropical Bush Builder (Raft Style)
 */
export function createBushModel(customScale = 1.0) {
  const group = new THREE.Group();

  // Vibrant warm tropical green & golden shrubs
  const leafColors = [0x558b2f, 0x689f38, 0x7cb342, 0x8bc34a];
  const chosenColor = leafColors[Math.floor(Math.random() * leafColors.length)];

  const bushMat = new THREE.MeshStandardMaterial({
    color: chosenColor,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: true
  });

  const clusterCount = 6;
  for (let i = 0; i < clusterCount; i++) {
    const rad = (0.55 + Math.random() * 0.45) * customScale;
    const geo = new THREE.DodecahedronGeometry(rad, 0);
    const cluster = new THREE.Mesh(geo, bushMat);
    cluster.position.set(
      (Math.random() - 0.5) * 1.2 * customScale,
      rad * 0.75,
      (Math.random() - 0.5) * 1.2 * customScale
    );
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    group.add(cluster);
  }

  // Glossy ripe red berries
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    roughness: 0.35,
    metalness: 0.1,
    flatShading: true
  });
  const berryGeo = new THREE.DodecahedronGeometry(0.12 * customScale, 0);
  for (let b = 0; b < 10; b++) {
    const berry = new THREE.Mesh(berryGeo, berryMat);
    berry.position.set(
      (Math.random() - 0.5) * 1.4 * customScale,
      (0.55 + Math.random() * 0.75) * customScale,
      (Math.random() - 0.5) * 1.4 * customScale
    );
    group.add(berry);
  }

  const bushHitGeo = new THREE.SphereGeometry(1.5 * customScale, 8, 8);
  const bushHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const bushHitMesh = new THREE.Mesh(bushHitGeo, bushHitMat);
  bushHitMesh.position.set(0, 0.75 * customScale, 0);
  bushHitMesh.name = 'bushCollider';
  group.add(bushHitMesh);

  return group;
}

/**
 * Main Island Construction
 * Features procedural multi-tone blended terrain:
 * - Warm sunlit natural golden sand beach (#e6c98c)
 * - Fresh warm green meadow top (#689f38)
 * - Slope-aware warm slate-grey cliffs (#78909c)
 */
export function createIsland(scene) {
  const terrainSize = 340;
  const segments = 180;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const count = posAttr.count;

  // Displace heights
  for (let i = 0; i < count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, getTerrainHeight(vx, vz));
  }
  terrainGeo.computeVertexNormals();

  const normAttr = terrainGeo.attributes.normal;
  const colors = new Float32Array(count * 3);

  // Raft Authentic Warm Tropical Island Palette
  const colorWetSand      = new THREE.Color(0xd4b373); // Wet sand at sea waterline
  const colorBeachSand    = new THREE.Color(0xedd198); // Natural warm golden beach sand (#edd198)
  const colorGrassWarm    = new THREE.Color(0x4f7932); // Natural survival grounded grass (#4f7932)
  const colorGrassBright  = new THREE.Color(0x5e8c3e); // Earthy olive-green highlight (#5e8c3e)
  const colorCliffRock    = new THREE.Color(0x5c6b73); // Weathered slate-grey cliff
  const colorCliffTop     = new THREE.Color(0x78909c); // Sunlit rock terrace ledge

  const tmpColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const ny = normAttr.getY(i); // Vertical slope factor: 1.0 = flat ground, 0.0 = sheer vertical cliff

    // Multi-frequency organic color noise
    const noiseLow = Math.sin(vx * 0.14 + vz * 0.11) * 0.5 + 0.5;
    const noiseHigh = Math.sin(vx * 0.38 - vz * 0.32) * Math.cos(vz * 0.28) * 0.5 + 0.5;
    const organicNoise = noiseLow * 0.65 + noiseHigh * 0.35;

    // Slope check: only very steep sheer cliffs (ny < 0.62) expose bare rock
    const isSteepCliff = ny < 0.62 && vy > 3.0;

    if (isSteepCliff) {
      // Terraced slate-grey rock cliff with sunlit top faces
      const cliffFactor = smoothstep(0.30, 0.62, ny);
      tmpColor.lerpColors(colorCliffRock, colorCliffTop, cliffFactor * 0.7 + organicNoise * 0.3);
    } else if (vy < 0.8) {
      // Wet coastal sand line
      tmpColor.copy(colorWetSand);
    } else if (vy < 2.5) {
      // Coastal warm beach sand
      const alpha = (vy - 0.8) / 1.7;
      tmpColor.lerpColors(colorWetSand, colorBeachSand, alpha);
    } else if (vy < 5.2) {
      // Smooth gradient transition from warm golden sand (#edd198) to lush tropical grass (#7cb342)
      const edge = (vy - 2.5) / 2.7 + (organicNoise - 0.5) * 0.35;
      const alpha = Math.max(0.0, Math.min(1.0, edge));
      tmpColor.lerpColors(colorBeachSand, colorGrassWarm, alpha);
    } else {
      // Entire hill and summits are covered in vibrant tropical grass (#7cb342 with highlights)
      const highlight = smoothstep(0.3, 0.7, organicNoise);
      tmpColor.lerpColors(colorGrassWarm, colorGrassBright, highlight * 0.40);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const sandTex = TextureGenerator.createSandTexture();
  const terrainBump = TextureGenerator.createTerrainNoiseBumpTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    bumpMap: terrainBump,
    bumpScale: 0.15,
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.0,
    flatShading: false
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  terrainMesh.name = 'Terrain';
  if (typeof window !== 'undefined') {
    window.terrainMesh = terrainMesh;
  }
  scene.add(terrainMesh);

  // Decorative terraced shoreline and hillside boulders
  const cliffRockMat = new THREE.MeshStandardMaterial({
    color: 0x78909c, // Warm slate-grey
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true
  });
  const cliffTopMat = new THREE.MeshStandardMaterial({
    color: 0x90a4ae,
    roughness: 0.84,
    metalness: 0.02,
    flatShading: true
  });

  const colliders = [];

  // Scatter 18 chiseled rock shelves along steep slopes
  for (let c = 0; c < 18; c++) {
    const angle = (c / 18) * Math.PI * 2 + (c % 2) * 0.2;
    const dist = 32 + (c % 5) * 11;
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;
    const ry = getTerrainHeight(rx, rz);
    if (ry > 1.5 && ry < 18.0) {
      const rockShelf = new THREE.Group();
      const baseRadius = 2.4 + (c % 3) * 0.8;
      const baseGeo = new THREE.DodecahedronGeometry(baseRadius, 0);
      baseGeo.scale(1.5, 0.65, 1.2);
      const baseMesh = new THREE.Mesh(baseGeo, cliffRockMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      rockShelf.add(baseMesh);

      const topGeo = new THREE.DodecahedronGeometry(1.6 + (c % 3) * 0.5, 0);
      topGeo.scale(1.3, 0.4, 1.1);
      const topMesh = new THREE.Mesh(topGeo, cliffTopMat);
      topMesh.position.y = 1.0;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      rockShelf.add(topMesh);

      rockShelf.position.set(rx, ry + 0.5, rz);
      rockShelf.rotation.set((c % 3) * 0.1, angle, (c % 2) * 0.1);
      scene.add(rockShelf);

      colliders.push({
        type: 'cylinder',
        x: rx,
        z: rz,
        radius: baseRadius * 0.85,
        mesh: rockShelf,
        destroyed: false
      });
    }
  }

  // Stylized Ocean
  const ocean = createStylizedOcean(scene);
  if (ocean && ocean.mesh) {
    ocean.mesh.userData.isWater = true;
    ocean.mesh.name = 'Ocean';
  }

  return {
    terrainMesh,
    oceanMesh: ocean.mesh,
    colliders,
    update: (delta, time, skyManager) => {
      ocean.update(delta, time, skyManager);
    }
  };
}

function smoothstep(min, max, val) {
  const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
