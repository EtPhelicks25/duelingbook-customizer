# 🎴 DuelingBook Customizer

[Español](#-duelingbook-customizer-español) | [English](#-duelingbook-customizer-english)

---

## 🇪🇸 DuelingBook Customizer (Español)

Extensión de navegador que te permite personalizar tu **avatar** (foto de perfil), los **sleeves** (dorso de cartas) y **emotes** en [DuelingBook.com](https://www.duelingbook.com).

> **Nota:** Los cambios son visuales y locales — solo tú los ves en tu navegador. Tu oponente seguirá viendo tu avatar y sleeves originales.

### Funciones

- **Foto de perfil / Avatar personalizado**: reemplaza tu avatar en duelo (`#avatar1`) y en la vista de perfil sin alterar el del oponente. Soporta imágenes estáticas y GIFs animados.
- **Mis Sleeves**: cambia el dorso de todas tus cartas (Deck, Extra Deck, mano, campo, cementerio, desterradas y piedra-papel-tijera) además de la previsualización en el Deck Constructor.
- **Sleeves del oponente**: personaliza independientemente el dorso de las cartas de tu rival.
- **Emote Pensando 🤔**: reemplaza el ícono de pensamiento sobre tu avatar y en el botón inferior con tu imagen/GIF preferido. Opción de aplicarlo también al oponente.
- **Emote Like / Keep Going 👍**: reemplaza el ícono de pulgar arriba / Keep Going que aparece durante el duelo. Opción de aplicarlo también al oponente.
- **Actualización en vivo**: los cambios se reflejan de inmediato al alternar los toggles sin necesidad de recargar la página.
- **Optimización automática**: las imágenes grandes se escalan de forma inteligente para evitar consumo de memoria y mantener el juego fluido, preservando GIFs intactos.
- **Soporte Drag & Drop**: arrastra directamente cualquier imagen a las cajas de subida.

### Instalación en Chrome / Brave / Edge (modo desarrollador)

1. Abre Chrome y navega a `chrome://extensions/`
2. Activa el interruptor **Modo de desarrollador** (esquina superior derecha).
3. Haz clic en **Cargar extensión sin empaquetar**.
4. Selecciona la carpeta `duelingbook-customizer`.
5. Si ya la tenías cargada, simplemente pulsa el botón **Recargar (🔄)** en la tarjeta de la extensión.

### Instalación en Firefox (temporal)

1. Abre Firefox y navega a `about:debugging#/runtime/this-firefox`
2. Haz clic en **Cargar complemento temporal...**
3. Selecciona el archivo `manifest.json` dentro de esta carpeta.

### Cómo usarla

1. Entra a [duelingbook.com](https://www.duelingbook.com) e inicia sesión.
2. Haz clic en el ícono **DB** de la extensión en la barra de tu navegador.
3. Sube las imágenes que desees para tu avatar, tus sleeves y/o los del rival.
4. Activa los interruptores (toggles) correspondientes.
5. ¡Listo! Los sleeves, avatar y emotes se aplicarán automáticamente tanto en partidas como en la construcción de mazos.

---

## 🇺🇸 DuelingBook Customizer (English)

A browser extension that allows you to customize your **avatar** (profile picture), **card sleeves** (card backs), and **emotes** on [DuelingBook.com](https://www.duelingbook.com).

> **Note:** Changes are purely client-side and visual — only you see them in your browser. Your opponent will still see your original avatar and sleeves.

### Features

- **Custom Profile Picture / Avatar**: Replaces your in-duel avatar (`#avatar1`) and profile view without affecting your opponent's avatar. Supports both static images and animated GIFs.
- **My Card Sleeves**: Changes the card back for all your cards (Main Deck, Extra Deck, hand, field, graveyard, banished zone, and Rock-Paper-Scissors) as well as the Deck Constructor preview.
- **Opponent Sleeves**: Independently customize your opponent's card backs.
- **Thinking Emote 🤔**: Replaces the thinking cloud above your avatar and in the action bar with your custom image or GIF. Optionally applies to the opponent's emote as well.
- **Like / Keep Going Emote 👍**: Replaces the thumbs-up / "Keep Going!" emote that appears during duels. Optionally applies to the opponent's emote as well.
- **Live Real-Time Updates**: Changes take effect immediately when toggling switches without needing to reload the webpage.
- **Smart Image Optimization**: Oversized images are dynamically scaled down to prevent memory leaks and keep the game running smoothly, while preserving animated GIFs.
- **Drag & Drop Support**: Easily drag and drop images directly into the upload boxes.

### Installation for Chrome / Brave / Edge (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `duelingbook-customizer` folder.
5. If already installed, simply click the **Reload (🔄)** button on the extension card.

### Installation for Firefox (Temporary)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside this folder.

### How to Use

1. Go to [duelingbook.com](https://www.duelingbook.com) and log in.
2. Click the **DB** icon in your browser toolbar to open the popup.
3. Upload images for your avatar, sleeves, and/or emotes.
4. Toggle the corresponding switches ON.
5. Done! Your custom sleeves, avatar, and emotes will apply instantly in duels and in the deck builder.

---

## Estructura del Proyecto / Project Structure

```
duelingbook-customizer/
├── manifest.json          # Extension Manifest (MV3 with unlimitedStorage)
├── icons/                 # Extension Icons
│   ├── icon-master.png    # High-resolution source master icon (1024x1024)
│   ├── icon16.png         # Toolbar icon (16x16)
│   ├── icon48.png         # Extension menu & header icon (48x48)
│   └── icon128.png        # Web Store / management icon (128x128)
├── popup/                 # Popup UI
│   ├── popup.html         # Popup markup
│   ├── popup.css          # Dark-themed styling
│   └── popup.js           # Settings manager & image processor
├── content/               # Injected scripts for DuelingBook
│   ├── content.js         # Isolated content script (dynamic CSS & DOM observer)
│   ├── content.css        # Base injected styles
│   └── injected.js        # Main-world script (game hook & sleeve/emote interceptor)
├── generate-icons.js      # Script to generate icons
├── resize-icons.ps1       # PowerShell icon resize utility using System.Drawing
└── README.md              # Documentation (Bilingual: ES / EN)
```

## Licencia / License

Uso personal / Personal use. Not affiliated with DuelingBook or Konami.
