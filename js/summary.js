/* ============================================================
   summary.js - metadata summary rendering (JSON / Table / Grid / Custom)
   Provides: fetchMetadataValue, fetchMetadataValues, updateMetadata,
   updateSummary, renderSummary
   ============================================================ */

function fetchMetadataValue(field) {
  if(field.startsWith('civitai.') && VARIABLES.civitaiMetadata && field.substring(8) in VARIABLES.civitaiMetadata)
    return VARIABLES.civitaiMetadata[field.substring(8)];
  else if(field.startsWith('arcenciel.') && VARIABLES.arcencielMetadata && field.substring(10) in VARIABLES.arcencielMetadata)
    return VARIABLES.arcencielMetadata[field.substring(10)];
  else if(field.startsWith('custom.') && VARIABLES.customMetadata && field.substring(7) in VARIABLES.customMetadata)
    return VARIABLES.customMetadata[field.substring(7)];
  else if(field in VARIABLES.fileMetadata)
    return VARIABLES.fileMetadata[field];
  else if(UI.showUndefinedSummaryValues.checked)
    return "undefined";
  else
    return undefined;
}

function fetchMetadataValues(fields) {
  const fieldList = fields.split(',').map(value => value.trim());
  return Object.fromEntries( fieldList.map(item => [item, fetchMetadataValue(item)]) );
}

function updateMetadata(metadata) {
  if(UI.enableMetadata.checked) formatAndColorizeJSON(metadata, UI.metadataDisplay);
}

function updateSummary(metadata) {
  if(UI.enableSummary.checked){
    const summaryJson = fetchMetadataValues(UI.summaryFields.value);
    renderSummary(summaryJson);
    const spContainer = $('dashboardSuggestedPrompt');
    if(spContainer && VARIABLES.customMetadata.suggested_prompt) renderSuggestedPrompt(VARIABLES.customMetadata.suggested_prompt, spContainer);
    const twContainer = $('triggerWordsPrompt');
    if(twContainer && VARIABLES.civitaiMetadata?.trainedWords) renderSuggestedPrompt(VARIABLES.civitaiMetadata.trainedWords, twContainer);
    else if(twContainer && VARIABLES.arcencielMetadata?.versions?.[0].activationTags) renderSuggestedPrompt(VARIABLES.arcencielMetadata.versions[0].activationTags, twContainer);
  }
}

function renderSummary(summaryJson){
  //Render JSON
  formatAndColorizeJSON(summaryJson, UI.summary); //Render JSON Summary
  //Render Table
  const rows = Object.entries(summaryJson).map(([key, value]) => {
    const dataType = value === null || value === undefined || value === "undefined" ? "null" : typeof value;
    const formattedValue = dataType === 'object' ? `<pre>${colorizeJSON(value)}</pre>` : colorizeJSON(value, true);
    return `<tr><td>${key}</td><td>${formattedValue}</td></tr>`;
  });
  UI.summaryTable.innerHTML = `<table>${rows.join('')}</table>`;
  //Render Grid
  const grid = Object.entries(summaryJson).map(([key, value]) => {
    return replacePlaceholders(UI.summaryGridTemplate.innerHTML, { key, value });
  }).join('');
  UI.summaryGrid.innerHTML = `<div class="summary-grid">${grid}</div>`
  //Render Custom
  UI.summaryCustom.innerHTML = replacePlaceholders(UI.customTemplate.value, null, true, "<span class='null'>-</span>");
}
