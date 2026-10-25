import * as THREE from 'three';

/**
 * TextureGenerator.js - Procedural HTML5 Canvas Texture Engine
 * Generates rich stylized textures entirely in-memory with zero external image files.
 * Emulates the warm, cozy, hand-painted aesthetic of Raft.
 */

class TextureGeneratorEngine {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Stylized Wood Texture with organic grain lines
   * Used for tool hafts, logs, planks, campfires, and shelters.
   */
  createWoodTexture() {
    if (this.cache.has('wood')) return this.cache.get('wood');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm golden-brown cedar tone
    ctx.fillStyle = '#9b6838';
    ctx.fillRect(0, 0, 512, 512);

    // Warm undertone variation
    for (let x = 0; x < 512; x += 32) {
      ctx.fillStyle = (x % 64 === 0) ? 'rgba(125, 78, 35, 0.28)' : 'rgba(180, 125, 70, 0.22)';
      ctx.fillRect(x, 0, 32, 512);
    }

    // Hand-painted organic wood grain waves
    ctx.strokeStyle = '#683f19';
    ctx.lineWidth = 3;
    for (let i = 0; i < 512; i += 18) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      const cp1y = i + Math.sin(i * 0.05) * 22;
      const cp2y = i - Math.cos(i * 0.04) * 18;
      ctx.bezierCurveTo(160, cp1y, 340, cp2y, 512, i);
      ctx.stroke();
    }

    // Fine golden fiber streaks
    ctx.strokeStyle = 'rgba(235, 185, 120, 0.35)';
    ctx.lineWidth = 1.2;
    for (let j = 0; j < 512; j += 10) {
      ctx.beginPath();
      ctx.moveTo(0, j + 4);
      ctx.lineTo(512, j + 4 + Math.sin(j) * 8);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('wood', tex);
    return tex;
  }

