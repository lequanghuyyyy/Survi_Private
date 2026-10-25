import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TextureGenerator } from './TextureGenerator.js';
import { createPalmTreeModel } from './Island.js';

/**
 * AssetLoader.js - Manages pre-made 3D assets (GLTF/GLB) with robust local/CDN loading
 * and high-fidelity procedural fallback models (stylized axe & smooth tropical palm trees).
 */
export class AssetLoader {
  constructor() {
    this.loader = new GLTFLoader();
    this.models = {};
    this.isReady = false;
  }

  async init() {
    const assets = [
      {
        name: 'axe',
        paths: [
          '/models/axe.glb',
          '/public/models/axe.glb',
          'models/axe.glb'
        ],
        scale: 0.95
      },
      {
        name: 'palm_tree',
        paths: [
          '/models/palm_tree.glb',
          '/public/models/palm_tree.glb',
          'models/palm_tree.glb'
        ],
        scale: 1.0
      }
    ];

    for (const asset of assets) {
      await this.tryLoadAsset(asset.name, asset.paths, asset.scale);
    }
    this.isReady = true;
  }

  async tryLoadAsset(name, paths, scale = 1.0) {
    for (const path of paths) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          this.loader.load(path, resolve, undefined, reject);
        });

        if (gltf && gltf.scene) {
          const root = gltf.scene;
          root.scale.setScalar(scale);
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.models[name] = root;
          console.log(`[AssetLoader] Successfully loaded pre-made asset: ${name} (${path})`);
          return;
        }
      } catch (err) {
        // Fallback to next path or procedural model
      }
    }
  }

  getAxeModel() {
    if (this.models['axe']) {
      return this.models['axe'].clone();
    }
    return createStylizedAxeModel();
  }

  getPalmTreeModel() {
    if (this.models['palm_tree']) {
      return this.models['palm_tree'].clone();
    }
    return createPalmTreeModel();
  }
}

export const assetLoader = new AssetLoader();

/**
 * High-fidelity, clean stylized Stone Axe Model using ExtrudeGeometry
 */
export function createStylizedAxeModel() {
  const axeGroup = new THREE.Group();

  // 1. WOODEN HANDLE (Slightly thicker at grip, tapering up)
  const handleGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.7, 10);
  handleGeo.translate(0, 0.35, 0); // Pivot at bottom grip
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x7c4dff, // Will be overridden by wood color below
    roughness: 0.85
  });
  woodMat.color.setHex(0x8b5a2b);
  const handle = new THREE.Mesh(handleGeo, woodMat);
  axeGroup.add(handle);

  // 2. AUTHENTIC STONE AXE BLADE (2D Shape extruded into 3D wedge)
  // Built in XY plane: -X is FORWARD (cutting edge), +X is BACKWARD (butt/poll)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.06, -0.04);  // Bottom-back of poll
  bladeShape.lineTo(0.06, 0.04);   // Top-back of poll
  bladeShape.lineTo(-0.02, 0.05);  // Top near handle
  // Flare out to the top tip of the cutting blade (-X is forward)
  bladeShape.quadraticCurveTo(-0.08, 0.06, -0.16, 0.11);
  // Curved sharp cutting edge down to bottom tip
  bladeShape.quadraticCurveTo(-0.20, 0.0, -0.16, -0.12);
  // Curve back into bottom of handle socket
  bladeShape.quadraticCurveTo(-0.08, -0.06, -0.02, -0.05);
  bladeShape.closePath();

  const extrudeSettings = {
    depth: 0.024,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,     // Tapered sharp edge!
    bevelThickness: 0.012
  };

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
  bladeGeo.center(); // Center geometry around origin

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x57606f,
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true
  });

  const axeHead = new THREE.Mesh(bladeGeo, stoneMat);
  // Position at the top of the handle, offset slightly forward (-X)
  axeHead.position.set(-0.04, 0.58, 0);
  axeGroup.add(axeHead);

  // 3. ROPE LASHING (Matte dark leather brown - ZERO bloom/glow)
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x4e342e, // Matte dark leather brown
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x000000 // NO glowing white bloom!
  });
  for (let i = -1; i <= 1; i++) {
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 6, 12), ropeMat);
    cord.position.set(0, 0.58 + i * 0.025, 0);
    cord.rotation.x = Math.PI / 2 + i * 0.2;
    axeGroup.add(cord);
  }

  return axeGroup;
}

/**
 * Smooth Tropical Palm Tree (curved trunk with smooth broad leaves & soft shadows)
 */
