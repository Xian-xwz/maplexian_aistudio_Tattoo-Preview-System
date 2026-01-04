// 1. 直接在此定义类型和常量（解决找不到 ./types 的报错）
export const Language = {
  ZH_TW: 'zh_tw' as const,
  ZH_CN: 'zh_cn' as const,
  EN: 'en' as const
};

export type LanguageType = typeof Language[keyof typeof Language];

export interface Tattoo {
  id: string;
  name: string;
  imageBase64: string;
  isDefault?: boolean;
}

// 系统默认配置
export const MAX_FREE_API_CALLS = 2;
export const MAX_UPLOAD_SIZE_MB = 10;

// 安全地获取 Key 的函数，防止在静态环境崩溃
const getApiKey = () => {
  try {
    // 使用 optional chaining 防止 env 缺失时报错
    // @ts-ignore
    const env = (import.meta as any).env;
    return env?.VITE_DEFAULT_API_KEY || '';
  } catch (e) {
    console.warn("Error reading API key from env:", e);
    return '';
  }
};

// 读取环境变量中的默认 API Key
export const DEFAULT_API_KEY = getApiKey();

// AI 生成提示词
export const AI_FUSION_PROMPT = `
This image shows a person with a digital tattoo overlay. 
Please refine this image to make the tattoo look like a REAL tattoo permanently inked on the skin.
1. Apply natural skin texture and pores over the tattoo ink.
2. Adjust the lighting, shading, and curvature to match the body part.
3. Slightly fade the tattoo edges to look realistic.
4. DO NOT change the person's facial features, identity, or background details.
5. The output must be the same aspect ratio as the input.
Return only the processed image.
`;

