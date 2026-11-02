# 🎴 DuelingBook Customizer

Extensión de navegador que te permite personalizar tu **avatar** (foto de perfil) y los **sleeves** (dorso de cartas) en [DuelingBook.com](https://www.duelingbook.com).

> **Nota:** Los cambios son visuales y locales — solo tú los ves en tu navegador. Tu oponente seguirá viendo tu avatar y sleeves originales.

## Funciones

- **Foto de perfil / Avatar personalizado**: reemplaza tu avatar en duelo (`#avatar1`) y en la vista de perfil sin alterar el del oponente. Soporta imágenes estáticas y GIFs animados.
- **Mis Sleeves**: cambia el dorso de todas tus cartas (Deck, Extra Deck, mano, campo, cementerio, desterradas y piedra-papel-tijera) además de la previsualización en el Deck Constructor.
- **Sleeves del oponente**: personaliza independientemente el dorso de las cartas de tu rival.
- **Emote Pensando 🤔**: reemplaza el ícono de pensamiento sobre tu avatar y en el botón inferior con tu imagen/GIF preferido. Opción de aplicarlo también al oponente.
- **Emote Like / Keep Going 👍**: reemplaza el ícono de pulgar arriba / Keep Going que aparece durante el duelo. Opción de aplicarlo también al oponente.
- **Actualización en vivo**: los cambios se reflejan de inmediato al alternar los toggles sin necesidad de recargar la página.
- **Optimización automática**: las imágenes grandes se escalan de forma inteligente para evitar consumo de memoria y mantener el juego fluido, preservando GIFs intactos.
- **Soporte Drag & Drop**: arrastra directamente cualquier imagen a las cajas de subida.

## Instalación en Chrome / Brave / Edge (modo desarrollador)

1. Abre Chrome y navega a `chrome://extensions/`
2. Activa el interruptor **Modo de desarrollador** (esquina superior derecha).
3. Haz clic en **Cargar extensión sin empaquetar**.
4. Selecciona esta carpeta: `duelingbook-customizer`.
5. Si ya la tenías cargada, simplemente pulsa el botón **Recargar (🔄)** en la tarjeta de la extensión.

## Instalación en Firefox (temporal)

1. Abre Firefox y navega a `about:debugging#/runtime/this-firefox`
2. Haz clic en **Cargar complemento temporal...**
3. Selecciona el archivo `manifest.json` dentro de esta carpeta.

## Cómo usarla

1. Entra a [duelingbook.com](https://www.duelingbook.com) e inicia sesión.
2. Haz clic en el ícono **DB** de la extensión en la barra de tu navegador.
3. Sube las imágenes que desees para tu avatar, tus sleeves y/o los del rival.
4. Activa los interruptores (toggles) correspondientes.
5. ¡Listo! Los sleeves y el avatar se aplicarán automáticamente tanto en partidas como en la construcción de mazos.

## Estructura del Proyecto

```
duelingbook-customizer/
├── manifest.json          # Manifiesto de la extensión (MV3 con unlimitedStorage)
├── icons/                 # Íconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/                 # Interfaz gráfica de configuración
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Lógica inyectada en DuelingBook
│   ├── content.js         # Script en contexto aislado (estilos CSS dinámicos y observador)
│   ├── content.css        # Estilos base
│   └── injected.js        # Script en el contexto principal (intercepción de jQuery y funciones del juego)
└── README.md
```

## Licencia

Uso personal. No afiliado a DuelingBook ni a Konami.
