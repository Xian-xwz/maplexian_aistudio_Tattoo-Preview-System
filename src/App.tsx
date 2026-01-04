import React, { useState, useEffect } from 'react';
import { Language, DeviceMode, UserConfig, Theme } from './types';
import { TRANSLATIONS } from './constants';
import LanguageSelector from './components/LanguageSelector';
import WorkBench from './components/WorkBench';

// 使用新的存储 Key 以强制重置旧缓存
const STORAGE_KEY = 'inkpreview_config_v1.1';

const App: React.FC = () => {
  // --- 状态管理 ---
  const [hasStarted, setHasStarted] = useState(false);
  
  // 从 localStorage 初始化配置
  const [config, setConfig] = useState<UserConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 简单验证 language 是否有效，无效则回退默认
        if (parsed.language && Object.values(Language).includes(parsed.language)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse config", e);
    }
    
    // 默认配置
    return {
      language: Language.ZH_TW,
      deviceMode: DeviceMode.WEB,
      theme: Theme.LIGHT,
      apiCallCount: 0,
      userApiKey: null
    };
  });

  // 持久化配置
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // 监听并应用主题变化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
  }, [config.theme]);

  // 更新配置的辅助函数
  const updateConfig = (newConfig: Partial<UserConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // 安全获取翻译对象，防止 localStorage 脏数据导致 crash
  const t = TRANSLATIONS[config.language] || TRANSLATIONS[Language.ZH_TW];

  // --- 渲染逻辑 ---

  // 如果已经开始，显示工作台
  if (hasStarted) {
    return (
      <WorkBench 
        language={config.language} 
        config={config} 
        onUpdateConfig={updateConfig}
        onBack={() => setHasStarted(false)}
      />
    );
  }

  // 否则显示着陆页 (Landing Page)
  return (
    <div className="min-h-screen bg-background text-txt-primary flex flex-col items-center justify-center relative px-4 transition-colors duration-300">
      {/* 语言选择器 */}
      <LanguageSelector 
        currentLang={config.language} 
        onLanguageChange={(lang) => updateConfig({ language: lang })} 
      />

      {/* 主内容 */}
      <div className="text-center max-w-2xl animate-fade-in-up">
        <div className="mb-6 inline-block p-4 rounded-full bg-surface shadow-xl border border-border">
           <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
           </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-txt-primary tracking-tight">
          {t.title}
        </h1>
        <p className="text-lg md:text-xl text-txt-secondary mb-10 font-light">
          {t.subtitle}
        </p>

        {/* 版本选择与开始 */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => {
              updateConfig({ deviceMode: DeviceMode.WEB });
              setHasStarted(true);
            }}
            className="w-full md:w-auto px-8 py-4 bg-primary text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-primary-hover hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>💻</span> {t.webMode}
          </button>
          
          <button
            onClick={() => {
              updateConfig({ deviceMode: DeviceMode.MOBILE });
              setHasStarted(true);
            }}
            className="w-full md:w-auto px-8 py-4 bg-surface text-txt-primary text-lg font-semibold rounded-xl shadow-md border border-border hover:bg-surface-highlight transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
          >
             <span>📱</span> {t.mobileMode}
          </button>
        </div>
        
        <p className="mt-8 text-sm text-txt-muted">
           Beta v1.0 • Powered by Google Gemini
        </p>
      </div>
    </div>
  );
};

export default App;