// 多语言字典
export const TRANSLATIONS = {
  [Language.ZH_TW]: {
    title: 'InkPreview AI 紋身預覽',
    subtitle: '上傳照片，預覽您的下一個紋身',
    start: '開始體驗',
    webMode: '網頁版',
    mobileMode: '手機版',
    uploadTitle: '拖拽或點擊上傳照片',
    uploadDesc: '支持 JPG, PNG, WEBP (最大 10MB)',
    galleryTitle: '紋身樣式庫',
    apiLimitWait: '請配置 API Key',
    generate: 'AI 融合生成',
    download: '下載結果',
    settings: '設置',
    reset: '清空紋身',
    delete: '刪除選中',
    apiKeyPlaceholder: '輸入您的 Google Gemini API Key',
    save: '保存',
    processing: 'AI 正在融合...',
    dragHere: '拖拽紋身到此處',
    errorFormat: '請上傳 JPG, PNG 或 WEBP 格式的圖片',
    errorSize: `圖片大小不能超過 ${MAX_UPLOAD_SIZE_MB}MB`,
    errorLoad: '圖片加載失敗，請重試',
    reupload: '重新上傳',
    genSuccess: '生成成功！',
    genFail: '生成失敗，已切換至本地預覽模式。',
    noApiKey: '請在設置中配置 API Key 以繼續使用。',
    guideTitle: '快速指南',
    guideStep1: '1. 上傳您的照片',
    guideStep2: '2. 拖拽喜歡的紋身',
    guideStep3: '3. 調整位置和大小',
    guideStep4: '4. 雙擊紋身開始融合',
    gotIt: '知道了',
    downloadSuccess: '下載成功',
    doubleClickHint: '雙擊紋身即可開始融合',
    zoomHint: 'Ctrl + 滾輪縮放，拖拽背景平移',
    resetView: '重置視圖',
    galleryDragHint: '支持本地上傳和拖拽上傳',
    uploadTattoo: '上傳紋身',
    replaceErrorDefault: '默認圖片不可替換',
    replaceSuccess: '紋身替換成功',
    uploadSuccess: '紋身添加成功',
    tattooSizeError: '紋身圖片大小不能超過 5MB',
    undo: '撤銷',
    redo: '重做',
    confirmDelete: '確定要刪除這個紋身嗎？',
    confirmReset: '確定要清空所有紋身並重置歷史記錄嗎？',
    loadingGallery: '正在加載紋身庫...',
    noTattoos: '暫無紋身樣式',
    uploadFailed: '上傳失敗',
    replaceFailed: '替換失敗',
    deleteFailed: '刪除失敗',
    dropToAdd: '鬆開鼠標添加紋身',
    processingImage: '正在處理圖片...',
    processImageFail: '圖片處理失敗',
    apiKeyLabel: 'Google Gemini API Key',
    callsUsed: '已調用次數: {count} (免費額度: {limit})',
    getApiKeyLink: '在此獲取 API Key',
    cancel: '取消',
    appearance: '外觀',
    lightMode: '亮色模式',
    darkMode: '暗色模式',
  },
  [Language.ZH_CN]: {
    title: 'InkPreview AI 纹身预览',
    subtitle: '上传照片，预览您的下一个纹身',
    start: '开始体验',
    webMode: '网页版',
    mobileMode: '手机版',
    uploadTitle: '拖拽或点击上传照片',
    uploadDesc: '支持 JPG, PNG, WEBP (最大 10MB)',
    galleryTitle: '纹身样式库',
    apiLimitWait: '请配置 API Key',
    generate: 'AI 融合生成',
    download: '下载结果',
    settings: '设置',
    reset: '清空纹身',
    delete: '删除选中',
    apiKeyPlaceholder: '输入您的 Google Gemini API Key',
    save: '保存',
    processing: 'AI 正在融合...',
    dragHere: '拖拽纹身到此处',
    errorFormat: '请上传 JPG, PNG 或 WEBP 格式的图片',
    errorSize: `图片大小不能超过 ${MAX_UPLOAD_SIZE_MB}MB`,
    errorLoad: '图片加载失败，请重试',
    reupload: '重新上传',
    genSuccess: '生成成功！',
    genFail: '生成失败，已切换至本地预览模式。',
    noApiKey: '请在设置中配置 API Key 以继续使用。',
    guideTitle: '快速指南',
    guideStep1: '1. 上传您的照片',
    guideStep2: '2. 拖拽喜欢的纹身',
    guideStep3: '3. 调整位置和大小',
    guideStep4: '4. 双击纹身开始融合',
    gotIt: '知道了',
    downloadSuccess: '下载成功',
    doubleClickHint: '双击纹身即可开始融合',
    zoomHint: 'Ctrl + 滚轮缩放，拖拽背景平移',
    resetView: '重置视图',
    galleryDragHint: '支持本地上传和拖拽上传',
    uploadTattoo: '上传纹身',
    replaceErrorDefault: '默认图片不可替换',
    replaceSuccess: '纹身替换成功',
    uploadSuccess: '纹身添加成功',
    tattooSizeError: '纹身图片大小不能超过 5MB',
    undo: '撤销',
    redo: '重做',
    confirmDelete: '确定要删除这个纹身吗？',
    confirmReset: '确定要清空所有纹身并重置历史记录吗？',
    loadingGallery: '正在加载纹身库...',
    noTattoos: '暂无纹身样式',
    uploadFailed: '上传失败',
    replaceFailed: '替换失败',
    deleteFailed: '删除失败',
    dropToAdd: '松开鼠标添加纹身',
    processingImage: '正在处理图片...',
    processImageFail: '图片处理失败',
    apiKeyLabel: 'Google Gemini API Key',
    callsUsed: '已调用次数: {count} (免费额度: {limit})',
    getApiKeyLink: '在此获取 API Key',
    cancel: '取消',
    appearance: '外观',
    lightMode: '亮色模式',
    darkMode: '暗色模式',
  },
  [Language.EN]: {
    title: 'InkPreview AI',
    subtitle: 'Upload photo, preview your next ink',
    start: 'Get Started',
    webMode: 'Web Mode',
    mobileMode: 'Mobile Mode',
    uploadTitle: 'Drag or Click to Upload Photo',
    uploadDesc: 'Supports JPG, PNG, WEBP (Max 10MB)',
    galleryTitle: 'Tattoo Gallery',
    apiLimitWait: 'Configure API Key',
    generate: 'AI Fusion',
    download: 'Download',
    settings: 'Settings',
    reset: 'Clear Tattoos',
    delete: 'Delete Selected',
    apiKeyPlaceholder: 'Enter your Google Gemini API Key',
    save: 'Save',
    processing: 'AI Fusion...',
    dragHere: 'Drag tattoo here',
    errorFormat: 'Please upload JPG, PNG or WEBP image',
    errorSize: `Image size cannot exceed ${MAX_UPLOAD_SIZE_MB}MB`,
    errorLoad: 'Failed to load image, please try again',
    reupload: 'Re-upload',
    genSuccess: 'Generation Successful!',
    genFail: 'Generation failed, switched to local preview.',
    noApiKey: 'Please configure API Key in settings to continue.',
    guideTitle: 'Quick Guide',
    guideStep1: '1. Upload your photo',
    guideStep2: '2. Drag & drop tattoo',
    guideStep3: '3. Adjust position',
    guideStep4: '4. Double-click to fuse',
    gotIt: 'Got it',
    downloadSuccess: 'Download Started',
    doubleClickHint: 'Double-click tattoo to start fusion',
    zoomHint: 'Ctrl + Wheel to zoom, Drag bg to pan',
    resetView: 'Reset View',
    galleryDragHint: 'Drag & Drop or Upload',
    uploadTattoo: 'Upload',
    replaceErrorDefault: 'Cannot replace default image',
    replaceSuccess: 'Tattoo replaced',
    uploadSuccess: 'Tattoo added',
    tattooSizeError: 'Tattoo image size cannot exceed 5MB',
    undo: 'Undo',
    redo: 'Redo',
    confirmDelete: 'Are you sure you want to delete this tattoo?',
    confirmReset: 'Are you sure you want to clear all tattoos and reset history?',
    loadingGallery: 'Loading Gallery...',
    noTattoos: 'No tattoos available',
    uploadFailed: 'Upload failed',
    replaceFailed: 'Replace failed',
    deleteFailed: 'Delete failed',
    dropToAdd: 'Release to add tattoo',
    processingImage: 'Processing Image...',
    processImageFail: 'Image processing failed',
    apiKeyLabel: 'Google Gemini API Key',
    callsUsed: 'Calls used: {count} (Free limit: {limit})',
    getApiKeyLink: 'Get API Key here',
    cancel: 'Cancel',
    appearance: 'Appearance',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
  }
};

