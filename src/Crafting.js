/**
 * Crafting.js - Recipe registry and crafting execution
 */

export const RECIPES = [
  {
    id: 'stone_axe',
    name: 'Rìu Đá',
    icon: '🪓',
    category: 'tools',
    resultId: 'stone_axe',
    resultCount: 1,
    description: 'Tăng gấp đôi tốc độ chặt cây cọ.',
    ingredients: [
      { id: 'wood', count: 3, name: 'Gỗ' },
      { id: 'stone', count: 2, name: 'Đá' }
    ]
  },
  {
    id: 'stone_pickaxe',
    name: 'Cuốc Đá',
    icon: '⛏️',
    category: 'tools',
    resultId: 'stone_pickaxe',
    resultCount: 1,
    description: 'Tăng gấp đôi tốc độ đập đá khoáng.',
    ingredients: [
      { id: 'wood', count: 2, name: 'Gỗ' },
      { id: 'stone', count: 3, name: 'Đá' }
    ]
  },
  {
    id: 'torch',
    name: 'Cây Đuốc',
    icon: '🔥',
    category: 'tools',
    resultId: 'torch',
    resultCount: 1,
    description: 'Soi sáng ban đêm khi cầm trên tay.',
    ingredients: [
      { id: 'wood', count: 1, name: 'Gỗ' },
      { id: 'flint', count: 1, name: 'Đá Lửa' }
    ]
  },
  {
    id: 'campfire',
    name: 'Lửa Trại',
    icon: '🏕️',
    category: 'survival',
    resultId: 'campfire',
    resultCount: 1,
    description: 'Tỏa sáng, xua tan bóng tối và hồi máu khi đứng gần.',
    ingredients: [
      { id: 'wood', count: 5, name: 'Gỗ' },
      { id: 'stone', count: 3, name: 'Đá' }
    ]
  },
  {
    id: 'shelter',
    name: 'Lều Trú Ẩn',
    icon: '⛺',
    category: 'survival',
    resultId: 'shelter',
    resultCount: 1,
    description: 'Lều che mưa nắng, cho phép ngủ qua đêm để hồi phục thể lực.',
    ingredients: [
      { id: 'wood', count: 8, name: 'Gỗ' },
      { id: 'palm_leaf', count: 6, name: 'Lá Cọ' }
    ]
  },
  {
    id: 'water_collector',
    name: 'Máy Hứng Nước',
    icon: '🚰',
    category: 'survival',
    resultId: 'water_collector',
    resultCount: 1,
    description: 'Tự động tích lũy nước ngọt từ sương sớm và mưa nhiệt đới.',
    ingredients: [
      { id: 'wood', count: 4, name: 'Gỗ' },
      { id: 'palm_leaf', count: 4, name: 'Lá Cọ' }
    ]
  },
  {
    id: 'hammer',
    name: 'Búa Xây Dựng',
    icon: '🔨',
    category: 'tools',
    resultId: 'hammer',
    resultCount: 1,
    description: 'Búa gỗ xây dựng phong cách Raft dùng để ghép mảng bè, cầu thang và vách gỗ.',
    ingredients: [
      { id: 'wood', count: 2, name: 'Gỗ' },
      { id: 'stone', count: 1, name: 'Đá' }
    ]
  },
  {
    id: 'raft_foundation',
    name: 'Mảng Bè Gỗ',
    icon: '🪵',
    category: 'build',
    resultId: 'raft_foundation',
    resultCount: 1,
    description: 'Mảng bè gỗ nổi trên mặt nước với thùng nổi và ván gỗ.',
    ingredients: [
      { id: 'wood', count: 4, name: 'Gỗ' }
    ]
  },
  {
    id: 'wooden_stairs',
    name: 'Cầu Thang Gỗ',
    icon: '🪜',
    category: 'build',
    resultId: 'wooden_stairs',
    resultCount: 1,
    description: 'Cầu thang gỗ dốc có tay vịn để leo lên tầng trên.',
    ingredients: [
      { id: 'wood', count: 4, name: 'Gỗ' }
    ]
  },
  {
    id: 'wooden_wall',
    name: 'Vách Gỗ Cửa Sổ',
    icon: '🚪',
    category: 'build',
    resultId: 'wooden_wall',
    resultCount: 1,
    description: 'Vách gỗ có khung cửa sổ thông thoáng và rèm bạt chắn gió.',
    ingredients: [
      { id: 'wood', count: 3, name: 'Gỗ' },
      { id: 'palm_leaf', count: 2, name: 'Lá Cọ' }
    ]
  }
];

export class CraftingManager {
  constructor(inventory) {
    this.inventory = inventory;
  }

  canCraft(recipe) {
    for (const req of recipe.ingredients) {
      if (this.inventory.getCount(req.id) < req.count) {
        return false;
      }
    }
    return true;
  }

  craft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    if (!this.canCraft(recipe)) return false;

    // Deduct ingredients
    for (const req of recipe.ingredients) {
      this.inventory.removeItem(req.id, req.count);
    }

    // Add created item to inventory
    this.inventory.addItem(recipe.resultId, recipe.resultCount);
    return true;
  }
}
