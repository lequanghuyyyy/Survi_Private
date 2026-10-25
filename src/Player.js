import * as THREE from 'three';
import { getTerrainHeight } from './Island.js';
import { TextureGenerator } from './TextureGenerator.js';
import { soundFX } from './SoundFX.js';
import { assetLoader } from './AssetLoader.js';

/**
 * Player.js - First-person movement, PointerLock camera,
 * physical collision, ground/water kinematics, and first-person weapon viewmodel dynamics.
 */

/**
 * Ribbed Brown Leather Handle Grip with Pommel Cap
 */
export function createLeatherGrip(bottomY = -0.28) {
  const gripGroup = new THREE.Group();

  const gripHeight = 0.18;
  const gripCenterY = bottomY + gripHeight * 0.5 + 0.01;

  const gripGeo = new THREE.CylinderGeometry(0.024, 0.022, gripHeight, 14);
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x543627,
    roughness: 0.72,
    metalness: 0.04,
    flatShading: false
  });
  const gripMesh = new THREE.Mesh(gripGeo, gripMat);
  gripMesh.position.y = gripCenterY;
  gripMesh.castShadow = false;
  gripGroup.add(gripMesh);

  // 3 subtle horizontal seam rings
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x362116,
    roughness: 0.85,
    metalness: 0.0
  });
  for (let s = -1; s <= 1; s++) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.0238, 0.0030, 8, 14), seamMat);
    seam.position.set(0, gripCenterY + s * 0.048, 0);
    seam.rotation.x = Math.PI / 2;
    gripGroup.add(seam);
  }

  // Rounded wooden/bone pommel cap at bottom
  const pommelGeo = new THREE.SphereGeometry(0.024, 12, 10);
  pommelGeo.scale(1.0, 0.65, 1.0);
  const pommelMat = new THREE.MeshStandardMaterial({
    color: 0xc8b575,
    roughness: 0.7,
    metalness: 0.0
  });
  const pommel = new THREE.Mesh(pommelGeo, pommelMat);
  pommel.position.set(0, bottomY, 0);
  pommel.castShadow = false;
  gripGroup.add(pommel);

  return gripGroup;
}

/**
 * Weathered Hardwood Tool Haft
 * Subtle organic backward curve and hand-hewn facets (#6e472b, roughness: 0.85).
 */
export function createCarvedHaft(topRadius = 0.016, bottomRadius = 0.022, length = 0.64, centerY = -0.02) {
  const haftGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, length, 12, 12);
  haftGeo.translate(0, centerY, 0);

  // Subtle organic natural curve and hand-hewn facets
  const pos = haftGeo.attributes.position;
  const minY = centerY - length / 2;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normY = Math.max(0, Math.min(1, (y - minY) / length));
    const bendZ = Math.sin(normY * Math.PI) * -0.016;
    const bendX = Math.sin(normY * Math.PI * 2.0) * 0.004;
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    const hewn = 1.0 + Math.sin(angle * 5 + normY * 12) * 0.025;

    pos.setX(i, (pos.getX(i) + bendX) * hewn);
    pos.setZ(i, (pos.getZ(i) + bendZ) * hewn);
  }
  haftGeo.computeVertexNormals();

  const woodTex = TextureGenerator.createWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x6e472b, // Weathered natural hardwood (#6e472b)
    roughness: 0.85,
    metalness: 0.02
  });

  return new THREE.Mesh(haftGeo, woodMat);
}

/**
 * Survival Tool Lashing (Dây Buộc Sinh Tồn)
 * 4 horizontal rings under tool head + 2 diagonal X-cross rings (#5d4037, roughness: 0.90).
 */
export function createToolLashing(haftRadius = 0.018, headCenterY = 0.30) {
  const lashingGroup = new THREE.Group();
  lashingGroup.name = 'ToolLashing';

  const lashingMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037, // Dark natural hemp/coconut fiber brown (#5d4037)
    roughness: 0.90,
    metalness: 0.0
  });

  // 4 horizontal snug rings directly under head
  const ringGeo = new THREE.TorusGeometry(haftRadius * 1.08, 0.0055, 8, 16);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(ringGeo, lashingMat);
    ring.position.set(0, headCenterY - 0.055 - i * 0.015, 0);
    ring.rotation.x = Math.PI / 2;
    lashingGroup.add(ring);
  }

  // 2 diagonal X-lashing rings wrapped through the junction
  const crossRadius = haftRadius * 1.45;
  const crossGeo = new THREE.TorusGeometry(crossRadius, 0.0065, 8, 18);

  const x1 = new THREE.Mesh(crossGeo, lashingMat);
  x1.position.set(0, headCenterY, 0);
  x1.rotation.set(Math.PI / 4, 0, 0);
  lashingGroup.add(x1);

  const x2 = new THREE.Mesh(crossGeo, lashingMat);
  x2.position.set(0, headCenterY, 0);
  x2.rotation.set(-Math.PI / 4, 0, 0);
  lashingGroup.add(x2);

  return lashingGroup;
}

/**
 * FIRST-PERSON VIEWMODEL RIG (TOOL-ONLY PERSPECTIVE)
 * Pure tool/item viewmodel oriented towards crosshair in Camera space (-Z).
 */
export function createRaftFirstPersonHand() {
  const handRoot = new THREE.Group();
  handRoot.name = 'ViewModelRoot';

  // Grip socket holds the held item/tool directly
  const gripSocket = new THREE.Group();
  gripSocket.name = 'gripSocket';
  gripSocket.position.set(0.0, 0.0, 0.0);
  handRoot.add(gripSocket);

  // Positioned in camera space for 75° FOV: handle tail dips deep below bottom screen edge
  handRoot.position.set(0.38, -0.48, -0.52);
  handRoot.rotation.set(-0.25, 0.35, 0.10);

  return { handRoot, gripSocket };
}

export const ITEM_VIEWMODEL_CONFIGS = {
  default: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  hammer: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  building_hammer: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  stone_axe: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  axe: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  stone_pickaxe: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  pickaxe: {
    pos: new THREE.Vector3(0.38, -0.48, -0.52),
    rot: new THREE.Euler(-0.25, 0.35, 0.10)
  },
  torch: {
    pos: new THREE.Vector3(0.38, -0.46, -0.50),
    rot: new THREE.Euler(-0.15, 0.30, 0.05)
  },
  wood: {
    pos: new THREE.Vector3(0.36, -0.42, -0.50),
    rot: new THREE.Euler(0.35, -0.15, 0.25)
  },
  palm_leaf: {
    pos: new THREE.Vector3(0.36, -0.42, -0.50),
    rot: new THREE.Euler(0.35, -0.15, 0.25)
  },
  stone: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.20, 0.15, -0.10)
  },
  da: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.20, 0.15, -0.10)
  },
  rock: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.20, 0.15, -0.10)
  },
  flint: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.20, 0.15, -0.10)
  },
  coconut: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.22, 0.10, -0.05)
  },
  berry: {
    pos: new THREE.Vector3(0.38, -0.37, -0.45),
    rot: new THREE.Euler(0.20, 0.10, -0.05)
  }
};

/* ================= HELD ITEM MODELS ================= */

/**
 * SURVIVAL WOODEN CONSTRUCTION MALLET
 * Octagonal cylinder head lying along Z axis (striking face at -Z),
 * 2 dark bark bands (#3e2723), 4 lashing rings + X-cross (#5d4037), and weathered curved haft (#6e472b).
 */
