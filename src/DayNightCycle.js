import * as THREE from 'three';

/**
 * DayNightCycle.js - Handles 5-minute Day/Night cycle,
 * moving sun/moon, sky & fog color grading, and dynamic star dome.
 */

export class DayNightCycle {
  constructor(scene, durationSec = 300) {
    this.scene = scene;
    this.durationSec = durationSec; // 300s = 5 minutes full cycle
    this.timeOfDay = 8.0; // Starts at 08:00 AM
    this.dayCount = 1;

    // Lights
    this.ambientLight = new THREE.HemisphereLight(0x70a1ff, 0xeccc68, 0.6);
    this.scene.add(this.ambientLight);

    // Sun Directional Light (Warm golden sunlight)
    this.sunLight = new THREE.DirectionalLight(0xfff2cc, 1.6);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 350;
    const d = 75;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Moon Directional Light (Soft blue tint at night)
    this.moonLight = new THREE.DirectionalLight(0x7090ff, 0.3);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);

    // Celestial Visual Objects: Sun & Corona & Moon
    const sunGroup = new THREE.Group();
    const sunGeo = new THREE.SphereGeometry(6.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea78 });
    const sunCore = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunCore);

    // Glowing Sun Corona Halo
    const coronaGeo = new THREE.SphereGeometry(10.5, 16, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.28
    });
    const sunCorona = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(sunCorona);

    this.sunMesh = sunGroup;
    this.scene.add(this.sunMesh);

    const moonGeo = new THREE.SphereGeometry(4.2, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xd8e6ff });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // Dynamic Starfield Points
    this.initStars();

    // Scene Fog - Soft blue-grey horizon blend
    this.fogColor = new THREE.Color(0x70a1ff);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.0048);
  }

  initStars() {
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Celestial sphere dome
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 240;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 10; // Upper dome
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      transparent: true,
      opacity: 0.0
    });

    this.starPoints = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.starPoints);
  }

  skipToMorning() {
    this.timeOfDay = 6.5; // 06:30 AM
    this.dayCount += 1;
    this.update(0);
  }

  update(delta) {
    // Advance time: 24 game hours in durationSec real seconds
    const hoursPerSec = 24.0 / this.durationSec;
    this.timeOfDay += hoursPerSec * delta;

    if (this.timeOfDay >= 24.0) {
      this.timeOfDay -= 24.0;
      this.dayCount += 1;
    }

    // Convert timeOfDay (0..24) to sun angle (radians)
    // 06:00 is sunrise (angle = 0), 12:00 is noon (angle = PI/2), 18:00 is sunset (angle = PI)
    const sunAngle = ((this.timeOfDay - 6.0) / 24.0) * Math.PI * 2;
    const sunDist = 180;

    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 40;

    this.sunLight.position.set(sunX, Math.max(-20, sunY), sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    // Moon is opposite to the Sun
    this.moonLight.position.set(-sunX, -sunY, -sunZ);
    this.moonMesh.position.set(-sunX, -sunY, -sunZ);

    // Target colors based on time
    const t = this.timeOfDay;
    let skyColor = new THREE.Color();
    let sunIntensity = 0;
    let moonIntensity = 0;
    let starOpacity = 0;

    // Day/Night transitions
    if (t >= 5.0 && t < 7.0) {
      // Dawn (05:00 - 07:00)
      const alpha = (t - 5.0) / 2.0;
      skyColor.lerpColors(new THREE.Color(0x1a0f2e), new THREE.Color(0xfd7e48), alpha);
      sunIntensity = alpha * 1.0;
      moonIntensity = (1 - alpha) * 0.3;
      starOpacity = 1 - alpha;
    } else if (t >= 7.0 && t < 17.0) {
      // Daytime (07:00 - 17:00)
      const alpha = Math.sin(((t - 7.0) / 10.0) * Math.PI);
      skyColor.lerpColors(new THREE.Color(0x7ac1eb), new THREE.Color(0x56a4dc), alpha);
      sunIntensity = 1.0 + alpha * 0.4;
      moonIntensity = 0.0;
      starOpacity = 0.0;
    } else if (t >= 17.0 && t < 19.5) {
      // Sunset (17:00 - 19:30)
      const alpha = (t - 17.0) / 2.5;
      skyColor.lerpColors(new THREE.Color(0x7ac1eb), new THREE.Color(0xc94b2a), alpha * 0.7);
      if (alpha > 0.5) {
        skyColor.lerp(new THREE.Color(0x281236), (alpha - 0.5) * 2.0);
      }
      sunIntensity = (1 - alpha) * 1.1;
      moonIntensity = alpha * 0.25;
      starOpacity = alpha;
    } else {
      // Night (19:30 - 05:00)
      skyColor.setHex(0x060914);
      sunIntensity = 0.0;
      moonIntensity = 0.35;
      starOpacity = 1.0;
    }

    // Apply to scene
    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(skyColor);
    }
    this.ambientLight.color.copy(skyColor).multiplyScalar(0.7).addScalar(0.2);

    this.sunLight.intensity = Math.max(0, sunIntensity);
    this.moonLight.intensity = Math.max(0, moonIntensity);
    this.starMat.opacity = starOpacity;

    // Slowly spin stars
    if (this.starPoints) {
      this.starPoints.rotation.y += delta * 0.015;
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
