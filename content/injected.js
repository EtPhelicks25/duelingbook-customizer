/**
 * injected.js — Runs in DuelingBook's MAIN execution world.
 *
 * Direct access to:
 * - window.$ (jQuery)
 * - window.Card, window.loadSleeves, window.initSleeves, window.loadDuelAvatar
 * - window.thinking, window.allGood
 * - window.player1, window.player2, window.Player1(), window.Player2()
 * - DOM card elements: <div class="card"><div class="cardback"><img .../></div></div>
 * - Avatars: #avatar1 .image, #my_profile .profile_avatar .image
 * - Emotes: #avatar1 .think, #avatar1 .all_good img, #think_btn img
 */

(function () {
  'use strict';

  // ── Configuration State ─────────────────────────────────────────
  let config = {
    avatarEnabled: false,
    avatarDataUrl: null,
    profilePicId: '',
    mySleevesEnabled: false,
    mySleevesDataUrl: null,
    oppSleevesEnabled: false,
    oppSleevesDataUrl: null,
    thinkEmoteEnabled: false,
    thinkEmoteDataUrl: null,
    thinkOpponentEnabled: false,
    allGoodEmoteEnabled: false,
    allGoodEmoteDataUrl: null,
    allGoodOpponentEnabled: false,
  };

  const originalAvatarSources = new WeakMap();
  const originalSleeveSources = new WeakMap();
  const originalThinkSources = new WeakMap();
  const originalAllGoodSources = new WeakMap();

  // ── Communication with content script ───────────────────────────
  window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data || event.data.type !== 'DB_CUSTOMIZER_CONFIG_UPDATE') {
      return;
    }

    const prevConfig = { ...config };
    config = { ...config, ...(event.data.config || {}) };

    // If sleeves were disabled, restore original sleeves
    if (prevConfig.mySleevesEnabled && !config.mySleevesEnabled) {
      restorePlayerSleeves(window.player1 || (window.Player1 && window.Player1()));
    }
    if (prevConfig.oppSleevesEnabled && !config.oppSleevesEnabled) {
      restorePlayerSleeves(window.player2 || (window.Player2 && window.Player2()));
    }

    // Apply all customizations immediately with the new configuration
    applyAllCustomizations();
  });

  // ── Helper: Identify Player ─────────────────────────────────────
  function isPlayer1(player) {
    if (!player) return false;
    const p1 = window.player1 || (window.Player1 && window.Player1());
    return player === p1;
  }

  function isPlayer2(player) {
    if (!player) return false;
    const p2 = window.player2 || (window.Player2 && window.Player2());
    return player === p2;
  }

  // ── Sleeve Application ──────────────────────────────────────────

  function applyCustomSleeveToCard(card) {
    if (!card) return;
    const $card = window.$ ? window.$(card) : null;
    const cardEl = $card ? $card[0] : card;
    if (!cardEl) return;

    const img = cardEl.querySelector('.cardback img');
    if (!img) return;

    let isP1 = false;
    let isP2 = false;

    if ($card) {
      const owner = $card.data('owner');
      if (owner) {
        if (isPlayer1(owner)) isP1 = true;
        else if (isPlayer2(owner)) isP2 = true;
      }
    }

    // Fallback: Check field position if owner not explicitly set yet
    if (!isP1 && !isP2) {
      const rect = cardEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const midY = window.innerHeight * 0.45;
        if (rect.top + rect.height / 2 > midY) {
          isP1 = true;
        } else {
          isP2 = true;
        }
      } else {
        // In deck constructor or solo preview, it's always the local player
        isP1 = true;
      }
    }

    if (isP1 && config.mySleevesEnabled && config.mySleevesDataUrl) {
      if (!originalSleeveSources.has(img)) {
        originalSleeveSources.set(img, img.src);
      }
      if (img.src !== config.mySleevesDataUrl) {
        img.src = config.mySleevesDataUrl;
      }
    } else if (isP2 && config.oppSleevesEnabled && config.oppSleevesDataUrl) {
      if (!originalSleeveSources.has(img)) {
        originalSleeveSources.set(img, img.src);
      }
      if (img.src !== config.oppSleevesDataUrl) {
        img.src = config.oppSleevesDataUrl;
      }
    } else if (!config.mySleevesEnabled && isP1 && originalSleeveSources.has(img)) {
      img.src = originalSleeveSources.get(img);
    } else if (!config.oppSleevesEnabled && isP2 && originalSleeveSources.has(img)) {
      img.src = originalSleeveSources.get(img);
    }
  }

  function applySleevesToPlayer(player) {
    if (!player) return;
    const isP1 = isPlayer1(player);
    const isP2 = isPlayer2(player);

    const targetUrl = isP1
      ? (config.mySleevesEnabled ? config.mySleevesDataUrl : null)
      : isP2
      ? (config.oppSleevesEnabled ? config.oppSleevesDataUrl : null)
      : null;

    if (!targetUrl) return;

    if (player.all_cards_arr && Array.isArray(player.all_cards_arr)) {
      for (let i = 0; i < player.all_cards_arr.length; i++) {
        const c = player.all_cards_arr[i];
        if (c) {
          if (c.find) {
            const img = c.find('.cardback img');
            if (img.length) {
              if (!originalSleeveSources.has(img[0])) originalSleeveSources.set(img[0], img[0].src);
              img.attr('src', targetUrl);
            }
          } else {
            applyCustomSleeveToCard(c);
          }
        }
      }
    }

    // Rock / Paper / Scissors sleeves
    if (isP1) {
      ['rock1', 'paper1', 'scissors1'].forEach((name) => {
        const obj = window[name];
        if (obj && obj.find) {
          const img = obj.find('.cardback img');
          if (img.length) img.attr('src', targetUrl);
        }
      });
    } else if (isP2) {
      ['rock2', 'paper2', 'scissors2'].forEach((name) => {
        const obj = window[name];
        if (obj && obj.find) {
          const img = obj.find('.cardback img');
          if (img.length) img.attr('src', targetUrl);
        }
      });
    }
  }

  function restorePlayerSleeves(player) {
    if (!player || !player.all_cards_arr) return;
    const defaultSleeve = player.sleeve || '1.jpg';
    const sleeveUrl = (window.SLEEVE_START || 'https://images.duelingbook.com/sleeves/') + defaultSleeve;

    for (let i = 0; i < player.all_cards_arr.length; i++) {
      const c = player.all_cards_arr[i];
      if (c && c.find) {
        const img = c.find('.cardback img');
        if (img.length) {
          const orig = originalSleeveSources.get(img[0]) || sleeveUrl;
          img.attr('src', orig);
        }
      }
    }
  }

  function patchCardInstance(card) {
    if (!card || !card.extend) return;
    if (card.__dbSleevePatched) return;
    card.__dbSleevePatched = true;

    const origSetSleeve = card.setSleeve;
    if (typeof origSetSleeve === 'function') {
      card.setSleeve = function (sleeveId) {
        origSetSleeve.apply(this, arguments);
        applyCustomSleeveToCard(card);
      };
    }
  }

  // ── Avatar Application ──────────────────────────────────────────

  function applyCustomAvatarToElement(img) {
    if (!img || !config.avatarEnabled || !config.avatarDataUrl) return;
    const el = img.jquery ? img[0] : img;
    if (!el || el.tagName !== 'IMG') return;

    // CRITICAL: NEVER overwrite emotes as avatar!
    if (el.classList.contains('think') || el.closest('.all_good') || el.closest('#think_btn')) {
      return;
    }

    if (!originalAvatarSources.has(el)) {
      originalAvatarSources.set(el, el.src);
    }

    if (el.src !== config.avatarDataUrl) {
      el.src = config.avatarDataUrl;
    }
    el.style.objectFit = 'cover';
  }

  function restoreAvatarElement(img) {
    const el = img.jquery ? img[0] : img;
    if (!el || !originalAvatarSources.has(el)) return;
    el.src = originalAvatarSources.get(el);
    originalAvatarSources.delete(el);
  }

  // ── Emote Application (Pensando & Like / Keep Going) ────────────

  function applyThinkEmote(img) {
    if (!img) return;
    const el = img.jquery ? img[0] : img;
    if (!el || el.tagName !== 'IMG') return;

    if (config.thinkEmoteEnabled && config.thinkEmoteDataUrl) {
      if (!originalThinkSources.has(el)) {
        originalThinkSources.set(el, el.src);
      }
      if (el.src !== config.thinkEmoteDataUrl) {
        el.src = config.thinkEmoteDataUrl;
      }
      el.style.objectFit = 'contain';
      el.style.height = 'auto';
      el.style.maxHeight = '80px';
      el.style.maxWidth = '120px';
    } else if (originalThinkSources.has(el)) {
      el.src = originalThinkSources.get(el);
      originalThinkSources.delete(el);
      el.style.height = '';
      el.style.maxHeight = '';
      el.style.maxWidth = '';
    }
  }

  function applyAllGoodEmote(img) {
    if (!img) return;
    const el = img.jquery ? img[0] : img;
    if (!el || el.tagName !== 'IMG') return;

    if (config.allGoodEmoteEnabled && config.allGoodEmoteDataUrl) {
      if (!originalAllGoodSources.has(el)) {
        originalAllGoodSources.set(el, el.src);
      }
      if (el.src !== config.allGoodEmoteDataUrl) {
        el.src = config.allGoodEmoteDataUrl;
      }
      el.style.objectFit = 'contain';
    } else if (originalAllGoodSources.has(el)) {
      el.src = originalAllGoodSources.get(el);
      originalAllGoodSources.delete(el);
    }
  }

  // ── Core Function Hooking ───────────────────────────────────────

  function hookFunction(name, wrapper) {
    if (window[name]) {
      window[name] = wrapper(window[name]);
    } else {
      let _real = undefined;
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get() {
          return _real;
        },
        set(fn) {
          _real = wrapper(fn);
        },
      });
    }
  }

  // Hook Card()
  hookFunction('Card', function (originalCard) {
    return function () {
      const card = originalCard.apply(this, arguments);
      patchCardInstance(card);
      applyCustomSleeveToCard(card);
      return card;
    };
  });

  // Hook loadSleeves()
  hookFunction('loadSleeves', function (originalLoadSleeves) {
    return function (player) {
      originalLoadSleeves.apply(this, arguments);
      applySleevesToPlayer(player);
    };
  });

  // Hook initSleeves()
  hookFunction('initSleeves', function (originalInitSleeves) {
    return function () {
      originalInitSleeves.apply(this, arguments);
      applyAllCustomizations();
    };
  });

  // Hook loadDuelAvatar()
  hookFunction('loadDuelAvatar', function (originalLoadDuelAvatar) {
    return function ($el, src) {
      originalLoadDuelAvatar.apply(this, arguments);
      if ($el && ($el.closest('#avatar1').length > 0 || $el.is('#avatar1 .image'))) {
        applyCustomAvatarToElement($el);
      }
    };
  });

  // Hook thinking()
  hookFunction('thinking', function (originalThinking) {
    return function (player, param) {
      originalThinking.apply(this, arguments);
      if (config.thinkEmoteEnabled && config.thinkEmoteDataUrl) {
        const isP1 = isPlayer1(player);
        const isP2 = isPlayer2(player);
        if (isP1 || (isP2 && config.thinkOpponentEnabled)) {
          if (player.thinking) {
            applyThinkEmote(player.thinking);
          }
        }
      }
    };
  });

  // Hook allGood()
  hookFunction('allGood', function (originalAllGood) {
    return function (player, param) {
      originalAllGood.apply(this, arguments);
      if (config.allGoodEmoteEnabled && config.allGoodEmoteDataUrl) {
        const isP1 = isPlayer1(player);
        const isP2 = isPlayer2(player);
        if (isP1 || (isP2 && config.allGoodOpponentEnabled)) {
          if (player.all_good && player.all_good.find) {
            const img = player.all_good.find('img');
            if (img.length) {
              applyAllGoodEmote(img);
            }
          }
        }
      }
    };
  });

  // ── Global Scanning & DOM Watcher ───────────────────────────────

  function applyAllCustomizations() {
    // 1. My Sleeves & Opponent Sleeves on field cards
    const p1 = window.player1 || (window.Player1 && window.Player1());
    const p2 = window.player2 || (window.Player2 && window.Player2());

    if (p1) applySleevesToPlayer(p1);
    if (p2) applySleevesToPlayer(p2);

    // 2. Scan all .cardback img in DOM
    document.querySelectorAll('.cardback img').forEach((img) => {
      applyCustomSleeveToCard(img.closest('.card') || img);
    });

    // 3. Sleeve preview in Deck Constructor & Profile
    if (config.mySleevesEnabled && config.mySleevesDataUrl) {
      document.querySelectorAll('#sleeve .image, #my_profile #sleeve .image').forEach((img) => {
        if (!originalSleeveSources.has(img)) originalSleeveSources.set(img, img.src);
        if (img.src !== config.mySleevesDataUrl) img.src = config.mySleevesDataUrl;
      });
    } else {
      document.querySelectorAll('#sleeve .image, #my_profile #sleeve .image').forEach((img) => {
        if (originalSleeveSources.has(img)) {
          img.src = originalSleeveSources.get(img);
          originalSleeveSources.delete(img);
        }
      });
    }

    // 4. Avatar (Player 1 in duel & Profile preview) - ONLY .image
    const avatarSelectors = [
      '#avatar1 .image',
      '#my_profile .profile_avatar .image',
      '#my_profile #avatar_frame img',
    ];

    if (config.avatarEnabled && config.avatarDataUrl) {
      avatarSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach(applyCustomAvatarToElement);
      });

      // Also replace by custom profilePicId if configured
      if (config.profilePicId && config.profilePicId.trim()) {
        const idStr = config.profilePicId.trim();
        document.querySelectorAll(`img[src*="${idStr}"]`).forEach((img) => {
          // Never replace emotes even by ID match
          if (!img.classList.contains('think') && !img.closest('.all_good') && !img.closest('#think_btn')) {
            applyCustomAvatarToElement(img);
          }
        });
      }
    } else {
      avatarSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach(restoreAvatarElement);
      });
    }

    // 5. Thinking emote (#avatar1 .think, #think_btn img, and #avatar2 .think if enabled)
    const thinkSelector = config.thinkOpponentEnabled
      ? '#avatar1 .think, #avatar2 .think, #think_btn img'
      : '#avatar1 .think, #think_btn img';
    document.querySelectorAll(thinkSelector).forEach(applyThinkEmote);

    // 6. All Good emote (#avatar1 .all_good img, and #avatar2 .all_good img if enabled)
    const allGoodSelector = config.allGoodOpponentEnabled
      ? '#avatar1 .all_good img, #avatar2 .all_good img'
      : '#avatar1 .all_good img';
    document.querySelectorAll(allGoodSelector).forEach(applyAllGoodEmote);
  }

  // Periodic scan to catch dynamic animations / delayed renders
  setInterval(applyAllCustomizations, 1000);

  // Notify content script that injected script is ready
  window.postMessage({ type: 'DB_CUSTOMIZER_INJECTED_READY' }, '*');
})();
