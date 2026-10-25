import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * Ocean.js - Realistic Stylized Ocean Shader
 * Features:
 * - Dynamic harmonic surface waves with smooth normal-mapped micro-ripples
 * - Perlin/Simplex normalMap providing brilliant sun specular glints on wave crests
 * - Shoreline Foam strictly based on island terrain elevation (abs(waterLevel - terrainHeight) < 0.35)
 * - Zero artificial radial rings offshore
 * - Seamless atmospheric horizon blending with sky fog (#bfe9ff)
 */

export function createStylizedOcean(scene) {
  const size = 900;
  const segments = 160;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const waterNormalMap = TextureGenerator.createWaterNormalMap();

  // Tropical Ocean Color Palette
  const oceanUniforms = {
    uTime: { value: 0 },
    uDeepColor: { value: new THREE.Color(0x005c97) },    // Deep ocean sapphire
    uShallowColor: { value: new THREE.Color(0x26c6da) }, // Clear turquoise shallows
    uCrestColor: { value: new THREE.Color(0x80deea) },   // Wave crest aqua
    uFoamColor: { value: new THREE.Color(0xffffff) },    // Crisp shoreline surf foam
    uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(0xfff4d6) },
    uSkyColor: { value: new THREE.Color(0x81d4fa) },
    uFogColor: { value: new THREE.Color(0xbfe9ff) },    // Synchronized with sky horizon (#bfe9ff)
    uFogDensity: { value: 0.0028 },
    uNormalMap: { value: waterNormalMap }
  };

  const oceanMaterial = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Gentle natural rolling tropical swells
        float t = uTime * 0.95;
        float w1 = sin(pos.x * 0.045 + t * 1.2) * 0.32 + cos(pos.z * 0.038 + t * 1.0) * 0.25;
        float w2 = sin((pos.x + pos.z) * 0.070 - t * 1.35) * 0.14;
        float w3 = cos((pos.x * 0.6 - pos.z * 0.8) * 0.090 + t * 0.75) * 0.08;
        float totalWave = w1 + w2 + w3;

        pos.y += totalWave;
        vWaveHeight = totalWave;

        // Analytical wave normals
        float dHdx = 0.045 * cos(pos.x * 0.045 + t * 1.2) * 0.32 + 0.070 * cos((pos.x + pos.z) * 0.070 - t * 1.35) * 0.14;
        float dHdz = -0.038 * sin(pos.z * 0.038 + t * 1.0) * 0.25 + 0.070 * cos((pos.x + pos.z) * 0.070 - t * 1.35) * 0.14;
        vec3 waveNormal = normalize(vec3(-dHdx, 1.0, -dHdz));

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * waveNormal);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uCrestColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunDirection;
      uniform vec3 uSunColor;
      uniform vec3 uSkyColor;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform float uTime;
      uniform sampler2D uNormalMap;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveHeight;

      // Island elevation function replicated in shader for 100% accurate shoreline foam
      float getIslandTerrainHeight(vec2 p) {
        float dist = length(p);
        if (dist >= 145.0) return -16.0;

        float islandFactor = max(0.0, 1.0 - pow(dist / 105.0, 2.2));

        float h = 0.0;
        h += sin(p.x * 0.035 + 1.2) * cos(p.y * 0.035 + 0.9) * 11.0;
        h += sin(p.x * 0.075 - p.y * 0.065) * 5.5;
        h += cos(p.x * 0.15 + p.y * 0.13) * 2.2;
        h += sin(p.x * 0.3) * cos(p.y * 0.3) * 0.8;

        float peakDist = length(p - vec2(18.0, 12.0));
        float mountainPeak = max(0.0, 1.0 - peakDist / 50.0) * 16.0;

        float totalHeight = (h + mountainPeak + 5.0) * islandFactor - (1.0 - islandFactor) * 14.0;

        if (totalHeight > -0.8 && totalHeight < 3.2) {
          totalHeight = totalHeight * 0.65 + 0.6;
        }

        return totalHeight;
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);

        // 1. Dual-layer animated normal map for realistic shimmering water ripples
        vec2 uv1 = vWorldPosition.xz * 0.045 + vec2(uTime * 0.022, uTime * 0.016);
        vec2 uv2 = vWorldPosition.xz * 0.075 - vec2(uTime * 0.018, uTime * 0.024);
        vec3 nMap1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
        vec3 nMap2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
        vec3 rippleNormal = normalize(vec3(nMap1.x + nMap2.x, 2.0, nMap1.y + nMap2.y));

        // Blend geometric wave normal with ripple normal map
        vec3 normal = normalize(vNormal + rippleNormal * 0.45);

        // 2. Dynamic Fresnel
        float NdotV = max(0.0, dot(viewDir, normal));
        float fresnel = pow(1.0 - NdotV, 3.2);
        fresnel = clamp(fresnel, 0.12, 0.85);

        // 3. Realistic Depth Blending based on island distance
        float distFromIsland = length(vWorldPosition.xz);
        float depthFactor = smoothstep(55.0, 140.0, distFromIsland);
        vec3 waterBase = mix(uShallowColor, uDeepColor, depthFactor);

        // Wave crest highlight
        float crest = smoothstep(0.28, 0.60, vWaveHeight);
        waterBase = mix(waterBase, uCrestColor, crest * 0.50);

        // 4. Accurate Shoreline Foam: STRICTLY based on actual island terrain height
        // Only visible where |waterLevel - terrainHeight| < 0.35
        float terrainH = getIslandTerrainHeight(vWorldPosition.xz);
        float waterLevel = vWaveHeight * 0.25;
        float heightDiff = abs(waterLevel - terrainH);

        float shoreFoam = 0.0;
        if (heightDiff < 0.35 && terrainH > -10.0) {
          // Organic foam noise contouring tightly around sand geometry
          float fn1 = sin(vWorldPosition.x * 3.8 + uTime * 2.2) * cos(vWorldPosition.z * 3.8 - uTime * 1.8);
          float fn2 = sin((vWorldPosition.x + vWorldPosition.z) * 7.5 + uTime * 3.0) * 0.5;
          float foamNoise = clamp(fn1 + fn2, -0.3, 1.0);
          float foamIntensity = smoothstep(0.35, 0.02, heightDiff);
          shoreFoam = clamp(foamIntensity * (0.65 + 0.35 * foamNoise), 0.0, 1.0);
        }

        // Apply white shoreline foam
        waterBase = mix(waterBase, uFoamColor, shoreFoam * 0.90);

        // 5. Sparkling Sun Specular Highlights on water ripples
        vec3 halfDir = normalize(uSunDirection + viewDir);
        float spec = pow(max(0.0, dot(normal, halfDir)), 140.0);
        vec3 specular = uSunColor * spec * 3.2;

        // 6. Sky reflection & composite
        vec3 finalColor = mix(waterBase, uSkyColor, fresnel * 0.45) + specular;

        // 7. Atmospheric horizon fog blend (eliminates visible cutoffs at horizon)
        float dist = length(vWorldPosition - cameraPosition);
        float fogFactor = 1.0 - exp(-dist * dist * uFogDensity * uFogDensity);
        finalColor = mix(finalColor, uFogColor, clamp(fogFactor, 0.0, 1.0));

        float alpha = mix(0.86, 0.98, depthFactor);
        alpha = max(alpha, shoreFoam * 0.92);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true
  });

  const oceanMesh = new THREE.Mesh(geometry, oceanMaterial);
  oceanMesh.position.y = 0;
  oceanMesh.receiveShadow = true;
  oceanMesh.name = 'Ocean';
  scene.add(oceanMesh);

  return {
    mesh: oceanMesh,
    material: oceanMaterial,
    update: (delta, time, skyManager = null) => {
      oceanUniforms.uTime.value = time;

      // Synchronize with Sky & Lighting
      if (skyManager) {
        if (skyManager.sunLight) {
          oceanUniforms.uSunDirection.value.copy(skyManager.sunLight.position).normalize();
          oceanUniforms.uSunColor.value.copy(skyManager.sunLight.color);
        }
        if (skyManager.skyUniforms) {
          oceanUniforms.uSkyColor.value.copy(skyManager.skyUniforms.uMidColor.value);
          oceanUniforms.uFogColor.value.copy(skyManager.skyUniforms.uBottomColor.value);
        }

        // Night vs Day water color tuning
        if (skyManager.isNight()) {
          oceanUniforms.uDeepColor.value.setHex(0x051324);
          oceanUniforms.uShallowColor.value.setHex(0x0a2238);
          oceanUniforms.uCrestColor.value.setHex(0x133857);
          oceanUniforms.uSunColor.value.setHex(0x7090ff); // Moon glint
        } else {
          oceanUniforms.uDeepColor.value.setHex(0x005c97);
          oceanUniforms.uShallowColor.value.setHex(0x26c6da);
          oceanUniforms.uCrestColor.value.setHex(0x80deea);
          oceanUniforms.uSunColor.value.setHex(0xfff4d6);
        }
      }
    }
  };
}
