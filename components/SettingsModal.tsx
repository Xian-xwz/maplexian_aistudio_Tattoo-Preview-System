import React, { useState, useEffect } from 'react';
import { UserConfig, Language, Theme } from '../types';
import { TRANSLATIONS, MAX_FREE_API_CALLS } from '../src/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  config: UserConfig;
  onUpdateConfig: (newConfig: Partial<UserConfig>) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, language, config, onUpdateConfig }) => {
  const t = TRANSLATIONS[language];
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(config.userApiKey || '');
    }
  }, [isOpen, config.userApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateConfig({ userApiKey: apiKey.trim() || null });
    onClose();
  };

  const isLimitReached = config.apiCallCount >= MAX_FREE_API_CALLS;
  const showLimitWarning = isLimitReached && !config.userApiKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up relative border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-txt-primary">{t.settings}</h2>
          <button onClick={onClose} className="text-txt-muted hover:text-txt-primary transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* 额度用尽提示横幅 */}
        {showLimitWarning && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 m-6 mb-0">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-amber-700">
                           {language === Language.EN ? 'Free trial limit reached.' : '免费试用额度已用尽。'}
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className="p-6 space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-2">
              {t.appearance}
            </label>
            <div className="flex gap-2 bg-surface-highlight p-1 rounded-lg border border-border">
              <button
                onClick={() => onUpdateConfig({ theme: Theme.LIGHT })}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  config.theme === Theme.LIGHT
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                {t.lightMode}
              </button>
              <button
                onClick={() => onUpdateConfig({ theme: Theme.DARK })}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  config.theme === Theme.DARK
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                {t.darkMode}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              {t.apiKeyLabel}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.apiKeyPlaceholder}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-surface text-txt-primary ${showLimitWarning && !apiKey ? 'border-amber-300 focus:ring-amber-200 focus:border-amber-500 bg-amber-50' : 'border-border focus:ring-primary focus:border-primary'}`}
            />
            <p className="mt-2 text-xs text-txt-muted">
              {t.callsUsed.replace('{count}', config.apiCallCount.toString()).replace('{limit}', MAX_FREE_API_CALLS.toString())}
              <br/>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 mt-1">
                {t.getApiKeyLink}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </p>
          </div>
        </div>

        <div className="p-4 bg-surface-highlight flex justify-end gap-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-txt-secondary hover:bg-surface rounded-lg transition-colors font-medium border border-transparent hover:border-border"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-md transition-transform active:scale-95 font-medium"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;