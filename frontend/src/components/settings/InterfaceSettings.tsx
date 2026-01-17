import { usePreferencesStore } from '../../store/preferencesStore';
import './InterfaceSettings.css';

export function InterfaceSettings() {
  const { preferences, updatePreference } = usePreferencesStore();

  if (!preferences) {
    return null;
  }

  const handleChange = async (
    key: 'language' | 'date_format' | 'results_per_page',
    value: any
  ) => {
    try {
      await updatePreference(key, value);
    } catch (error) {
      console.error('Failed to update interface preference:', error);
    }
  };

  return (
    <div className="interface-settings">
      <h3 className="interface-settings__title">Interface & Display</h3>
      <p className="interface-settings__subtitle">
        Customize how information is displayed across the platform
      </p>

      <div className="interface-settings__grid">
        {/* Language Selector */}
        <div className="interface-setting">
          <label htmlFor="language-select" className="interface-setting__label">
            Language
          </label>
          <p className="interface-setting__description">
            Choose your preferred interface language
          </p>
          <div className="select-wrapper">
            <select
              id="language-select"
              className="select"
              value={preferences.language}
              onChange={(e) => handleChange('language', e.target.value as 'fr' | 'en')}
            >
              <option value="fr">Français (French)</option>
              <option value="en">English</option>
            </select>
            <svg className="select__icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Date Format Selector */}
        <div className="interface-setting">
          <label htmlFor="date-format-select" className="interface-setting__label">
            Date Format
          </label>
          <p className="interface-setting__description">
            How dates are displayed throughout the app
          </p>
          <div className="select-wrapper">
            <select
              id="date-format-select"
              className="select"
              value={preferences.date_format}
              onChange={(e) => handleChange('date_format', e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY')}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</option>
            </select>
            <svg className="select__icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Results Per Page Selector */}
        <div className="interface-setting">
          <label htmlFor="results-per-page-select" className="interface-setting__label">
            Results Per Page
          </label>
          <p className="interface-setting__description">
            Number of items to show in lists and tables
          </p>
          <div className="select-wrapper">
            <select
              id="results-per-page-select"
              className="select"
              value={preferences.results_per_page}
              onChange={(e) => handleChange('results_per_page', parseInt(e.target.value) as 10 | 25 | 50 | 100)}
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
            <svg className="select__icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
