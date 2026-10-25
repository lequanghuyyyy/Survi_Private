/**
 * Inventory.js - Separated 8-slot Tool Hotbar & 20-slot Survival Backpack (5x4 Grid)
 */

export const ITEM_DEFS = {
  wood: {
    id: 'wood',
    name: 'Gỗ',
    icon: '🪵',
    type: 'resource',
    maxStack: 99,
    description: 'Thân gỗ từ cây cọ dùng để chế tạo và xây dựng.'
  },
  stone: {
    id: 'stone',
    name: 'Đá',
    icon: '🪨',
    type: 'resource',
    maxStack: 99,
    description: 'Khối đá cứng thu được từ các tảng đá lớn.'
  },
  flint: {
    id: 'flint',
    name: 'Đá Lửa',
    icon: '💎',
    type: 'resource',
    maxStack: 50,
    description: 'Mảnh đá lửa sắc bén dùng làm lưỡi công cụ hoặc thắp lửa.'
  },
  palm_leaf: {
    id: 'palm_leaf',
    name: 'Lá Cọ',
    icon: '🌿',
    type: 'resource',
    maxStack: 80,
    description: 'Lá dừa cọ bản lớn dùng lợp mái lều và máy hứng nước.'
  },
  coconut: {
    id: 'coconut',
    name: 'Trái Dừa',
    icon: '🥥',
    type: 'food',
    maxStack: 20,
    description: 'Trái dừa tươi ngọt, hồi +15 Đói và +10 Khát khi ăn.'
  },
  berry: {
    id: 'berry',
    name: 'Quả Mọng',
    icon: '🍒',
    type: 'food',
    maxStack: 30,
    description: 'Quả dại mọng nước, hồi +12 Đói và +6 Khát.'
  },
  stone_axe: {
    id: 'stone_axe',
    name: 'Rìu Đá',
    icon: '🪓',
    type: 'tool',
    toolType: 'axe',
    maxStack: 1,
    description: 'Tăng gấp đôi tốc độ chặt cây cọ.'
  },
  stone_pickaxe: {
    id: 'stone_pickaxe',
    name: 'Cuốc Đá',
    icon: '⛏️',
    type: 'tool',
    toolType: 'pickaxe',
    maxStack: 1,
    description: 'Tăng gấp đôi tốc độ đập đá khoáng.'
  },
  torch: {
    id: 'torch',
    name: 'Cây Đuốc',
    icon: '🔥',
    type: 'tool',
    toolType: 'torch',
    maxStack: 1,
    description: 'Đuốc cầm tay phát sáng ấm áp soi rọi ban đêm.'
  },
  hammer: {
    id: 'hammer',
    name: 'Búa Xây Dựng',
    icon: '🔨',
    type: 'tool',
    toolType: 'hammer',
    maxStack: 1,
    description: 'Búa gỗ xây dựng phong cách Raft dùng để ghép mảng bè, cầu thang và vách gỗ.'
  },
  building_hammer: {
    id: 'building_hammer',
    name: 'Búa Xây Dựng',
    icon: '🔨',
    type: 'tool',
    toolType: 'hammer',
    maxStack: 1,
    description: 'Búa gỗ xây dựng phong cách Raft dùng để ghép mảng bè, cầu thang và vách gỗ.'
  },
  campfire: {
    id: 'campfire',
    name: 'Lửa Trại',
    icon: '🏕️',
    type: 'building',
    buildType: 'campfire',
    maxStack: 5,
    description: 'Công trình sưởi ấm ban đêm và hồi phục máu khi ở gần.'
  },
  shelter: {
    id: 'shelter',
    name: 'Lều Trú Ẩn',
    icon: '⛺',
    type: 'building',
    buildType: 'shelter',
    maxStack: 5,
    description: 'Lều bằng gỗ và lá cọ, cho phép ngủ qua đêm để hồi sức.'
  },
  water_collector: {
    id: 'water_collector',
    name: 'Máy Hứng Nước',
    icon: '🚰',
    type: 'building',
    buildType: 'water_collector',
    maxStack: 5,
    description: 'Tự động tích tụ nước ngọt tinh khiết từ sương và mưa.'
  },
  raft_foundation: {
    id: 'raft_foundation',
    name: 'Mảng Bè Gỗ',
    icon: '🪵',
    type: 'building',
    buildType: 'raft_foundation',
    maxStack: 10,
    description: 'Mảng bè gỗ nổi trên mặt nước với thùng nổi và ván ghép.'
  },
  wooden_stairs: {
    id: 'wooden_stairs',
    name: 'Cầu Thang Gỗ',
    icon: '🪜',
    type: 'building',
    buildType: 'wooden_stairs',
    maxStack: 10,
    description: 'Cầu thang gỗ dốc có tay vịn để leo lên các tầng mảng bè.'
  },
  wooden_wall: {
    id: 'wooden_wall',
    name: 'Vách Gỗ Cửa Sổ',
    icon: '🚪',
    type: 'building',
    buildType: 'wooden_wall',
    maxStack: 10,
    description: 'Vách gỗ có khung cửa sổ thông thoáng và rèm bạt chắn gió.'
  }
};