// --- 默认纹身数据生成 ---
const svgToDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
const heartTribalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/><path d="M12 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="white"/></svg>`;
const roseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/><path d="M12 12c0 4-4 4-4 0s4-4 4 0z"/></svg>`;
const skullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 2c-4.42 0-8 3.58-8 8 0 2.88 1.54 5.4 3.88 6.78L7 22h2v-2h6v2h2l-.88-5.22C18.46 15.4 20 12.88 20 10c0-4.42-3.58-8-8-8zm-4 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;
const dragonSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M20 2c-2 0-4 1-5 3-2 4-5 5-8 5-2 0-4-1-5-2 1 3 3 5 5 5 4 0 7-2 9-5 1-1.5 2-2 4-2 1 0 2 .5 2 1.5S21 9 20 9c-1 0-1.5-.5-2-1-.5 1 0 3 2 3 2.5 0 4-2.5 4-5S22 2 20 2z"/></svg>`;
const butterflySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2s2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 2c-3.87 0-7 3.13-7 7 0 2.5 1.4 4.8 3.6 6.1-.2-.6-.4-1.3-.5-2 0-3.31 2.69-6 6-6V5h-2.1zM14 5v5.1c3.31 0 6 2.69 6 6 0 .7-.2 1.4-.5 2 2.2-1.3 3.6-3.6 3.6-6.1 0-3.87-3.13-7-7-7h-2.1z"/></svg>`;
const anchorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm1 6v3h3v2h-3v5c0 1.1-.9 2-2 2s-2-.9-2-2v-5H6v-2h3V8h6zM6 18c0 1.65 1.35 3 3 3v-2c-.55 0-1-.45-1-1H6zm12 0h-2c0 .55-.45 1-1 1v2c1.65 0 3-1.35 3-3z"/></svg>`;
const boltSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`;

export const DEFAULT_TATTOOS: Tattoo[] = [
  { id: 'def_star', name: 'Classic Star', imageBase64: svgToDataUrl(starSvg), isDefault: true },
  { id: 'def_heart', name: 'Tribal Heart', imageBase64: svgToDataUrl(heartTribalSvg), isDefault: true },
  { id: 'def_rose', name: 'Minimal Rose', imageBase64: svgToDataUrl(roseSvg), isDefault: true },
  { id: 'def_skull', name: 'Skull', imageBase64: svgToDataUrl(skullSvg), isDefault: true },
  { id: 'def_dragon', name: 'Dragon', imageBase64: svgToDataUrl(dragonSvg), isDefault: true },
  { id: 'def_butterfly', name: 'Butterfly', imageBase64: svgToDataUrl(butterflySvg), isDefault: true },
  { id: 'def_anchor', name: 'Anchor', imageBase64: svgToDataUrl(anchorSvg), isDefault: true },
  { id: 'def_bolt', name: 'Lightning', imageBase64: svgToDataUrl(boltSvg), isDefault: true },
];