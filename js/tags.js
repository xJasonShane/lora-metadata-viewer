/* ============================================================
   tags.js - tag frequency analysis & suggested prompt rendering
   Provides: tagTools, updateTagFrequency, renderSuggestedPrompt
   ============================================================ */

const tagTools = {
    aggregateAndSort: (originalObject) => {
      return Object.fromEntries(
          Object.entries(
              Object.values(originalObject).reduce((acc, subObject) => {
                  for (const [key, value] of Object.entries(subObject)) {
                      acc[key] = (acc[key] || 0) + value;
                  }
                  return acc;
              }, {})
          ).sort(([, a], [, b]) => b - a));
    },
    sortSubproperties: (originalObject) => {
        return Object.fromEntries(
            Object.entries(originalObject).map(([key, subObject]) => [
                key,
                Object.fromEntries(
                    Object.entries(subObject).sort(([, a], [, b]) => b - a)
                ),
            ])
        );
    },
    convertNumericKeysToString: (originalObject) => {
        const convertedObject = {};
        for (const [key, value] of Object.entries(originalObject)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const nestedObject = {};
                for (const [subKey, subValue] of Object.entries(value)) {
                    const newSubKey = !isNaN(subKey) ? `(${subKey})` : subKey;
                    nestedObject[newSubKey] = subValue;
                }
                convertedObject[key] = nestedObject;
            } else {
                convertedObject[key] = value;
            }
        }
        return convertedObject;
    },
    filterTopN: (obj, n) => {
        const topNEntries = Object.entries(obj).slice(0, n);
        return Object.fromEntries(topNEntries);
    },
    filterByTag: (obj, regex) => {
        const filteredObj = {};
        const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
        for (const key in obj) {
            if (obj.hasOwnProperty(key))
                if (pattern.test(key) || (typeof obj[key] === 'string' && pattern.test(obj[key])))
                    filteredObj[key] = obj[key];
        }
        return filteredObj;
    },
    removeTags: (obj, regex) => {
        const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
        Object.keys(obj).forEach(property => {
            if (pattern.test(property)) delete obj[property];
        });
        return obj;
    },
    isValidRegex: (regexString) => {
        try {
            new RegExp(regexString);
            return true;
        } catch (e) {
            return false;
        }
    },
    applyFiltersToSubproperties: (obj, filterFunction, ...args) => {
        const filteredObject = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) filteredObject[key] = filterFunction(obj[key], ...args);
        }
        return filteredObject;
    },
    listToRegex: (listString, exactMatch = false) => {
        const valuesArray = listString.split(',').map(value => value.trim());
        const escapedValues = valuesArray.map(value => value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')); // Escape special regex characters in each value
        const pattern = exactMatch
            ? `^(${escapedValues.join('|')})$`  // Exact match: ^value1$|^value2$|...
            : `(${escapedValues.join('|')})`;   // Partial match: value1|value2|...
        return new RegExp(pattern);
    },
    getSuggestedPrompt: (tags) => {
      if(!tags) return;
      const keys = Object.keys(tags);
      const prompts = {};
      if(typeof tags[keys[0]] !== 'object')
        prompts.提示词 = Object.keys(tags).join(', ');
      else
        for (let property in tags)
          if (tags.hasOwnProperty(property))
            prompts[property] = Object.keys(tags[property]).join(', ');
      return prompts;
    }
}

// Deep-clone helper (structuredClone when available, JSON fallback)
function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(obj); } catch (e) { /* fall through */ }
  }
  return JSON.parse(JSON.stringify(obj));
}