export class Inventory {
  constructor(slotCount = 8, onChangeCallback = null) {
    // Hotbar: Strictly for interactive tools (Búa, Rìu, Cuốc, Đuốc)
    this.slotCount = slotCount; // 8 hotbar slots
    this.hotbarSlots = new Array(slotCount).fill(null);
    this.selectedSlotIndex = 0;

    // Backward-compatible alias for existing callers
    this.slots = this.hotbarSlots;

    // Backpack: 20 slots (5 columns x 4 rows) for resources, food, and spare tools/buildings
    this.backpackSlotCount = 20;
    this.backpackSlots = new Array(this.backpackSlotCount).fill(null);

    this.onChangeCallback = onChangeCallback;

    // Initial starter equipment:
    // Hammer on hotbar slot 1 (interactive tool)
    this.addToolToHotbar('hammer');

    // Raw resources & food route directly to Backpack (never on hotbar!)
    this.addItemToBackpack('wood', 8);
    this.addItemToBackpack('stone', 4);
    this.addItemToBackpack('coconut', 3);
  }

  notifyChange() {
    this.slots = this.hotbarSlots;
    if (this.onChangeCallback) {
      this.onChangeCallback(this);
    }
  }

  selectSlot(index) {
    if (index >= 0 && index < this.slotCount) {
      this.selectedSlotIndex = index;
      this.notifyChange();
    }
  }

  getSelectedItem() {
    return this.hotbarSlots[this.selectedSlotIndex] || null;
  }

  /**
   * Route item based on type:
   * - Interactive tools ('tool') -> hotbar first if space available, otherwise backpack
   * - Resources & Foods ('resource', 'food') -> STRICTLY to backpack (never hotbar)
   * - Buildings -> backpack (can be clicked to build or placed)
   */
  addItem(itemId, count = 1) {
    const def = ITEM_DEFS[itemId];
    if (!def || count <= 0) return 0;

    if (def.type === 'tool') {
      // Try hotbar first
      const storedHotbar = this.addToolToHotbar(itemId);
      if (storedHotbar > 0) {
        return storedHotbar;
      }
      // If hotbar full, store in backpack
      return this.addItemToBackpack(itemId, 1);
    } else {
      // Raw resources, food, and buildings go strictly into backpack
      return this.addItemToBackpack(itemId, count);
    }
  }

  addToolToHotbar(itemId) {
    const def = ITEM_DEFS[itemId];
    if (!def) return 0;

    // Check if empty slot exists in hotbar
    for (let i = 0; i < this.slotCount; i++) {
      if (!this.hotbarSlots[i]) {
        this.hotbarSlots[i] = {
          id: itemId,
          name: def.name,
          icon: def.icon,
          type: def.type,
          count: 1
        };
        this.notifyChange();
        return 1;
      }
    }
    return 0; // Hotbar full
  }

  addItemToBackpack(itemId, count = 1) {
    const def = ITEM_DEFS[itemId];
    if (!def || count <= 0) return 0;

    let remaining = count;

    // 1. First add to existing non-full stacks in backpack
    for (let i = 0; i < this.backpackSlotCount; i++) {
      const slot = this.backpackSlots[i];
      if (slot && slot.id === itemId && slot.count < def.maxStack) {
        const canAdd = Math.min(remaining, def.maxStack - slot.count);
        slot.count += canAdd;
        remaining -= canAdd;
        if (remaining <= 0) break;
      }
    }

    // 2. Put remainder into first empty backpack slot
    if (remaining > 0) {
      for (let i = 0; i < this.backpackSlotCount; i++) {
        if (!this.backpackSlots[i]) {
          const toAdd = Math.min(remaining, def.maxStack);
          this.backpackSlots[i] = {
            id: itemId,
            name: def.name,
            icon: def.icon,
            type: def.type,
            count: toAdd
          };
          remaining -= toAdd;
          if (remaining <= 0) break;
        }
      }
    }

    this.notifyChange();
    return count - remaining;
  }

