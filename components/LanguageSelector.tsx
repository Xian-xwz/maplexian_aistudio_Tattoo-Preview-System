import React from 'react';
import { Language } from '../types';

interface Props {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<Props> = ({ currentLang, onLanguageChange }) => {
  return (
    <div className="absolute top-4 right-4 z-50">
      <select
        value={currentLang}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="bg-surface border border-border text-txt-primary py-1 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm hover:border-primary transition-colors cursor-pointer"
      >
        <option value={Language.ZH_TW}>繁體中文</option>
        <option value={Language.ZH_CN}>简体中文</option>
        <option value={Language.EN}>English</option>
      </select>
    </div>
  );
};

export default LanguageSelector;