export function createHeldHammer() {
  const hammerGroup = new THREE.Group();
  hammerGroup.name = 'HeldHammer';

  const woodTex = TextureGenerator.createWoodTexture();
  const logEndTex = TextureGenerator.createLogEndTexture();

  // 1. CARVED WEATHERED HARDWOOD HAFT (+35% EXTENDED, #6e472b)
  const haft = createCarvedHaft(0.016, 0.022, 0.62, -0.02);
  hammerGroup.add(haft);

  // Ribbed Leather Grip around handle bottom
  hammerGroup.add(createLeatherGrip(-0.31));

  // 2. TIMBER MALLET HEAD: CylinderGeometry(0.11, 0.11, 0.32, 8) lying along Z axis
  // Striking faces at front (-Z) and rear (+Z). Strictly NO BoxGeometry!
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x825432, // Sturdy weathered hardwood mallet head
    roughness: 0.82,
    metalness: 0.02
  });

  const malletGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.32, 8);
  malletGeo.rotateX(Math.PI / 2); // Lies along Z axis
  const malletMesh = new THREE.Mesh(malletGeo, woodMat);
  malletMesh.position.set(0, 0.28, 0);
  hammerGroup.add(malletMesh);

  // 2 beveled end striking caps (slightly tapered octagon)
  const endCapMat = new THREE.MeshStandardMaterial({
    map: logEndTex,
    color: 0x9b6b43,
    roughness: 0.85
  });

  const capGeoFront = new THREE.CylinderGeometry(0.095, 0.11, 0.04, 8);
  capGeoFront.rotateX(Math.PI / 2);
  const capFront = new THREE.Mesh(capGeoFront, endCapMat);
  capFront.position.set(0, 0.28, -0.18); // Facing -Z
  hammerGroup.add(capFront);

  const capGeoRear = new THREE.CylinderGeometry(0.11, 0.095, 0.04, 8);
  capGeoRear.rotateX(Math.PI / 2);
  const capRear = new THREE.Mesh(capGeoRear, endCapMat);
  capRear.position.set(0, 0.28, 0.18); // Facing +Z
  hammerGroup.add(capRear);

  // Top Handle Peg emerging from mallet head
  const topPegGeo = new THREE.CylinderGeometry(0.015, 0.016, 0.042, 10);
  const topPeg = new THREE.Mesh(topPegGeo, endCapMat);
  topPeg.position.set(0, 0.40, 0);
  hammerGroup.add(topPeg);

  // 2 dark bark / cordage rings (#3e2723) wrapped around the mallet head ends
  const headBandMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723, // Deep dark bark brown (#3e2723)
    roughness: 0.90
  });
  [-0.10, 0.10].forEach((zPos) => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.009, 8, 16), headBandMat);
    band.position.set(0, 0.28, zPos);
    hammerGroup.add(band);
  });

  // 3. Survival Lashing (4 horizontal rings + 2 diagonal X-cross rings in #5d4037)
  hammerGroup.add(createToolLashing(0.019, 0.28));

  hammerGroup.position.set(0, 0, 0);
  hammerGroup.rotation.set(0, 0, 0);

  hammerGroup.traverse((child) => {
    if (child.isMesh) {
      child.raycast = () => {};
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return hammerGroup;
}

/**
 * CHISELED RIVER STONE / KNAPPED FLINT
 * Scaled up 2.2x (radius ~0.096), anchored at viewport bottom-right so 1/3 sits off-screen.
 */
export function createHeldStone() {
  const stoneGroup = new THREE.Group();
  stoneGroup.name = 'HeldStone';

  const stoneTex = TextureGenerator.createStoneTexture();

  // Multi-faceted knapped core stone scaled 2.2x with irregular chipping scars
  const stoneGeo = new THREE.IcosahedronGeometry(0.096, 0);
  const pos = stoneGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const flatten = vy < 0 ? 0.80 : 1.06;
    const ridge = (vx > 0.016 && vz > 0.016) ? 1.15 : 0.95;
    pos.setXYZ(i, vx * ridge, vy * flatten, vz * ridge);
  }
  stoneGeo.computeVertexNormals();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0x93a4b5,
    roughness: 0.65,
    metalness: 0.12,
    flatShading: true
  });

  const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
  stoneMesh.position.set(0, 0, 0);
  stoneMesh.rotation.set(0.1, 0.3, -0.1);
  stoneGroup.add(stoneMesh);

  // Pale quartz / flint fracture vein highlight
  const veinGeo = new THREE.BoxGeometry(0.010, 0.052, 0.082);
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0xedf4fc,
    roughness: 0.42,
    metalness: 0.22
  });
  const vein = new THREE.Mesh(veinGeo, veinMat);
  vein.position.set(-0.018, 0.02, -0.02);
  vein.rotation.set(0.3, 0.5, 0.1);
  stoneGroup.add(vein);

  stoneGroup.traverse((child) => {
    if (child.isMesh) {
      child.raycast = () => {};
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return stoneGroup;
}

/**
 * REDESIGNED TIMBER LOG + MILLED PLANK + ROPE WRAPS
 * Scaled 2.2x larger: massive trunk log + milled plank strapped with rope lashings.
 * Anchored deep below bottom viewport edge, tilted diagonally upward.
 */
export function createHeldWoodLog() {
  const logGroup = new THREE.Group();
  logGroup.name = 'HeldWoodLog';

  const woodTex = TextureGenerator.createWoodTexture();
  const logEndTex = TextureGenerator.createLogEndTexture();

  const barkMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x7c4f28,
    roughness: 0.82,
    flatShading: true
  });
  const innerWoodMat = new THREE.MeshStandardMaterial({
    map: logEndTex,
    color: 0xd9b382,
    roughness: 0.74
  });
  const plankMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xc89f68,
    roughness: 0.72
  });
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    roughness: 0.86,
    metalness: 0.0
  });

  // 1. Massive Primary Timber Trunk Log (Diameter ~16cm: radius 0.078, length 0.85m - 2.2x scale)
  const radius = 0.078;
  const length = 0.85;
  const trunkGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 1.05, length, 12, 4, true);
  const pos = trunkGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    const ridge = 1 + 0.035 * Math.sin(angle * 5 + y * 6);
    pos.setX(i, pos.getX(i) * ridge);
    pos.setZ(i, pos.getZ(i) * ridge);
  }
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  logGroup.add(trunk);

  // 2. Cut wood end-caps with annual heartwood growth rings
  [-length / 2, length / 2].forEach((endY, idx) => {
    const capRadius = idx === 0 ? radius * 1.04 : radius * 0.94;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(capRadius, capRadius, 0.006, 14), innerWoodMat);
    cap.position.y = endY;
    logGroup.add(cap);
  });

  // 3. Milled Building Timber Plank strapped to the side of the log
  const plankGeo = new THREE.BoxGeometry(0.092, length * 0.94, 0.026);
  const plank = new THREE.Mesh(plankGeo, plankMat);
  plank.position.set(radius + 0.012, 0.0, 0.0);
  logGroup.add(plank);

  // 4. Exactly 2 Heavy Cordage Rope Lashings (#8d6e63) securing plank to log
  [-0.18, 0.18].forEach((ropeY) => {
    const rope = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.011, 8, 20), ropeMat);
    rope.position.set(0.03, ropeY, 0.0);
    rope.rotation.x = Math.PI / 2;
    logGroup.add(rope);
  });

  // 5. Chopped branch knot
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.038, 8), barkMat);
  knot.position.set(-radius * 0.92, 0.08, 0.0);
  knot.rotation.z = Math.PI / 2.5;
  logGroup.add(knot);

  logGroup.traverse((c) => {
    if (c.isMesh) {
      c.raycast = () => {};
      c.castShadow = false;
      c.receiveShadow = false;
    }
  });

  return logGroup;
}
export function createHeldWood() {
  return createHeldWoodLog();
}

