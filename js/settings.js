/* ============================================================
   settings.js - localStorage persistence for .settings-field inputs
   ============================================================ */

function initSettingsStorage(){
  // Unique prefix for the app
  const appPrefix = `lmv.r2.`;

  // Retrieve values from local storage and set default values if not present
  const loadSettings = () => {
      document.querySelectorAll('.settings-field').forEach(function (element) {
          const id = element.id ? appPrefix + element.id : null;
          if (id) {
              let value = localStorage.getItem(id);
              if (value === null && DEFAULTS[element.id] !== undefined) {
                  value = typeof DEFAULTS[element.id] === 'object' ? JSON.stringify(DEFAULTS[element.id]) : DEFAULTS[element.id];
                  localStorage.setItem(id, value); // Store default value in local storage
              }
              if (value !== null) {
                  if (element.type === 'checkbox') {
                      element.checked = value === 'true';
                  } else {
                      element.value = value;
                      if(element.getAttribute('data-editable-list') !== null){
                          const listElem = $(element.getAttribute('data-editable-list'));
                          JSON.parse(value).forEach(obj => {
                              addListItem(element.getAttribute('data-editable-list'), listElem.getAttribute('data-list-template'), obj);
                          })
                      }
                      if (element.tagName.toLowerCase() === 'select')
                          element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                  }
                  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
              }
          }
      });
      updateTheme();
      UI.enableUpdateCheck.checked && checkForUpdates();
      if(location.protocol === 'http:') UI.proxyUrl.value = `${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}/?url=`;
  };

  // Save values to local storage
  const saveSettings = () => {
      document.querySelectorAll('.settings-field').forEach(function (element) {
          const id = element.id ? appPrefix + element.id : null;
          if (id) {
              let value = element.type === 'checkbox' ? element.checked : element.value;
              if(element.getAttribute('data-editable-list') !== null){
                  const objectArray = [];
                  const listElem = $(element.getAttribute('data-editable-list'));
                  listElem.querySelectorAll('.list-item').forEach(listItem => {
                      const itemObject = {};
                      listItem.querySelectorAll('[name]').forEach(inputField => {
                          itemObject[inputField.getAttribute('name')] = inputField.value;
                      });
                      objectArray.push(itemObject);
                  });
                  value = element.value = JSON.stringify(objectArray);
              }
              localStorage.setItem(id, value.toString());
          }
      });
  }

  const exportLocalStorage = () => {
      const storageData = JSON.stringify(localStorage); // Convert localStorage to JSON string
      const blob = new Blob([storageData], { type: 'application/json' }); // Create a blob
      const url = URL.createObjectURL(blob); // Create a URL for the blob
      const a = document.createElement('a'); // Create an anchor element
      a.href = url;
      a.download = 'localStorage.json'; // Set the download filename
      document.body.appendChild(a);
      a.click(); // Trigger the download
      document.body.removeChild(a); // Clean up the DOM
  }

  const importLocalStorage = (file) => {
      const reader = new FileReader();
      reader.onload = function(event) {
          const storageData = JSON.parse(event.target.result);
          for (let key in storageData) {
              if (storageData.hasOwnProperty(key)) localStorage.setItem(key, storageData[key]);
          }
      };
      reader.readAsText(file);
  }

  // Load settings when the page is opened
  window.addEventListener('load', function () {
      loadSettings();
      // Save settings when the user changes any input
      document.querySelectorAll('.settings-field').forEach(function (element) {
          element.addEventListener('input', saveSettings);
      });
  });

  UI.exportSettingsBtn.addEventListener('click', exportLocalStorage);

  UI.importSettingsBtn.addEventListener('click', () => {
    if (UI.importSettingsFile.files.length > 0) {
      importLocalStorage(UI.importSettingsFile.files[0]);
      location.reload();
    }else alert('请选择要导入的文件。');
  });

  UI.importSettingsFile.addEventListener('change', function() {
      if (UI.importSettingsFile.files.length > 0) UI.importSettingsFileName.textContent = UI.importSettingsFile.files[0].name;
      else UI.importSettingsFileName.textContent = '未选择文件';
  });

  // Clear local storage and reset defaults
  UI.clearSettingsBtn.addEventListener('click', () => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith(appPrefix))
        localStorage.removeItem(key);
    }
    location.reload();
  });
}
