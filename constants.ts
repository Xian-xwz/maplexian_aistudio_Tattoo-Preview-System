// 1. 统一语言标识符（解决 reading 'title' 的报错）
export const Language = {
  ZH_TW: 'zh' as const, // 统一使用 'zh' 匹配组件逻辑
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

// 5. 完整多语言字典
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
  }
};

// 6. 核心数据导出 (解决 SyntaxError)
const svgToDataUrl = (svgContent: string): string => `data:image/svg+xml;base64,${btoa(svgContent)}`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

export const DEFAULT_TATTOOS: Tattoo[] = [
  { id: 'def_star', name: 'Classic Star', imageBase64: svgToDataUrl(starSvg), isDefault: true },
];