/**
 * popup.js — Manages the popup UI for DuelingBook Customizer.
 */

document.addEventListener('DOMContentLoaded', () => {
  const profilePicIdInput = document.getElementById('profilePicId');
  const detectBtn = document.getElementById('detectBtn');
  const thinkOpponentCheckbox = document.getElementById('thinkOpponentEnabled');
  const allGoodOpponentCheckbox = document.getElementById('allGoodOpponentEnabled');

  const fields = [
    {
      key: 'avatar',
      toggle: document.getElementById('avatarEnabled'),
      uploadArea: document.getElementById('avatarUploadArea'),
      fileInput: document.getElementById('avatarFile'),
      preview: document.getElementById('avatarPreview'),
      placeholder: document.getElementById('avatarPlaceholder'),
      clearBtn: document.getElementById('avatarClear'),
    },
    {
      key: 'mySleeves',
      toggle: document.getElementById('mySleevesEnabled'),
      uploadArea: document.getElementById('mySleevesUploadArea'),
      fileInput: document.getElementById('mySleevesFile'),
      preview: document.getElementById('mySleevesPreview'),
      placeholder: document.getElementById('mySleevesPlaceholder'),
      clearBtn: document.getElementById('mySleevesClear'),
    },
    {
      key: 'oppSleeves',
      toggle: document.getElementById('oppSleevesEnabled'),
      uploadArea: document.getElementById('oppSleevesUploadArea'),
      fileInput: document.getElementById('oppSleevesFile'),
      preview: document.getElementById('oppSleevesPreview'),
      placeholder: document.getElementById('oppSleevesPlaceholder'),
      clearBtn: document.getElementById('oppSleevesClear'),
    },
    {
      key: 'thinkEmote',
      toggle: document.getElementById('thinkEmoteEnabled'),
      uploadArea: document.getElementById('thinkEmoteUploadArea'),
      fileInput: document.getElementById('thinkEmoteFile'),
      preview: document.getElementById('thinkEmotePreview'),
      placeholder: document.getElementById('thinkEmotePlaceholder'),
      clearBtn: document.getElementById('thinkEmoteClear'),
    },
    {
      key: 'allGoodEmote',
      toggle: document.getElementById('allGoodEmoteEnabled'),
      uploadArea: document.getElementById('allGoodEmoteUploadArea'),
      fileInput: document.getElementById('allGoodEmoteFile'),
      preview: document.getElementById('allGoodEmotePreview'),
      placeholder: document.getElementById('allGoodEmotePlaceholder'),
      clearBtn: document.getElementById('allGoodEmoteClear'),
    },
  ];

  // ── Load Saved State ──────────────────────────────────────────
  const storageKeys = [
    'profilePicId',
    'thinkOpponentEnabled',
    'allGoodOpponentEnabled',
  ];
  fields.forEach((f) => {
    storageKeys.push(`${f.key}Enabled`, `${f.key}DataUrl`);
  });

  chrome.storage.local.get(storageKeys, (data) => {
    if (data.profilePicId) {
      profilePicIdInput.value = data.profilePicId;
    }

    if (thinkOpponentCheckbox) {
      thinkOpponentCheckbox.checked = !!data.thinkOpponentEnabled;
    }

    if (allGoodOpponentCheckbox) {
      allGoodOpponentCheckbox.checked = !!data.allGoodOpponentEnabled;
    }

    fields.forEach((f) => {
      f.toggle.checked = !!data[`${f.key}Enabled`];
      const dataUrl = data[`${f.key}DataUrl`];
      if (dataUrl) {
        showPreview(f, dataUrl);
      }
    });
  });

  // ── Emote Opponent Checkboxes ─────────────────────────────────
  if (thinkOpponentCheckbox) {
    thinkOpponentCheckbox.addEventListener('change', () => {
      chrome.storage.local.set({ thinkOpponentEnabled: thinkOpponentCheckbox.checked });
      notifyContentScript();
    });
  }

  if (allGoodOpponentCheckbox) {
    allGoodOpponentCheckbox.addEventListener('change', () => {
      chrome.storage.local.set({ allGoodOpponentEnabled: allGoodOpponentCheckbox.checked });
      notifyContentScript();
    });
  }

  // ── Profile Pic ID (Optional) ─────────────────────────────────
  profilePicIdInput.addEventListener('input', () => {
    let value = profilePicIdInput.value.trim();
    const match = value.match(/(\d+)/);
    if (match) {
      value = match[1];
    }
    chrome.storage.local.set({ profilePicId: value });
    notifyContentScript();
  });

  // ── Auto-Detect Button ────────────────────────────────────────
  detectBtn.addEventListener('click', () => {
    detectBtn.textContent = '⏳';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes('duelingbook.com')) {
        detectBtn.textContent = '❌';
        setTimeout(() => {
          detectBtn.textContent = '🔍';
        }, 1500);
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'DB_CUSTOMIZER_DETECT_PROFILE' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.profilePicId) {
          detectBtn.textContent = '⚠️';
          setTimeout(() => {
            detectBtn.textContent = '🔍';
          }, 1500);
          return;
        }

        const detectedId = response.profilePicId;
        profilePicIdInput.value = detectedId;
        chrome.storage.local.set({ profilePicId: detectedId });
        notifyContentScript();

        detectBtn.textContent = '✅';
        setTimeout(() => {
          detectBtn.textContent = '🔍';
        }, 1500);
      });
    });
  });

  // ── Upload & Drag & Drop Handling ─────────────────────────────
  fields.forEach((f) => {
    f.toggle.addEventListener('change', () => {
      chrome.storage.local.set({ [`${f.key}Enabled`]: f.toggle.checked });
      notifyContentScript();
    });

    f.uploadArea.addEventListener('click', () => f.fileInput.click());

    f.fileInput.addEventListener('change', () => {
      if (f.fileInput.files.length > 0) {
        processAndStoreFile(f, f.fileInput.files[0]);
      }
    });

    f.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      f.uploadArea.classList.add('dragover');
    });

    f.uploadArea.addEventListener('dragleave', () => {
      f.uploadArea.classList.remove('dragover');
    });

    f.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      f.uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        processAndStoreFile(f, e.dataTransfer.files[0]);
      }
    });

    f.clearBtn.addEventListener('click', () => {
      chrome.storage.local.remove([`${f.key}DataUrl`, `${f.key}Enabled`]);
      f.toggle.checked = false;
      f.preview.src = '';
      f.preview.classList.add('hidden');
      f.placeholder.classList.remove('hidden');
      notifyContentScript();
    });
  });

  // ── Image Processing (Optimized for performance & GIFs) ───────
  function processAndStoreFile(field, file) {
    if (!file || !file.type.startsWith('image/')) return;

    // Preserve animated GIFs as-is
    if (file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => saveImage(field, reader.result);
      reader.readAsDataURL(file);
      return;
    }

    // For static images, resize if overly large to prevent memory overhead
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let w = img.width;
        let h = img.height;

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          saveImage(field, canvas.toDataURL('image/png', 0.92));
        } else {
          saveImage(field, reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function saveImage(field, dataUrl) {
    chrome.storage.local.set(
      {
        [`${field.key}DataUrl`]: dataUrl,
        [`${field.key}Enabled`]: true,
      },
      () => {
        showPreview(field, dataUrl);
        field.toggle.checked = true;
        notifyContentScript();
      }
    );
  }

  function showPreview(field, dataUrl) {
    field.preview.src = dataUrl;
    field.preview.classList.remove('hidden');
    field.placeholder.classList.add('hidden');
  }

  function notifyContentScript() {
    chrome.tabs.query({ url: '*://*.duelingbook.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: 'DB_CUSTOMIZER_UPDATE' }).catch(() => {});
      });
    });
  }
});
