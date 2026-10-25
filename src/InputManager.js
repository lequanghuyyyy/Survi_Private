/**
 * InputManager.js - Intercepts browser shortcuts, manages PointerLock,
 * tracks input states, and handles Settings & Pause synchronization.
 */

export class InputManager {
  constructor(domElement, options = {}) {
    this.domElement = domElement;

    // Movement states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false
    };

    // Mouse movement
    this.mouseDelta = { x: 0, y: 0 };
    this.isLocked = false;
    this.isPaused = false;

    // Settings defaults (Sensitivity Level 1 - 10, default 4 = 0.0008)
    this.sensitivityLevel = options.sensitivityLevel !== undefined ? options.sensitivityLevel : 4;
    this.mouseSensitivity = options.mouseSensitivity !== undefined ? options.mouseSensitivity : (this.sensitivityLevel * 0.0002);
    this.masterVolume = options.masterVolume !== undefined ? options.masterVolume : 1.0;
    this.shadowsEnabled = options.shadowsEnabled !== undefined ? options.shadowsEnabled : true;

    // Callbacks
    this.onToggleCrafting = null;
    this.onToggleBackpack = null;
    this.onCancelBuild = null;
    this.onTogglePause = null;
    this.onToggleGuide = null;
    this.onEscape = null;
    this.onPointerLockLost = null;
    this.onSelectSlot = null;
    this.onSettingsChange = null;

    this.setupListeners();
  }

  setupListeners() {
    // 0. Intercept Ctrl+W, Ctrl+S, Ctrl+A, Ctrl+D, Ctrl+R, Ctrl+T, Ctrl+F, Tab with capture to prevent browser close/save/tab-switch
    window.addEventListener(
      'keydown',
      (e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyR', 'KeyT', 'KeyF', 'KeyP', 'KeyG'].includes(e.code)
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.code === 'Tab') {
          e.preventDefault();
        }
      },
      { capture: true, passive: false }
    );

    // 1. Prevent default browser shortcuts (Ctrl+D, Ctrl+S, Tab, Space, Arrow keys, etc.)
    window.addEventListener(
      'keydown',
      (e) => {
        // Chặn toàn bộ phím tắt hệ thống khi đang giữ phím Ctrl / Cmd
        // Đặc biệt là Ctrl + D (Bookmark/Dấu trang), Ctrl + S (Save page), Ctrl + A, Ctrl + P,...
        if (e.ctrlKey || e.metaKey) {
          if (['KeyD', 'KeyS', 'KeyA', 'KeyW', 'KeyP', 'KeyF', 'KeyG', 'KeyR', 'KeyT'].includes(e.code)) {
            e.preventDefault();
          }
        }

        if (['Tab', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
          e.preventDefault();
        }

        // Toggle Crafting (Tab)
        if (e.code === 'Tab') {
          e.preventDefault();
          if (this.onToggleCrafting) {
            this.onToggleCrafting();
          }
          return;
        }

        // Toggle Backpack (B)
        if (e.code === 'KeyB') {
          if (this.onToggleBackpack) {
            this.onToggleBackpack();
          }
          return;
        }

        // Cancel Building Mode (Q)
        if (e.code === 'KeyQ') {
          if (this.onCancelBuild) {
            this.onCancelBuild();
          }
          return;
        }

        // Toggle Pause / Settings or close active modal (ESC)
        if (e.code === 'Escape') {
          if (this.onEscape) {
            this.onEscape();
          } else if (this.onTogglePause) {
            this.onTogglePause();
          }
          return;
        }

        // Toggle Guide
        if (e.code === 'KeyH') {
          if (this.onToggleGuide) {
            this.onToggleGuide();
          }
          return;
        }

        // Hotbar selection numbers
        if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''), 10);
          if (num >= 1 && num <= 8 && this.onSelectSlot) {
            this.onSelectSlot(num - 1);
          }
          return;
        }

        // Movement & Actions
        switch (e.code) {
          case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
          case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
          case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
          case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
          case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
          case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = true; break;
          case 'Space': this.keys.jump = true; break;
        }
      },
      { passive: false }
    );

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
        case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = false; break;
        case 'Space': this.keys.jump = false; break;
      }
    });

    // Reset phím khi cửa sổ mất focus (Alt+Tab hoặc click ra ngoài)
    window.addEventListener('blur', () => {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.sprint = false;
      this.keys.crouch = false;
      this.keys.jump = false;
    });

    // 2. Mouse Move
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || this.isPaused) return;
      this.mouseDelta.x += e.movementX || 0;
      this.mouseDelta.y += e.movementY || 0;
    });

    // 3. PointerLock Synchronization
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === this.domElement || document.pointerLockElement === document.body;
      const wasLocked = this.isLocked;
      this.isLocked = locked;

      // If pointer lock was lost while actively playing, notify callback
      if (wasLocked && !locked) {
        if (this.onPointerLockLost) {
          this.onPointerLockLost();
        }
      }
    });
  }

  getAndResetMouseDelta() {
    const delta = {
      x: this.mouseDelta.x * this.mouseSensitivity,
      y: this.mouseDelta.y * this.mouseSensitivity,
      rawX: this.mouseDelta.x,
      rawY: this.mouseDelta.y
    };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  async requestLock() {
    const target = this.domElement || document.body;
    target.requestPointerLock?.();
    if (navigator.keyboard && navigator.keyboard.lock) {
      try {
        await navigator.keyboard.lock(['KeyW', 'ControlLeft', 'ControlRight']);
      } catch (_) {}
    }
  }

  exitLock() {
    document.exitPointerLock?.();
  }

  updateSettings(newSettings) {
    if (newSettings.sensitivityLevel !== undefined) {
      this.sensitivityLevel = newSettings.sensitivityLevel;
      this.mouseSensitivity = this.sensitivityLevel * 0.0002;
    } else if (newSettings.mouseSensitivity !== undefined) {
      this.mouseSensitivity = newSettings.mouseSensitivity;
      this.sensitivityLevel = Math.round(this.mouseSensitivity / 0.0002);
    }
    if (newSettings.masterVolume !== undefined) {
      this.masterVolume = newSettings.masterVolume;
    }
    if (newSettings.shadowsEnabled !== undefined) {
      this.shadowsEnabled = newSettings.shadowsEnabled;
    }

    if (this.onSettingsChange) {
      this.onSettingsChange(this);
    }
  }
}
