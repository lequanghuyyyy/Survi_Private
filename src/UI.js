import { RECIPES } from './Crafting.js';
import { ITEM_DEFS } from './Inventory.js';
import { soundFX } from './SoundFX.js';

/**
 * UI.js - Manages HUD, Vitals, Hotbar, Crafting Modal,
 * Guide Modal, Notifications, and Interaction Prompts.
 */


export const ITEM_SVGS = {
  wood: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="34" height="28" rx="4" fill="#6e4222" stroke="#2b1b0e" stroke-width="3"/>
    <line x1="26" y1="20" x2="26" y2="44" stroke="#4a2c14" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="38" y1="20" x2="38" y2="44" stroke="#4a2c14" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="44" cy="27" rx="3.5" ry="5.5" fill="#38210c" stroke="#2b1b0e" stroke-width="2"/>
    <ellipse cx="18" cy="32" rx="7" ry="14" fill="#e5b87c" stroke="#2b1b0e" stroke-width="3"/>
    <ellipse cx="18" cy="32" rx="3.5" ry="7.5" fill="#c38d50" stroke="#2b1b0e" stroke-width="1.5"/>
  </svg>`,

  stone: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="18,48 10,32 20,16 44,12 56,26 52,48 34,54" fill="#7f8c8d" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="20,16 44,12 36,32 18,28" fill="#bdc3c7"/>
    <polygon points="44,12 56,26 48,38 36,32" fill="#95a5a6"/>
    <polygon points="10,32 18,48 34,54 36,32 18,28" fill="#576574"/>
    <polygon points="56,26 52,48 34,54 36,32 48,38" fill="#34495e"/>
  </svg>`,

  flint: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="32,8 50,22 44,48 32,56 16,46 14,24" fill="#34495e" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="32,8 50,22 34,32" fill="#576574"/>
    <polygon points="32,8 34,32 14,24" fill="#778ca3"/>
    <polygon points="14,24 34,32 32,56 16,46" fill="#2c3e50"/>
    <polygon points="50,22 44,48 32,56 34,32" fill="#1e272e"/>
    <line x1="32" y1="12" x2="34" y2="30" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
  </svg>`,

  palm_leaf: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,52 Q26,38 52,14" stroke="#78e08f" stroke-width="4" stroke-linecap="round"/>
    <path d="M12,52 Q26,38 52,14" stroke="#2b1b0e" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M52,14 C44,10 32,18 24,24 C34,22 44,18 52,14 Z" fill="#2ed573" stroke="#2b1b0e" stroke-width="2"/>
    <path d="M46,20 C36,18 26,26 18,34 C28,31 38,26 46,20 Z" fill="#10ac84" stroke="#2b1b0e" stroke-width="2"/>
    <path d="M40,26 C30,26 22,34 14,44 C22,40 32,34 40,26 Z" fill="#2ed573" stroke="#2b1b0e" stroke-width="2"/>
    <path d="M52,14 C48,22 38,32 30,38 C36,30 46,24 52,14 Z" fill="#1dd1a1" stroke="#2b1b0e" stroke-width="2"/>
  </svg>`,

  coconut: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="32" rx="22" ry="24" fill="#5c3818" stroke="#2b1b0e" stroke-width="3"/>
    <path d="M18,22 Q24,34 20,44" stroke="#3d240d" stroke-width="2" stroke-linecap="round"/>
    <path d="M46,22 Q40,34 44,44" stroke="#3d240d" stroke-width="2" stroke-linecap="round"/>
    <circle cx="27" cy="22" r="3" fill="#2b1b0e"/>
    <circle cx="37" cy="22" r="3" fill="#2b1b0e"/>
    <circle cx="32" cy="29" r="2.8" fill="#2b1b0e"/>
  </svg>`,

  berry: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32,14 Q32,24 24,28 M32,18 Q36,22 40,28" stroke="#10ac84" stroke-width="3" stroke-linecap="round"/>
    <circle cx="22" cy="36" r="12" fill="#eb4d4b" stroke="#2b1b0e" stroke-width="3"/>
    <circle cx="42" cy="36" r="12" fill="#d63031" stroke="#2b1b0e" stroke-width="3"/>
    <circle cx="32" cy="44" r="11" fill="#ff7675" stroke="#2b1b0e" stroke-width="3"/>
    <circle cx="18" cy="32" r="2.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="38" cy="32" r="2.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="28" cy="40" r="2.5" fill="#ffffff" opacity="0.8"/>
  </svg>`,

  stone_axe: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="52" x2="44" y2="18" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
    <line x1="16" y1="52" x2="44" y2="18" stroke="#2b1b0e" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="49" x2="26" y2="39" stroke="#5d4037" stroke-width="8" stroke-linecap="round"/>
    <path d="M34,16 L49,9 C53,7 57,11 55,16 L51,26 C49,30 43,32 39,28 L35,24 Z" fill="#636e72" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M49,9 L55,16 L51,26 L46,23 L49,15 Z" fill="#b2bec3"/>
    <path d="M35,19 L43,27 M37,25 L45,17" stroke="#e17055" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  stone_pickaxe: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="14" y1="54" x2="46" y2="16" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
    <line x1="14" y1="54" x2="46" y2="16" stroke="#2b1b0e" stroke-width="2" stroke-linecap="round"/>
    <path d="M26,10 Q44,22 56,36 L52,40 Q40,26 22,14 Z" fill="#475569" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M34,8 Q20,15 10,28 L14,32 Q24,19 38,12 Z" fill="#64748b" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="34" cy="20" r="5" fill="#334155" stroke="#2b1b0e" stroke-width="2.5"/>
    <line x1="30" y1="17" x2="38" y2="23" stroke="#e17055" stroke-width="2.5"/>
    <line x1="30" y1="23" x2="38" y2="17" stroke="#e17055" stroke-width="2.5"/>
  </svg>`,

  torch: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="52" x2="38" y2="26" stroke="#6d4c41" stroke-width="7" stroke-linecap="round"/>
    <line x1="18" y1="52" x2="38" y2="26" stroke="#2b1b0e" stroke-width="2" stroke-linecap="round"/>
    <rect x="33" y="19" width="14" height="12" rx="2" transform="rotate(-35 40 25)" fill="#3e2723" stroke="#2b1b0e" stroke-width="3"/>
    <path d="M41,20 C42,12 49,8 49,4 C52,10 59,13 57,21 C55,27 45,26 41,20 Z" fill="#ff7675" stroke="#2b1b0e" stroke-width="2.5"/>
    <path d="M43,18 C44,13 49,11 49,8 C51,12 55,14 54,19 C52,23 46,22 43,18 Z" fill="#ffeaa7"/>
  </svg>`,

  campfire: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="10" y1="46" x2="54" y2="46" stroke="#5d4037" stroke-width="9" stroke-linecap="round"/>
    <line x1="10" y1="46" x2="54" y2="46" stroke="#2b1b0e" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="50" x2="50" y2="42" stroke="#4e342e" stroke-width="7" stroke-linecap="round"/>
    <circle cx="16" cy="52" r="5" fill="#7f8c8d" stroke="#2b1b0e" stroke-width="2"/>
    <circle cx="28" cy="54" r="5" fill="#95a5a6" stroke="#2b1b0e" stroke-width="2"/>
    <circle cx="40" cy="54" r="5" fill="#7f8c8d" stroke="#2b1b0e" stroke-width="2"/>
    <circle cx="50" cy="51" r="5" fill="#95a5a6" stroke="#2b1b0e" stroke-width="2"/>
    <path d="M32,8 C38,17 48,24 46,38 C44,45 38,47 32,47 C26,47 20,45 18,38 C16,24 26,17 32,8 Z" fill="#ff4757" stroke="#2b1b0e" stroke-width="3"/>
    <path d="M32,18 C36,24 42,29 40,38 C39,43 35,44 32,44 C29,44 25,43 24,38 C22,29 28,24 32,18 Z" fill="#ffa502"/>
    <path d="M32,27 C34,31 37,34 36,39 C35,42 33,42 32,42 C31,42 29,42 28,39 C27,34 30,31 32,27 Z" fill="#fff200"/>
  </svg>`,

  shelter: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32,8 L10,50 L54,50 Z" fill="#c79c5e" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="32,14 18,50 46,50" fill="#2d1a0e" stroke="#2b1b0e" stroke-width="2"/>
    <path d="M26,16 L6,46 M38,16 L58,46" stroke="#27ae60" stroke-width="4" stroke-linecap="round"/>
    <line x1="32" y1="4" x2="32" y2="14" stroke="#6d4c41" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  water_collector: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="14" y1="56" x2="22" y2="28" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="56" x2="42" y2="28" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
    <line x1="12" y1="46" x2="52" y2="46" stroke="#5d4037" stroke-width="4" stroke-linecap="round"/>
    <path d="M12,24 Q32,40 52,24 L46,16 Q32,24 18,16 Z" fill="#00cec9" stroke="#2b1b0e" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="32" cy="48" r="4.5" fill="#0984e3" stroke="#2b1b0e" stroke-width="1.5"/>
    <path d="M32,40 C34,44 36,46 36,48 C36,50 34,52 32,52 C30,52 28,50 28,48 C28,46 30,44 32,40 Z" fill="#74b9ff"/>
  </svg>`,

  hammer: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="52" x2="42" y2="22" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
    <line x1="16" y1="52" x2="42" y2="22" stroke="#2b1b0e" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="50" x2="28" y2="38" stroke="#543627" stroke-width="8" stroke-linecap="round"/>
    <rect x="32" y="10" width="22" height="18" rx="3" transform="rotate(-40 43 19)" fill="#c89f68" stroke="#2b1b0e" stroke-width="3"/>
    <rect x="34" y="12" width="18" height="14" rx="2" transform="rotate(-40 43 19)" fill="#dfbe8c"/>
    <line x1="42" y1="12" x2="52" y2="20" stroke="#7c4f28" stroke-width="2"/>
    <ellipse cx="53" cy="24" rx="3" ry="5.5" transform="rotate(-40 53 24)" fill="#d4ad75" stroke="#2b1b0e" stroke-width="1.5"/>
    <line x1="38" y1="26" x2="44" y2="20" stroke="#222" stroke-width="4"/>
  </svg>`,

  raft_foundation: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="38" width="48" height="14" rx="7" fill="#206378" stroke="#2b1b0e" stroke-width="2.5"/>
    <line x1="20" y1="38" x2="20" y2="52" stroke="#2b1b0e" stroke-width="2"/>
    <line x1="44" y1="38" x2="44" y2="52" stroke="#2b1b0e" stroke-width="2"/>
    <rect x="10" y="24" width="44" height="6" rx="2" fill="#dfbe8c" stroke="#2b1b0e" stroke-width="2"/>
    <rect x="12" y="16" width="40" height="6" rx="2" fill="#caa778" stroke="#2b1b0e" stroke-width="2"/>
    <line x1="18" y1="14" x2="18" y2="32" stroke="#7c4f28" stroke-width="2.5"/>
    <line x1="46" y1="14" x2="46" y2="32" stroke="#7c4f28" stroke-width="2.5"/>
  </svg>`,

  wooden_stairs: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="52" x2="50" y2="14" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
    <line x1="20" y1="56" x2="56" y2="20" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
    <line x1="12" y1="52" x2="24" y2="52" stroke="#dfbe8c" stroke-width="4" stroke-linecap="round"/>
    <line x1="22" y1="42" x2="34" y2="42" stroke="#dfbe8c" stroke-width="4" stroke-linecap="round"/>
    <line x1="32" y1="32" x2="44" y2="32" stroke="#dfbe8c" stroke-width="4" stroke-linecap="round"/>
    <line x1="42" y1="22" x2="54" y2="22" stroke="#dfbe8c" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  wooden_wall: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="12" width="44" height="42" rx="3" fill="#8d5c32" stroke="#2b1b0e" stroke-width="3"/>
    <rect x="20" y="22" width="24" height="18" rx="2" fill="#6e4222" stroke="#2b1b0e" stroke-width="2.5"/>
    <rect x="22" y="24" width="20" height="14" rx="1" fill="#dcd5c4"/>
    <line x1="10" y1="12" x2="18" y2="20" stroke="#5d3c22" stroke-width="2.5"/>
    <line x1="54" y1="12" x2="46" y2="20" stroke="#5d3c22" stroke-width="2.5"/>
  </svg>`
};

ITEM_SVGS.axe = ITEM_SVGS.stone_axe;
ITEM_SVGS.pickaxe = ITEM_SVGS.stone_pickaxe;
ITEM_SVGS.tent = ITEM_SVGS.shelter;
ITEM_SVGS.leaf = ITEM_SVGS.palm_leaf;
ITEM_SVGS.bua = ITEM_SVGS.hammer;

export function getItemSvg(id) {
  if (!id) return '';
  const key = String(id).toLowerCase();
  return ITEM_SVGS[key] || ITEM_SVGS.wood;
}

export class UIManager {
  constructor(inventory, survivalStats, craftingManager, dayNightCycle) {
    this.inventory = inventory;
    this.survivalStats = survivalStats;
    this.craftingManager = craftingManager;
    this.dayNightCycle = dayNightCycle;

    // DOM Elements
    this.healthFill = document.getElementById('health-fill');
    this.healthVal = document.getElementById('health-val');
    this.hungerFill = document.getElementById('hunger-fill');
    this.hungerVal = document.getElementById('hunger-val');
    this.thirstFill = document.getElementById('thirst-fill');
    this.thirstVal = document.getElementById('thirst-val');
    this.staminaFill = document.getElementById('stamina-fill');
    this.staminaVal = document.getElementById('stamina-val');

    this.hotbarSlotsContainer = document.getElementById('hotbar-slots');
    this.equippedName = document.getElementById('equipped-name');
    this.equippedDesc = document.getElementById('equipped-desc');

    this.crosshair = document.getElementById('crosshair');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.promptText = this.interactionPrompt.querySelector('.prompt-text');
    this.keyBadge = this.interactionPrompt.querySelector('.key-badge');

    this.timeIcon = document.getElementById('time-icon');
    this.dayCounter = document.getElementById('day-counter');
    this.clockDisplay = document.getElementById('clock-display');

    this.notificationsContainer = document.getElementById('notifications');

    // Modals & Survival Journal (Cuốn Sổ Tay Sinh Tồn)
    this.craftingModal = document.getElementById('crafting-journal') || document.getElementById('crafting-modal');
    this.craftingGrid = document.getElementById('crafting-grid');
    this.recipeList = document.getElementById('recipe-list');
    this.blueprintTitle = document.getElementById('blueprint-title');
    this.blueprintPreview = document.getElementById('blueprint-preview');
    this.blueprintMaterials = document.getElementById('blueprint-materials');
    this.btnDoCraft = document.getElementById('btn-do-craft');
    this.journalCloseBtn = document.getElementById('journal-close-btn');
    this.currentSelectedRecipe = null;
    this.currentCraftCategory = 'tools';
    this.currentIngredientFilter = null;

    // Survival Backpack Modal (20 Slots)
    this.backpackModal = document.getElementById('backpack-modal');
    this.backpackGrid = document.getElementById('backpack-grid');
    this.backpackCloseBtn = document.getElementById('backpack-close-btn');

    // Building Mode HUD Prompt
    this.buildingPrompt = document.getElementById('building-prompt');

    // Contextual Action Prompt
    this.contextualPrompt = document.getElementById('contextual-action-prompt');
    this.contextualPromptIcon = document.getElementById('contextual-prompt-icon');
    this.contextualPromptText = document.getElementById('contextual-prompt-text');

    this.guideModal = document.getElementById('guide-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.sleepOverlay = document.getElementById('sleep-overlay');

    // Settings inputs & floating value bubbles
    this.sensitivitySlider = document.getElementById('setting-sensitivity');
    this.sensitivityBubble = document.getElementById('bubble-sensitivity');
    this.volumeSlider = document.getElementById('setting-volume');
    this.volumeBubble = document.getElementById('bubble-volume');
    this.shadowsCheckbox = document.getElementById('setting-shadows');
    this.resumeBtn = document.getElementById('resume-btn');
    this.settingsCloseBtn = document.getElementById('settings-close-btn');

    // Event hooks
    this.onStartGameCallback = null;
    this.onRespawnCallback = null;
    this.onSettingsChange = null;
    this.onPauseStateChange = null;
    this.onRequestPointerLock = null;
    this.onStartBuildingFromBackpack = null;

    // Set exact default setting controls (Sensitivity level 4 [1-10], Volume 100%, Shadows true)
    if (this.sensitivitySlider) {
      this.sensitivitySlider.value = '4';
    }
    if (this.volumeSlider) {
      this.volumeSlider.value = '1.0';
    }
    if (this.shadowsCheckbox) {
      this.shadowsCheckbox.checked = true;
    }
    this.updateAllSliderBubbles();

    // Build DOM
    this.initHotbarDOM();
    this.setupListeners();
    this.renderCraftingGrid();
  }

  initHotbarDOM() {
    this.hotbarSlotsContainer.innerHTML = '';
    for (let i = 0; i < this.inventory.slotCount; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'hotbar-slot';
      slotEl.dataset.index = i;
      slotEl.innerHTML = `
        <span class="slot-index">${i + 1}</span>
        <span class="slot-icon"></span>
        <span class="slot-count"></span>
        <div class="slot-durability hidden"></div>
      `;
      slotEl.addEventListener('click', () => {
        this.inventory.selectSlot(i);
      });
      this.hotbarSlotsContainer.appendChild(slotEl);
    }
  }

  setupListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startScreen.style.display = 'none';
      soundFX.init();
      if (this.onStartGameCallback) {
        this.onStartGameCallback();
      }
    });

    // Journal / Crafting Close
    if (this.journalCloseBtn) {
      this.journalCloseBtn.addEventListener('click', () => {
        this.toggleCrafting(false);
      });
    }
    const oldCloseBtn = document.getElementById('crafting-close-btn');
    if (oldCloseBtn) {
      oldCloseBtn.addEventListener('click', () => {
        this.toggleCrafting(false);
      });
    }
    // Click overlay outside book to close journal
    if (this.craftingModal) {
      this.craftingModal.addEventListener('click', (e) => {
        if (e.target === this.craftingModal) {
          this.toggleCrafting(false);
        }
      });
    }

    // Journal Tabs: tools, survival, build
    const jTabs = document.querySelectorAll('.j-tab');
    jTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        jTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCraftCategory = tab.dataset.category;
        this.currentSelectedRecipe = null;
        this.renderCraftingGrid();
      });
    });

    // Stamp Craft Button
    if (this.btnDoCraft) {
      this.btnDoCraft.addEventListener('click', () => {
        if (!this.currentSelectedRecipe) return;
        const recipe = this.currentSelectedRecipe;
        if (!this.craftingManager.canCraft(recipe)) return;
        const success = this.craftingManager.craft(recipe.id);
        if (success) {
          soundFX.playCraft();
          this.showNotification(`Đã chế tạo: ${recipe.name}`, getItemSvg(recipe.resultId || recipe.id));
          
          const resultDef = ITEM_DEFS[recipe.resultId || recipe.id];
          if (resultDef && resultDef.type === 'building') {
            this.toggleCrafting(false);
            if (this.onStartBuildingFromBackpack) {
              this.onStartBuildingFromBackpack(resultDef.buildType || recipe.resultId || recipe.id);
            }
          } else {
            const slotIdx = this.inventory.findItemSlot(recipe.resultId);
            if (slotIdx !== -1) {
              this.inventory.selectSlot(slotIdx);
            }
          }

          this.renderCraftingGrid();
          this.updateHotbar();
        }
      });
    }

    // Legacy Category buttons fallback
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCraftCategory = btn.dataset.cat;
        this.currentIngredientFilter = null;
        this.renderCraftingGrid();
      });
    });

    // Hotbar side tabs
    const hotbarBackpackBtn = document.getElementById('hotbar-btn-backpack');
    if (hotbarBackpackBtn) {
      hotbarBackpackBtn.addEventListener('click', () => {
        this.toggleBackpack(true);
      });
    }
    const hotbarCraftBtn = document.getElementById('hotbar-btn-crafting');
    if (hotbarCraftBtn) {
      hotbarCraftBtn.addEventListener('click', () => {
        this.toggleCrafting(true);
      });
    }
    const hotbarGuideBtn = document.getElementById('hotbar-btn-guide');
    if (hotbarGuideBtn) {
      hotbarGuideBtn.addEventListener('click', () => {
        this.toggleGuide(true);
      });
    }

    // Respawn button
    document.getElementById('respawn-btn').addEventListener('click', () => {
      this.gameOverScreen.classList.add('hidden');
      if (this.onRespawnCallback) {
        this.onRespawnCallback();
      }
    });

    // Settings / Pause Modal Controls
    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => {
        this.togglePauseMenu(false);
      });
    }

    if (this.settingsCloseBtn) {
      this.settingsCloseBtn.addEventListener('click', () => {
        this.togglePauseMenu(false);
      });
    }

    if (this.sensitivitySlider) {
      this.sensitivitySlider.addEventListener('input', (e) => {
        const level = parseInt(e.target.value, 10);
        this.updateSliderBubble(this.sensitivitySlider, this.sensitivityBubble);
        const actualSens = level * 0.0002;
        if (this.onSettingsChange) this.onSettingsChange({ sensitivityLevel: level, mouseSensitivity: actualSens });
      });
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateSliderBubble(this.volumeSlider, this.volumeBubble, '', (v) => `${Math.round(v * 100)}%`);
        soundFX.setMasterVolume(val);
        if (this.onSettingsChange) this.onSettingsChange({ masterVolume: val });
      });
    }

    if (this.shadowsCheckbox) {
      this.shadowsCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        if (this.onSettingsChange) this.onSettingsChange({ shadowsEnabled: checked });
      });
    }

    // Keep floating bubbles aligned on window resize
    window.addEventListener('resize', () => this.updateAllSliderBubbles());

    // Top HUD Clickable buttons
    const hudBackpackBtn = document.getElementById('hud-btn-backpack');
    if (hudBackpackBtn) {
      hudBackpackBtn.addEventListener('click', () => this.toggleBackpack());
    }

    const hudCraftingBtn = document.getElementById('hud-btn-crafting');
    if (hudCraftingBtn) {
      hudCraftingBtn.addEventListener('click', () => this.toggleCrafting());
    }

    const hudGuideBtn = document.getElementById('hud-btn-guide');
    if (hudGuideBtn) {
      hudGuideBtn.addEventListener('click', () => this.toggleGuide());
    }

    const hudSettingsBtn = document.getElementById('hud-btn-settings');
    if (hudSettingsBtn) {
      hudSettingsBtn.addEventListener('click', () => this.togglePauseMenu());
    }
  }

  handleEscapeKey() {
    if (this.backpackModal && !this.backpackModal.classList.contains('hidden')) {
      this.toggleBackpack(false);
    } else if (!this.craftingModal.classList.contains('hidden')) {
      this.toggleCrafting(false);
    } else if (!this.guideModal.classList.contains('hidden')) {
      this.toggleGuide(false);
    } else if (this.startScreen.style.display === 'none' && this.gameOverScreen.classList.contains('hidden')) {
      this.togglePauseMenu();
    }
  }

  toggleBackpack(forceState = null) {
    if (!this.backpackModal) return;
    const isHidden = this.backpackModal.classList.contains('hidden');
    const targetState = forceState !== null ? forceState : isHidden;

    if (targetState) {
      this.backpackModal.classList.remove('hidden');
      this.craftingModal.classList.add('hidden');
      this.guideModal.classList.add('hidden');
      if (this.settingsModal) this.settingsModal.classList.add('hidden');
      document.exitPointerLock?.();
      this.renderBackpackGrid();
    } else {
      this.backpackModal.classList.add('hidden');
      if (this.onRequestPointerLock) this.onRequestPointerLock();
    }
  }

  renderBackpackGrid() {
    if (!this.backpackGrid) return;
    this.backpackGrid.innerHTML = '';

    for (let i = 0; i < this.inventory.backpackSlotCount; i++) {
      const item = this.inventory.backpackSlots[i];
      const slotEl = document.createElement('div');
      slotEl.className = 'backpack-slot' + (!item ? ' empty' : '');
      slotEl.dataset.slotIndex = i;

      if (item) {
        const def = ITEM_DEFS[item.id] || {};
        slotEl.title = `${def.name || item.name} (${item.count})\n${def.description || ''}`;

        // Tag label
        let tagHtml = '';
        if (item.type === 'food') {
          tagHtml = '<span class="backpack-slot-tag tag-food">Ăn Uống</span>';
        } else if (item.type === 'tool') {
          tagHtml = '<span class="backpack-slot-tag tag-tool">Công Cụ</span>';
        } else if (item.type === 'building') {
          tagHtml = '<span class="backpack-slot-tag tag-building">Xây Dựng</span>';
        }

        slotEl.innerHTML = `
          ${tagHtml}
          <div class="backpack-slot-icon">${getItemSvg(item.id)}</div>
          <span class="backpack-slot-count">${item.count}</span>
        `;

        // Click interaction:
        // Left / Right Click on Food -> Consume immediately
        // Click on Tool -> Equip to hotbar
        // Click on Building -> Trigger build preview
        const handleClick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (item.type === 'food') {
            const consumedId = this.inventory.consumeFoodFromBackpack(i);
            if (consumedId) {
              this.survivalStats.consumeItem(consumedId);
              soundFX.playEat();
              this.showNotification(`Đã dùng ${def.name || item.name}!`, getItemSvg(consumedId));
              this.renderBackpackGrid();
              this.updateHotbar();
            }
          } else if (item.type === 'tool') {
            const equipped = this.inventory.equipToolFromBackpack(i);
            if (equipped) {
              soundFX.playCraft();
              this.showNotification(`Đã trang bị ${def.name || item.name} xuống Hotbar!`, getItemSvg(item.id));
              this.renderBackpackGrid();
              this.updateHotbar();
            }
          } else if (item.type === 'building') {
            this.toggleBackpack(false);
            if (this.onStartBuildingFromBackpack) {
              this.onStartBuildingFromBackpack(item.id);
            }
          }
        };

        slotEl.addEventListener('click', handleClick);
        slotEl.addEventListener('contextmenu', handleClick);
      } else {
        slotEl.innerHTML = '';
      }

      this.backpackGrid.appendChild(slotEl);
    }
  }

  setBuildingPrompt(active, text = null) {
    if (!this.buildingPrompt) return;
    if (active) {
      if (text) {
        const textSpan = this.buildingPrompt.querySelector('.building-hud-text');
        if (textSpan) textSpan.innerHTML = text;
      }
      this.buildingPrompt.classList.remove('hidden');
    } else {
      this.buildingPrompt.classList.add('hidden');
    }
  }

  togglePauseMenu(forceState = null) {
    if (!this.settingsModal) return;
    const isHidden = this.settingsModal.classList.contains('hidden');
    const targetState = forceState !== null ? forceState : isHidden;

    if (targetState) {
      // Show pause menu
      this.settingsModal.classList.remove('hidden');
      this.craftingModal.classList.add('hidden');
      this.guideModal.classList.add('hidden');
      document.exitPointerLock?.();
      if (this.onPauseStateChange) this.onPauseStateChange(true);
      requestAnimationFrame(() => this.updateAllSliderBubbles());
    } else {
      // Hide pause menu and resume
      this.settingsModal.classList.add('hidden');
      if (this.onPauseStateChange) this.onPauseStateChange(false);
      if (this.onRequestPointerLock) this.onRequestPointerLock();
    }
  }

  toggleCrafting(forceState = null) {
    const isHidden = this.craftingModal.classList.contains('hidden');
    const targetState = forceState !== null ? forceState : isHidden;

    if (targetState) {
      this.craftingModal.classList.remove('hidden');
      this.guideModal.classList.add('hidden');
      if (this.settingsModal) this.settingsModal.classList.add('hidden');
      this.renderCraftingGrid();
      document.exitPointerLock?.();
    } else {
      this.currentIngredientFilter = null;
      this.craftingModal.classList.add('hidden');
      if (this.onRequestPointerLock) this.onRequestPointerLock();
    }
  }

  openCraftingWithFilter(ingredientId) {
    this.currentIngredientFilter = ingredientId;
    this.currentCraftCategory = 'all';
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
      if (btn.dataset.cat === 'all') btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.toggleCrafting(true);
  }

  toggleGuide(forceState = null) {
    const isHidden = this.guideModal.classList.contains('hidden');
    const targetState = forceState !== null ? forceState : isHidden;

    if (targetState) {
      this.guideModal.classList.remove('hidden');
      this.craftingModal.classList.add('hidden');
      if (this.settingsModal) this.settingsModal.classList.add('hidden');
      document.exitPointerLock?.();
    } else {
      this.guideModal.classList.add('hidden');
      if (this.onRequestPointerLock) this.onRequestPointerLock();
    }
  }

  updateSliderBubble(slider, bubble, unit = '', formatFn = null) {
    if (!slider || !bubble) return;
    const val = parseFloat(slider.value);
    const min = parseFloat(slider.min) !== undefined && !isNaN(parseFloat(slider.min)) ? parseFloat(slider.min) : 0;
    const max = parseFloat(slider.max) !== undefined && !isNaN(parseFloat(slider.max)) ? parseFloat(slider.max) : 100;

    // Calculate percentage (0 to 1)
    const percent = Math.max(0, Math.min(1, (val - min) / (max - min)));

    // Account for thumb width (~16px) so bubble stays centered on thumb
    const thumbWidth = 16;
    const width = slider.offsetWidth;

    if (formatFn) {
      bubble.textContent = formatFn(val);
    } else {
      bubble.textContent = `${val}${unit}`;
    }

    if (width && width > 0) {
      const offset = percent * (width - thumbWidth) + (thumbWidth / 2);
      bubble.style.left = `${offset}px`;
    } else {
      bubble.style.left = `calc(${percent * 100}% + ${(0.5 - percent) * thumbWidth}px)`;
    }
  }

  updateAllSliderBubbles() {
    this.updateSliderBubble(this.sensitivitySlider, this.sensitivityBubble);
    this.updateSliderBubble(this.volumeSlider, this.volumeBubble, '', (v) => `${Math.round(v * 100)}%`);
  }

  showNotification(message, icon = '') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const isSvg = typeof icon === 'string' && icon.includes('<svg');
    const iconHtml = isSvg ? `<span class="toast-svg">${icon}</span>` : (icon ? `<span>${icon}</span>` : '');
    toast.innerHTML = `${iconHtml} <span>${message}</span>`;
    this.notificationsContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  showInteractionPrompt(key, text) {
    this.keyBadge.textContent = key;
    this.promptText.textContent = text;
    this.interactionPrompt.classList.remove('hidden');
    this.crosshair.classList.add('targeting');
  }

  hideInteractionPrompt() {
    this.interactionPrompt.classList.add('hidden');
    this.crosshair.classList.remove('targeting');
  }

  triggerSleepSequence(onComplete) {
    this.sleepOverlay.classList.remove('hidden');
    setTimeout(() => {
      if (onComplete) onComplete();
      setTimeout(() => {
        this.sleepOverlay.classList.add('hidden');
      }, 900);
    }, 1200);
  }

  showGameOver(reason, stats) {
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('stat-days').textContent = stats.days;
    document.getElementById('stat-harvested').textContent = stats.harvested;
    document.getElementById('stat-crafted').textContent = stats.crafted;
    this.gameOverScreen.classList.remove('hidden');
    document.exitPointerLock?.();
  }

  renderCraftingGrid() {
    if (this.recipeList && this.blueprintTitle) {
      this.renderCraftingJournal();
      return;
    }

    if (!this.craftingGrid) return;
    this.craftingGrid.innerHTML = '';

    let filtered = RECIPES.filter(r => {
      if (this.currentCraftCategory === 'all') return true;
      return r.category === this.currentCraftCategory;
    });

    // If ingredient filter is active, sort matching recipes directly to top
    if (this.currentIngredientFilter) {
      const filterId = this.currentIngredientFilter;
      filtered = [...filtered].sort((a, b) => {
        const aHas = a.ingredients && a.ingredients.some(ing => ing.id === filterId);
        const bHas = b.ingredients && b.ingredients.some(ing => ing.id === filterId);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });
    }

    filtered.forEach(recipe => {
      const canMake = this.craftingManager.canCraft(recipe);
      const card = document.createElement('div');
      card.className = `recipe-card ${canMake ? 'ready' : ''}`;

      const matchesFilter = this.currentIngredientFilter && recipe.ingredients && recipe.ingredients.some(ing => ing.id === this.currentIngredientFilter);
      if (matchesFilter) {
        card.classList.add('highlight-ingredient');
      }

      // Ingredients list as resource pills
      let reqsHtml = '';
      recipe.ingredients.forEach(req => {
        const hasCount = this.inventory.getCount(req.id);
        const isMet = hasCount >= req.count;
        const pillSvg = getItemSvg(req.id);
        reqsHtml += `
          <div class="resource-pill ${isMet ? 'met' : 'missing'}">
            <span class="pill-icon">${pillSvg}</span>
            <span class="pill-text">${hasCount}/${req.count}</span>
          </div>
        `;
      });

      const filterBadge = matchesFilter ? `<span class="ingredient-badge">✨ Dùng ${ITEM_DEFS[this.currentIngredientFilter]?.name || 'Vật Liệu'}</span>` : '';

      card.innerHTML = `
        <div class="recipe-top">
          <div class="recipe-icon-frame">
            ${getItemSvg(recipe.resultId || recipe.id)}
          </div>
          <div class="recipe-details">
            <div class="recipe-title">${recipe.name}</div>
            <div class="recipe-subtitle">${recipe.description}</div>
          </div>
          ${filterBadge}
        </div>
        <div class="recipe-pills">${reqsHtml}</div>
        <button class="craft-action-btn ${canMake ? 'can-craft' : 'locked'}" ${!canMake ? 'disabled' : ''}>
          ${canMake ? 'CHẾ TẠO' : 'CHƯA ĐỦ'}
        </button>
      `;

      const btn = card.querySelector('.craft-action-btn');
      if (canMake) {
        btn.addEventListener('click', () => {
          const success = this.craftingManager.craft(recipe.id);
          if (success) {
            soundFX.playCraft();
            this.showNotification(`Đã chế tạo: ${recipe.name}`, getItemSvg(recipe.resultId || recipe.id));
            
            const resultDef = ITEM_DEFS[recipe.resultId || recipe.id];
            if (resultDef && resultDef.type === 'building') {
              // If crafting a building, close crafting modal and enter build placement mode immediately!
              this.toggleCrafting(false);
              if (this.onStartBuildingFromBackpack) {
                this.onStartBuildingFromBackpack(resultDef.buildType || recipe.resultId || recipe.id);
              }
            } else {
              // Automatically equip newly crafted tool or item
              const slotIdx = this.inventory.findItemSlot(recipe.resultId);
              if (slotIdx !== -1) {
                this.inventory.selectSlot(slotIdx);
              }
            }

            this.renderCraftingGrid();
            this.updateHotbar();
          }
        });
      }

      this.craftingGrid.appendChild(card);
    });
  }

  renderCraftingJournal() {
    if (!this.recipeList) return;
    this.recipeList.innerHTML = '';

    const category = this.currentCraftCategory || 'tools';
    const filtered = RECIPES.filter(r => {
      if (category === 'build' || category === 'building') {
        return r.category === 'build' || r.category === 'building';
      }
      return r.category === category;
    });

    if (!this.currentSelectedRecipe || !filtered.some(r => r.id === this.currentSelectedRecipe.id)) {
      this.currentSelectedRecipe = filtered.length > 0 ? filtered[0] : null;
    }

    filtered.forEach(recipe => {
      const isSelected = this.currentSelectedRecipe && this.currentSelectedRecipe.id === recipe.id;
      const box = document.createElement('div');
      box.className = `sketch-item-box ${isSelected ? 'selected' : ''}`;
      box.title = recipe.name;
      box.innerHTML = getItemSvg(recipe.resultId || recipe.id);

      box.addEventListener('click', () => {
        this.currentSelectedRecipe = recipe;
        this.renderCraftingJournal();
      });

      this.recipeList.appendChild(box);
    });

    // Update Right Page: Blueprint Details
    if (this.currentSelectedRecipe) {
      const rec = this.currentSelectedRecipe;
      if (this.blueprintTitle) this.blueprintTitle.textContent = rec.name;

      if (this.blueprintPreview) {
        this.blueprintPreview.innerHTML = `
          <div class="blueprint-big-icon">${getItemSvg(rec.resultId || rec.id)}</div>
          <div class="blueprint-desc">${rec.description}</div>
        `;
      }

      if (this.blueprintMaterials) {
        let matHtml = '';
        rec.ingredients.forEach(req => {
          const hasCount = this.inventory.getCount(req.id);
          const isMet = hasCount >= req.count;
          matHtml += `
            <div class="ink-req-item ${isMet ? 'met' : 'missing'}">
              <span>• ${req.name || req.id}</span>
              <span>${hasCount}/${req.count}</span>
            </div>
          `;
        });
        this.blueprintMaterials.innerHTML = matHtml;
      }

      if (this.btnDoCraft) {
        const canMake = this.craftingManager.canCraft(rec);
        this.btnDoCraft.disabled = !canMake;
        this.btnDoCraft.textContent = canMake ? 'CHẾ TẠO' : 'CHƯA ĐỦ';
      }
    } else {
      if (this.blueprintTitle) this.blueprintTitle.textContent = 'Chọn công thức';
      if (this.blueprintPreview) this.blueprintPreview.innerHTML = '<div class="blueprint-desc">Chưa chọn công thức chế tạo</div>';
      if (this.blueprintMaterials) this.blueprintMaterials.innerHTML = '';
      if (this.btnDoCraft) {
        this.btnDoCraft.disabled = true;
        this.btnDoCraft.textContent = 'CHẾ TẠO';
      }
    }
  }

  updateHotbar() {
    const slots = this.hotbarSlotsContainer.children;
    for (let i = 0; i < this.inventory.slotCount; i++) {
      const slotEl = slots[i];
      const item = this.inventory.slots[i];
      const iconEl = slotEl.querySelector('.slot-icon');
      const countEl = slotEl.querySelector('.slot-count');

      if (i === this.inventory.selectedSlotIndex) {
        slotEl.classList.add('active');
      } else {
        slotEl.classList.remove('active');
      }

      const durEl = slotEl.querySelector('.slot-durability');
      if (item) {
        iconEl.innerHTML = getItemSvg(item.id);
        countEl.textContent = item.count > 1 ? item.count : '';
        if (item.type === 'tool' || item.id === 'stone_axe' || item.id === 'stone_pickaxe') {
          if (durEl) {
            durEl.classList.remove('hidden');
            durEl.style.width = '88%';
          }
        } else if (durEl) {
          durEl.classList.add('hidden');
        }
      } else {
        iconEl.innerHTML = '';
        countEl.textContent = '';
        if (durEl) durEl.classList.add('hidden');
      }
    }

    // Action hint description & Contextual Prompt HUD
    const equipped = this.inventory ? this.inventory.getSelectedItem() : null;
    if (equipped) {
      const def = ITEM_DEFS[equipped.id];
      if (this.equippedName) this.equippedName.textContent = def ? def.name : (equipped.name || '');
      if (this.equippedDesc) this.equippedDesc.textContent = def ? def.description : '';
    } else {
      if (this.equippedName) this.equippedName.textContent = 'Tay Không';
      if (this.equippedDesc) this.equippedDesc.textContent = 'Chuột trái để vung tay / thu thập';
    }

    // Dynamic Contextual Action Prompt
    if (this.contextualPrompt && this.contextualPromptIcon && this.contextualPromptText) {
      if (!equipped || equipped.id === 'hand') {
        this.contextualPromptIcon.textContent = '✋';
        this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Vung tay / Thu thập nhặt đồ';
      } else {
        const id = equipped.id;
        if (id === 'wood' || id === 'palm_leaf') {
          this.contextualPromptIcon.textContent = '🪵';
          this.contextualPromptText.innerHTML = 'Nguyên liệu Chế tạo & Xây dựng — Nhấn <kbd class="prompt-kbd">[Chuột Trái]</kbd> hoặc <kbd class="prompt-kbd">[TAB]</kbd> để Mở Bảng Chế Tạo';
        } else if (id === 'stone' || id === 'flint' || id === 'rock' || id === 'da') {
          this.contextualPromptIcon.textContent = '🪨';
          this.contextualPromptText.innerHTML = 'Nguyên liệu Chế tạo & Xây dựng — Nhấn <kbd class="prompt-kbd">[Chuột Trái]</kbd> hoặc <kbd class="prompt-kbd">[TAB]</kbd> để Mở Bảng Chế Tạo';
        } else if (id === 'hammer') {
          this.contextualPromptIcon.textContent = '🔨';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Xây dựng công trình / Sửa chữa cấu trúc';
        } else if (id === 'stone_axe' || id === 'axe') {
          this.contextualPromptIcon.textContent = '🪓';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Khai thác tài nguyên / Đập cây lấy gỗ';
        } else if (id === 'stone_pickaxe' || id === 'pickaxe') {
          this.contextualPromptIcon.textContent = '⛏️';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Khai thác tài nguyên / Đập đá lấy quặng';
        } else if (id === 'torch') {
          this.contextualPromptIcon.textContent = '🔥';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Soi sáng ban đêm';
        } else if (id === 'coconut') {
          this.contextualPromptIcon.textContent = '🥥';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái / E]</kbd> Ăn uống để hồi Đói & Khát';
        } else if (id === 'berry') {
          this.contextualPromptIcon.textContent = '🍒';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái / E]</kbd> Ăn uống để hồi Đói & Khát';
        } else if (equipped.type === 'building') {
          this.contextualPromptIcon.textContent = '🏗️';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Đặt vị trí xây dựng / <kbd class="prompt-kbd">[ESC]</kbd> Hủy';
        } else {
          this.contextualPromptIcon.textContent = '✋';
          this.contextualPromptText.innerHTML = '<kbd class="prompt-kbd">[Chuột Trái]</kbd> Tương tác / Sử dụng';
        }
      }
    }
  }

  update() {
    // 1. Update Survival Vitals Bars
    const hp = Math.max(0, Math.min(100, this.survivalStats.health));
    const hg = Math.max(0, Math.min(100, this.survivalStats.hunger));
    const th = Math.max(0, Math.min(100, this.survivalStats.thirst));
    const st = Math.max(0, Math.min(100, this.survivalStats.stamina));

    this.healthFill.style.width = `${hp}%`;
    this.healthVal.textContent = Math.round(hp);

    this.hungerFill.style.width = `${hg}%`;
    this.hungerVal.textContent = Math.round(hg);

    this.thirstFill.style.width = `${th}%`;
    this.thirstVal.textContent = Math.round(th);

    this.staminaFill.style.width = `${st}%`;
    this.staminaVal.textContent = Math.round(st);

    // 2. Day & Clock
    this.dayCounter.textContent = `NGÀY ${this.dayNightCycle.dayCount}`;
    this.clockDisplay.textContent = this.dayNightCycle.getTimeFormatted();
    this.timeIcon.textContent = this.dayNightCycle.isNight() ? '🌙' : '☀️';

    // 3. Hotbar
    this.updateHotbar();
  }
}
