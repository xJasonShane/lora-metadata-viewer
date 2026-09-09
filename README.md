# LoRA Metadata Viewer/Editor

Pure HTML/JS tool for viewing and editing LoRA metadata locally on your web browser without the need of installation or internet connectivity.

## Usage
No need for prior setup, just open `index.html` with the web browser of your choice and drag a Safetensors file. Alternatively, you can use the version hosted on GitHub through the link provided in the demo section.

## Demo
https://xypher7.github.io/lora-metadata-viewer

## Features
- Configurable metadata summary
- CivitAI resource lookup. (Requires internet connection)
- Configurable training tag summary
- Edit or remove metadata in the Safetensors file
- Doro :3

## Structure
The tool is split into small modules under the `js/` and `css/` directories and loaded by `index.html`:

| File | Responsibility |
|------|----------------|
| `css/main.css` | Design system, themes, responsive layout |
| `js/config.js` | Global constants and initial state |
| `js/utils.js` | Shared helpers (toasts, JSON colorizing, clipboard) |
| `js/theme.js` | Theme switching (light/dark/custom colors) |
| `js/settings.js` | LocalStorage settings persistence |
| `js/hashing.js` | SHA-256 hashing (AutoV2/AutoV3) |
| `js/safetensors.js` | Safetensors parsing and file rewriting |
| `js/lookup.js` | CivitAI / Arc En Ciel online lookup |
| `js/tags.js` | Training tag frequency analysis |
| `js/summary.js` | Metadata summary rendering |
| `js/editor.js` | Metadata editor and download |
| `js/app.js` | Application entry point and wiring |

## Offline Execution
All file processing is done entirely in the browser and works offline, including hash calculation for files of any size (SHA-256 is implemented in pure JavaScript with chunked reading, so no external library is required). The following features require an internet connection and will not work offline:
- CivitAI / Arc En Ciel data lookup
- Automatic update check

## Screenshots
![App Screenshot](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5c3b0f97-d7ff-4c7a-b9c5-d5f176544151/original=true,quality=90/Screenshot%202025-10-01%20195536.jpeg)
