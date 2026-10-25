import * as THREE from 'three';
import { getTerrainHeight } from './Island.js';

/**
 * Foliage.js - Survival Island Groundcover & Tropical Foliage
 * Features:
 * - Natural survival grass tufts with dry straw and moss-green tones (#557a2b & #8c7a3e)
 * - Tropical Ferns (Dương xỉ nhiệt đới) with 6 arching fronds in deep survival green (#3b5e2b)
 * - Scattered river pebbles & gravel on hill slopes
 * - Fallen deadwood branches scattered on forest floor
 * - GPU wind sway harmonics
 */

export function createFoliage(scene) {
  // 1. Build Fine 3-4 Blade Crossed Stylized Grass Tuft Geometry
  const clumpGeo = new THREE.BufferGeometry();
  const bladePositions = [];
  const bladeColors = [];
  const bladeNormals = [];

  const rootColor = new THREE.Color(0x283816); // Deep earthy root tone
  const mossColor = new THREE.Color(0x557a2b); // Moss forest green (#557a2b)
  const strawColor = new THREE.Color(0x8c7a3e); // Weathered dry straw gold (#8c7a3e)

  // 4 slender crossed blades radiating outwards
  const bladeCount = 4;
  for (let b = 0; b < bladeCount; b++) {
    const angle = (b / bladeCount) * Math.PI + (Math.random() - 0.5) * 0.2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const width = 0.08 + Math.random() * 0.03;
    const height = 0.38 + Math.random() * 0.20;
    const curveLean = 0.12 + (b % 2 === 0 ? 0.04 : -0.04);

    // Blade coordinates
    const rL = [-width * cos, 0, -width * sin];
    const rR = [width * cos, 0, width * sin];
    const mL = [-width * 0.7 * cos + cos * curveLean, height * 0.55, -width * 0.7 * sin + sin * curveLean];
    const mR = [width * 0.7 * cos + cos * curveLean, height * 0.55, width * 0.7 * sin + sin * curveLean];
    const tip = [cos * curveLean * 2.0, height, sin * curveLean * 2.0];

    // Lower Quad (2 triangles)
    bladePositions.push(...rL, ...rR, ...mR);
    bladePositions.push(...rL, ...mR, ...mL);
    // Upper Triangle
    bladePositions.push(...mL, ...mR, ...tip);

    for (let k = 0; k < 9; k++) {
      bladeNormals.push(0, 1, 0);
    }

    const curTip = (b % 2 === 0) ? mossColor : strawColor;

    // Root to tip vertex colors
    bladeColors.push(rootColor.r, rootColor.g, rootColor.b);
    bladeColors.push(rootColor.r, rootColor.g, rootColor.b);
    bladeColors.push(curTip.r, curTip.g, curTip.b);

    bladeColors.push(rootColor.r, rootColor.g, rootColor.b);
    bladeColors.push(curTip.r, curTip.g, curTip.b);
    bladeColors.push(curTip.r, curTip.g, curTip.b);

    // Tip triangle
    bladeColors.push(curTip.r, curTip.g, curTip.b);
    bladeColors.push(curTip.r, curTip.g, curTip.b);
    bladeColors.push(curTip.r * 1.05, curTip.g * 1.05, curTip.b * 1.05);
  }

  clumpGeo.setAttribute('position', new THREE.Float32BufferAttribute(bladePositions, 3));
  clumpGeo.setAttribute('color', new THREE.Float32BufferAttribute(bladeColors, 3));
  clumpGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bladeNormals, 3));

  const grassMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide
  });

  // Zero-cost GPU Wind Sway
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    grassMat.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float windPhase = uTime * 2.2 + instanceMatrix[3].x * 0.18 + instanceMatrix[3].z * 0.18;
      float sway = sin(windPhase) * 0.14;
      transformed.x += sway * position.y * 1.2;
      transformed.z += cos(windPhase * 0.85) * 0.09 * position.y * 1.2;
      `
    );
  };

  const grassInstanceCount = 8500;
  const grassMesh = new THREE.InstancedMesh(clumpGeo, grassMat, grassInstanceCount);
  grassMesh.receiveShadow = false;
  grassMesh.castShadow = false;

  // 2. Build River Pebbles & Gravel (InstancedMesh across hill slopes & paths)
  const pebbleGeo = new THREE.DodecahedronGeometry(0.12, 0);
  pebbleGeo.scale(1.2, 0.55, 1.0);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x607d8b, // Weathered river slate-grey
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true
  });
  const pebbleCount = 850;
  const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
  pebbleMesh.receiveShadow = true;
  pebbleMesh.castShadow = false;

  // 3. Tropical Island Ferns (Dương xỉ nhiệt đới: 6 tàu lá xanh trầm #3b5e2b tỏa đều)
  const fernPositions = [];
  const fernColors = [];
  const fernNormals = [];

  const fernFrondCount = 6;
  const fernBaseColor = new THREE.Color(0x233b18);
  const fernMidColor = new THREE.Color(0x3b5e2b); // Deep tropical fern green (#3b5e2b)
  const fernTipColor = new THREE.Color(0x4a7335);

  for (let f = 0; f < fernFrondCount; f++) {
    const fAngle = (f / fernFrondCount) * Math.PI * 2 + (f % 2 === 0 ? 0.12 : -0.12);
    const cosA = Math.cos(fAngle);
    const sinA = Math.sin(fAngle);
    const perpX = -sinA;
    const perpZ = cosA;

    // 5 segments arching gracefully outwards and drooping
    const segs = 5;
    const frondLength = 0.54;
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;

      const r0 = t0 * frondLength;
      const y0 = Math.sin(t0 * Math.PI * 0.85) * 0.24;
      const r1 = t1 * frondLength;
      const y1 = Math.sin(t1 * Math.PI * 0.85) * 0.24;

      const w0 = Math.sin(t0 * Math.PI) * 0.12 + 0.025;
      const w1 = Math.sin(t1 * Math.PI) * 0.12 + (s === segs - 1 ? 0.0 : 0.025);

      const p0L = [cosA * r0 - perpX * w0 * 0.5, y0, sinA * r0 - perpZ * w0 * 0.5];
      const p0R = [cosA * r0 + perpX * w0 * 0.5, y0, sinA * r0 + perpZ * w0 * 0.5];
      const p1L = [cosA * r1 - perpX * w1 * 0.5, y1, sinA * r1 - perpZ * w1 * 0.5];
      const p1R = [cosA * r1 + perpX * w1 * 0.5, y1, sinA * r1 + perpZ * w1 * 0.5];

      fernPositions.push(...p0L, ...p0R, ...p1R);
      fernPositions.push(...p0L, ...p1R, ...p1L);

      for (let k = 0; k < 6; k++) fernNormals.push(0, 1, 0);

      const c0 = new THREE.Color().lerpColors(fernBaseColor, fernMidColor, t0);
      const c1 = new THREE.Color().lerpColors(fernMidColor, fernTipColor, t1);

      fernColors.push(c0.r, c0.g, c0.b);
      fernColors.push(c0.r, c0.g, c0.b);
      fernColors.push(c1.r, c1.g, c1.b);

      fernColors.push(c0.r, c0.g, c0.b);
      fernColors.push(c1.r, c1.g, c1.b);
      fernColors.push(c1.r, c1.g, c1.b);
    }
  }

  const fernGeo = new THREE.BufferGeometry();
  fernGeo.setAttribute('position', new THREE.Float32BufferAttribute(fernPositions, 3));
  fernGeo.setAttribute('color', new THREE.Float32BufferAttribute(fernColors, 3));
  fernGeo.setAttribute('normal', new THREE.Float32BufferAttribute(fernNormals, 3));

  const fernMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    side: THREE.DoubleSide
  });
  const fernCount = 850;
  const fernMesh = new THREE.InstancedMesh(fernGeo, fernMat, fernCount);
  fernMesh.receiveShadow = false;
  fernMesh.castShadow = false;

  // 4. Fallen Deadwood Branches (Cành gỗ mục rải rác trên nền đất)
  const branchGeo = new THREE.CylinderGeometry(0.016, 0.026, 0.65, 5);
  branchGeo.rotateZ(Math.PI / 2); // Lies flat on ground
  const branchMat = new THREE.MeshStandardMaterial({
    color: 0x543821, // Weathered decayed wood
    roughness: 0.92,
    metalness: 0.02,
    flatShading: true
  });
  const branchCount = 450;
  const branchMesh = new THREE.InstancedMesh(branchGeo, branchMat, branchCount);
  branchMesh.receiveShadow = true;
  branchMesh.castShadow = false;

  // Slope calculation helper
  function getSurfaceNormal(x, z) {
    const eps = 0.5;
    const hL = getTerrainHeight(x - eps, z);
    const hR = getTerrainHeight(x + eps, z);
    const hD = getTerrainHeight(x, z - eps);
    const hU = getTerrainHeight(x, z + eps);
    return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
  }

  const dummy = new THREE.Object3D();
  let placedGrass = 0;
  let placedPebbles = 0;
  let placedFerns = 0;
  let placedBranches = 0;

  // Populate uniformly across entire island green hills up to the highest summits
  for (let i = 0; i < grassInstanceCount * 5 && placedGrass < grassInstanceCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Cover from central peaks (dist ~ 0) all the way out to beach transition (dist ~ 110)
    const dist = Math.sqrt(Math.random()) * 110;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = getTerrainHeight(x, z);

    // Height & slope check: Entire green island elevation range (2.0 < y < 35.0, slope > 0.65)
    if (y > 2.0 && y < 35.0) {
      const normal = getSurfaceNormal(x, z);
      if (normal.y > 0.65) {
        dummy.position.set(x, y, z);
        const s = 0.85 + Math.random() * 0.45;
        dummy.scale.set(s, s * (0.9 + Math.random() * 0.35), s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();

        grassMesh.setMatrixAt(placedGrass, dummy.matrix);
        placedGrass++;

        // Scatter smooth grey pebbles across hillside and grassy slopes
        if (placedPebbles < pebbleCount && Math.random() < 0.12) {
          dummy.position.set(x + (Math.random() - 0.5) * 1.1, y + 0.04, z + (Math.random() - 0.5) * 1.1);
          const ps = 0.7 + Math.random() * 0.7;
          dummy.scale.set(ps * (0.9 + Math.random() * 0.4), ps * 0.5, ps * (0.9 + Math.random() * 0.4));
          dummy.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3);
          dummy.updateMatrix();
          pebbleMesh.setMatrixAt(placedPebbles, dummy.matrix);
          placedPebbles++;
        }

        // Scatter lush tropical ferns (Dương xỉ nhiệt đới)
        if (placedFerns < fernCount && Math.random() < 0.14) {
          dummy.position.set(x + (Math.random() - 0.5) * 0.9, y + 0.02, z + (Math.random() - 0.5) * 0.9);
          const fs = 0.90 + Math.random() * 0.45;
          dummy.scale.set(fs, fs * (0.85 + Math.random() * 0.3), fs);
          dummy.rotation.y = Math.random() * Math.PI * 2;
          dummy.updateMatrix();
          fernMesh.setMatrixAt(placedFerns, dummy.matrix);
          placedFerns++;
        }

        // Scatter weathered deadwood sticks and branches
        if (placedBranches < branchCount && Math.random() < 0.08) {
          dummy.position.set(x + (Math.random() - 0.5) * 1.2, y + 0.03, z + (Math.random() - 0.5) * 1.2);
          const bs = 0.8 + Math.random() * 0.5;
          dummy.scale.set(bs, bs, bs);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();
          branchMesh.setMatrixAt(placedBranches, dummy.matrix);
          placedBranches++;
        }
      }
    }
  }

  grassMesh.instanceMatrix.needsUpdate = true;
  pebbleMesh.instanceMatrix.needsUpdate = true;
  fernMesh.instanceMatrix.needsUpdate = true;
  branchMesh.instanceMatrix.needsUpdate = true;

  scene.add(grassMesh);
  scene.add(pebbleMesh);
  scene.add(fernMesh);
  scene.add(branchMesh);

  return {
    mesh: grassMesh,
    update: (time) => {
      if (grassMat.userData.shader) {
        grassMat.userData.shader.uniforms.uTime.value = time;
      }
    }
  };
}
