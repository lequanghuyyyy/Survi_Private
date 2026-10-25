import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { createIsland } from './Island.js';
import { createFoliage } from './Foliage.js';
import { Player } from './Player.js';
import { InputManager } from './InputManager.js';
import { SurvivalStats } from './SurvivalStats.js';
import { Inventory, ITEM_DEFS } from './Inventory.js';
import { CraftingManager } from './Crafting.js';
import { BuildingManager } from './Building.js';
import { SkyManager } from './Sky.js';
import { ResourceManager } from './Resources.js';
import { UIManager } from './UI.js';
import { soundFX } from './SoundFX.js';
import { assetLoader } from './AssetLoader.js';

window.worldColliders = [];
window.raftFloorMeshes = [];

class Game {
  constructor() {
    window.gameInstance = this;
    window.handlePlayerInteract = this.handlePlayerInteract.bind(this);
    this.container = document.getElementById('game-container');

    // Initialize 3D Asset Loader asynchronously (supports /models/axe.glb and /models/palm_tree.glb)
    assetLoader.init().catch((err) => console.warn('AssetLoader init warning:', err));

    // 1. Scene, Camera, Renderer (Fixed 75 degree FOV)
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      800
    );
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15; // Raft tropical warm sunlit exposure
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Setup Post-Processing EffectComposer
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // UnrealBloomPass: Calibrated so wood/stone/rope never neon-bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.18, // strength: gentle glow only
      0.35, // radius
      0.92  // threshold: only sun specular highlights glow
    );
    this.composer.addPass(bloomPass);

    // VignetteShader: softens screen edges, focuses center
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 1.05;
    vignettePass.uniforms['darkness'].value = 1.15;
    this.composer.addPass(vignettePass);

    // OutputPass: Handles tone mapping and color space output correctly
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    // 2. Input Manager (Manages PointerLock, settings, and prevents browser key conflicts)
    this.inputManager = new InputManager(this.renderer.domElement, {
      sensitivityLevel: 4,
      mouseSensitivity: 0.0008,
      masterVolume: 1.0,
      shadowsEnabled: true
    });

    // 3. Atmospheric Sky, Lighting, 6-minute Day/Night Cycle, and Cumulus Clouds
    this.skyManager = new SkyManager(this.scene, 360); // 6 min full cycle

    // 4. Survival Stats & Inventory
    this.survivalStats = new SurvivalStats((reason, stats) => {
      this.uiManager.showGameOver(reason, stats);
    });

    this.inventory = new Inventory(8, () => {
      if (this.uiManager) {
        this.uiManager.updateHotbar();
        this.uiManager.renderCraftingGrid();
      }
    });

    this.craftingManager = new CraftingManager(this.inventory);

    // 5. Procedural Island Environment & Animated Stylized Ocean
    this.island = createIsland(this.scene);

    // 6. Slope-Aware Instanced Foliage (Grass & Bushes, restricted to 1.2 < y < 13.0 and flat terrain)
    this.foliage = createFoliage(this.scene);

    // 7. Player Controller (Integrated with InputManager & Solid Obstacle Colliders)
    this.player = new Player(this.camera, this.renderer.domElement, this.inventory, this.survivalStats, this.inputManager);
    this.player.setIsland(this.island);
    this.scene.add(this.player.camera);

    // 8. Resources & Building Managers (Populating unified solid obstacle colliders)
    this.resourceManager = new ResourceManager(this.scene, this.inventory, this.survivalStats, this.island.colliders);
    this.buildingManager = new BuildingManager(this.scene, this.inventory, this.survivalStats, this.skyManager);
    this.buildingManager.setTerrainMesh(this.island.terrainMesh);
    window.terrainMesh = this.island.terrainMesh;
    this.player.setBuildingManager(this.buildingManager);

    // Building Mode state
    this.activeBuildingType = null;
    this.isRightMouseDown = false;

    // 3D Yellow Inverted-Hull Outline Highlight
    this.outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd32a, // Bright warm Raft yellow
      side: THREE.BackSide
    });
    this.currentHovered = null;

    // 9. UI Manager (HUD, Frosted Glass Pause/Settings modal, Crafting modal)
    this.uiManager = new UIManager(this.inventory, this.survivalStats, this.craftingManager, this.skyManager);

    // Wire InputManager shortcuts to UI
    this.inputManager.onToggleCrafting = () => this.uiManager.toggleCrafting();
    this.inputManager.onToggleBackpack = () => this.uiManager.toggleBackpack();
    this.inputManager.onCancelBuild = () => {
      if (this.activeBuildingType) {
        this.cancelBuildMode();
      }
    };
    this.inputManager.onTogglePause = (force) => this.uiManager.togglePauseMenu(force);
    this.inputManager.onToggleGuide = () => this.uiManager.toggleGuide();
    this.inputManager.onEscape = () => {
      if (this.activeBuildingType) {
        this.cancelBuildMode();
        return;
      }
      this.uiManager.handleEscapeKey();
    };
    this.inputManager.onPointerLockLost = () => {
      // Only pause if player lost pointer lock unintentionally (NOT when intentionally opening Crafting, Backpack, or Guide modal)
      if (this.uiManager.craftingModal.classList.contains('hidden') &&
          (!this.uiManager.backpackModal || this.uiManager.backpackModal.classList.contains('hidden')) &&
          this.uiManager.guideModal.classList.contains('hidden') &&
          this.uiManager.startScreen.style.display === 'none' &&
          this.uiManager.gameOverScreen.classList.contains('hidden')) {
        this.uiManager.togglePauseMenu(true);
      }
    };
    this.inputManager.onSelectSlot = (idx) => {
      if (this.activeBuildingType) {
        this.cancelBuildMode();
      }
      this.inventory.selectSlot(idx);
    };

    // Wire UI Manager callbacks
    this.uiManager.onStartBuildingFromBackpack = (buildItemId) => {
      const def = ITEM_DEFS[buildItemId];
      this.startBuildMode(def?.buildType || buildItemId);
    };
    this.uiManager.onStartGameCallback = () => {
      this.inputManager.requestLock();
      enableGameKeyboardLock();
    };
    this.uiManager.onRespawnCallback = () => {
      this.survivalStats.respawn();
      this.player.respawn();
      this.inputManager.requestLock();
      enableGameKeyboardLock();
    };
    this.uiManager.onRequestPointerLock = () => {
      this.inputManager.requestLock();
      enableGameKeyboardLock();
    };
    this.uiManager.onPauseStateChange = (isPaused) => {
      this.inputManager.isPaused = isPaused;
    };
    this.uiManager.onSettingsChange = (newSettings) => {
      this.inputManager.updateSettings(newSettings);
      if (newSettings.shadowsEnabled !== undefined) {
        this.renderer.shadowMap.enabled = newSettings.shadowsEnabled;
        this.skyManager.sunLight.castShadow = newSettings.shadowsEnabled;
        this.scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.needsUpdate = true;
          }
        });
      }
    };

    // Raycaster for player interactions
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.2;
    this.targetedObject = null;

    // Clock
    this.clock = new THREE.Clock();

    // Setup Game Interaction Handlers
    this.setupInteractionHandlers();

    // Window Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  startBuildMode(buildType) {
    this.activeBuildingType = buildType;
    this.buildingManager.setBuildPreview(buildType);
    this.uiManager.setBuildingPrompt(true);

    // Auto-select building hammer on hotbar if available
    const hammerIdx = this.inventory.findItemSlot('hammer');
    if (hammerIdx !== -1) {
      this.inventory.selectSlot(hammerIdx);
    }

    if (!this.inputManager.isLocked) {
      this.inputManager.requestLock();
      enableGameKeyboardLock();
    }
  }

  cancelBuildMode() {
    this.activeBuildingType = null;
    this.isRightMouseDown = false;
    this.buildingManager.setBuildPreview(null);
    this.uiManager.setBuildingPrompt(false);
    const equipped = this.inventory.getSelectedItem();
    if (equipped && equipped.type === 'building') {
      const toolIdx = this.inventory.hotbarSlots.findIndex(s => s && s.type === 'tool');
      if (toolIdx !== -1) {
        this.inventory.selectSlot(toolIdx);
      } else {
        const emptyIdx = this.inventory.hotbarSlots.findIndex(s => s === null);
        if (emptyIdx !== -1) this.inventory.selectSlot(emptyIdx);
      }
    }
  }

  setupInteractionHandlers() {
    // Click canvas or background to regain pointer lock if not in menu
    window.addEventListener('click', (e) => {
      if (e.target.closest('.modal-card') || e.target.closest('#start-screen button')) {
        return;
      }
      if (!this.inputManager.isLocked && 
          this.uiManager.craftingModal.classList.contains('hidden') && 
          (!this.uiManager.backpackModal || this.uiManager.backpackModal.classList.contains('hidden')) &&
          this.uiManager.guideModal.classList.contains('hidden') &&
          this.uiManager.settingsModal.classList.contains('hidden') &&
          this.uiManager.gameOverScreen.classList.contains('hidden') &&
          this.uiManager.startScreen.style.display === 'none') {
        this.inputManager.requestLock();
        enableGameKeyboardLock();
      }
    });

    // Primary & Building actions: Left Click (Attack / Harvest / Place structure)
    window.addEventListener('mousedown', (e) => {
      if (!this.inputManager.isLocked || this.inputManager.isPaused || this.survivalStats.isDead) return;

      const equipped = this.inventory.getSelectedItem();
      const inBuildingMode = !!this.activeBuildingType || (equipped && equipped.type === 'building');

      if (e.button === 0) { // Left Click
        // 1. If in Building Mode -> Place Structure at current ghost location & rotation
        if (inBuildingMode) {
          const placed = this.buildingManager.placeStructure();
          if (placed) {
            const buildType = this.activeBuildingType || (equipped && ITEM_DEFS[equipped.id]?.buildType);
            let targetItemId = null;
            for (const [id, def] of Object.entries(ITEM_DEFS)) {
              if (def.buildType === buildType) {
                targetItemId = id;
                break;
              }
            }
            if (!targetItemId) targetItemId = buildType;
            const def = ITEM_DEFS[targetItemId];
            this.uiManager.showNotification(`Đã xây dựng: ${def ? def.name : targetItemId}`, def ? def.icon : '🏗️');
            if (targetItemId && !this.inventory.hasItem(targetItemId, 1)) {
              this.cancelBuildMode();
            }
          } else {
            if (!this.buildingManager.isValidPlacement) {
              this.uiManager.showNotification("⚠️ Vị trí không hợp lệ để đặt!", "🚫");
            } else {
              this.uiManager.showNotification("⚠️ Không đủ vật phẩm trong túi đồ!", "📦");
            }
          }
          return;
        }

        // If holding food, left click consumes it
        if (equipped && equipped.type === 'food') {
          this.handleSecondaryAction();
          return;
        }

        // Tool Swing Animation
        this.player.triggerSwing();

        // Raycast interact with world
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        this.raycaster.far = 4.8;
        const interactables = [];
        for (const drop of this.resourceManager.collectibles) interactables.push(drop.mesh);
        for (const b of this.buildingManager.activeBuildings) interactables.push(b.mesh);
        for (const node of this.resourceManager.resourceNodes) {
          if (!node.isDestroyed) interactables.push(node.mesh);
        }
        if (window.worldColliders) {
          for (const col of window.worldColliders) interactables.push(col);
        }

        const hits = this.raycaster.intersectObjects(interactables, true);
        const raycastHit = hits.length > 0 ? hits[0] : null;

        // Normalize equipped tool
        let currentEquippedItem = null;
        if (equipped && equipped.id !== 'hand') {
          let eqId = equipped.id;
          if (eqId === 'hammer') eqId = 'building_hammer';
          if (eqId === 'axe') eqId = 'stone_axe';
          if (eqId === 'pickaxe') eqId = 'stone_pickaxe';
          currentEquippedItem = { ...equipped, id: eqId };
        }

        this.handlePlayerInteract(raycastHit, currentEquippedItem);
      } else if (e.button === 2) { // Right Click
        // In Building Mode: Right-Click rotates the hologram 45 degrees, and flag for drag rotation
        if (inBuildingMode) {
          e.preventDefault();
          this.isRightMouseDown = true;
          this.buildingManager.rotateHologramStep(1);
          return;
        }

        // Otherwise: Eat food or interact
        this.handleSecondaryAction();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isRightMouseDown = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.inputManager.isLocked || this.inputManager.isPaused) return;
      // If holding right-click in building mode, smooth rotation via mouse delta
      if (this.isRightMouseDown && (this.activeBuildingType || (this.inventory.getSelectedItem()?.type === 'building'))) {
        const deltaX = e.movementX || 0;
        if (deltaX !== 0) {
          this.buildingManager.rotateHologram(-deltaX * 0.02);
        }
      }
    });

    // Secondary action: 'E' Key
    window.addEventListener('keydown', (e) => {
      if (!this.inputManager.isLocked || this.inputManager.isPaused || this.survivalStats.isDead) return;
      if (e.code === 'KeyE') {
        this.handleSecondaryAction();
      }
    });

    // Prevent context menu on right click in game
    window.addEventListener('contextmenu', (e) => {
      if (this.inputManager.isLocked || this.activeBuildingType) {
        e.preventDefault();
      }
    });
  }

  handlePlayerInteract(raycastHit, currentEquippedItem) {
    const playSwingSound = () => soundFX.playSwingSound();
    const showHUDMessage = (msg) => this.uiManager.showNotification(msg);
    const pickupItemToBackpack = (target) => {
      let current = target;
      let drop = null;
      while (current && !drop) {
        if (current.userData && current.userData.collectible) drop = current.userData.collectible;
        current = current.parent;
      }
      if (drop && this.resourceManager.pickupItem(drop)) {
        const def = ITEM_DEFS[drop.itemId];
        showHUDMessage(`+${drop.count} ${def ? def.name : drop.itemId}`);
        soundFX.playPickup();
        this.setHoveredObject(null);
        this.targetedObject = null;
      }
    };
    const lightUpCampfire = (target) => {
      target.userData.isLit = true;
      let current = target;
      while (current) {
        if (current.userData && current.userData.building && current.userData.building.setLit) {
          current.userData.building.setLit(true);
          break;
        }
        current = current.parent;
      }
      soundFX.playCraft();
    };
    const playChopWoodSound = () => soundFX.playChopWoodSound();
    const spawnWoodSplinters = (point) => {
      this.resourceManager.spawnDebris(point, 0x8b5a2b, 8);
      this.player.applyHitShake(0.048);
    };
    const harvestTree = (target) => {
      let current = target;
      let node = null;
      while (current && !node) {
        if (current.userData && current.userData.resourceNode) node = current.userData.resourceNode;
        current = current.parent;
      }
      if (node && !node.isDestroyed) {
        this.resourceManager.destroyNode(node);
        this.setHoveredObject(null);
        this.targetedObject = null;
      }
    };
    const playDullClangSound = () => soundFX.playDullClangSound();
    const playMineRockSound = () => soundFX.playMineRockSound();
    const spawnRockChips = (point) => {
      this.resourceManager.spawnDebris(point, 0x7a8089, 8);
      this.player.applyHitShake(0.048);
    };
    const harvestRock = (target) => {
      let current = target;
      let node = null;
      while (current && !node) {
        if (current.userData && current.userData.resourceNode) node = current.userData.resourceNode;
        current = current.parent;
      }
      if (node && !node.isDestroyed) {
        this.resourceManager.destroyNode(node);
        this.setHoveredObject(null);
        this.targetedObject = null;
      }
    };
    const playThudSound = () => soundFX.playThudSound();
    const repairOrUpgradeStructure = (target) => {
      soundFX.playBuild();
      showHUDMessage("🔨 Đã sửa chữa và gia cố công trình!");
    };

    if (!raycastHit) {
      playSwingSound(); // Vung gió nếu không trúng gì
      return;
    }

    const target = raycastHit.object;
    const targetType = target.userData.type; // 'tree', 'rock', 'ground_item', 'structure'

    // TRƯỜNG HỢP 1: TAY KHÔNG (Không cầm gì)
    if (!currentEquippedItem) {
      if (targetType === 'ground_item') {
        pickupItemToBackpack(target); // Nhặt cành cây, sỏi, quả dừa vào Balo
      } else if (targetType === 'tree') {
        showHUDMessage("⚠️ Cần có Rìu để chặt cây!");
      } else if (targetType === 'rock') {
        showHUDMessage("⚠️ Cần có Cuốc Đá để đập đá!");
      }
      return;
    }

    // TRƯỜNG HỢP 2: CẦM ĐUỐC (TORCH)
    if (currentEquippedItem.id === 'torch') {
      if (targetType === 'campfire' && !target.userData.isLit) {
        lightUpCampfire(target);
        showHUDMessage("🔥 Đã nhóm lửa trại!");
      } else {
        showHUDMessage("⚠️ Đuốc chỉ dùng để soi sáng và thắp lửa!");
      }
      return;
    }

    // TRƯỜNG HỢP 3: CẦM RÌU ĐÁ (AXE)
    if (currentEquippedItem.id === 'stone_axe') {
      if (targetType === 'tree') {
        target.userData.health -= 25;
        playChopWoodSound();
        spawnWoodSplinters(raycastHit.point);
        if (target.userData.health <= 0) harvestTree(target);
      } else if (targetType === 'rock') {
        playDullClangSound();
        showHUDMessage("⚠️ Rìu không thể đập đá! Hãy dùng Cuốc.");
      }
      return;
    }

    // TRƯỜNG HỢP 4: CẦM CUỐC ĐÁ (PICKAXE)
    if (currentEquippedItem.id === 'stone_pickaxe') {
      if (targetType === 'rock') {
        target.userData.health -= 25;
        playMineRockSound();
        spawnRockChips(raycastHit.point);
        if (target.userData.health <= 0) harvestRock(target);
      } else if (targetType === 'tree') {
        playThudSound();
        showHUDMessage("⚠️ Cuốc dùng để đập đá, không hiệu quả khi chặt cây!");
      }
      return;
    }

    // TRƯỜNG HỢP 5: CẦM BÚA GỖ (BUILDING HAMMER)
    if (currentEquippedItem.id === 'building_hammer') {
      if (targetType === 'structure') {
        repairOrUpgradeStructure(target);
      } else {
        showHUDMessage("ℹ️ Búa dùng để sửa chữa và mở chế độ xây dựng.");
      }
      return;
    }
  }

  handleSecondaryAction() {
    // 1. Check if holding food in hotbar -> Eat
    const equipped = this.inventory.getSelectedItem();
    if (equipped && equipped.type === 'food') {
      const consumedId = this.inventory.consumeSelectedFood();
      if (consumedId) {
        this.survivalStats.consumeItem(consumedId);
        soundFX.playEat();
        const def = ITEM_DEFS[consumedId];
        this.uiManager.showNotification(`Đã ăn ${def.name}!`, def.icon);
        return;
      }
    }

    // 2. Check targeted interactive object in front
    if (this.targetedObject) {
      if (this.targetedObject.type === 'collectible') {
        const drop = this.targetedObject.data;
        const def = ITEM_DEFS[drop.itemId];
        if (this.resourceManager.pickupItem(drop)) {
          this.uiManager.showNotification(`+${drop.count} ${def ? def.name : drop.itemId}`, def ? def.icon : '📦');
          this.setHoveredObject(null);
          this.targetedObject = null;
        }
      } else if (this.targetedObject.type === 'building') {
        const b = this.targetedObject.data;
        if (b.type === 'campfire') {
          // Cho phép bấm [E] để Dập lửa / Thắp lại lửa tự do
          const newLit = !b.isLit;
          b.setLit(newLit);
          soundFX.playCraft();
          this.uiManager.showNotification(newLit ? "🔥 Đã thắp lại lửa trại!" : "💨 Đã dập tắt lửa trại!");
          return;
        } else if (b.type === 'shelter') {
          // Sleep through the night
          this.uiManager.triggerSleepSequence(() => {
            this.skyManager.skipToMorning();
            this.survivalStats.sleepRest();
            this.uiManager.showNotification("Bạn đã ngủ một giấc sâu tới sáng!", "🌅");
          });
        } else if (b.type === 'water_collector') {
          // Drink collected water
          if (b.waterLevel >= 20) {
            b.waterLevel = Math.max(0, b.waterLevel - 35);
            this.survivalStats.drinkWater(35);
            soundFX.playDrink();
            this.uiManager.showNotification("Đã uống nước mưa mát lạnh (+35 Khát)", "💧");
          } else {
            this.uiManager.showNotification("Máy chưa gom đủ nước mưa!", "⚠️");
          }
        }
      } else if (this.targetedObject.type === 'resource') {
        const node = this.targetedObject.data;
        if (node.type === 'bush') {
          this.resourceManager.hitNode(node, equipped);
        }
      }
      return;
    }

    // 3. Check if standing near any campfire within 3.5m to toggle with [E]
    if (this.buildingManager && this.buildingManager.activeBuildings) {
      const nearCampfire = this.buildingManager.activeBuildings.find(b =>
        b.type === 'campfire' && b.position && this.player.position.distanceTo(b.position) <= 3.5
      );
      if (nearCampfire) {
        const newLit = !nearCampfire.isLit;
        nearCampfire.setLit(newLit);
        soundFX.playCraft();
        this.uiManager.showNotification(newLit ? "🔥 Đã thắp lại lửa trại!" : "💨 Đã dập tắt lửa trại!");
        return;
      }
    }
  }

  setHoveredObject(targetGroup) {
    if (this.currentHovered === targetGroup) return;

    // Remove outline from previous target
    if (this.currentHovered) {
      this.currentHovered.traverse((child) => {
        if (child.isMesh && child.userData.outlineMesh) {
          child.userData.outlineMesh.visible = false;
        }
      });
    }

    this.currentHovered = targetGroup;
    if (!this.currentHovered) {
      if (this.uiManager && this.uiManager.crosshair) {
        this.uiManager.crosshair.classList.remove('targeting');
      }
      return;
    }

    // Collect target meshes first — NEVER call child.add() inside traverse()!
    const meshesToOutline = [];
    this.currentHovered.traverse((child) => {
      if (child.isMesh && !child.userData.isOutline && !child.name.includes('Collider')) {
        meshesToOutline.push(child);
      }
    });

    for (const mesh of meshesToOutline) {
      if (!mesh.userData.outlineMesh) {
        const outline = new THREE.Mesh(mesh.geometry, this.outlineMaterial);
        outline.userData.isOutline = true;
        outline.raycast = () => {}; // Disable raycasting on outline mesh!
        outline.scale.multiplyScalar(1.045);
        mesh.add(outline);
        mesh.userData.outlineMesh = outline;
      }
      mesh.userData.outlineMesh.visible = true;
    }

    if (this.uiManager && this.uiManager.crosshair) {
      this.uiManager.crosshair.classList.add('targeting');
    }
  }

  updateRaycastTargeting() {
    this.targetedObject = null;

    if (!this.inputManager.isLocked || this.inputManager.isPaused) {
      this.setHoveredObject(null);
      this.uiManager.hideInteractionPrompt();
      return;
    }

    // 1. If in building mode (active building type or holding building item), update preview FIRST
    const equipped = this.inventory.getSelectedItem();
    const inBuildingMode = !!this.activeBuildingType || (equipped && equipped.type === 'building');
    if (inBuildingMode) {
      const buildType = this.activeBuildingType || (equipped && ITEM_DEFS[equipped.id]?.buildType);
      const camPos = this.player.camera.position;
      const camDir = this.player.getForwardDirection();
      this.buildingManager.setBuildPreview(buildType);
      this.buildingManager.updateHologram(camPos, camDir);
      this.uiManager.setBuildingPrompt(true);
      this.setHoveredObject(null);
      this.uiManager.hideInteractionPrompt();
      return;
    } else {
      this.uiManager.setBuildingPrompt(false);
      this.buildingManager.setBuildPreview(null);
    }

    // 2. Raycast directly from Camera Center (crosshair) for interactables
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    this.raycaster.far = 5.2;

    const interactables = [];

    // Collectibles
    for (const drop of this.resourceManager.collectibles) {
      interactables.push(drop.mesh);
    }
    // Buildings
    for (const b of this.buildingManager.activeBuildings) {
      interactables.push(b.mesh);
    }
    // Resource Nodes
    for (const node of this.resourceManager.resourceNodes) {
      if (!node.isDestroyed) {
        interactables.push(node.mesh);
      }
    }

    const intersects = this.raycaster.intersectObjects(interactables, true);

    if (intersects.length > 0) {
      for (const hit of intersects) {
        let current = hit.object;
        let found = null;

        while (current && !found) {
          if (current.userData) {
            if (current.userData.collectible) {
              found = { type: 'collectible', data: current.userData.collectible, distance: hit.distance };
            } else if (current.userData.building) {
              found = { type: 'building', data: current.userData.building, distance: hit.distance };
            } else if (current.userData.resourceNode) {
              found = { type: 'resource', data: current.userData.resourceNode, distance: hit.distance };
            }
          }
          current = current.parent;
        }

        if (found) {
          if (found.type === 'collectible' && found.distance <= 3.8) {
            this.targetedObject = found;
            this.setHoveredObject(found.data.mesh);
            this.uiManager.hideInteractionPrompt();
            return;
          } else if (found.type === 'building' && found.distance <= 4.8) {
            this.targetedObject = found;
            this.setHoveredObject(found.data.mesh);
            if (found.data.type === 'campfire') {
              this.uiManager.showInteractionPrompt('E', found.data.isLit ? 'Dập lửa' : 'Thắp lửa');
            } else if (found.data.type === 'shelter') {
              this.uiManager.showInteractionPrompt('E', 'Đi ngủ');
            } else if (found.data.type === 'water_collector') {
              this.uiManager.showInteractionPrompt('E', 'Uống nước');
            } else {
              this.uiManager.hideInteractionPrompt();
            }
            return;
          } else if (found.type === 'resource' && found.distance <= 5.2) {
            const node = found.data;
            if (!node.isDestroyed) {
              this.targetedObject = found;
              this.setHoveredObject(node.mesh);
              this.uiManager.hideInteractionPrompt();
              return;
            }
          }
        }
      }
    }

    // Nothing targeted
    this.setHoveredObject(null);
    this.uiManager.hideInteractionPrompt();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Freeze simulation delta when paused or in start screen
    const isPaused = this.inputManager.isPaused || 
                     (this.uiManager.settingsModal && !this.uiManager.settingsModal.classList.contains('hidden')) || 
                     this.uiManager.startScreen.style.display !== 'none';

    const rawDelta = this.clock.getDelta();
    const delta = isPaused ? 0 : Math.min(rawDelta, 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Celestial Lighting & 6-minute Day/Night Cycle (Sun, Moon, Clouds, Stars)
    this.skyManager.update(delta, this.camera.position);

    // 2. Player Kinematics & First-Person Tools
    this.player.update(delta, time);

    // 3. Island Ocean Wave displacement, shore foam ring, and sun specular highlight
    this.island.update(delta, time, this.skyManager);

    // 4. Slope-aware instanced tropical foliage wind sway
    this.foliage.update(time);

    // 5. Interactive Resource Nodes & Collectibles
    this.resourceManager.update(delta, time, this.player.position);

    // 6. Placed Buildings & Hologram Preview
    this.buildingManager.update(delta, time, this.player.position);

    // 7. Raycast Targeting directly from crosshair
    this.updateRaycastTargeting();

    // 8. Procedural Ocean Ambient sound modulation based on distance to beach
    const distToCenter = Math.hypot(this.player.position.x, this.player.position.z);
    soundFX.updateOcean(distToCenter);

    // 9. HUD & UI Updates
    this.uiManager.update();

    // 10. Post-Processing Pipeline (UnrealBloom + Vignette + ACESFilmic ToneMapping)
    this.composer.render();
  }
}

// 1. Prevent accidental tab closure via Ctrl+W in windowed mode (triggers browser confirmation instead of instant close)
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = '';
});

// 2. Use Keyboard Lock API when entering Fullscreen / PointerLock so Ctrl+W is 100% captured by the game in Chrome/Edge
export async function enableGameKeyboardLock() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    if (navigator.keyboard && navigator.keyboard.lock) {
      // Lock W and Control keys for seamless game controls
      await navigator.keyboard.lock(['KeyW', 'ControlLeft', 'ControlRight']);
    }
  } catch (err) {
    console.warn('Keyboard lock could not be activated:', err);
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
