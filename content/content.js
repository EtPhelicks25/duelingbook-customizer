/**
 * content.js — DuelingBook Customizer Content Script.
 *
 * Runs in DuelingBook tabs.
 * 1. Injects `injected.js` into the page to hook DuelingBook's jQuery & card/emote methods.
 * 2. Injects dynamic CSS rules for instant avatar, sleeves, and emote replacement.
 * 3. Observes DOM mutations to ensure customized elements stay updated reliably.
 */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────
  let settings = {
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

  const originals = new WeakMap();
  let dynamicStyleTag = null;

  // ── Inject Main Script into Page Execution Context ────────────
  function injectMainScript() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('content/injected.js');
      script.onload = function () {
        this.remove();
        sendConfigToInjected();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.warn('[DB Customizer] Error injecting page script:', e);
    }
  }

  function sendConfigToInjected() {
    window.postMessage(
      {
        type: 'DB_CUSTOMIZER_CONFIG_UPDATE',
        config: {
          avatarEnabled: settings.avatarEnabled,
          avatarDataUrl: settings.avatarDataUrl,
          profilePicId: settings.profilePicId,
          mySleevesEnabled: settings.mySleevesEnabled,
          mySleevesDataUrl: settings.mySleevesDataUrl,
          oppSleevesEnabled: settings.oppSleevesEnabled,
          oppSleevesDataUrl: settings.oppSleevesDataUrl,
          thinkEmoteEnabled: settings.thinkEmoteEnabled,
          thinkEmoteDataUrl: settings.thinkEmoteDataUrl,
          thinkOpponentEnabled: settings.thinkOpponentEnabled,
          allGoodEmoteEnabled: settings.allGoodEmoteEnabled,
          allGoodEmoteDataUrl: settings.allGoodEmoteDataUrl,
          allGoodOpponentEnabled: settings.allGoodOpponentEnabled,
        },
      },
      '*'
    );
  }

  window.addEventListener('message', function (e) {
    if (e.source === window && e.data && e.data.type === 'DB_CUSTOMIZER_INJECTED_READY') {
      sendConfigToInjected();
    }
  });

  // ── Dynamic CSS Injection ─────────────────────────────────────
  function updateDynamicStyles() {
    if (!dynamicStyleTag) {
      dynamicStyleTag = document.createElement('style');
      dynamicStyleTag.id = 'db-customizer-dynamic-style';
      (document.head || document.documentElement).appendChild(dynamicStyleTag);
    }

    let css = '';

    // 1. Avatar styling: STRICTLY target .image (NEVER touch .think or .all_good)
    if (settings.avatarEnabled && settings.avatarDataUrl) {
      css += `
        #avatar1 > img.image,
        #avatar1 .image,
        #my_profile .profile_avatar .image,
        #my_profile #avatar_frame img {
          content: url("${settings.avatarDataUrl}") !important;
          object-fit: cover !important;
        }
      `;
    }

    // 2. Sleeve preview in Deck Constructor & Profile
    if (settings.mySleevesEnabled && settings.mySleevesDataUrl) {
      css += `
        #sleeve .image,
        #my_profile #sleeve .image {
          content: url("${settings.mySleevesDataUrl}") !important;
          object-fit: cover !important;
        }
      `;
    }

    // 3. Emote: Pensando (Thinking)
    if (settings.thinkEmoteEnabled && settings.thinkEmoteDataUrl) {
      let thinkSelectors = '#avatar1 .think, #think_btn img';
      if (settings.thinkOpponentEnabled) {
        thinkSelectors += ', #avatar2 .think';
      }
      css += `
        ${thinkSelectors} {
          content: url("${settings.thinkEmoteDataUrl}") !important;
          object-fit: contain !important;
          height: auto !important;
          max-height: 80px !important;
          max-width: 120px !important;
        }
      `;
    }

    // 4. Emote: Like / Keep Going (All Good)
    if (settings.allGoodEmoteEnabled && settings.allGoodEmoteDataUrl) {
      let allGoodSelectors = '#avatar1 .all_good img';
      if (settings.allGoodOpponentEnabled) {
        allGoodSelectors += ', #avatar2 .all_good img';
      }
      css += `
        ${allGoodSelectors} {
          content: url("${settings.allGoodEmoteDataUrl}") !important;
          object-fit: contain !important;
        }
      `;
    }

    dynamicStyleTag.textContent = css;
  }

  // ── Avatar Detection & Replacement ────────────────────────────

  /**
   * Checks if an element is the user's avatar.
   * Matches ONLY the profile picture / avatar element, specifically
   * excluding the thinking emote and all_good (like) button inside #avatar1.
   */
  function isUserAvatar(el) {
    if (el.tagName !== 'IMG') return false;

    // CRITICAL: NEVER treat emotes as the avatar!
    if (el.classList.contains('think') || el.closest('.all_good') || el.closest('#think_btn')) {
      return false;
    }

    // Check DOM hierarchy: #avatar1 is Player 1 (user)
    if (el.closest('#avatar1') && (el.classList.contains('image') || el.matches('#avatar1 .image'))) {
      return true;
    }

    // User's own profile modal
    if (el.closest('#my_profile .profile_avatar, #my_profile #avatar_frame')) {
      return true;
    }

    // Specific Profile Pic ID check if provided
    if (settings.profilePicId && settings.profilePicId.trim() !== '') {
      const id = settings.profilePicId.trim();
      const src = el.src || '';
      if (src.includes(id)) return true;
    }

    return false;
  }

  function processElement(el) {
    if (el.nodeType !== Node.ELEMENT_NODE) return;
    if (el.tagName !== 'IMG') return;

    if (isUserAvatar(el)) {
      if (settings.avatarEnabled && settings.avatarDataUrl) {
        if (!originals.has(el)) {
          originals.set(el, el.src);
        }
        if (el.src !== settings.avatarDataUrl) {
          el.src = settings.avatarDataUrl;
          el.style.objectFit = 'cover';
        }
      } else if (originals.has(el)) {
        el.src = originals.get(el);
        originals.delete(el);
      }
    }
  }

  // ── Emote Elements Processing ─────────────────────────────────

  function processEmoteElements() {
    // 1. Thinking emote
    const thinkImgs = document.querySelectorAll(
      settings.thinkOpponentEnabled
        ? '#avatar1 .think, #avatar2 .think, #think_btn img'
        : '#avatar1 .think, #think_btn img'
    );
    thinkImgs.forEach((img) => {
      if (settings.thinkEmoteEnabled && settings.thinkEmoteDataUrl) {
        if (!originals.has(img)) originals.set(img, img.src);
        if (img.src !== settings.thinkEmoteDataUrl) {
          img.src = settings.thinkEmoteDataUrl;
          img.style.objectFit = 'contain';
        }
      } else if (originals.has(img)) {
        img.src = originals.get(img);
        originals.delete(img);
      }
    });

    // 2. All Good (Like / Keep Going) emote
    const allGoodImgs = document.querySelectorAll(
      settings.allGoodOpponentEnabled
        ? '#avatar1 .all_good img, #avatar2 .all_good img'
        : '#avatar1 .all_good img'
    );
    allGoodImgs.forEach((img) => {
      if (settings.allGoodEmoteEnabled && settings.allGoodEmoteDataUrl) {
        if (!originals.has(img)) originals.set(img, img.src);
        if (img.src !== settings.allGoodEmoteDataUrl) {
          img.src = settings.allGoodEmoteDataUrl;
          img.style.objectFit = 'contain';
        }
      } else if (originals.has(img)) {
        img.src = originals.get(img);
        originals.delete(img);
      }
    });
  }

  function scanAll() {
    document.querySelectorAll('img').forEach(processElement);
    processEmoteElements();
  }

  // ── MutationObserver ──────────────────────────────────────────
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        processElement(node);
        if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(processElement);
        }
      }
      if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
        processElement(mutation.target);
      }
    }
    processEmoteElements();
  });

  // ── Communication with Popup / Storage ────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DB_CUSTOMIZER_UPDATE') {
      loadSettingsAndApply();
      sendResponse({ status: 'ok' });
    }

    if (message.type === 'DB_CUSTOMIZER_DETECT_PROFILE') {
      let detectedId = null;

      // 1. Check user profile avatar in modal
      const profileImg = document.querySelector('#my_profile .profile_avatar .image, #my_profile img');
      if (profileImg && profileImg.src) {
        const m = profileImg.src.match(/\/(\d+)\.(jpg|png|webp|gif)/i) || profileImg.src.match(/(\d{4,})/);
        if (m) detectedId = m[1];
      }

      // 2. Check Player 1 in duel
      if (!detectedId) {
        const p1Img = document.querySelector('#avatar1 .image, #avatar1 img.image');
        if (p1Img && p1Img.src) {
          const m = p1Img.src.match(/\/(\d+)\.(jpg|png|webp|gif)/i) || p1Img.src.match(/(\d{4,})/);
          if (m) detectedId = m[1];
        }
      }

      // 3. Fallback: check any profile-pics img on bottom half
      if (!detectedId) {
        const midY = window.innerHeight * 0.45;
        document.querySelectorAll('img[src*="/profile-pics/"]').forEach(function (img) {
          const rect = img.getBoundingClientRect();
          if (rect.top + rect.height / 2 > midY) {
            const m = img.src.match(/\/profile-pics\/(\d+)/);
            if (m) detectedId = m[1];
          }
        });
      }

      sendResponse({ profilePicId: detectedId });
    }

    return true;
  });

  function loadSettingsAndApply() {
    chrome.storage.local.get(
      [
        'avatarEnabled',
        'avatarDataUrl',
        'profilePicId',
        'mySleevesEnabled',
        'mySleevesDataUrl',
        'oppSleevesEnabled',
        'oppSleevesDataUrl',
        'thinkEmoteEnabled',
        'thinkEmoteDataUrl',
        'thinkOpponentEnabled',
        'allGoodEmoteEnabled',
        'allGoodEmoteDataUrl',
        'allGoodOpponentEnabled',
      ],
      (data) => {
        settings = { ...settings, ...data };
        updateDynamicStyles();
        sendConfigToInjected();
        scanAll();
      }
    );
  }

  chrome.storage.onChanged.addListener(() => {
    loadSettingsAndApply();
  });

  // ── Initialization ────────────────────────────────────────────
  injectMainScript();

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src'],
      });
    });
  }

  loadSettingsAndApply();
  setInterval(scanAll, 1200);

  console.log('[DB Customizer] Extension content script active.');
})();
