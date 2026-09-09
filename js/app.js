/* ============================================================
   app.js - main entry point: UI references, initialization,
   file handling, loading state, and app-level actions
   ============================================================ */

const UI = {
  appVersion: $('appVersion'),
  favicon: $('favicon'),
  dropArea: $('dropArea'),
  metadataDisplay: $('metadataDisplay'),
  metadataEditor: $('metadataEditor'),
  metadataEditorSimple: $('metadataEditorSimple'),
  summary: $('summary'),
  summaryTable: $('summaryTable'),
  summaryGrid: $('summaryGrid'),
  summaryGridTemplate: $('summaryGridTemplate'),
  summaryCustom: $('summaryCustom'),
  modelUrl: $('modelUrl'),
  resourceUrl: $('resourceUrl'),
  onlineLookupData: $('onlineLookupData'),
  previewImage: $('previewImage'),
  keywordDetails: $('keywordDetails'),
  suggestedPromptDetails: $('suggestedPromptDetails'),
  notificationPanel: $('notificationPanel'),
  editorNotificationPanel: $('editorNotificationPanel'),
  editorHeader: $('editorHeader'),

  summaryFields: $('summaryFields'),
  editorFields: $('editorFields'),
  editorFormat: $('editorFormat'),
  showUndefinedSummaryValues: $('showUndefinedSummaryValues'),
  customFields: $('customFields'),
  customTemplate: $('customTemplate'),
  enableSummary: $('enableSummary'),
  enableOnlineLookup: $('enableOnlineLookup'),
  enableProxy: $('enableProxy'),
  primaryLookup: $('primaryLookup'),
  secondaryLookup: $('secondaryLookup'),
  enableTagFrequency: $('enableTagFrequency'),
  enableSuggestedPrompt: $('enableSuggestedPrompt'),
  tagFrequencyCount: $('tagFrequencyCount'),
  tagFrequencyFilter: $('tagFrequencyFilter'),
  tagFrequencyFilterVld: $('tagFrequencyFilterVld'),
  tagFrequencyFilterMethod: $('tagFrequencyFilterMethod'),
  tagByFolder: $('tagByFolder'),
  tagExcludeFilter: $('tagExcludeFilter'),
  tagExcludeFilterMethod: $('tagExcludeFilterMethod'),
  tagExcludeFilterVld: $('tagExcludeFilterVld'),
  suggestedPromptCount: $('suggestedPromptCount'),
  suggestedPromptFilter: $('suggestedPromptFilter'),
  suggestedPromptFilterVld: $('suggestedPromptFilterVld'),
  suggestedPromptFilterMethod: $('suggestedPromptFilterMethod'),
  suggestedPromptByFolder: $('suggestedPromptByFolder'),
  suggestedPromptExcludeFilter: $('suggestedPromptExcludeFilter'),
  suggestedPromptExcludeFilterMethod: $('suggestedPromptExcludeFilterMethod'),
  suggestedPromptExcludeFilterVld: $('suggestedPromptExcludeFilterVld'),

  enableMetadata: $('enableMetadata'),
  enableMetadataEditor: $('enableMetadataEditor'),
  enableUpdateCheck: $('enableUpdateCheck'),
  themeSelect: $('themeSelect'),
  themeColorSelect: $('themeColorSelect'),
  themeColorPicker: $('themeColorPicker'),
  themeBgColorSelect: $('themeBgColorSelect'),
  themeBgColorPicker: $('themeBgColorPicker'),
  themeInputColorSelect: $('themeInputColorSelect'),
  themeInputColorPicker: $('themeInputColorPicker'),
  themeFont: $('themeFont'),
  themeFontColorSelect: $('themeFontColorSelect'),
  themeFontColorPicker: $('themeFontColorPicker'),
  proxyUrl: $('proxyUrl'),
  proxyScript: $('proxyScript'),
  clearSettingsBtn: $('clearSettingsBtn'),
  exportSettingsBtn: $('exportSettingsBtn'),
  importSettingsBtn: $('importSettingsBtn'),
  importSettingsFile: $('importSettingsFile'),
  importSettingsFileName: $('importSettingsFileName'),

  downloadBtn: $('downloadBtn'),
  purgeBtn: $('purgeBtn'),

  loading: $('loading'),
  loadingMessage: document.querySelector('.loading-message'),
  progressBar: document.querySelector('.progress-bar'),
  progressText: document.querySelector('.progress-text'),
  abortBtn: document.querySelector('.abort')
};

// Expose VARIABLES (and its properties) as globals so the eval'd
// custom-field expressions can reference fileMetadata, customMetadata, etc.
function setGlobalVariables(variable) {
  for (const key in variable) {
    Object.defineProperty(window, key, {
      get() { return variable[key]; },
      set(value) { variable[key] = value; },
      configurable: true
    });
  }
}

