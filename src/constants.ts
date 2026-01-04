// 1. 核心类型定义
export const Language = {
  ZH_TW: 'zh-TW' as const, // 修正为 zh-TW 以匹配组件逻辑
  ZH_CN: 'zh-CN' as const,
  EN: 'en' as const
};

export type LanguageType = typeof Language[keyof typeof Language];

export interface Tattoo {
  id: string;
  name: string;
  imageBase64: string;
  isDefault?: boolean;
}

// 2. 环境变量安全读取
const getApiKey = (): string => {
  try {
    // @ts-ignore
    const env = (import.meta as any).env;
    return env?.VITE_DEFAULT_API_KEY || '';
  } catch (e) {
    return '';
  }
};

export const DEFAULT_API_KEY = getApiKey();

// 3. 系统配置
export const MAX_FREE_API_CALLS = 2;
export const MAX_UPLOAD_SIZE_MB = 10;

// 4. AI 提示词
export const AI_FUSION_PROMPT = `This image shows a person with a digital tattoo overlay. Please refine this image to make the tattoo look like a REAL tattoo permanently inked on the skin.`;

// 5. 完整多语言字典 (使用 zh-TW 作为 Key 解决组件报错)
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

// 6. 核心数据导出 (解决 mockDb.ts 找不到 DEFAULT_TATTOOS 报错)
const svgToDataUrl = (svgContent: string): string => `data:image/svg+xml;base64,${btoa(svgContent)}`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

export const DEFAULT_TATTOOS: Tattoo[] = [
  { id: 'def_star', name: 'Classic Star', imageBase64: svgToDataUrl(starSvg), isDefault: true },
];