  /**
   * Raft Timber Plank Texture
   * Features horizontal individual wooden boards with beveled dark seams,
   * subtle nail heads, and warm weathered driftwood tones.
   */
  createRaftPlankTexture() {
    if (this.cache.has('raftplank')) return this.cache.get('raftplank');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm weathered pine/driftwood
    ctx.fillStyle = '#caa778';
    ctx.fillRect(0, 0, 512, 512);

    const plankCount = 8;
    const plankHeight = 512 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const y = p * plankHeight;
      // Slight tone shift per board
      const shade = (p % 3 === 0) ? '#be9869' : (p % 2 === 0 ? '#d4b284' : '#caa778');
      ctx.fillStyle = shade;
      ctx.fillRect(0, y + 2, 512, plankHeight - 4);

      // Wood grain inside plank
      ctx.strokeStyle = 'rgba(105, 72, 40, 0.28)';
      ctx.lineWidth = 1.8;
      for (let g = 6; g < plankHeight - 6; g += 9) {
        ctx.beginPath();
        ctx.moveTo(0, y + g);
        const wave = Math.sin((p * 7 + g) * 0.1) * 6;
        ctx.bezierCurveTo(170, y + g + wave, 340, y + g - wave, 512, y + g);
        ctx.stroke();
      }

      // Plank top edge highlight
      ctx.fillStyle = 'rgba(255, 245, 220, 0.35)';
      ctx.fillRect(0, y, 512, 2);

      // Plank bottom edge dark groove seam
      ctx.fillStyle = 'rgba(45, 28, 15, 0.65)';
      ctx.fillRect(0, y + plankHeight - 3, 512, 3);

      // Iron nail dots at ends of planks
      ctx.fillStyle = '#3a2a1a';
      ctx.beginPath();
      ctx.arc(28, y + plankHeight * 0.5, 3.2, 0, Math.PI * 2);
      ctx.arc(484, y + plankHeight * 0.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('raftplank', tex);
    return tex;
  }

  /**
   * Stylized Palm Bark Texture with fibrous ring notches
   */
  createPalmBarkTexture() {
    if (this.cache.has('palmbark')) return this.cache.get('palmbark');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#7a5542';
    ctx.fillRect(0, 0, 256, 256);

    // Dark fibrous ring notches
    for (let y = 0; y < 256; y += 22) {
      ctx.fillStyle = '#4a2f22';
      ctx.fillRect(0, y, 256, 5);

      ctx.fillStyle = 'rgba(255, 235, 200, 0.22)';
      ctx.fillRect(0, y + 5, 256, 2);
    }

    // Vertical coconut husk fibers
    ctx.fillStyle = 'rgba(50, 30, 20, 0.4)';
    for (let i = 0; i < 220; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillRect(rx, ry, 2, 12 + Math.random() * 18);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('palmbark', tex);
    return tex;
  }

  /**
   * Soft Coral Sand Texture with fine speckled grains
   */
  createSandTexture() {
    if (this.cache.has('sand')) return this.cache.get('sand');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base sunny beach sand
    ctx.fillStyle = '#ebd59d';
    ctx.fillRect(0, 0, 256, 256);

    // Warm sand grain specks
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#f5e3b5' : '#dec487';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    // Fine dark mineral specks
    ctx.fillStyle = 'rgba(150, 105, 55, 0.3)';
    for (let j = 0; j < 250; j++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    this.cache.set('sand', tex);
    return tex;
  }

  /**
   * Procedural Soft Round Star Sprite Texture
   * Eliminates the ugly square WebGL point stars!
   */
  createStarTexture() {
    if (this.cache.has('star')) return this.cache.get('star');

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(235, 245, 255, 0.9)');
    grad.addColorStop(0.45, 'rgba(180, 220, 255, 0.45)');
    grad.addColorStop(0.8, 'rgba(140, 180, 255, 0.12)');
    grad.addColorStop(1, 'rgba(100, 150, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // Subtle 4-point twinkle sparkle line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(32, 10);
    ctx.lineTo(32, 54);
    ctx.moveTo(10, 32);
    ctx.lineTo(54, 32);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set('star', tex);
    return tex;
  }

  /**
   * Procedural Soft Cloud Puff Alpha Texture
   */
  createCloudPuffTexture() {
    if (this.cache.has('cloudpuff')) return this.cache.get('cloudpuff');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.78)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set('cloudpuff', tex);
    return tex;
  }

  /**
   * Water Ripple Normal Map for sparkling sun specular glints and physical waves
   */
  createWaterNormalMap() {
    if (this.cache.has('waternormal')) return this.cache.get('waternormal');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        // Multi-frequency harmonic wave normal map (Simplex/Perlin-style composite)
        const wave1X = Math.sin(x * 0.055) * 0.35 + Math.cos((x + y) * 0.040) * 0.25;
        const wave1Y = Math.cos(y * 0.055) * 0.35 + Math.sin((x - y) * 0.040) * 0.25;

        const wave2X = Math.sin(x * 0.12 - y * 0.09) * 0.22 + Math.cos(x * 0.22) * 0.12;
        const wave2Y = Math.cos(y * 0.12 + x * 0.09) * 0.22 + Math.sin(y * 0.22) * 0.12;

        const wave3X = Math.sin((x * 0.35 + y * 0.25)) * 0.08;
        const wave3Y = Math.cos((x * 0.25 - y * 0.35)) * 0.08;

        const nx = wave1X + wave2X + wave3X;
        const ny = wave1Y + wave2Y + wave3Y;
        const nz = 1.0;

        // Normalize (nx, ny, nz)
        const len = Math.hypot(nx, ny, nz);
        const normX = nx / len;
        const normY = ny / len;
        const normZ = nz / len;

        // Map [-1, 1] to RGB [0, 255]
        const r = Math.floor((normX * 0.5 + 0.5) * 255);
        const g = Math.floor((normY * 0.5 + 0.5) * 255);
        const b = Math.floor((normZ * 0.5 + 0.5) * 255);

        const idx = (y * 512 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('waternormal', tex);
    return tex;
  }

  /**
   * Procedural Noise Bump Texture for Island Terrain (Sand grit & grass texture)
   */
  createTerrainNoiseBumpTexture() {
    if (this.cache.has('terrain_bump')) return this.cache.get('terrain_bump');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        // Multi-frequency organic grain noise
        const n1 = Math.sin(x * 0.12) * Math.cos(y * 0.12) * 0.25;
        const n2 = Math.sin(x * 0.35 + y * 0.28) * 0.20;
        const n3 = Math.cos(x * 0.75 - y * 0.65) * 0.15;
        const fineGrain = (Math.random() - 0.5) * 0.40;

        const combined = 0.5 + n1 + n2 + n3 + fineGrain;
        const val = Math.floor(Math.max(0, Math.min(255, combined * 255)));

        const idx = (y * 512 + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    this.cache.set('terrain_bump', tex);
    return tex;
  }

  /**
   * End-grain Log Rings Texture (for cut ends of wood logs & wooden mallet head)
   */
  createLogEndTexture() {
    if (this.cache.has('logend')) return this.cache.get('logend');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#c5a782';
    ctx.fillRect(0, 0, 256, 256);

    // Concentric growth rings
    ctx.strokeStyle = '#855d36';
    ctx.lineWidth = 2.4;
    for (let r = 12; r < 120; r += 11) {
      ctx.beginPath();
      ctx.arc(128, 128, r + Math.sin(r) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial drying cracks
    ctx.strokeStyle = '#4e3118';
    ctx.lineWidth = 1.6;
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(128 + Math.cos(angle) * 95, 128 + Math.sin(angle) * 95);
      ctx.stroke();
    }

    // Center pith
    ctx.fillStyle = '#5a371c';
    ctx.beginPath();
    ctx.arc(128, 128, 7, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set('logend', tex);
    return tex;
  }

  /**
   * Stylized Fine-Grain Stone Texture
   */
  createStoneTexture() {
    if (this.cache.has('stone')) return this.cache.get('stone');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#7e8b94';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#98a5ad' : '#616d75';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2.5, 2.5);
    }

    // Mineral flecks
    ctx.fillStyle = 'rgba(230, 240, 250, 0.4)';
    for (let k = 0; k < 120; k++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('stone', tex);
    return tex;
  }

  /**
   * Raft Sail Canvas / Fabric Texture
   */
  createCanvasFabricTexture() {
    if (this.cache.has('fabric')) return this.cache.get('fabric');

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#dcd5c4';
    ctx.fillRect(0, 0, 256, 256);

    // Cross-hatch fabric weave
    ctx.fillStyle = 'rgba(140, 130, 115, 0.2)';
    for (let x = 0; x < 256; x += 4) {
      ctx.fillRect(x, 0, 1.5, 256);
    }
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 1.5);
    }

    // Subtle weathered stain patches
    ctx.fillStyle = 'rgba(160, 140, 110, 0.15)';
    for (let s = 0; s < 25; s++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 15 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.cache.set('fabric', tex);
    return tex;
  }

  /**
   * Stylized Skin Tone Gradient Texture
   */
  createSkinTexture() {
    if (this.cache.has('skin')) return this.cache.get('skin');

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Warm sun-tanned skin tone
    ctx.fillStyle = '#d49870';
    ctx.fillRect(0, 0, 128, 128);

    // Palm / inner crease warmth
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(235, 175, 140, 0.4)');
    grad.addColorStop(1, 'rgba(190, 120, 85, 0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set('skin', tex);
    return tex;
  }

  /**
   * Stylized Teardrop Flame Texture
   * Dual-plane and triple-plane animated fire with soft additive blending edges
   */
  createFlameTexture() {
    if (this.cache.has('flame')) return this.cache.get('flame');

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 128, 256);

    // Smooth teardrop fire tongue gradient
    const grad = ctx.createRadialGradient(64, 180, 12, 64, 150, 75);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.2, '#fff275');
    grad.addColorStop(0.5, '#ff8c00');
    grad.addColorStop(0.82, '#d63031');
    grad.addColorStop(1.0, 'rgba(214, 48, 49, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(64, 14); // Flame tip
    ctx.bezierCurveTo(112, 85, 124, 185, 64, 250);
    ctx.bezierCurveTo(4, 185, 16, 85, 64, 14);
    ctx.closePath();
    ctx.fill();

    // Hot inner core
    const coreGrad = ctx.createRadialGradient(64, 190, 4, 64, 175, 40);
    coreGrad.addColorStop(0.0, '#ffffff');
    coreGrad.addColorStop(0.5, '#fff9a6');
    coreGrad.addColorStop(1.0, 'rgba(255, 249, 166, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(64, 75);
    ctx.bezierCurveTo(92, 130, 96, 195, 64, 235);
    ctx.bezierCurveTo(32, 195, 36, 130, 64, 75);
    ctx.closePath();
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('flame', tex);
    return tex;
  }

  /**
   * Radial Gradient Soft Glow Flame Texture (128x128)
   * Multi-stage radial gradient for zero-artifact additive blending flame planes:
   * 0.0: Brilliant warm white (rgba(255, 255, 230, 1))
   * 0.3: Vibrant flame orange (rgba(255, 140, 0, 0.8))
   * 0.7: Fiery ember red (rgba(220, 40, 0, 0.3))
   * 1.0: Zero alpha completely transparent (rgba(0, 0, 0, 0))
   */
  createSoftGlowTexture() {
    if (this.cache.has('soft_glow')) return this.cache.get('soft_glow');

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.0, 'rgba(255, 255, 230, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 140, 0, 0.82)');
    grad.addColorStop(0.7, 'rgba(220, 40, 0, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('soft_glow', tex);
    return tex;
  }

  /**
   * Radial Gradient Soft Spark / Ember Point Texture (64x64)
   * Eliminates square pixel points in particle systems.
   */
  createSparkTexture() {
    if (this.cache.has('spark')) return this.cache.get('spark');

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(255, 240, 180, 0.95)');
    grad.addColorStop(0.55, 'rgba(255, 140, 30, 0.60)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cache.set('spark', tex);
    return tex;
  }
}

export const TextureGenerator = new TextureGeneratorEngine();
