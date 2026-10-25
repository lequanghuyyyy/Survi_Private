/**
 * SurvivalStats.js - Manages Health, Hunger, Thirst, Stamina
 * and game over / respawn cycle.
 */

export class SurvivalStats {
  constructor(onGameOver) {
    this.maxHealth = 100;
    this.maxHunger = 100;
    this.maxThirst = 100;
    this.maxStamina = 100;

    this.health = 100;
    this.hunger = 100;
    this.thirst = 100;
    this.stamina = 100;

    this.isDead = false;
    this.deathReason = '';
    this.onGameOver = onGameOver;

    // Trackers
    this.daysSurvived = 1;
    this.resourcesGathered = 0;
    this.structuresBuilt = 0;

    // Nearby campfire flag (set per frame by world check)
    this.isNearCampfire = false;
  }

  update(delta, isSprinting, isMoving) {
    if (this.isDead) return;

    // 1. Hunger depletion: 1 every 4 seconds (0.25 / s)
    this.hunger = Math.max(0, this.hunger - 0.25 * delta);

    // 2. Thirst depletion: 1 every 3 seconds (0.333 / s)
    this.thirst = Math.max(0, this.thirst - 0.333 * delta);

    // 3. Stamina drain / recovery
    if (isSprinting && isMoving) {
      this.stamina = Math.max(0, this.stamina - 18 * delta);
    } else {
      // Regenerate stamina
      this.stamina = Math.min(this.maxStamina, this.stamina + 22 * delta);
    }

    // 4. Starvation & Dehydration damage
    let damagePerSec = 0;
    if (this.hunger <= 0) {
      damagePerSec += 2.0;
    }
    if (this.thirst <= 0) {
      damagePerSec += 2.0;
    }

    if (damagePerSec > 0) {
      this.health = Math.max(0, this.health - damagePerSec * delta);
      if (this.health <= 0) {
        this.die(this.hunger <= 0 && this.thirst <= 0 
          ? "Bạn đã chết vì đói và khát!" 
          : (this.hunger <= 0 ? "Bạn đã chết đói!" : "Bạn đã chết vì mất nước!"));
        return;
      }
    } else {
      // 5. Health regeneration:
      // A) Campfire warmth bonus (+3 HP / s)
      if (this.isNearCampfire) {
        this.health = Math.min(this.maxHealth, this.health + 3.0 * delta);
      }
      // B) Well-fed passive slow regen (+0.5 HP / s)
      else if (this.hunger > 70 && this.thirst > 70 && this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + 0.6 * delta);
      }
    }
  }

  canSprint() {
    return this.stamina > 5 && !this.isDead;
  }

  consumeItem(itemId) {
    if (this.isDead) return false;

    if (itemId === 'coconut') {
      // Coconut restores +15 Hunger, +10 Thirst
      this.hunger = Math.min(this.maxHunger, this.hunger + 15);
      this.thirst = Math.min(this.maxThirst, this.thirst + 10);
      return true;
    }

    if (itemId === 'berry') {
      // Berries restore +12 Hunger, +6 Thirst
      this.hunger = Math.min(this.maxHunger, this.hunger + 12);
      this.thirst = Math.min(this.maxThirst, this.thirst + 6);
      return true;
    }

    return false;
  }

  drinkWater(amount = 35) {
    if (this.isDead) return;
    this.thirst = Math.min(this.maxThirst, this.thirst + amount);
  }

  sleepRest() {
    // Restores stamina & health after a night's sleep
    this.stamina = this.maxStamina;
    this.health = Math.min(this.maxHealth, this.health + 30);
    // Slight hunger and thirst consumption during 8hr sleep
    this.hunger = Math.max(10, this.hunger - 15);
    this.thirst = Math.max(10, this.thirst - 20);
  }

  takeDamage(amt, reason = "Bị thương") {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amt);
    if (this.health <= 0) {
      this.die(reason);
    }
  }

  die(reason) {
    this.isDead = true;
    this.deathReason = reason;
    if (this.onGameOver) {
      this.onGameOver(reason, {
        days: this.daysSurvived,
        harvested: this.resourcesGathered,
        crafted: this.structuresBuilt
      });
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.thirst = this.maxThirst;
    this.stamina = this.maxStamina;
    this.isDead = false;
  }
}
