/* ============================================================
   utils.js - shared rendering helpers
   Provides: showTooltip, showToast, createCopyableTextElem,
   copyToClipboard, colorizeJSON, formatAndColorizeJSON,
   replacePlaceholders, yieldToUI
   ============================================================ */

function showTooltip(message, event, timeout = 1500) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = message;
  tooltip.style.left = `${event.pageX - 35}px`;
  tooltip.style.top = `${event.pageY - 30}px`;
  document.body.appendChild(tooltip);
  setTimeout(() => { tooltip.remove(); }, timeout);
}

function showToast(message, timeout = null, type = 'info') {
  const container = $('toast-container');

  const toast = document.createElement('div');
  toast.classList.add('toast', type);

  const messageText = document.createElement('span');
  messageText.innerHTML = message;
  toast.appendChild(messageText);

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => container.removeChild(toast);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  if (timeout && typeof timeout === 'number') {
    setTimeout(() => {
      if (toast.parentElement) {
        container.removeChild(toast);
      }
    }, timeout);
  }
}

function createCopyableTextElem(string) {
  const elem = document.createElement('span');
  elem.textContent = string;
  elem.className = 'copyable-item';
  elem.addEventListener('click', function(event) {
      navigator.clipboard.writeText(string).then(() => {
          showTooltip('已复制！', event);
      }).catch(err => {
          console.error('Failed to copy text: ', err);
      });
  });
  return elem;
}

function copyToClipboard(elementId, event) {
  const textToCopy = $(elementId);
  if (!textToCopy) return;
  const textarea = document.createElement('textarea');
  textarea.value = textToCopy.innerText;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showTooltip('已复制！', event);
}

// Colorize a JSON object into syntax-highlighted HTML
function colorizeJSON(json, removeSurroundingQuotes) {
  const formattedJSON = JSON.stringify(json, null, 2);
  const coloredJSON = formattedJSON && formattedJSON.replace(
      /"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null|"undefined")\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
      function(match) {
          let cls = 'number';
          if (/^(null|"?undefined"?)$/.test(match))
            cls = 'null';
          else if (/^(true|false)$/.test(match))
            cls = 'boolean';
          else if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'key' : 'string';
            if (cls === 'string' && /^("https?:\/\/)/.test(match)) { // Check if the string is a url
                match = `<a target='_blank' href=${match}>${removeSurroundingQuotes ? match.replaceAll('"','') :match}</a>`;
                cls = 'url';
            }
            else if (cls === 'string' && /<(lora|lyco):/.test(match)) { // HTML encode prompt values
                const tempElement = document.createElement('div');
                tempElement.textContent = match;
                match = tempElement.innerHTML;
            }
            else if (cls === 'string' && /\<[^\>]+\>/.test(match)) { // Check if the string contains HTML tags
                match = match.replace(/\\"/g, '"').replace(/\\n/g,''); // Replace escaped characters
                cls = 'html';
            }
          }
          if(removeSurroundingQuotes) match = match.replace(/^"(.*)"$/, '$1');
          return `<span class="${cls}">${match}</span>`;
      }
  );
  return coloredJSON;
}

function formatAndColorizeJSON(json, targetElement) {
    targetElement.innerHTML = colorizeJSON(json);
}

function replacePlaceholders(text, data=null, colorize=true, undefinedText=null) {
  const replacedContent = text.replace(/{{([^}]+)}}/g, (match, placeholder) => {
    placeholder = placeholder.replace(" ", "");
    let remove = false;
    if (placeholder.endsWith('?')) {
      remove = true;
      placeholder = placeholder.slice(0, -1);
    }
    const value = data !== null ? data[placeholder] : fetchMetadataValue(placeholder);
    if (typeof value === 'object') return (colorize?`<pre>${colorizeJSON(value)}</pre>`:value);
    else if(value !== undefined && value !== "undefined") return colorize ? colorizeJSON(value, true) : value;
    else if(remove) return '';
    else if(undefinedText) return undefinedText;
    else '<span class="null">undefined<span>';
  });
  return replacedContent;
}

// Yield to the browser so the UI can repaint between heavy steps
function yieldToUI() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 16);
  });
}