/**
 * HELD COCONUT
 * Scaled up 2.0x (radius 0.092), anchored at viewport bottom-right so 1/3 sits off-screen.
 */
export function createHeldCoconut() {
  const nutGeo = new THREE.SphereGeometry(0.092, 16, 14);
  nutGeo.scale(1.0, 1.18, 1.0);
  const nutMat = new THREE.MeshStandardMaterial({
    color: 0x4e311d,
    roughness: 0.82
  });
  const nut = new THREE.Mesh(nutGeo, nutMat);
  nut.position.set(0, 0, 0);

  // Triple germination pores (dark eyes)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221308 });
  const eyeGeo = new THREE.SphereGeometry(0.008, 6, 6);
  [-0.024, 0.0, 0.024].forEach((xOff, idx) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(xOff, 0.088, 0.046 + (idx === 1 ? 0.008 : 0));
    nut.add(eye);
  });

  nut.raycast = () => {};
  nut.castShadow = false;
  nut.receiveShadow = false;
  return nut;
}

/**
 * HELD WILD BERRIES
 * Scaled up 2.0x, resting at viewport bottom-right.
 */
export function createHeldBerry() {
  const group = new THREE.Group();
  const berryMat = new THREE.MeshStandardMaterial({
    color: 0xeb3b5a,
    roughness: 0.28,
    metalness: 0.08
  });

  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), berryMat);
    b.position.set((i - 1.5) * 0.030, (i % 2) * 0.016, (i % 2 === 0 ? 0.012 : -0.012));
    b.raycast = () => {};
    group.add(b);
  }
  group.position.set(0, 0, 0);
  return group;
}

/**
 * SURVIVAL STONE AXE (Rìu Đá Liền Khối)
 * Trapeze blade extruded from THREE.Shape with curved cutting edge pointing forward (-Z),
 * weathered carved haft (#6e472b), and 4 rings + X-cross cordage lashing (#5d4037).
 */
