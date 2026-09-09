/* ============================================================
   editor.js - metadata editor (simple/manual), custom fields,
   file download/rewrite, proxy script helpers
   Provides: updateMetadataEditor, updateEditorFields, initEditor,
   addListItem, removeListItem, downloadFile, setCustomMetadata,
   updateProxyScript, downloadProxyScript
   ============================================================ */

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateMetadataEditor(metadata) {
  if(UI.enableMetadataEditor.checked) {
    UI.metadataEditor.value = metadata ? JSON.stringify(metadata, null, 2) : '';
    UI.editorHeader.style.display = "";
    UI.editorHeader.classList.remove('dirty');
    updateEditorFields();
  }
}

function updateEditorFields() {
  if(UI.editorFormat.value!=='simple') return;
  const container = UI.metadataEditorSimple;
  container.innerHTML = '';
  if(!UI.editorFields.value || !UI.metadataEditor.value) return;
  const fieldNames = UI.editorFields.value.split(',').map(field => field.trim());
  let metadata = JSON.parse(UI.metadataEditor.value) || {};
  let htmlContent = '';
  const idPrefix = 'editor_';
  fieldNames.forEach(fieldName => {
      const value = metadata[fieldName] || '';
      htmlContent += `<tr>
          <td><label for="${idPrefix}${fieldName}">${fieldName}: </label></td>
          <td><input type="text" id="${idPrefix}${fieldName}" name="${fieldName}" value="${escapeHtml(value)}"></td>
          </tr>`;
  });
  container.innerHTML = htmlContent;
  fieldNames.forEach(fieldName => {
      $(idPrefix+fieldName).addEventListener('change', function(event) {
        let metadata = JSON.parse(UI.metadataEditor.value) || {};
        metadata[fieldName] = event.target.value;
        UI.metadataEditor.value = JSON.stringify(metadata, null, 2);
        UI.editorHeader.classList.add('dirty');
      });
  });
}

function addListItem(listId, itemTemplateId, data=null) {
  const template = $(itemTemplateId).innerHTML;
  const html = data===null ? template.replace(/\{\{.*?\}\}/g, '') : replacePlaceholders(template, data, false);
  $(listId).insertAdjacentHTML('beforeend', html);
}

function removeListItem(button) {
  let currentElement = button;
  while (currentElement) {
      if (currentElement.classList.contains('list-item'))
          currentElement.remove();
      currentElement = currentElement.parentNode;
  }
}

function setEditorBusy(busy) {
  [UI.downloadBtn, UI.purgeBtn].forEach(btn => { if (btn) btn.disabled = busy; });
}

async function downloadFile(purge) {
  UI.editorNotificationPanel.innerHTML = '';
  let newMetadata;
  try {
    newMetadata = UI.metadataEditor.value && !purge ? JSON.parse(UI.metadataEditor.value) : {};
    const validateJsonString = (obj, name) => {
      try{
        obj && typeof obj === 'string' && JSON.parse(obj);
      }catch(e){
        showToast(`Error parsing edited metadata field '${name}'. Ensure the field value is a valid JSON string and try again.`, null, 'error');
        throw e;
      }
    };
    !purge && ['ss_dataset_dirs', 'ss_bucket_info', 'ss_tag_frequency'].forEach((f) => { validateJsonString(newMetadata[f], f); });
  } catch (e) {
    showToast('Error parsing edited metadata. Ensure the metadata is in valid JSON format and try again.', null, 'error');
    return;
  }
  try {
    setEditorBusy(true);
    const newFileBlob = await buildUpdatedSafetensorsBlob(VARIABLES.safetensorsFile, newMetadata);
    const url = URL.createObjectURL(newFileBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = VARIABLES.safetensorsFile.name.replace(/(\.[^.]+)$/, `_${purge ? "purged" : "edited"}$1`);
    downloadLink.click();
    URL.revokeObjectURL(url);
    showToast(`Metadata ${purge ? "purged" : "updated"} successfully!`, null, 'success');
  } catch (error) {
    showToast(`An error occured while updating the file:<br>${error}`, null, 'error');
    console.error(error);
  } finally {
    setEditorBusy(false);
  }
}

function initEditor() {
  // Highlight the editor header while there are unsaved changes
  UI.metadataEditor.addEventListener('input', () => {
    UI.editorHeader.classList.add('dirty');
  });
  UI.downloadBtn.addEventListener('click', () => downloadFile(false));
  UI.purgeBtn.addEventListener('click', () => downloadFile(true));
}

function setCustomMetadata(){
  try {
      const objArray = JSON.parse(UI.customFields.value);
      if (Array.isArray(objArray) && objArray.length > 0) {
          const evaluatedObj = objArray.reduce((acc, obj) => {
              if (typeof obj === 'object' && 'label' in obj && 'calc' in obj && typeof obj.calc === 'string') {
                  try{
                    acc[obj.label] = eval(obj.calc);
                  }
                  catch(e) {
                    if(obj.showError){
                      console.warn(`Error evaluating expression for custom field "${obj.label}".`, obj, e);
                      showToast(`Error evaluating expression for custom field "${obj.label}":<br>${e.message}`, null, 'error');
                    }
                  }
                  VARIABLES.customMetadata[obj.label] = acc[obj.label];
              } else {
                  console.error('Invalid object format or missing fields:', obj);
              }
              return acc;
          }, {});
          return evaluatedObj;
      } else {
          throw new Error('Invalid JSON format or empty array.');
      }
  } catch (error) {
      console.error('Error evaluating expressions:', error.message);
      return null;
  }
}

function updateProxyScript() {
  const path = decodeURIComponent(window.location.pathname);
  const file = path.substring(path.lastIndexOf('/') + 1);
  if(file) UI.proxyScript.innerText = UI.proxyScript.innerText.replace('index.html', file);
}

function downloadProxyScript() {
  const blob = new Blob([UI.proxyScript.innerText], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'proxy.py';
  a.click();
  URL.revokeObjectURL(url);
}
