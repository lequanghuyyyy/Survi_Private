import * as THREE from 'three';
import { CloudManager } from './Clouds.js';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * Sky.js - Raft-Style Tropical Sky Dome, Lighting & Atmosphere
 * - 3-color tropical gradient dome: Deep Sky Blue (#1e88e5) -> Turquoise Aqua (#81d4fa) -> Warm Golden Horizon (#ffe0b2)
 * - Warm sun directional light (#fff4d6, 1.8 intensity)
 * - Balanced hemisphere light (#87ceeb sky, #e6c280 ground, 0.7 intensity)
 * - Soft warm turquoise atmospheric fog (#b2ebf2)
 */

export class SkyManager {
  constructor(scene, durationSec = 360) {
    this.scene = scene;
    this.durationSec = durationSec; // 360s = 6 min cycle
    this.timeOfDay = 9.5; // Starts at 09:30 AM sunny morning
    this.dayCount = 1;

    // Atmospheric sky background synchronized with horizon fog (#bfe9ff)
    this.scene.background = new THREE.Color(0xbfe9ff);

    // 1. Inverted Giant Sky Dome with 3-stop Gradient Shader
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color(0x1e88e5) },    // Deep tropical sky blue zenith
      uMidColor: { value: new THREE.Color(0x81d4fa) },    // Light turquoise-aqua mid sky
      uBottomColor: { value: new THREE.Color(0xbfe9ff) }  // Clear tropical blue horizon (synchronized with fog)
    };
    this.initSkyDome();

    // 2. Raft Tropical Balanced Lighting (Zero pitch-black shadows)
    // Hemisphere Light: vibrant turquoise-sky zenith (#87ceeb) with warm sandy ground bounce (#e6c280, 0.7)
    this.ambientLight = new THREE.HemisphereLight(0x87ceeb, 0xe6c280, 0.7);
    this.scene.add(this.ambientLight);

    // Ambient Fill Light: lifts shadow valleys into warm sunlit haze
    this.fillLight = new THREE.AmbientLight(0xfff4d6, 0.35);
    this.scene.add(this.fillLight);

    // 3. Directional Sunlight: Warm golden tropical sunlight (#fff4d6, 1.8)
    this.sunLight = new THREE.DirectionalLight(0xfff4d6, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 450;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    // 4. Moon Directional Light (Clear silvery-blue night fill)
    this.moonLight = new THREE.DirectionalLight(0x8bb4f6, 0.50);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);

    // 5. Sun & Moon visual meshes
    const sunGroup = new THREE.Group();
    const sunGeo = new THREE.SphereGeometry(10.0, 20, 20);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    sunGroup.add(new THREE.Mesh(sunGeo, sunMat));

    // Luminous Corona Glow
    const coronaGeo = new THREE.SphereGeometry(18.0, 20, 20);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.38 });
    sunGroup.add(new THREE.Mesh(coronaGeo, coronaMat));

    this.sunMesh = sunGroup;
    this.scene.add(this.sunMesh);

    const moonGeo = new THREE.SphereGeometry(6.0, 18, 18);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xdce8ff });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // 6. Synchronized atmospheric horizon fog (#bfe9ff) - eliminates visible cutoff lines
    this.fogColor = new THREE.Color(0xbfe9ff);
    this.scene.fog = new THREE.FogExp2(0xbfe9ff, 0.0028);

    // 7. Fluffy Billboard Sprite Clouds
    this.cloudManager = new CloudManager(this.scene, 14);

    // 8. Soft Twinkling Stars (Round Canvas Sprite Particle texture)
    this.initStars();
  }

  initSkyDome() {
    const skyGeo = new THREE.SphereGeometry(600, 32, 16);
    skyGeo.scale(-1, 1, 1); // Inverted sphere

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uBottomColor;
        varying vec3 vWorldPosition;

        void main() {
          // Normalize height factor: 0.0 at horizon, 1.0 at zenith
          float h = clamp(normalize(vWorldPosition).y, 0.0, 1.0);
          vec3 col;
          if (h < 0.28) {
            float factor = smoothstep(0.0, 0.28, h);
            col = mix(uBottomColor, uMidColor, factor);
          } else {
            float factor = smoothstep(0.28, 0.95, h);
            col = mix(uMidColor, uTopColor, factor);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  initStars() {
    const starTex = TextureGenerator.createStarTexture();
    const starCount = 950;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const starColor = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 380 + Math.random() * 50;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 14;
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const p = Math.random();
      if (p > 0.65) {
        starColor.setHex(0xb5d8ff); // soft blue star
      } else if (p > 0.3) {
        starColor.setHex(0xfff8ee); // diamond white star
      } else {
        starColor.setHex(0xffe6b8); // soft gold star
      }

      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.starMat = new THREE.PointsMaterial({
      map: starTex,
      vertexColors: true,
      size: 5.2,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.starPoints = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.starPoints);
  }

  skipToMorning() {
    this.timeOfDay = 6.5; // 06:30 AM
    this.dayCount += 1;
    this.update(0);
  }

  update(delta, cameraPos = null) {
    if (cameraPos && this.skyDome) {
      this.skyDome.position.copy(cameraPos);
    }
    const hoursPerSec = 24.0 / this.durationSec;
    this.timeOfDay += hoursPerSec * delta;

    if (this.timeOfDay >= 24.0) {
      this.timeOfDay -= 24.0;
      this.dayCount += 1;
    }

    // Arching sun position
    const sunAngle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2;
    const sunDist = 240;

    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 45;

    this.sunLight.position.set(sunX, Math.max(-20, sunY), sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    this.moonLight.position.set(-sunX, -sunY, -sunZ);
    this.moonMesh.position.set(-sunX, -sunY, -sunZ);

    // Calculate atmospheric palette based on time of day
    const t = this.timeOfDay;
    let topColor = new THREE.Color();
    let midColor = new THREE.Color();
    let bottomColor = new THREE.Color();
    let fogColor = new THREE.Color();
    let cloudColor = new THREE.Color(0xffffff);
    let cloudOpacity = 0.72;
    let sunIntensity = 0;
    let moonIntensity = 0;
    let starOpacity = 0;

    if (t >= 5.0 && t < 7.0) {
      // Dawn (05:00 - 07:00): Soft morning transition to tropical horizon
      const alpha = (t - 5.0) / 2.0;
      topColor.lerpColors(new THREE.Color(0x1a263f), new THREE.Color(0x1e88e5), alpha);
      midColor.lerpColors(new THREE.Color(0x54293f), new THREE.Color(0x81d4fa), alpha);
      bottomColor.lerpColors(new THREE.Color(0x3a4b68), new THREE.Color(0xbfe9ff), alpha);
      fogColor.lerpColors(new THREE.Color(0x2d3a4d), new THREE.Color(0xbfe9ff), alpha);
      cloudColor.lerpColors(new THREE.Color(0x6a4a6b), new THREE.Color(0xffbe76), alpha);
      cloudOpacity = 0.58 + alpha * 0.14;
      sunIntensity = alpha * 1.8;
      moonIntensity = (1 - alpha) * 0.45;
      starOpacity = 1 - alpha;
    } else if (t >= 7.0 && t < 17.0) {
      // Daytime (07:00 - 17:00): Tropical Azure (#1e88e5), Light Turquoise (#81d4fa) & Horizon (#bfe9ff)
      topColor.setHex(0x1e88e5);
      midColor.setHex(0x81d4fa);
      bottomColor.setHex(0xbfe9ff);
      fogColor.setHex(0xbfe9ff);
      cloudColor.setHex(0xffffff);
      cloudOpacity = 0.75;
      sunIntensity = 1.8;
      moonIntensity = 0.0;
      starOpacity = 0.0;
    } else if (t >= 17.0 && t < 19.5) {
      // Sunset (17:00 - 19:30): Glowing Amber, Peach & Coral Violet
      const alpha = (t - 17.0) / 2.5;
      topColor.lerpColors(new THREE.Color(0x1e88e5), new THREE.Color(0x2c1b4d), alpha);
      midColor.lerpColors(new THREE.Color(0x81d4fa), new THREE.Color(0xe67e22), alpha);
      bottomColor.lerpColors(new THREE.Color(0xbfe9ff), new THREE.Color(0xd35400), alpha);
      fogColor.lerpColors(new THREE.Color(0xbfe9ff), new THREE.Color(0xb56576), alpha);
      cloudColor.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff7675), alpha);
      cloudOpacity = 0.65;
      sunIntensity = (1 - alpha) * 1.8;
      moonIntensity = alpha * 0.50;
      starOpacity = alpha;
    } else {
      // Night (19:30 - 05:00): Warm Caribbean Midnight Navy (Readable, atmospheric)
      topColor.setHex(0x0a192f);
      midColor.setHex(0x112240);
      bottomColor.setHex(0x1a365d);
      fogColor.setHex(0x132338);
      cloudColor.setHex(0x1d3557);
      cloudOpacity = 0.45;
      sunIntensity = 0.0;
      moonIntensity = 0.50;
      starOpacity = 0.95;
    }

    // Apply to SkyDome and Atmospheric Fog
    this.skyUniforms.uTopColor.value.copy(topColor);
    this.skyUniforms.uMidColor.value.copy(midColor);
    this.skyUniforms.uBottomColor.value.copy(bottomColor);

    if (this.scene.background) {
      this.scene.background.copy(fogColor);
    }

    if (this.scene.fog) {
      this.scene.fog.color.copy(fogColor);
    }

    // Sun & Moon light settings
    this.sunLight.color.set(0xfff4d6);
    this.sunLight.intensity = Math.max(0, sunIntensity);
    this.moonLight.intensity = Math.max(0, moonIntensity);

    // Balanced Hemisphere & Fill lights
    if (t >= 6.0 && t <= 18.5) {
      this.ambientLight.color.set(0x87ceeb);
      this.ambientLight.groundColor.set(0xe6c280);
      this.ambientLight.intensity = 0.70;

      this.fillLight.color.set(0xfff4d6);
      this.fillLight.intensity = Math.min(0.45, Math.max(0.20, (sunIntensity / 1.8) * 0.35));
    } else {
      this.ambientLight.color.set(0x4a6d8c);
      this.ambientLight.groundColor.set(0x2c3e50);
      this.ambientLight.intensity = 0.55;

      this.fillLight.color.set(0x3a5470);
      this.fillLight.intensity = 0.40;
    }

    this.starMat.opacity = starOpacity;

    // Update Billboard Sprite Clouds
    if (this.cloudManager) {
      this.cloudManager.setCloudColor(cloudColor, cloudOpacity);
      this.cloudManager.update(delta);
    }

    if (this.starPoints) {
      this.starPoints.rotation.y += delta * 0.008;
    }
  }

  isNight() {
    return this.timeOfDay < 5.5 || this.timeOfDay > 18.5;
  }

  getTimeFormatted() {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    const padH = hours.toString().padStart(2, '0');
    const padM = minutes.toString().padStart(2, '0');
    return `${padH}:${padM}`;
  }
}
