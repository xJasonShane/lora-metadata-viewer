/* ============================================================
   lookup.js - online resource lookup (CivitAI / Arc En Ciel)
   Parallel queries + per-request timeout + session cache.
   Provides: onlineLookup, getCivitAiData, getArcEnCielData,
   getModelDataByHash, updateOnlineLookupInfo
   ============================================================ */

const LOOKUP_TIMEOUT_MS = 15000;
const LOOKUP_CACHE_PREFIX = 'lmv.lookup.';

async function fetchWithTimeout(url, timeout = LOOKUP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function lookupCacheGet(key) {
  try {
    const raw = sessionStorage.getItem(LOOKUP_CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function lookupCacheSet(key, value) {
  try {
    sessionStorage.setItem(LOOKUP_CACHE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // Storage quota / unavailable - caching is best-effort only
  }
}

async function onlineLookup(url, useProxy = false) {
  if (UI.enableProxy.checked && useProxy) {
    const proxyAvailable = await isProxyAvailable(UI.proxyUrl.value);
    if (proxyAvailable) url = UI.proxyUrl.value + url;
    else {
      showToast('代理服务器不可用。', null, 'error');
      return null;
    }
  }
  const response = await fetchWithTimeout(url);
  if (!response.ok) return null;
  return response.json();
}

async function isProxyAvailable(proxyUrl) {
  try {
    const response = await fetchWithTimeout(proxyUrl + 'https://www.civitai.com');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function getCivitAiData(hash) {
  const baseApiUrl = "https://civitai.com/api/v1/model-versions/by-hash/";
  const modelApiUrl = "https://civitai.com/api/v1/models/";
  const baseModelUrl = "https://civitai.com/models/";
  const versionParam = "?modelVersionId=";
  if (!hash) return null;
  const cacheKey = `civ.${hash}`;
  const cached = lookupCacheGet(cacheKey);
  if (cached) return cached;
  try {
    let data = await onlineLookup(baseApiUrl + hash);
    if (!data || !data.modelId) return null;
    data.model = await onlineLookup(modelApiUrl + data.modelId);
    if (!data.model) return null;
    const result = { data, hash, modelUrl: baseModelUrl + data.modelId + versionParam + data.id, resourceUrl: baseApiUrl + hash, source: "CivitAI" };
    lookupCacheSet(cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof TypeError) showToast('CivitAI 查询失败，可能是由于 CORS 限制或网络错误...', null, 'error');
    console.error("Error fetching CivitAI data:", error);
    return null;
  }
}

async function getArcEnCielData(hash) {
  const baseApiUrl = "https://arcenciel.io/api/models/search?search=";
  const baseModelUrl = "https://arcenciel.io/models/";
  if (!hash) return null;
  const cacheKey = `aec.${hash}`;
  const cached = lookupCacheGet(cacheKey);
  if (cached) return cached;
  try {
    let data = await onlineLookup(baseApiUrl + hash, true);
    if (!data?.data?.[0]) return null;
    const result = { data: data.data[0], hash, hashType: "SHA256", modelUrl: baseModelUrl + data.data[0].id, resourceUrl: baseApiUrl + hash, source: "Arc En Ciel" };
    lookupCacheSet(cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof TypeError) showToast('Arc En Ciel 查询失败，可能是由于 CORS 限制或网络错误。请确保在"在线查询"设置选项卡中启用了 HTTP 代理，并指定了有效的代理 URL。', null, 'error');
    console.error("Error fetching Arc En Ciel data:", error);
    return null;
  }
}

async function getModelDataByHash(hash) {
  let data;
  switch (UI.primaryLookup.value) {
    case 'civ':
      data = await getCivitAiData(hash);
      break;
    case 'aec':
      data = await getArcEnCielData(hash);
      break;
  }
  if (!data?.data && UI.secondaryLookup.value && UI.primaryLookup.value !== UI.secondaryLookup.value) {
    switch (UI.secondaryLookup.value) {
      case 'civ':
        data = await getCivitAiData(hash);
        break;
      case 'aec':
        data = await getArcEnCielData(hash);
        break;
    }
  }
  return data;
}

function setPreviewFromUrl(url) {
  if (!url) return;
  const isVideo = /\.(mp4|webm)$/i.test(url);
  UI.previewImage.innerHTML = isVideo ? `<video src='${url}' controls loop></video>` : `<img src='${url}'>`;
}

// Primary model lookup: primary source first (AutoV2 then AutoV3 for CivitAI,
// SHA256 then SHA256-AutoV3 for Arc En Ciel), falling back to the secondary source.
async function getPrimaryModelData() {
  const primary = UI.primaryLookup.value;
  const secondary = (UI.secondaryLookup.value && UI.secondaryLookup.value !== primary) ? UI.secondaryLookup.value : null;
  if (primary === 'civ') {
    let data = await getCivitAiData(VARIABLES.customMetadata.autov2);
    if (!data?.data) data = await getCivitAiData(VARIABLES.customMetadata.autov3);
    if (!data?.data && secondary === 'aec') {
      data = await getArcEnCielData(VARIABLES.customMetadata.sha256);
      if (!data?.data) data = await getArcEnCielData(VARIABLES.customMetadata.sha256_autov3);
    }
    return data;
  }
  if (primary === 'aec') {
    let data = await getArcEnCielData(VARIABLES.customMetadata.sha256);
    if (!data?.data) data = await getArcEnCielData(VARIABLES.customMetadata.sha256_autov3);
    if (!data?.data && secondary === 'civ') {
      data = await getCivitAiData(VARIABLES.customMetadata.autov2);
      if (!data?.data) data = await getCivitAiData(VARIABLES.customMetadata.autov3);
    }
    return data;
  }
  return null;
}

// Apply preview / metadata / toast side effects from a successful lookup result
function applyLookupSideEffects(data) {
  if (data?.source === 'CivitAI') {
    VARIABLES.civitaiMetadata = data.data;
    VARIABLES.customMetadata.lora_hash = data.hash;
    setPreviewFromUrl(data.data?.images?.[0]?.url);
    showToast('在 CivitAI 中找到匹配资源', 8000, 'success');
  } else if (data?.source === 'Arc En Ciel') {
    VARIABLES.arcencielMetadata = data.data;
    const versions = data.data?.versions ?? [];
    let versionIndex = 0;
    if (versions.length > 1) {
      const matchIdx = versions.findIndex(v => v?.sha256 === VARIABLES.customMetadata.sha256 || v?.sha256webui === VARIABLES.customMetadata.sha256_autov3);
      if (matchIdx !== -1) versionIndex = matchIdx;
    }
    const selectedVersion = versions[versionIndex];
    let mediaType = selectedVersion?.images?.length ? 'images' : (selectedVersion?.videos?.length ? 'videos' : undefined);
    if (mediaType) {
      const filePath = selectedVersion?.[mediaType]?.[0]?.filePath;
      if (filePath) setPreviewFromUrl('https://arcenciel.io/uploads/' + filePath);
    }
    showToast('在 Arc En Ciel 中找到匹配资源', 8000, 'success');
  } else {
    showToast('未找到匹配资源', 8000, 'warning');
  }
}

async function updateOnlineLookupInfo() {
  if (!UI.primaryLookup.value) return;
  let data;
  updateLoading("正在查询模型...", 75);

  const baseModelHash = VARIABLES.fileMetadata.ss_new_sd_model_hash || VARIABLES.fileMetadata.ss_sd_model_hash;
  const vaeHash = VARIABLES.fileMetadata.ss_new_vae_hash || VARIABLES.fileMetadata.ss_vae_hash;

  // Run model lookup, base model lookup and VAE lookup concurrently
  const [modelResult, baseModelInfo, vaeInfo] = await Promise.allSettled([
    getPrimaryModelData(),
    baseModelHash ? getModelDataByHash(baseModelHash) : Promise.resolve(null),
    vaeHash ? getModelDataByHash(vaeHash) : Promise.resolve(null)
  ]);

  data = modelResult.status === 'fulfilled' ? modelResult.value : null;
  if (baseModelInfo.status === 'fulfilled' && baseModelInfo.value?.data) {
    VARIABLES.basemodelMetadata = baseModelInfo.value.data;
  }
  if (vaeInfo.status === 'fulfilled' && vaeInfo.value?.data) {
    VARIABLES.vaeMetadata = vaeInfo.value.data;
  }

  if (data?.data) {
    UI.modelUrl.href = data.modelUrl;
    UI.modelUrl.innerHTML = data.modelUrl;
    UI.resourceUrl.href = data.resourceUrl;
    UI.resourceUrl.innerHTML = data.resourceUrl;
    formatAndColorizeJSON(data.data, UI.onlineLookupData);
    applyLookupSideEffects(data);
  }
  if (data?.data || VARIABLES.basemodelMetadata || VARIABLES.vaeMetadata) setCustomMetadata();
  if (UI.primaryLookup.value) updateSummary(VARIABLES.fileMetadata);
  hideLoading();
}
