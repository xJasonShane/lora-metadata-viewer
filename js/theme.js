/* ============================================================
   theme.js - theme switching (light/dark/custom/color themes)
   ============================================================ */

function updateTheme() {
  const _getColorCss = (selectElem, colorPickerElem, cssVar) => {
    colorPickerElem.style.setProperty('display','none');
    if(selectElem.value && selectElem.value === 'custom-theme') {
      colorPickerElem.style.removeProperty('display');
      return `--${cssVar}: ${colorPickerElem.value};`;
    }
    else if(selectElem.value) return `--${cssVar}: ${selectElem.value};`;
    return '';
  };

  document.body.className = UI.themeSelect.value === 'default'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme')
    : UI.themeSelect.value;
  let css = '';

  UI.themeColorPicker.style.setProperty('display','none');
  if(UI.themeColorSelect.value && UI.themeColorSelect.value === 'default') {
    document.body.classList.add('default-' + document.body.className);
  } else if(UI.themeColorSelect.value && UI.themeColorSelect.value === 'custom-theme') {
    UI.themeColorPicker.style.removeProperty('display');
    css += `--primary: ${UI.themeColorPicker.value};`;
  }
  else document.body.classList.add(UI.themeColorSelect.value);

  if(UI.themeFont.value ) css += `--font: ${UI.themeFont.value};`;

  css += _getColorCss(UI.themeBgColorSelect, UI.themeBgColorPicker, 'bg');
  css += _getColorCss(UI.themeInputColorSelect, UI.themeInputColorPicker, 'inputbg');
  css += _getColorCss(UI.themeFontColorSelect, UI.themeFontColorPicker, 'text');

  const styleId = "custom-theme-id";
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }
  style.innerHTML = `.custom-theme { ${css} }`;
  if(css) document.body.classList.add('custom-theme');
}