export function createSmoothPalmTreeModel() {
  const treeGroup = new THREE.Group();

  // 1. WARM MEDIUM-TAN BARK TRUNK (#8d6e63 / #795548, roughness: 0.85)
  const trunkSegments = 12;
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x8d6e63, // Warm medium-tan bark
    map: TextureGenerator.createPalmBarkTexture(),
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false // Never black silhouettes
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x795548, // Warm reddish-tan base
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false
  });

  // Flared root base
  const rootGeo = new THREE.CylinderGeometry(0.55, 0.82, 0.8, 14);
  const rootMesh = new THREE.Mesh(rootGeo, baseMat);
  rootMesh.position.y = 0.4;
  rootMesh.castShadow = true;
  rootMesh.receiveShadow = true;
  treeGroup.add(rootMesh);

  let currentPos = new THREE.Vector3(0, 0.7, 0);
  const leanAngleX = (Math.random() - 0.5) * 0.14;
  const leanAngleZ = (Math.random() - 0.5) * 0.14;

  const trunkRadiusBase = 0.45;
  const trunkRadiusTop = 0.20;

  for (let i = 0; i < trunkSegments; i++) {
    const segHeight = 0.82;
    const progress = i / trunkSegments;
    const nextProgress = (i + 1) / trunkSegments;

    const rBottom = THREE.MathUtils.lerp(trunkRadiusBase, trunkRadiusTop, Math.pow(progress, 0.75));
    const rTop = THREE.MathUtils.lerp(trunkRadiusBase, trunkRadiusTop, Math.pow(nextProgress, 0.75));

    const geo = new THREE.CylinderGeometry(rTop, rBottom, segHeight, 12);
    const segMesh = new THREE.Mesh(geo, trunkMat);
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;

    currentPos.y += segHeight * 0.5;
    segMesh.position.copy(currentPos);
    segMesh.rotation.x = leanAngleX * (i + 1);
    segMesh.rotation.z = leanAngleZ * (i + 1);
    treeGroup.add(segMesh);

    currentPos.x += Math.sin(leanAngleZ) * segHeight * 0.65;
    currentPos.z += Math.sin(leanAngleX) * segHeight * 0.65;
    currentPos.y += segHeight * 0.5;
  }

  // 2. BROAD SMOOTH TROPICAL PALM CANOPY
  const crownGroup = new THREE.Group();
  crownGroup.position.copy(currentPos);
  treeGroup.add(crownGroup);

  // Warm sunlit leaf greens (#588141 and #70974c)
  const leafMatTop = new THREE.MeshStandardMaterial({
    color: 0x70974c, // Warm sunlit bright leaf green
    roughness: 0.65,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: false
  });

  const leafMatMid = new THREE.MeshStandardMaterial({
    color: 0x588141, // Warm sunlit leaf green
    roughness: 0.70,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: false
  });

  const leafMatLow = new THREE.MeshStandardMaterial({
    color: 0x4a6f35, // Natural shaded palm green
    roughness: 0.75,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: false
  });

  // Build curved broad palm fronds
  function createBroadFrond(length = 4.2, width = 1.1, droop = 1.0, material = leafMatMid) {
    const frondGroup = new THREE.Group();

    // Arched center spine
    const spineCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.9 * droop, length * 0.5),
      new THREE.Vector3(0, -1.8 * droop, length)
    );
    const spineGeo = new THREE.TubeGeometry(spineCurve, 10, 0.04, 6, false);
    const spineMesh = new THREE.Mesh(spineGeo, material);
    spineMesh.castShadow = true;
    frondGroup.add(spineMesh);

    // Broad palm leaf surface (smooth arched shape)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.5, length * 0.25, width * 0.6, length * 0.7, 0, length);
    shape.bezierCurveTo(-width * 0.6, length * 0.7, -width * 0.5, length * 0.25, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(shape, 8);
    leafGeo.rotateX(Math.PI / 2);
    leafGeo.rotateZ(Math.PI);
    leafGeo.computeVertexNormals();

    const leafMesh = new THREE.Mesh(leafGeo, material);
    leafMesh.position.y = 0.1;
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    frondGroup.add(leafMesh);

    return frondGroup;
  }

  // Tier 1: Upward crowning fronds (6 fronds)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const frond = createBroadFrond(3.6, 0.9, 0.75, leafMatTop);
    frond.rotation.y = angle;
    frond.rotation.x = 0.25;
    crownGroup.add(frond);
  }

  // Tier 2: Mid-tier cascading fronds (8 fronds)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.2;
    const frond = createBroadFrond(4.6, 1.25, 1.1, leafMatMid);
    frond.rotation.y = angle;
    frond.rotation.x = -0.15;
    crownGroup.add(frond);
  }

  // Tier 3: Low drooping mature fronds (6 fronds)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.45;
    const frond = createBroadFrond(4.8, 1.35, 1.45, leafMatLow);
    frond.rotation.y = angle;
    frond.rotation.x = -0.42;
    crownGroup.add(frond);
  }

  // Coconuts nestled at crown base
  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b,
    roughness: 0.85,
    metalness: 0.05
  });
  for (let c = 0; c < 5; c++) {
    const nut = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), coconutMat);
    const cAngle = (c / 5) * Math.PI * 2;
    nut.position.set(Math.cos(cAngle) * 0.32, -0.15, Math.sin(cAngle) * 0.32);
    nut.castShadow = true;
    crownGroup.add(nut);
  }

  return treeGroup;
}
