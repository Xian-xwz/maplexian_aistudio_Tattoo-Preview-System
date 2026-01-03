export enum Language {
  ZH_TW = 'zh-TW',
  ZH_CN = 'zh-CN',
  EN = 'en'
}

export enum DeviceMode {
  WEB = 'web',
  MOBILE = 'mobile'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface Tattoo {
  id: string;
  name: string;
  imageBase64: string; // Base64格式图片数据
  isDefault: boolean;  // 是否为默认不可删除图片
}

export interface UserConfig {
  language: Language;
  deviceMode: DeviceMode;
  theme: Theme;
  apiCallCount: number;
  userApiKey: string | null;
}

export interface CanvasObject {
  id: string;
  type: 'image';
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isSelected: boolean;
}