function init() {
  setGlobalVariables(VARIABLES);
  updateTheme();
  initDropArea();
  initSelectToggle();
  initSettingsStorage();
  initCollapsible();
  initTabs();
  initEditor();

  [UI.themeSelect, UI.themeColorSelect, UI.themeBgColorSelect, UI.themeInputColorSelect, UI.themeFont, UI.themeFontColorSelect].forEach(e => { e.addEventListener('change', updateTheme); });
  [UI.themeColorPicker, UI.themeBgColorPicker, UI.themeInputColorPicker, UI.themeFontColorPicker].forEach(e => { e.addEventListener('input', updateTheme); });
  [UI.tagFrequencyCount, UI.tagFrequencyFilter, UI.tagExcludeFilter, UI.tagExcludeFilterMethod, UI.tagFrequencyFilterMethod].forEach(e => { e.addEventListener('change', updateTagFrequency); });
  UI.tagByFolder.addEventListener('click', updateTagFrequency);
  [UI.suggestedPromptCount, UI.suggestedPromptFilter, UI.suggestedPromptExcludeFilter, UI.suggestedPromptExcludeFilterMethod, UI.suggestedPromptFilterMethod].forEach(e => { e.addEventListener('change', () => { updateTagFrequency(null, true); }); });
  UI.suggestedPromptByFolder.addEventListener('click', () => { updateTagFrequency(null, true); });
  UI.editorFormat.addEventListener('change', updateEditorFields);
  updateProxyScript();
  document.head.insertAdjacentHTML('beforeend', `<style>.doro-theme *{cursor:url("${UI.favicon.href}") 4 4,auto;}</style>`);
  window.addEventListener("load", () => document.body.appendChild(Object.assign(document.createElement("script"), { src: "https://xypher7.github.io/Doro.js/doro.js" })));
}

function initSelectToggle() {
  document.querySelectorAll('select[data-select-toggle]').forEach(select => {
    select.addEventListener('change', () => {
      document.querySelectorAll(`[data-toggle-target="${select.id}"]`).forEach(element => {
        element.style.display = select.value === element.getAttribute('data-toggle-value') ? 'block' : 'none';
      });
    });
    select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  });
}

function initDropArea() {
  const highlight = () => { UI.dropArea.classList.add('hover'); };
  const unhighlight = () => { UI.dropArea.classList.remove('hover'); };
  const handleDrop = (event) => {
    handleFile(event.dataTransfer.files[0]);
    UI.dropArea.classList.remove('hover');
  };
  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    UI.dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when a file is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    UI.dropArea.addEventListener(eventName, highlight, false);
  });

  // Remove highlighting when a file is dragged away from the drop area
  ['dragleave', 'drop'].forEach(eventName => {
    UI.dropArea.addEventListener(eventName, unhighlight, false);
  });

  UI.dropArea.addEventListener('drop', handleDrop, false);
  UI.dropArea.addEventListener('mouseover', highlight);
  UI.dropArea.addEventListener('mouseout', unhighlight);

  // File input handling
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.style.display = 'none';
  fileInput.accept = '.safetensors,.gguf';
  document.body.appendChild(fileInput);

  UI.dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files[0]);
  });
}

function initCollapsible() {
  document.querySelectorAll('.collapsible').forEach((collapsible) => {
    collapsible.addEventListener('click', function () {
      this.classList.toggle('active');
      const targetSelector = this.getAttribute('data-target');
      const content = !targetSelector ? this.nextElementSibling : $(targetSelector);
      if (content.style.display === 'block') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    });
    const targetSelector = collapsible.getAttribute('data-target');
    if (!!targetSelector) {
      const content = $(targetSelector);
      content.classList.add('content');
    }
    if (collapsible.classList.contains('expanded')) collapsible.click();
  });

  const toggleDisplay = e => {
    const targetId = e.getAttribute('data-display');
    const targetElement = $(targetId);
    if (targetElement) {
      targetElement.style.display = e.checked ? 'block' : 'none';
    }
  };

  // Panel display toggle
  document.querySelectorAll('input[type="checkbox"][data-display]').forEach(function (checkbox) {
    checkbox.addEventListener('click', function () { toggleDisplay(this); });
    window.addEventListener('load', () => { toggleDisplay(checkbox); });
  });
}

