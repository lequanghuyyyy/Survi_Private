import * as THREE from 'three';
import { getTerrainHeight, createPalmTreeModel, createRockModel, createBushModel } from './Island.js';
import { TextureGenerator } from './TextureGenerator.js';
import { soundFX } from './SoundFX.js';

/**
 * Resources.js - Interactive Resource Nodes (Trees, Rocks, Bushes)
 * and Collectible Floating Drops
 */

export class ResourceManager {
  constructor(scene, inventory, survivalStats, colliders = null) {
    this.scene = scene;
    this.inventory = inventory;
    this.survivalStats = survivalStats;
    this.colliders = colliders || [];

    this.resourceNodes = []; // { id, type, hitsLeft, maxHits, mesh, position, isDestroyed }
    this.collectibles = [];  // { id, itemId, count, mesh, position, birthTime }
    this.particles = [];     // { mesh, velocity, life, maxLife }

    // Floating item geometries & materials cached
    this.itemMeshesCache = this.initItemMeshes();

    // Populate island with resources
    this.spawnIslandResources();
  }

  initItemMeshes() {
    return {
      wood: () => {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x936336,
          map: TextureGenerator.createWoodTexture(),
          roughness: 0.8
        });
        const m = new THREE.Mesh(geo, mat);
        m.rotation.z = Math.PI / 2;
        return m;
      },
      stone: () => {
        const geo = new THREE.DodecahedronGeometry(0.14, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0x7a8089, roughness: 0.9 });
        return new THREE.Mesh(geo, mat);
      },
      flint: () => {
        const geo = new THREE.OctahedronGeometry(0.12, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.4, metalness: 0.6 });
        return new THREE.Mesh(geo, mat);
      },
      palm_leaf: () => {
        const geo = new THREE.ConeGeometry(0.15, 0.55, 4);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.6, side: THREE.DoubleSide });
        return new THREE.Mesh(geo, mat);
      },
      coconut: () => {
        const geo = new THREE.DodecahedronGeometry(0.16, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4a2e1b, roughness: 0.8 });
        return new THREE.Mesh(geo, mat);
      },
      berry: () => {
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3 });
        return new THREE.Mesh(geo, mat);
      }
    };
  }

  spawnIslandResources() {
    // Spread resources across the island within radius 15 to 90
    // 1. Shoreline & Lowland Tropical Palm Trees (~36)
    for (let i = 0; i < 38; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 72;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      if (y > 1.2 && y < 11.5) {
        const treeScale = 0.90 + Math.random() * 0.35;
        const model = createPalmTreeModel(treeScale);
        model.position.set(x, y, z);
        model.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(model);

        const node = {
          id: `tree_${i}`,
          type: 'tree',
          name: 'Cây Cọ',
          maxHits: 3,
          hitsLeft: 3,
          mesh: model,
          position: new THREE.Vector3(x, y, z),
          isDestroyed: false,
          shakeTimer: 0,
          fronds: []
        };

        node.health = 100;
        model.traverse(child => {
          if (child.name === 'palmFrond') {
            node.fronds.push(child);
          }
          if (child.isMesh) {
            child.userData.resourceNode = node;
            child.userData.type = 'tree';
            Object.defineProperty(child.userData, 'health', {
              get: () => node.health,
              set: (v) => { node.health = v; },
              configurable: true
            });
            if (!window.worldColliders) window.worldColliders = [];
            window.worldColliders.push(child);
          }
        });

        // Register solid obstacle collider (radius 0.45 for palm trunk)
        const col = {
          type: 'cylinder',
          x: x,
          z: z,
          radius: 0.45 * treeScale,
          mesh: model,
          destroyed: false
        };
        this.colliders.push(col);
        node.collider = col;

        this.resourceNodes.push(node);
      }
    }

    // 1b. Highland & Hillside Tropical Palm Trees (~26) - Replacing cone trees entirely!
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 55;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      if (y >= 7.5 && y < 22) {
        const treeScale = 0.85 + Math.random() * 0.45;
        const model = createPalmTreeModel(treeScale);
        model.position.set(x, y, z);
        model.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(model);

        const node = {
          id: `hill_palm_${i}`,
          type: 'tree',
          name: 'Cây Cọ Nhiệt Đới',
          maxHits: 3,
          hitsLeft: 3,
          mesh: model,
          position: new THREE.Vector3(x, y, z),
          isDestroyed: false,
          shakeTimer: 0,
          fronds: []
        };

        node.health = 100;
        model.traverse(child => {
          if (child.name === 'palmFrond') {
            node.fronds.push(child);
          }
          if (child.isMesh) {
            child.userData.resourceNode = node;
            child.userData.type = 'tree';
            Object.defineProperty(child.userData, 'health', {
              get: () => node.health,
              set: (v) => { node.health = v; },
              configurable: true
            });
            if (!window.worldColliders) window.worldColliders = [];
            window.worldColliders.push(child);
          }
        });

        // Register solid obstacle collider
        const col = {
          type: 'cylinder',
          x: x,
          z: z,
          radius: 0.48 * treeScale,
          mesh: model,
          destroyed: false
        };
        this.colliders.push(col);
        node.collider = col;

        this.resourceNodes.push(node);
      }
    }

    // 2. Chiseled Rocks with varied scale (from small stones to massive boulders)
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 85;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      if (y > 0.8 && y < 22) {
        // Natural distribution: small, medium, and massive boulders
        const scale = 0.65 + Math.random() * 1.15;
        const model = createRockModel(scale);
        model.position.set(x, y, z);
        model.rotation.set(
          (Math.random() - 0.5) * 0.25,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.25
        );
        this.scene.add(model);

        const node = {
          id: `rock_${i}`,
          type: 'rock',
          name: 'Khối Đá',
          maxHits: 4,
          hitsLeft: 4,
          mesh: model,
          position: new THREE.Vector3(x, y, z),
          isDestroyed: false,
          shakeTimer: 0
        };

        node.health = 100;
        model.traverse(child => {
          if (child.isMesh) {
            child.userData.resourceNode = node;
            child.userData.type = 'rock';
            Object.defineProperty(child.userData, 'health', {
              get: () => node.health,
              set: (v) => { node.health = v; },
              configurable: true
            });
            if (!window.worldColliders) window.worldColliders = [];
            window.worldColliders.push(child);
          }
        });

        // Register solid obstacle collider for boulders
        const col = {
          type: 'sphere',
          x: x,
          z: z,
          radius: scale * 1.35 * 0.82,
          mesh: model,
          destroyed: false
        };
        this.colliders.push(col);
        node.collider = col;

        this.resourceNodes.push(node);
      }
    }

    // 3. Tropical Berry Bushes (~32)
    for (let i = 0; i < 34; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 75;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = getTerrainHeight(x, z);

      if (y > 2.0 && y < 16) {
        const bushScale = 0.85 + Math.random() * 0.4;
        const model = createBushModel(bushScale);
        model.position.set(x, y, z);
        model.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(model);

        const node = {
          id: `bush_${i}`,
          type: 'bush',
          name: 'Bụi Quả Mọng',
          maxHits: 1,
          hitsLeft: 1,
          mesh: model,
          position: new THREE.Vector3(x, y, z),
          isDestroyed: false,
          shakeTimer: 0
        };

        node.health = 100;
        model.traverse(child => {
          if (child.isMesh) {
            child.userData.resourceNode = node;
            child.userData.type = 'rock';
            Object.defineProperty(child.userData, 'health', {
              get: () => node.health,
              set: (v) => { node.health = v; },
              configurable: true
            });
            if (!window.worldColliders) window.worldColliders = [];
            window.worldColliders.push(child);
          }
        });

        this.resourceNodes.push(node);
      }
    }
  }

  /**
   * Hit or harvest a resource node
   */
  hitNode(node, equippedItem) {
    if (node.isDestroyed) return;

    let damage = 1;

    // Check equipped tool efficiency bonuses
    if (node.type === 'tree') {
      if (equippedItem && equippedItem.id === 'stone_axe') {
        damage = 2; // Axe doubles tree harvesting speed
      }
      soundFX.playChopWoodSound();
      this.spawnDebris(node.position, 0x8b5a2b, 6);
    } else if (node.type === 'rock') {
      if (equippedItem && equippedItem.id === 'stone_pickaxe') {
        damage = 2; // Pickaxe doubles rock harvesting speed
      }
      soundFX.playMineRockSound();
      this.spawnDebris(node.position, 0x7a8089, 7);
    } else if (node.type === 'bush') {
      soundFX.playChopWoodSound();
      this.spawnDebris(node.position, 0x2ed573, 5);
    }

    node.hitsLeft = Math.max(0, node.hitsLeft - damage);
    node.shakeTimer = 0.22; // trigger wobble animation

    if (node.hitsLeft <= 0) {
      this.destroyNode(node);
    }
  }

  destroyNode(node) {
    node.isDestroyed = true;
    this.survivalStats.resourcesGathered += 1;

    // Remove solid obstacle collider so player can walk freely through the spot
    if (node.collider) {
      node.collider.destroyed = true;
      const idx = this.colliders.indexOf(node.collider);
      if (idx !== -1) {
        this.colliders.splice(idx, 1);
      }
    }

    // Remove meshes from worldColliders
    if (node.mesh) {
      node.mesh.traverse(child => {
        if (child.isMesh && window.worldColliders) {
          const idx = window.worldColliders.indexOf(child);
          if (idx !== -1) window.worldColliders.splice(idx, 1);
        }
      });
    }

    // Shrink animation then remove from scene
    const initialScale = node.mesh.scale.clone();
    let shrinkProgress = 0;

    const shrinkAnim = () => {
      shrinkProgress += 0.08;
      if (shrinkProgress < 1.0) {
        node.mesh.scale.copy(initialScale).multiplyScalar(1 - shrinkProgress);
        requestAnimationFrame(shrinkAnim);
      } else {
        this.scene.remove(node.mesh);
      }
    };
    shrinkAnim();

    // Spawn Collectible drops at node position
    const pos = node.position.clone();

    if (node.type === 'tree') {
      // 2-3 Wood, 1-2 Palm Leaves, 40% chance of Coconut
      this.spawnCollectible('wood', 2 + Math.floor(Math.random() * 2), pos);
      this.spawnCollectible('palm_leaf', 1 + Math.floor(Math.random() * 2), pos);
      if (Math.random() < 0.45) {
        this.spawnCollectible('coconut', 1, pos);
      }
    } else if (node.type === 'rock') {
      // 2-3 Stone, 1-2 Flint
      this.spawnCollectible('stone', 2 + Math.floor(Math.random() * 2), pos);
      this.spawnCollectible('flint', 1 + Math.floor(Math.random() * 2), pos);
    } else if (node.type === 'bush') {
      // 2-3 Berries, 1 Palm Leaf
      this.spawnCollectible('berry', 2 + Math.floor(Math.random() * 2), pos);
      this.spawnCollectible('palm_leaf', 1, pos);
    }
  }

  spawnCollectible(itemId, count, basePos) {
    const builder = this.itemMeshesCache[itemId];
    if (!builder) return;

    const group = new THREE.Group();
    const mesh = builder();
    group.add(mesh);

    // Random offset around base position
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.6 + Math.random() * 1.4;
    const x = basePos.x + Math.cos(angle) * dist;
    const z = basePos.z + Math.sin(angle) * dist;
    const y = getTerrainHeight(x, z) + 0.4;

    group.position.set(x, y, z);
    this.scene.add(group);

    const collectible = {
      id: `drop_${Date.now()}_${Math.random()}`,
      itemId,
      count,
      mesh: group,
      baseY: y,
      position: group.position,
      birthTime: performance.now() * 0.001
    };

    // Attach generous hit sphere for raycast targeting
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 6, 6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData.collectible = collectible;
    group.add(hitSphere);

    group.traverse(child => {
      if (child.isMesh) {
        child.userData.collectible = collectible;
        child.userData.type = 'ground_item';
      }
    });

    this.collectibles.push(collectible);
  }

  spawnDebris(position, color, count = 5) {
    for (let i = 0; i < count; i++) {
      const size = 0.08 + Math.random() * 0.08;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color });
      const pMesh = new THREE.Mesh(geo, mat);

      pMesh.position.copy(position);
      pMesh.position.y += 0.8 + Math.random() * 0.5;

      this.scene.add(pMesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        2.5 + Math.random() * 3.0,
        (Math.random() - 0.5) * 4.0
      );

      this.particles.push({
        mesh: pMesh,
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4
      });
    }
  }

  pickupItem(collectible) {
    const added = this.inventory.addItem(collectible.itemId, collectible.count);
    if (added > 0) {
      soundFX.playPickup();
      this.scene.remove(collectible.mesh);
      const idx = this.collectibles.indexOf(collectible);
      if (idx !== -1) {
        this.collectibles.splice(idx, 1);
      }
      return true;
    }
    return false;
  }

  update(delta, time, playerPos) {
    // 1. Shake animation on hit nodes & gentle wind sway on palm fronds
    for (const node of this.resourceNodes) {
      if (node.shakeTimer > 0) {
        node.shakeTimer -= delta;
        const wobble = Math.sin(node.shakeTimer * 40) * 0.08;
        node.mesh.rotation.z = wobble;
        if (node.shakeTimer <= 0) {
          node.mesh.rotation.z = 0;
        }
      }

      // Gentle natural wind breeze on palm fronds
      if (node.type === 'tree' && !node.isDestroyed && node.fronds) {
        for (const f of node.fronds) {
          const sway = Math.sin(time * f.userData.swaySpeed + f.userData.swayOffset) * 0.04;
          f.rotation.z = (f.userData.baseAngleZ || 0) + sway;
        }
      }
    }

    // 2. Animate floating collectibles (bob & spin) + check proximity auto pickup or manual pickup
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const drop = this.collectibles[i];
      drop.mesh.rotation.y += delta * 2.2;
      drop.mesh.position.y = drop.baseY + Math.sin(time * 3.5 + drop.birthTime) * 0.12;

      // Distance check to player: auto-pickup if close enough (~1.8m)
      const dist = drop.position.distanceTo(playerPos);
      if (dist < 1.8) {
        this.pickupItem(drop);
      }
    }

    // 3. Update debris particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      p.velocity.y -= 14.0 * delta; // Gravity
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.rotation.x += delta * 5;
      p.mesh.rotation.y += delta * 5;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
