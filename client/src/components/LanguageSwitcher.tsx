import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ];

  return (
    <div className="language-switcher">
      <Globe size={18} />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      <style>{`
        .language-switcher {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
        }

        .language-select {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          font-weight: 500;
          padding: 4px 8px;
          outline: none;
          transition: 0.2s;
        }

        .language-select:hover {
          color: var(--accent-primary);
        }

        .language-select option {
          background: #1a1a1a;
          color: #fff;
          padding: 8px;
        }

        @media (max-width: 640px) {
          .language-switcher {
            padding: 6px 10px;
            font-size: 0.85rem;
          }

          .language-select {
            padding: 2px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