  removeItem(itemId, count = 1) {
    let remaining = count;

    // Remove from backpack first
    for (let i = this.backpackSlotCount - 1; i >= 0; i--) {
      const slot = this.backpackSlots[i];
      if (slot && slot.id === itemId) {
        if (slot.count > remaining) {
          slot.count -= remaining;
          remaining = 0;
          break;
        } else {
          remaining -= slot.count;
          this.backpackSlots[i] = null;
          if (remaining <= 0) break;
        }
      }
    }

    // If still remaining, check hotbar
    if (remaining > 0) {
      for (let i = this.slotCount - 1; i >= 0; i--) {
        const slot = this.hotbarSlots[i];
        if (slot && slot.id === itemId) {
          if (slot.count > remaining) {
            slot.count -= remaining;
            remaining = 0;
            break;
          } else {
            remaining -= slot.count;
            this.hotbarSlots[i] = null;
            if (remaining <= 0) break;
          }
        }
      }
    }

    this.notifyChange();
    return remaining === 0;
  }

  findItemSlot(itemId) {
    // Check hotbar
    for (let i = 0; i < this.slotCount; i++) {
      if (this.hotbarSlots[i] && this.hotbarSlots[i].id === itemId) {
        return i;
      }
    }
    return -1;
  }

  findBackpackSlot(itemId) {
    for (let i = 0; i < this.backpackSlotCount; i++) {
      if (this.backpackSlots[i] && this.backpackSlots[i].id === itemId) {
        return i;
      }
    }
    return -1;
  }

  hasItem(itemId, count = 1) {
    return this.getCount(itemId) >= count;
  }

  getCount(itemId) {
    let total = 0;
    // Count from backpack
    for (let i = 0; i < this.backpackSlotCount; i++) {
      if (this.backpackSlots[i] && this.backpackSlots[i].id === itemId) {
        total += this.backpackSlots[i].count;
      }
    }
    // Count from hotbar
    for (let i = 0; i < this.slotCount; i++) {
      if (this.hotbarSlots[i] && this.hotbarSlots[i].id === itemId) {
        total += this.hotbarSlots[i].count;
      }
    }
    return total;
  }

  /**
   * Consume food directly from backpack slot (left or right click in Backpack UI)
   */
  consumeFoodFromBackpack(backpackIndex) {
    if (backpackIndex < 0 || backpackIndex >= this.backpackSlotCount) return null;
    const item = this.backpackSlots[backpackIndex];
    if (!item || item.type !== 'food') return null;

    const itemId = item.id;
    item.count -= 1;
    if (item.count <= 0) {
      this.backpackSlots[backpackIndex] = null;
    }
    this.notifyChange();
    return itemId;
  }

  /**
   * Move or equip tool from backpack to hotbar
   */
  equipToolFromBackpack(backpackIndex, targetHotbarIndex = null) {
    if (backpackIndex < 0 || backpackIndex >= this.backpackSlotCount) return false;
    const item = this.backpackSlots[backpackIndex];
    if (!item || item.type !== 'tool') return false;

    let targetIdx = targetHotbarIndex !== null ? targetHotbarIndex : this.selectedSlotIndex;
    if (targetIdx < 0 || targetIdx >= this.slotCount) {
      // Find first empty hotbar slot
      targetIdx = this.hotbarSlots.findIndex(s => s === null);
      if (targetIdx === -1) targetIdx = this.selectedSlotIndex;
    }

    // Swap items between backpack and hotbar
    const currentHotbarItem = this.hotbarSlots[targetIdx];
    this.hotbarSlots[targetIdx] = item;
    this.backpackSlots[backpackIndex] = currentHotbarItem;

    this.selectSlot(targetIdx);
    this.notifyChange();
    return true;
  }

  consumeSelectedFood() {
    const item = this.getSelectedItem();
    if (!item || item.type !== 'food') return null;

    const itemId = item.id;
    item.count -= 1;
    if (item.count <= 0) {
      this.hotbarSlots[this.selectedSlotIndex] = null;
    }
    this.notifyChange();
    return itemId;
  }

  consumeSelectedBuilding() {
    const item = this.getSelectedItem();
    if (!item || item.type !== 'building') return null;

    const buildType = ITEM_DEFS[item.id]?.buildType;
    item.count -= 1;
    if (item.count <= 0) {
      this.hotbarSlots[this.selectedSlotIndex] = null;
    }
    this.notifyChange();
    return buildType;
  }
}