function updateTagFrequency(data, suggestedPrompt=false){
  try {
    if((!UI.enableTagFrequency.checked && !UI.enableSuggestedPrompt.checked) || (!data?.['ss_tag_frequency'] && !VARIABLES.customMetadata.tags)) return;
    if(data?.['ss_tag_frequency']){
      const tags = tagTools.convertNumericKeysToString(data['ss_tag_frequency']);
      VARIABLES.customMetadata.tags = tagTools.aggregateAndSort(tags);
      VARIABLES.customMetadata.tagsByFolder = tagTools.sortSubproperties(tags);
    }
    const filterMethod = !suggestedPrompt ? UI.tagFrequencyFilterMethod : UI.suggestedPromptFilterMethod;
    const filter = !suggestedPrompt ? UI.tagFrequencyFilter : UI.suggestedPromptFilter;
    const excludeFilterMethod = !suggestedPrompt ? UI.tagExcludeFilterMethod : UI.suggestedPromptExcludeFilterMethod;
    const excludeFilter = !suggestedPrompt ? UI.tagExcludeFilter : UI.suggestedPromptExcludeFilter;
    const filterVld = !suggestedPrompt ? UI.tagFrequencyFilterVld : UI.suggestedPromptFilterVld;
    const excludeFilterVld = !suggestedPrompt ? UI.tagExcludeFilterVld : UI.suggestedPromptExcludeFilterVld;
    const tagCount = !suggestedPrompt ? UI.tagFrequencyCount : UI.suggestedPromptCount;
    const byFolder = !suggestedPrompt ? UI.tagByFolder : UI.suggestedPromptByFolder;
    let filteredResult;
    let includeRegex;
    switch (filterMethod.value) {
      case 'regex': includeRegex = filter.value; break;
      case 'exact': includeRegex = tagTools.listToRegex(filter.value, true); break;
      case 'partial': includeRegex = tagTools.listToRegex(filter.value); break;
    }
    let excludeRegex;
    switch (excludeFilterMethod.value) {
      case 'regex': excludeRegex = excludeFilter.value; break;
      case 'exact': excludeRegex = tagTools.listToRegex(excludeFilter.value, true); break;
      case 'partial': excludeRegex = tagTools.listToRegex(excludeFilter.value); break;
    }
    filterVld.innerHTML = !tagTools.isValidRegex(includeRegex) ? '正则表达式无效！' : '';
    excludeFilterVld.innerHTML = !tagTools.isValidRegex(excludeRegex) ? '正则表达式无效！' : '';
    if(!tagTools.isValidRegex(includeRegex)) includeRegex = '';
    if(!tagTools.isValidRegex(excludeRegex)) excludeRegex = '';
    if(byFolder.checked) {
      filteredResult = deepClone(VARIABLES.customMetadata.tagsByFolder);
      if(includeRegex) filteredResult = tagTools.applyFiltersToSubproperties(filteredResult, tagTools.filterByTag, includeRegex);
      if(excludeRegex) filteredResult = tagTools.applyFiltersToSubproperties(filteredResult, tagTools.removeTags, excludeRegex);
      if(tagCount.value && parseInt(tagCount.value)>0) filteredResult = tagTools.applyFiltersToSubproperties(filteredResult, tagTools.filterTopN, tagCount.value);
    }else{
      filteredResult = deepClone(VARIABLES.customMetadata.tags);
      if(includeRegex) filteredResult = tagTools.filterByTag(filteredResult, includeRegex);
      if(excludeRegex) filteredResult = tagTools.removeTags(filteredResult, excludeRegex);
      if(tagCount.value && parseInt(tagCount.value)>0) filteredResult = tagTools.filterTopN(filteredResult, tagCount.value);
    }
    if(!suggestedPrompt) formatAndColorizeJSON(filteredResult, UI.keywordDetails);
    else {
      let prompt = tagTools.getSuggestedPrompt(filteredResult);
      if(!byFolder.checked) prompt = [prompt.Prompt];
      renderSuggestedPrompt(prompt, UI.suggestedPromptDetails);
      VARIABLES.customMetadata.suggested_prompt = prompt;
      const spContainer = $('dashboardSuggestedPrompt');
      if(spContainer && VARIABLES.customMetadata.suggested_prompt) renderSuggestedPrompt(VARIABLES.customMetadata.suggested_prompt, spContainer);
    }
  } catch (error) { console.error(error); }
}

function renderSuggestedPrompt(prompt, targetElem) {
    const addRow = (table, key, value) => {
        const row = document.createElement('tr');
        if (key !== null) {
            const keyCell = document.createElement('td');
            keyCell.textContent = key;
            row.appendChild(keyCell);
        }
        const valueCell = document.createElement('td');
        valueCell.appendChild(createCopyableTextElem(value));
        row.appendChild(valueCell);
        table.appendChild(row);
    }
    targetElem.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'summary-table';
    if (Array.isArray(prompt)) prompt.forEach(value => addRow(table, null, value));
    else Object.entries(prompt).forEach(([key, value]) => addRow(table, key, value));
    targetElem.appendChild(table);
}