export function createHeldAxe() {
  const axeGroup = new THREE.Group();
  axeGroup.name = 'HeldAxe';

  const stoneTex = TextureGenerator.createStoneTexture();

  // 1. Weathered carved hardwood haft (+35% extended, subtle curve, #6e472b)
  const haft = createCarvedHaft(0.016, 0.022, 0.62, -0.02);
  axeGroup.add(haft);

  // Leather grip anchored off-screen
  axeGroup.add(createLeatherGrip(-0.30));

  // 2. Chiseled Stone Axe Blade (ExtrudeGeometry from THREE.Shape)
  const axeShape = new THREE.Shape();
  // Front cutting edge: curved sharp blade apex at -Z
  axeShape.moveTo(-0.18, 0.09);
  axeShape.quadraticCurveTo(-0.21, 0.0, -0.18, -0.10); // Curved sharp cutting edge
  // Bottom taper to haft slot
  axeShape.lineTo(0.05, -0.045);
  // Rear butt / hammer pole
  axeShape.lineTo(0.09, 0.0);
  axeShape.lineTo(0.05, 0.055);
  axeShape.lineTo(-0.18, 0.09);
  axeShape.closePath();

  const axeGeo = new THREE.ExtrudeGeometry(axeShape, {
    depth: 0.038,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2
  });
  axeGeo.center();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.12,
    color: 0x4a5559, // Dark survival flint (#4a5559)
    roughness: 0.85,
    metalness: 0.08,
    flatShading: true
  });

  const axeHeadMesh = new THREE.Mesh(axeGeo, stoneMat);
  // Rotate so cutting blade points directly forward along -Z
  axeHeadMesh.rotation.y = -Math.PI / 2;
  axeHeadMesh.position.set(0, 0.24, 0);
  axeGroup.add(axeHeadMesh);

  // 3. Survival Lashing (4 horizontal rings + 2 diagonal X-cross rings in #5d4037)
  axeGroup.add(createToolLashing(0.019, 0.24));

  axeGroup.position.set(0, 0, 0);
  axeGroup.rotation.set(0, 0, 0);

  axeGroup.traverse((child) => {
    if (child.isMesh) {
      child.raycast = () => {};
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return axeGroup;
}

/**
 * SURVIVAL STONE PICKAXE (Cuốc Đá Liền Khối Chuẩn Xác)
 * Double-pointed arched crescent blade extruded from THREE.Shape (strictly NO CONE OR BOX),
 * main sharp spike points forward (-Z), rear beak points backward (+Z),
 * secured by 4 rings + X-cross cordage lashing (#5d4037) and weathered carved haft (#6e472b).
 */
export function createHeldPickaxe() {
  const pickGroup = new THREE.Group();
  pickGroup.name = 'HeldPickaxe';

  const stoneTex = TextureGenerator.createStoneTexture();

  // 1. Weathered carved hardwood haft (+35% extended, subtle organic curve, #6e472b)
  const haft = createCarvedHaft(0.016, 0.022, 0.68, 0.0);
  pickGroup.add(haft);

  // Grip anchored off-screen
  pickGroup.add(createLeatherGrip(-0.32));

  // 2. Chiseled Stone Pick Head (ExtrudeGeometry from THREE.Shape, NO CONE OR BOX)
  const pickaxeShape = new THREE.Shape();
  // Start at left tip:
  pickaxeShape.moveTo(-0.38, -0.12);
  // Upper arched spine curving smoothly over center hub (0.0, 0.06) to right tip:
  pickaxeShape.quadraticCurveTo(-0.18, 0.06, 0.0, 0.06);
  pickaxeShape.quadraticCurveTo(0.18, 0.06, 0.38, -0.12);
  // Lower belly curving back to center hub (0.0, -0.06), then to left tip:
  pickaxeShape.quadraticCurveTo(0.18, -0.02, 0.0, -0.06);
  pickaxeShape.quadraticCurveTo(-0.18, -0.02, -0.38, -0.12);
  pickaxeShape.closePath();

  const pickGeo = new THREE.ExtrudeGeometry(pickaxeShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2
  });
  pickGeo.center();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneTex,
    bumpScale: 0.12,
    color: 0x4a5559, // Dark flint stone (#4a5559)
    roughness: 0.85,
    metalness: 0.08,
    flatShading: true
  });

  const pickHeadMesh = new THREE.Mesh(pickGeo, stoneMat);
  // Rotate so one tip points straight forward (-Z) and one tip backward (+Z)
  pickHeadMesh.rotation.y = -Math.PI / 2;
  pickHeadMesh.position.set(0, 0.32, 0);
  pickGroup.add(pickHeadMesh);

  // 3. Survival Lashing (4 horizontal rings + 2 diagonal X-cross rings in #5d4037)
  pickGroup.add(createToolLashing(0.019, 0.32));

  pickGroup.position.set(0, 0, 0);
  pickGroup.rotation.set(0, 0, 0);

  pickGroup.traverse((child) => {
    if (child.isMesh) {
      child.raycast = () => {};
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return pickGroup;
}

export function createHeldTorch() {
  const torchGroup = new THREE.Group();
  torchGroup.name = 'HeldTorch';

  // 1. Thân đuốc: THREE.CylinderGeometry(0.035, 0.025, 0.75, 7)
  // Vật liệu gỗ thô sần sùi màu nâu đen (#422a1d, roughness: 0.95)
  const shaftGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.75, 7);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x422a1d,
    roughness: 0.95,
    metalness: 0.0
  });
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  torchGroup.add(shaftMesh);

  // 2. Đầu bọc giẻ tẩm nhựa thông: THREE.CylinderGeometry(0.065, 0.055, 0.22, 8)
  // Đặt ở ngọn đuốc, màu xơ đen xám tro (#212121, roughness: 1.0)
  const ragGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.22, 8);
  ragGeo.translate(0, 0.36, 0);
  const ragMat = new THREE.MeshStandardMaterial({
    color: 0x212121,
    roughness: 1.0,
    metalness: 0.0
  });
  const ragMesh = new THREE.Mesh(ragGeo, ragMat);
  torchGroup.add(ragMesh);

  // 3. Dây buộc: 2 vòng THREE.TorusGeometry(0.068, 0.008, 6, 12) màu dây thừng khô (#5d4037) quấn quanh phần giẻ
  const twineMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.90,
    metalness: 0.0
  });
  [0.31, 0.41].forEach((offsetY) => {
    const ringGeo = new THREE.TorusGeometry(0.068, 0.008, 6, 12);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, twineMat);
    ring.position.set(0, offsetY, 0);
    torchGroup.add(ring);
  });

  // 4. Ngọn lửa: Dùng 2 mặt phẳng chéo chữ X gán createSoftGlowTexture() (AdditiveBlending, depthWrite: false)
  // kết hợp 1 PointLight(0xff7700, 1.8, 10) nhấp nháy ngẫu nhiên
  const flameGroup = new THREE.Group();
  flameGroup.name = 'torchFlame';
  flameGroup.position.set(0, 0.47, 0);

  const flameGeo = new THREE.PlaneGeometry(0.24, 0.36);
  flameGeo.translate(0, 0.16, 0);
  const flameMat = new THREE.MeshBasicMaterial({
    map: TextureGenerator.createSoftGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const p1 = new THREE.Mesh(flameGeo, flameMat);
  p1.rotation.y = Math.PI / 4;
  flameGroup.add(p1);

  const p2 = new THREE.Mesh(flameGeo, flameMat);
  p2.rotation.y = -Math.PI / 4;
  flameGroup.add(p2);

  torchGroup.add(flameGroup);

  const torchLight = new THREE.PointLight(0xff7700, 1.8, 10);
  torchLight.name = 'torchPointLight';
  torchLight.position.set(0, 0.58, 0);
  torchLight.castShadow = false;
  torchGroup.add(torchLight);

  // Flying Sparks / Embers Particle System (30 swirling glowing particles)
  const emberCount = 30;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberData = [];

  for (let i = 0; i < emberCount; i++) {
    const r = Math.random() * 0.08;
    const th = Math.random() * Math.PI * 2;
    const baseY = 0.47;
    const maxHeight = 1.05 + Math.random() * 0.35;
    const y = baseY + Math.random() * (maxHeight - baseY);

    emberPositions[i * 3] = Math.cos(th) * r;
    emberPositions[i * 3 + 1] = y;
    emberPositions[i * 3 + 2] = Math.sin(th) * r;

    const prog = Math.min(1.0, Math.max(0.0, (y - baseY) / (maxHeight - baseY)));
    emberColors[i * 3] = 1.0 - prog * 0.15;
    emberColors[i * 3 + 1] = 0.75 - prog * 0.55;
    emberColors[i * 3 + 2] = 0.15 - prog * 0.15;

    emberData.push({
      angle: th,
      radius: r,
      baseY: baseY,
      y: y,
      vy: 0.65 + Math.random() * 0.65,
      rotSpeed: (Math.random() - 0.5) * 3.0,
      maxHeight: maxHeight
    });
  }

  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));
  const emberMat = new THREE.PointsMaterial({
    size: 0.08,
    map: TextureGenerator.createSparkTexture(),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });
  const embersMesh = new THREE.Points(emberGeo, emberMat);
  embersMesh.name = 'torchEmbers';
  torchGroup.add(embersMesh);

  torchGroup.userData.emberData = emberData;
  torchGroup.userData.embersMesh = embersMesh;
  torchGroup.userData.flameGroup = flameGroup;
  torchGroup.userData.torchLight = torchLight;

  torchGroup.position.set(0, 0, 0);
  torchGroup.rotation.set(0, 0, 0);

  torchGroup.traverse((child) => {
    if (child.isMesh || child.isPoints) {
      child.raycast = () => {};
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  return torchGroup;
}

/**
 * Attach held item model inside gripSocket with proper offsets
 */
export function attachItemToGripSocket(gripSocket, itemType) {
  if (!gripSocket) return;
  gripSocket.clear();

  if (!itemType || itemType === 'hand') {
    return;
  }

  const id = String(itemType).toLowerCase();
  if (id === 'hammer' || id === 'building_hammer') {
    gripSocket.add(createHeldHammer());
  } else if (id === 'stone_axe' || id === 'axe') {
    gripSocket.add(createHeldAxe());
  } else if (id === 'stone_pickaxe' || id === 'pickaxe') {
    gripSocket.add(createHeldPickaxe());
  } else if (id === 'torch') {
    gripSocket.add(createHeldTorch());
  } else if (id === 'stone' || id === 'da' || id === 'rock' || id === 'flint') {
    gripSocket.add(createHeldStone());
  } else if (id === 'wood' || id === 'palm_leaf') {
    gripSocket.add(createHeldWoodLog());
  } else if (id === 'campfire' || id === 'shelter' || id === 'water_collector' || id === 'raft_foundation' || id === 'wooden_stairs' || id === 'wooden_wall') {
    // In Raft, building mode equips the construction hammer!
    gripSocket.add(createHeldHammer());
  } else if (id === 'coconut') {
    gripSocket.add(createHeldCoconut());
  } else if (id === 'berry') {
    gripSocket.add(createHeldBerry());
  }
}

/**
 * Creates full standalone hand rig with item attached
 */
export function createFirstPersonRig(itemType = 'hand') {
  const { handRoot, gripSocket } = createRaftFirstPersonHand();
  attachItemToGripSocket(gripSocket, itemType);
  return handRoot;
}

export function createRightHandRig(itemType = 'hand') {
  return createFirstPersonRig(itemType);
}

export function createStoneAxe() {
  return createFirstPersonRig('stone_axe');
}

export function createStonePickaxe() {
  return createFirstPersonRig('stone_pickaxe');
}

export class Player {
  constructor(camera, domElement, inventory, survivalStats, inputManager = null) {
    this.camera = camera;
    this.domElement = domElement;
    this.inventory = inventory;
    this.survivalStats = survivalStats;
    this.inputManager = inputManager;

    // Kinematics & States
    this.island = null;
    this.buildingManager = null;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.standHeight = 1.75;
    this.crouchHeight = 1.05;
    this.playerHeight = 1.75;
    this.isOnGround = false;
    this.isGrounded = false;
    this.isInWater = false;
    this.stepTimer = 0;

    // Movement speeds
    this.walkSpeed = 7.0;
    this.sprintSpeed = 12.0;
    this.crouchSpeed = 3.6;
    this.jumpForce = 9.2;
    this.gravity = 24.0;

    // Zero-delay Jumping: Jump Buffer & Coyote Time
    this.jumpBufferTimer = 0; // 0.15s window to buffer Space press
    this.coyoteTimer = 0;     // 0.12s grace window after leaving ground ledge
    this.verticalRaycaster = new THREE.Raycaster();

    // PointerLock state & Euler rotation
    this.isLocked = false;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.pitchLimit = Math.PI / 2 - 0.05;

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false
    };
    this.wasJumpPressed = false;

    // First Person Viewmodel State (Weapon-only perspective, like Raft)
    this.currentTool = null;
    this.currentToolId = null;
    this.axe = null;
    this.axeInitialPos = new THREE.Vector3(0.38, -0.48, -0.52);
    this.axeInitialRot = new THREE.Euler(-0.25, 0.35, 0.10);

    // Inspect animation state
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.inspectDuration = 0.35;

    // Initialize Raft First-Person Hand Rig (Persistent root & gripSocket)
    const { handRoot, gripSocket } = createRaftFirstPersonHand();
    this.handRoot = handRoot;
    this.gripSocket = gripSocket;
    this.camera.add(this.handRoot);
    this.currentTool = this.handRoot;
    this.axe = this.handRoot;

    // Realistic Viewmodel Dynamics (Mouse inertia sway & Walking figure-8 bobbing)
    this.currentSwayX = 0;
    this.currentSwayY = 0;
    this.bobTimer = 0;
    this.isMoving = false;
    this.isSprinting = false;

    // Viewmodel fill light to ensure tools and hands are clearly illuminated without dark silhouettes
    this.viewmodelFillLight = new THREE.PointLight(0xfff8ee, 0.75, 3.2);
    this.viewmodelFillLight.position.set(0.18, 0.18, -0.25);
    this.camera.add(this.viewmodelFillLight);

    // Torch light (when torch is equipped)
    this.torchLight = new THREE.PointLight(0xff8833, 0, 14);
    this.torchLight.position.set(0.32, -0.15, -0.45);
    this.camera.add(this.torchLight);

    // Tool swing state (natural 0.25s chopping swing)
    this.isSwinging = false;
    this.swingTimer = 0;
    this.swingDuration = 0.25;

    // Camera impact shake
    this.cameraShake = 0;

    // Smooth item equip transition animation (lowering and raising)
    this.equipAnim = 0;

    // Build first person tools
    this.toolBuilders = this.initToolBuilders();

    // Spawn player safely on beach
    this.respawn();

    // Setup input listeners
    this.setupListeners();

    // Update initial equipped tool
    this.updateEquippedTool();
  }

  setIsland(island) {
    this.island = island;
  }

  setBuildingManager(buildingManager) {
    this.buildingManager = buildingManager;
  }

  respawn() {
    // Start on the sunny beach at radius ~75
    const spawnX = 65;
    const spawnZ = 35;
    const groundY = getTerrainHeight(spawnX, spawnZ);

    this.position.set(spawnX, groundY + this.playerHeight, spawnZ);
    this.velocity.set(0, 0, 0);
    this.camera.position.copy(this.position);

    // Look slightly towards island center
    this.euler.set(0, -Math.PI / 1.4, 0);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  setupListeners() {
    // If inputManager is passed, it manages pointerlock, mousemove, and keyboard shortcuts
    if (this.inputManager) {
      // Hotbar scroll wheel
      window.addEventListener('wheel', (e) => {
        if (!this.isLocked || (this.inputManager && this.inputManager.isPaused)) return;
        let newSlot = this.inventory.selectedSlotIndex + (e.deltaY > 0 ? 1 : -1);
        if (newSlot < 0) newSlot = this.inventory.slotCount - 1;
        if (newSlot >= this.inventory.slotCount) newSlot = 0;
        this.inventory.selectSlot(newSlot);
      }, { passive: true });
      return;
    }

    // Fallback listeners when InputManager is not provided:
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement || document.pointerLockElement === document.body;
    });

    // Mouse Move for Look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      const sensitivity = this.inputManager ? this.inputManager.mouseSensitivity : 0.0008;
      this.euler.y -= movementX * sensitivity;
      this.euler.x -= movementY * sensitivity;

      // Clamp vertical look
      this.euler.x = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && ['KeyD', 'KeyS', 'KeyA', 'KeyP', 'KeyF'].includes(e.code)) {
        e.preventDefault();
      }
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
        case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = true; break;
        case 'Space':
          this.keys.jump = true;
          this.handleJump();
          break;
        case 'Digit1': this.inventory.selectSlot(0); break;
        case 'Digit2': this.inventory.selectSlot(1); break;
        case 'Digit3': this.inventory.selectSlot(2); break;
        case 'Digit4': this.inventory.selectSlot(3); break;
        case 'Digit5': this.inventory.selectSlot(4); break;
        case 'Digit6': this.inventory.selectSlot(5); break;
        case 'Digit7': this.inventory.selectSlot(6); break;
        case 'Digit8': this.inventory.selectSlot(7); break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
        case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = false; break;
        case 'Space': this.keys.jump = false; break;
      }
    });

    // Hotbar scroll wheel
    window.addEventListener('wheel', (e) => {
      if (!this.isLocked) return;
      let newSlot = this.inventory.selectedSlotIndex + (e.deltaY > 0 ? 1 : -1);
      if (newSlot < 0) newSlot = this.inventory.slotCount - 1;
      if (newSlot >= this.inventory.slotCount) newSlot = 0;
      this.inventory.selectSlot(newSlot);
    }, { passive: true });
  }

  handleJump() {
    if (!this.isLocked || this.survivalStats.isDead) return;
    this.jumpBufferTimer = 0.15; // Zero-delay jump buffered
  }

  /* ================= FIRST-PERSON VIEWMODELS ================= */

  initToolBuilders() {
    const hand = () => createFirstPersonRig('hand');
    const hammer = () => createFirstPersonRig('hammer');
    const axe = () => createFirstPersonRig('stone_axe');
    const pickaxe = () => createFirstPersonRig('stone_pickaxe');
    const torch = () => createFirstPersonRig('torch');
    const wood = () => createFirstPersonRig('wood');
    const stone = () => createFirstPersonRig('stone');
    const coconut = () => createFirstPersonRig('coconut');
    const berry = () => createFirstPersonRig('berry');

    return {
      hand,
      hammer,
      building_hammer: hammer,
      stone_axe: axe,
      axe,
      stone_pickaxe: pickaxe,
      pickaxe,
      torch,
      wood,
      stone,
      da: stone,
      rock: stone,
      flint: stone,
      coconut,
      berry,
      palm_leaf: wood,
      campfire: hammer,
      shelter: hammer,
      water_collector: hammer,
      raft_foundation: hammer,
      wooden_stairs: hammer,
      wooden_wall: hammer
    };
  }

  updateHeldItem() {
    this.updateEquippedTool();
  }

  equipItem(item) {
    this.updateEquippedTool();
  }

  updateEquippedTool() {
    const item = this.inventory ? this.inventory.getSelectedItem() : null;
    const toolId = (item && item.id) ? item.id : 'hand';

    if (this.currentToolId === toolId && this.handRoot) return;
    this.currentToolId = toolId;
    this.equipAnim = 1.0; // Trigger smooth raise animation on item switch

    if (!this.handRoot || !this.gripSocket) {
      const { handRoot, gripSocket } = createRaftFirstPersonHand();
      this.handRoot = handRoot;
      this.gripSocket = gripSocket;
      this.camera.add(this.handRoot);
      this.currentTool = this.handRoot;
      this.axe = this.handRoot;
    }

    const cfg = ITEM_VIEWMODEL_CONFIGS[toolId] || ITEM_VIEWMODEL_CONFIGS.default;
    this.axeInitialPos = cfg.pos.clone();
    this.axeInitialRot = cfg.rot.clone();

    // Attach selected item with safe offsets inside gripSocket (calls gripSocket.clear() first)
    attachItemToGripSocket(this.gripSocket, toolId);

    // Torch light activation
    if (this.torchLight) {
      this.torchLight.intensity = (toolId === 'torch') ? 2.0 : 0.0;
    }
  }

  triggerInspect() {
    if (this.isInspecting) return;
    this.isInspecting = true;
    this.inspectTimer = 0;
    this.inspectDuration = 0.35;
  }

  triggerSwing() {
    if (this.isSwinging) return;
    this.isSwinging = true;
    this.swingTimer = 0;
    this.swingDuration = 0.25;
  }

  applyHitShake(intensity = 0.055) {
    this.cameraShake = intensity;
  }

  /* ================= UPDATE LOOP ================= */

  update(delta, time) {
    this.updateEquippedTool();

    if (this.survivalStats.isDead) return;

    // Synchronize with InputManager if present
    let currentKeys = this.keys;
    let mouseDeltaX = 0;
    let mouseDeltaY = 0;
    if (this.inputManager) {
      this.isLocked = this.inputManager.isLocked && !this.inputManager.isPaused;
      currentKeys = this.inputManager.keys;

      // Mouse look via InputManager
      if (this.isLocked) {
        const mouseDelta = this.inputManager.getAndResetMouseDelta();
        if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
          this.euler.y -= mouseDelta.x;
          this.euler.x -= mouseDelta.y;
          this.euler.x = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.euler.x));
          this.camera.quaternion.setFromEuler(this.euler);
        }
        mouseDeltaX = mouseDelta.rawX || 0;
        mouseDeltaY = mouseDelta.rawY || 0;
      }

      // Jump trigger via InputManager
      if (currentKeys.jump && !this.wasJumpPressed) {
        this.handleJump();
      }
      this.wasJumpPressed = currentKeys.jump;
    }

    // Zero-delay Jumping with Jump Buffer (0.15s) and Coyote Time (0.12s)
    if (this.isOnGround) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    if (this.jumpBufferTimer > 0) {
      if (this.isOnGround || this.coyoteTimer > 0) {
        this.velocity.y = this.jumpForce;
        this.isOnGround = false;
    this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        soundFX.playJump();
      } else if (this.isInWater) {
        // Water jump boost: 45% stronger upward force (baseJumpForce * 1.45)
        this.velocity.y = this.jumpForce * 1.45;
        this.jumpBufferTimer = 0;
        soundFX.playStep(true);
      }
    }

    // 1. Movement Kinematics
    const isCrouching = currentKeys.crouch && this.isOnGround;
    const canRun = this.survivalStats.canSprint() && !isCrouching;
    const isSprinting = currentKeys.sprint && canRun && (currentKeys.forward || currentKeys.backward || currentKeys.left || currentKeys.right);
    this.isSprinting = isSprinting;
    
    let speed = this.walkSpeed;
    if (isSprinting) {
      speed = this.sprintSpeed;
    } else if (isCrouching) {
      speed = this.crouchSpeed;
    }

    // Smooth height transition between standing and crouching
    const targetHeight = isCrouching ? this.crouchHeight : this.standHeight;
    this.playerHeight = THREE.MathUtils.lerp(this.playerHeight, targetHeight, 14.0 * delta);

    // Calculate move direction relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (currentKeys.forward) moveDir.add(forward);
    if (currentKeys.backward) moveDir.sub(forward);
    if (currentKeys.right) moveDir.add(right);
    if (currentKeys.left) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.01;
    this.isMoving = isMoving;
    if (isMoving) {
      moveDir.normalize();
    }

    // Pass sprint state to survival stats
    this.survivalStats.update(delta, isSprinting, isMoving);

    // Horizontal velocity with smooth acceleration/damping
    const targetVelX = moveDir.x * speed;
    const targetVelZ = moveDir.z * speed;
    const accel = this.isOnGround ? 14.0 : 4.0;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, accel * delta);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, accel * delta);

    // 2. Vertical Kinematics & Terrain Following
    const playerRadius = 0.45;
    let nextX = this.position.x + this.velocity.x * delta;
    let nextZ = this.position.z + this.velocity.z * delta;

    // Solid Circle-to-Circle Horizontal Obstacle Collision (Trees, Rocks, Cliffs)
    if (this.island && this.island.colliders) {
      for (let iter = 0; iter < 2; iter++) {
        for (const col of this.island.colliders) {
          if (col.destroyed) continue;
          const dx = nextX - col.x;
          const dz = nextZ - col.z;
          const distSq = dx * dx + dz * dz;
          const minDist = playerRadius + col.radius;
          if (distSq < minDist * minDist && distSq > 0.00001) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            // Push player smoothly out along collision normal (smooth wall/tree sliding)
            nextX += (dx / dist) * overlap;
            nextZ += (dz / dist) * overlap;
          }
        }
      }
    }

    // Horizontal Wooden Wall Collision & Sliding along normal (Ngăn đi xuyên tường gỗ)
    if (this.buildingManager && this.buildingManager.activeBuildings) {
      for (const b of this.buildingManager.activeBuildings) {
        if (b.type === 'wooden_wall' && b.mesh) {
          const rotY = b.mesh.rotation.y || 0;
          const cos = Math.cos(-rotY);
          const sin = Math.sin(-rotY);
          const dx = nextX - b.position.x;
          const dz = nextZ - b.position.z;

          // Local wall coords: X is along wall width (3.6m), Z is wall thickness (0.24m)
          const localX = dx * cos - dz * sin;
          const localZ = dx * sin + dz * cos;

          const halfWidth = 1.8 + playerRadius;
          const halfThick = 0.16 + playerRadius;

          const currentFeetY = this.position.y - this.playerHeight;
          if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfThick &&
              currentFeetY >= b.position.y - 0.2 && currentFeetY <= b.position.y + 2.8) {
            // Push out along wall normal (Z axis in local space)
            const pushLocalZ = localZ > 0 ? halfThick : -halfThick;
            const pushDiffZ = pushLocalZ - localZ;

            // Transform push back to world space
            nextX += -sin * pushDiffZ;
            nextZ += cos * pushDiffZ;
          }
        }
      }
    }

    // Thân bè gỗ có Box Collider chặn người chơi lại (minX: 70.95, maxX: 79.05, minZ: 21.95, maxZ: 29.05)
    // Muốn lên bè: Người chơi phải bơi sát mép, nhìn vào mép sàn bè và nhấn Space (nhảy) kết hợp W để trèo lên.
    const raftMinX = 75 - 3.6 - playerRadius;
    const raftMaxX = 75 + 3.6 + playerRadius;
    const raftMinZ = 26 - 3.6 - playerRadius;
    const raftMaxZ = 26 + 3.6 + playerRadius;
    const currentFeetY = this.position.y - this.playerHeight;

    if (currentFeetY < 0.10) {
      if (nextX > raftMinX && nextX < raftMaxX && nextZ > raftMinZ && nextZ < raftMaxZ) {
        // Kiểm tra điều kiện trèo lên bè: bơi sát mép, nhìn vào mép bè và nhấn Space (hoặc W + Space)
        const toRaftX = 75 - this.position.x;
        const toRaftZ = 26 - this.position.z;
        const isFacingRaft = (forward.x * toRaftX + forward.z * toRaftZ) > 0;
        const isClimbing = currentKeys.jump || this.jumpBufferTimer > 0 || (currentKeys.forward && (currentKeys.jump || this.jumpBufferTimer > 0));

        if (isClimbing && isFacingRaft) {
          // Trèo lên bè: tạo xung lực nâng lên mép sàn bè (TUYỆT ĐỐI KHÔNG gán player.position.y = raft.position.y)
          this.velocity.y = 5.6;
          this.jumpBufferTimer = 0;
          soundFX.playStep(true);
        } else {
          // Box Collider đẩy người chơi ra mép gần nhất
          const dLeft = nextX - raftMinX;
          const dRight = raftMaxX - nextX;
          const dBottom = nextZ - raftMinZ;
          const dTop = raftMaxZ - nextZ;
          const minD = Math.min(dLeft, dRight, dBottom, dTop);

          if (minD === dLeft) nextX = raftMinX;
          else if (minD === dRight) nextX = raftMaxX;
          else if (minD === dBottom) nextZ = raftMinZ;
          else nextZ = raftMaxZ;
        }
      }
    }

    const groundY = getTerrainHeight(nextX, nextZ);
    let highestFloorY = groundY;

    // Xử lý leo cầu thang & sàn tầng trên (Step-up Raycasting):
    // Tia downRay chỉ được phép va chạm với: Địa hình đảo cát (terrainMesh), các tấm sàn bè gỗ (raftFloorMeshes), và các bậc cầu thang/công trình cứng.
    // TUYỆT ĐỐI LOẠI BỎ waterMesh, Ocean, và Ghost Mesh khỏi danh sách vật cản!
    const validColliders = [];
    if (window.terrainMesh) validColliders.push(window.terrainMesh);
    if (this.island && this.island.terrainMesh && !validColliders.includes(this.island.terrainMesh)) {
      validColliders.push(this.island.terrainMesh);
    }
    const rawColliders = (window.worldColliders && window.worldColliders.length > 0)
      ? window.worldColliders
      : (this.buildingManager ? this.buildingManager.getWorldColliders() : []);

    for (const col of rawColliders) {
      if (
        col &&
        col.isMesh &&
        !col.userData.isWater &&
        !col.userData.noCollision &&
        !col.userData.isHologram &&
        col.name !== 'waterMesh' &&
        col.name !== 'Ocean'
      ) {
        validColliders.push(col);
      }
    }

    const kneeY = (this.position.y - this.playerHeight) + 0.8;
    const downRay = new THREE.Raycaster(
      new THREE.Vector3(nextX, kneeY, nextZ),
      new THREE.Vector3(0, -1, 0),
      0,
      1.6
    );
    const hits = downRay.intersectObjects(validColliders, true);
    if (hits.length > 0) {
      const groundHeight = hits[0].point.y;
      const feetY = this.position.y - this.playerHeight;
      // Nếu chân chạm bề mặt cầu thang hoặc sàn bè
      if (feetY < groundHeight) {
        this.position.y = groundHeight + this.playerHeight;
        this.velocity.y = 0;
        this.isOnGround = true;
        this.isGrounded = true;
      }
      highestFloorY = Math.max(highestFloorY, groundHeight);
    }

    // Đảm bảo không bị lọt khe giữa các tấm sàn bè gỗ (x: 71.4 - 78.6, z: 22.4 - 29.6)
    if (nextX > 71.4 && nextX < 78.6 && nextZ > 22.4 && nextZ < 29.6) {
      highestFloorY = Math.max(highestFloorY, 0.19);
    }

    // Gravity
    this.velocity.y -= this.gravity * delta;
    this.position.y += this.velocity.y * delta;
    this.position.x = nextX;
    this.position.z = nextZ;

    // Ocean surface check & Swimming status (sea level = 0.0)
    const waterLevel = 0.0;
    const feetY = this.position.y - this.playerHeight;
    // Chỉ coi là có sàn khi đứng trên sàn bè thật sự (raftFloorMeshes):
    const isOnRaftFloor = highestFloorY > 0.12 && (nextX > 71 && nextX < 79 && nextZ > 22 && nextZ < 30);

    if (feetY < waterLevel - 0.1 && !isOnRaftFloor) {
      this.isInWater = true;
      this.isOnGround = false;
      this.isGrounded = false;

      // Nếu không đang trong xung lực nhảy/trèo lên khỏi mặt nước (velocity.y <= 0.5)
      if (this.velocity.y <= 0.5) {
        // Cơ thể chìm sâu xuống nước, chỉ có đầu nhô lên (mắt ở y = 0.35 trên mặt nước):
        const targetSwimEyeY = waterLevel + 0.35;
        this.position.y = THREE.MathUtils.lerp(this.position.y, targetSwimEyeY, 6.0 * delta);
        this.velocity.y = Math.sin(time * 3.0) * 0.08; // Nhấp nhô nhẹ theo sóng
      }

      // Giảm tốc độ di chuyển khi bơi (chậm hơn đi bộ trên cạn 40%):
      this.velocity.x *= 0.82;
      this.velocity.z *= 0.82;
    } else {
      this.isInWater = false;
    }

    // Ground / Structure floor collision (TUYỆT ĐỐI CHỈ ÁP DỤNG KHI KHÔNG BƠI TRONG NƯỚC)
    if (!this.isInWater) {
      const targetEyeY = highestFloorY + this.playerHeight;
      if (this.position.y <= targetEyeY) {
        this.position.y = targetEyeY;
        this.velocity.y = 0;
        this.isOnGround = true;
        this.isGrounded = true;
      } else {
        this.isOnGround = false;
        this.isGrounded = false;
      }
    } else {
      this.isOnGround = false;
      this.isGrounded = false;
    }

    // Keep camera at player position
    this.camera.position.copy(this.position);

    // 3. Footstep Sounds & View Bobbing
    if (isMoving) {
      if (this.isInWater) {
        // Khi bơi: chỉ phát âm thanh bì bõm dưới nước với tần suất chậm, TUYỆT ĐỐI không phát tiếng gõ bước chân cộp cộp
        this.stepTimer += delta * 0.6;
        if (this.stepTimer > 0.65) {
          this.stepTimer = 0;
          soundFX.playStep(true);
        }
      } else if (this.isOnGround) {
        this.stepTimer += delta * (isSprinting ? 1.6 : 1.0);
        if (this.stepTimer > 0.42) {
          this.stepTimer = 0;
          soundFX.playStep(false);
        }
      }
    } else {
      this.stepTimer = 0.35;
    }

    // Subtle natural head bob
    const bobFactor = isMoving && this.isOnGround ? Math.sin(time * (isSprinting ? 15 : 10)) * 0.035 : 0;
    this.camera.position.y += bobFactor;

    // Camera impact shake when hitting resources
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 0.38);
    }

    // 4. Viewmodel Dynamics: Mouse Look Inertia (Sway) & Walking Bobbing
    const swayAmount = 0.0006;
    const maxSway = 0.035;
    const targetSwayX = Math.max(-maxSway, Math.min(maxSway, -mouseDeltaX * swayAmount));
    const targetSwayY = Math.max(-maxSway, Math.min(maxSway, -mouseDeltaY * swayAmount));
    this.currentSwayX = THREE.MathUtils.lerp(this.currentSwayX || 0, targetSwayX, 0.1);
    this.currentSwayY = THREE.MathUtils.lerp(this.currentSwayY || 0, targetSwayY, 0.1);
    // Clamp swayY strictly to prevent tool bottom from rising onto screen
    this.currentSwayY = THREE.MathUtils.clamp(this.currentSwayY, -0.025, 0.025);

    // Walking Bobbing (Figure-8 natural gait motion, clamped so bottom never lifts on screen)
    let bobX = 0, bobY = 0;
    if (isMoving && (this.isOnGround || this.isInWater)) {
      this.bobTimer = (this.bobTimer || 0) + delta * (isSprinting ? 12 : 8);
      bobX = Math.sin(this.bobTimer * 0.5) * 0.016; // Side to side
      bobY = Math.abs(Math.sin(this.bobTimer)) * 0.015; // Up and down bounce (restricted)
    } else {
      this.bobTimer = 0;
    }

    // Idle Breathing
    const breathY = Math.sin(time * 2.2) * 0.004;
    const breathRot = Math.cos(time * 2.2) * 0.006;

    // Inspect Animation (Gentle lift and angle towards player)
    let inspectPosX = 0;
    let inspectPosY = 0;
    let inspectPosZ = 0;
    let inspectRotX = 0;
    let inspectRotY = 0;
    let inspectRotZ = 0;

    if (this.isInspecting) {
      this.inspectTimer += delta;
      const t = Math.min(1.0, this.inspectTimer / this.inspectDuration);
      const ease = Math.sin(t * Math.PI);
      inspectPosY = ease * 0.05;
      inspectPosZ = ease * 0.04;
      inspectRotX = ease * 0.14;
      inspectRotZ = ease * -0.06;

      if (this.inspectTimer >= this.inspectDuration) {
        this.isInspecting = false;
        this.inspectTimer = 0;
      }
    }

    // 5. First-Person Tool Swing Animation (Natural Chopping Swing)
    let swingRotX = 0;
    let swingRotY = 0;
    let swingRotZ = 0;
    let swingPosX = 0;
    let swingPosY = 0;
    let swingPosZ = 0;

    if (this.isSwinging) {
      this.swingTimer += delta;
      const t = Math.min(1.0, this.swingTimer / this.swingDuration);

      if (t < 0.20) {
        // Quick pullback: cock tool upward and back
        const p = t / 0.20;
        const ease = Math.sin(p * Math.PI / 2);
        swingRotX = 0.25 * ease;
        swingRotY = -0.12 * ease;
        swingRotZ = 0.08 * ease;
        swingPosX = 0.02 * ease;
        swingPosY = 0.04 * ease;
        swingPosZ = 0.05 * ease;
      } else if (t < 0.58) {
        // Forward strike: chop forcefully down and forward (-Z) into crosshair
        const p = (t - 0.20) / (0.58 - 0.20);
        const ease = p * p;
        swingRotX = THREE.MathUtils.lerp(0.25, -0.75, ease);
        swingRotY = THREE.MathUtils.lerp(-0.12, 0.22, ease);
        swingRotZ = THREE.MathUtils.lerp(0.08, -0.22, ease);
        swingPosX = THREE.MathUtils.lerp(0.02, -0.10, ease);
        swingPosY = THREE.MathUtils.lerp(0.04, -0.05, ease);
        swingPosZ = THREE.MathUtils.lerp(0.05, -0.16, ease);
      } else {
        // Return to idle rest position over remainder of swing duration
        const p = (t - 0.58) / (1.0 - 0.58);
        const ease = 1.0 - Math.pow(1.0 - p, 2);
        swingRotX = THREE.MathUtils.lerp(-0.75, 0, ease);
        swingRotY = THREE.MathUtils.lerp(0.22, 0, ease);
        swingRotZ = THREE.MathUtils.lerp(-0.22, 0, ease);
        swingPosX = THREE.MathUtils.lerp(-0.10, 0, ease);
        swingPosY = THREE.MathUtils.lerp(-0.05, 0, ease);
        swingPosZ = THREE.MathUtils.lerp(-0.16, 0, ease);
      }

      if (this.swingTimer >= this.swingDuration) {
        this.isSwinging = false;
        this.swingTimer = 0;
      }
    }

    // Smooth item equip transition animation (lowering and raising)
    if (this.equipAnim > 0) {
      this.equipAnim = Math.max(0, this.equipAnim - delta * 4.8);
    }
    const equipDropY = Math.sin(this.equipAnim * Math.PI) * 0.24;

    // Apply combined first-person tool position & rotation
    if (this.currentTool && this.axeInitialPos && this.axeInitialRot) {
      this.currentTool.position.x = this.axeInitialPos.x + this.currentSwayX + bobX + swingPosX + inspectPosX;
      this.currentTool.position.y = this.axeInitialPos.y + this.currentSwayY - bobY + breathY - equipDropY + swingPosY + inspectPosY;
      this.currentTool.position.z = this.axeInitialPos.z + swingPosZ + inspectPosZ;

      this.currentTool.rotation.x = this.axeInitialRot.x - this.currentSwayY * 1.5 + swingRotX + breathRot + inspectRotX;
      this.currentTool.rotation.y = this.axeInitialRot.y + this.currentSwayX * 1.5 + swingRotY + inspectRotY;
      this.currentTool.rotation.z = this.axeInitialRot.z + swingRotZ + inspectRotZ;
    }

    // Torch flame animation, flickering light, and flying ember sparks
    if (this.currentToolId === 'torch' && this.currentTool) {
      const heldTorch = this.currentTool.getObjectByName('HeldTorch');
      if (heldTorch && heldTorch.userData) {
        const flameGroup = heldTorch.userData.flameGroup;
        if (flameGroup) {
          flameGroup.scale.y = 1.0 + Math.sin(time * 24.0) * 0.25;
          flameGroup.scale.x = 1.0 + Math.cos(time * 18.0) * 0.15;
          flameGroup.rotation.y = Math.sin(time * 12.0) * 0.15;
        }

        const torchPointLight = heldTorch.userData.torchLight;
        if (torchPointLight) {
          // PointLight(0xff7700, 1.8, 10) nhấp nháy ngẫu nhiên
          torchPointLight.intensity = 1.8 + (Math.random() - 0.5) * 0.45;
        }

        const embersMesh = heldTorch.userData.embersMesh;
        const emberData = heldTorch.userData.emberData;
        if (embersMesh && emberData) {
          const posAttr = embersMesh.geometry.attributes.position;
          const colAttr = embersMesh.geometry.attributes.color;
          for (let i = 0; i < emberData.length; i++) {
            const ed = emberData[i];
            ed.y += ed.vy * delta;
            ed.angle += ed.rotSpeed * delta;
            if (ed.y > ed.maxHeight) {
              ed.y = ed.baseY;
              ed.radius = Math.random() * 0.08;
            }
            posAttr.setXYZ(i, Math.cos(ed.angle) * ed.radius, ed.y, Math.sin(ed.angle) * ed.radius);
            if (colAttr) {
              const prog = Math.min(1.0, Math.max(0.0, (ed.y - ed.baseY) / (ed.maxHeight - ed.baseY)));
              colAttr.setXYZ(i, 1.0 - prog * 0.15, 0.85 - prog * 0.65, 0.20 - prog * 0.15);
            }
          }
          posAttr.needsUpdate = true;
          if (colAttr) colAttr.needsUpdate = true;
        }
      }
      if (this.torchLight) {
        this.torchLight.intensity = 1.8 + Math.sin(time * 12.0) * 0.30;
      }
    }
  }

  getForwardDirection() {
    return new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
  }

  updateMovement(delta, time = 0) {
    this.update(delta, time);
  }
}