function initTabs() {
  document.querySelectorAll(".tab-container").forEach(container => {
    const tablinks = container.querySelectorAll("[data-target-tab]");
    tablinks.forEach(button => { // Loop through each tab button and add a click event listener
      button.addEventListener("click", () => {
        container.querySelectorAll(".tabcontent").forEach(tab => { tab.style.display = "none"; }); // Hide all tab content within this tab container
        tablinks.forEach(tab => { tab.classList.remove("active"); }); // Remove "active" class from all tab buttons within this tab container
        const targetTabId = button.getAttribute("data-target-tab");
        container.querySelector("#" + targetTabId).style.display = "block"; // Show the selected tab content within this tab container
        button.classList.add("active"); // Add "active" class to the clicked tab button within this tab container
      });
    });
    // Set the default tab to be opened within this tab container
    container.querySelector(".tabcontent").style.display = "block";
    container.querySelector("[data-target-tab]").classList.add("active");
  });
}

async function handleFile(file) {
  clearAll();
  VARIABLES.safetensorsFile = file;
  if (file.name.endsWith('.gguf')) {
    calculateFileHashes(file);
    updateOnlineLookupInfo();
    setCustomMetadata();
    return;
  }
  if (!file.name.endsWith('.safetensors')) {
    showToast('Please drop a valid .safetensors file.', null, 'error');
    return;
  }
  try {
    const { metadata, formattedMetadata } = await parseSafetensors(file);
    if (!formattedMetadata) {
      showToast('No metadata found', null, 'warning');
    }
    VARIABLES.fileMetadata = metadata;
    updateMetadataEditor(formattedMetadata);
    setCustomMetadata();
    updateMetadata(metadata);
    updateTagFrequency(metadata);
    updateTagFrequency(metadata, true);
    updateSummary(metadata);
    await calculateFileHashes(file);
    updateOnlineLookupInfo();
  } catch (error) {
    showToast(`Error parsing metadata:<br>${error}`, null, 'error');
    console.error('Error reading file:', error);
  }
}

function abort() {
  if (VARIABLES.abortController) VARIABLES.abortController.abort();
}

/* ---- UI rendering / loading state ---- */

function clearAll() {
  UI.notificationPanel.innerHTML = '';
  UI.editorNotificationPanel.innerHTML = '';
  UI.summary.innerHTML = '';
  UI.summaryTable.innerHTML = '';
  UI.summaryGrid.innerHTML = '';
  UI.summaryCustom.innerHTML = '';
  UI.modelUrl.href = '#';
  UI.modelUrl.innerHTML = '';
  UI.resourceUrl.href = '#';
  UI.resourceUrl.innerHTML = '';
  UI.previewImage.innerHTML = '';
  UI.onlineLookupData.innerHTML = '';
  UI.keywordDetails.innerHTML = '';
  UI.metadataDisplay.innerHTML = '';
  UI.metadataEditor.value = '';
  UI.editorHeader.style.display = "none";

  VARIABLES.fileMetadata = {};
  VARIABLES.civitaiMetadata = {};
  VARIABLES.arcencielMetadata = {};
  VARIABLES.customMetadata = {};
  VARIABLES.basemodelMetadata = {};
  VARIABLES.vaeMetadata = {};
  VARIABLES.safetensorsFile = null;
}

function showLoading(message = null, allowCancel = false) {
  if (allowCancel) {
    VARIABLES.abortController = new AbortController();
    UI.abortBtn.style.display = 'inline';
  }
  UI.loading.style.display = 'block';
  updateLoading(message, 0);
}

function hideLoading() {
  UI.loading.style.display = 'none';
  UI.abortBtn.style.display = 'none';
}

function updateLoading(message, progress) {
  updateLoadingMessage(message);
  updateProgress(progress);
}

function updateLoadingMessage(message) {
  if (message !== null) UI.loadingMessage.innerHTML = message;
}

function updateProgress(progress) {
  if (progress || progress === 0) {
    UI.progressBar.style.width = `${progress}%`;
    UI.progressText.textContent = `${progress}%`;
  }
}

async function checkForUpdates() {
  const normalizeVersion = (v) => { return v.replace(/^v/, '').split('.').map(Number).concat([0, 0, 0]).slice(0, 3); };

  const compareVersions = (a, b) => {
    const [a1, a2, a3] = normalizeVersion(a);
    const [b1, b2, b3] = normalizeVersion(b);
    if (a1 !== b1) return a1 - b1;
    if (a2 !== b2) return a2 - b2;
    return a3 - b3;
  };

  try {
    const response = await fetch('https://api.github.com/repos/Xypher7/lora-metadata-viewer/tags');
    const tags = await response.json();
    const versions = tags.map(tag => tag.name).sort((a, b) => compareVersions(b, a));
    const isLatest = compareVersions(UI.appVersion.innerHTML, versions[0]) >= 0;
    const latest = versions[0];
    if (!isLatest) showToast(`New version available: <a href="https://github.com/Xypher7/lora-metadata-viewer" target='_blank'>${latest}</a>`, null, 'none');
  } catch (error) {
    // Update check is best-effort; ignore network failures silently
  }
}

// Boot the app
init();
