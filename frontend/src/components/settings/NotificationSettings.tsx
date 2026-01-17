import { usePreferencesStore } from '../../store/preferencesStore';
import './NotificationSettings.css';

export function NotificationSettings() {
  const { preferences, updatePreference } = usePreferencesStore();

  if (!preferences) {
    return null;
  }

  const handleToggle = async (key: 'notifications_toast' | 'notifications_sound' | 'notifications_email', value: boolean) => {
    try {
      await updatePreference(key, value);
    } catch (error) {
      console.error('Failed to update notification preference:', error);
    }
  };

  return (
    <div className="notification-settings">
      <h3 className="notification-settings__title">Notifications</h3>
      <p className="notification-settings__subtitle">
        Configure how you receive workflow completion alerts
      </p>

      <div className="notification-settings__list">
        {/* Toast Notifications */}
        <div className="notification-setting">
          <div className="notification-setting__content">
            <label htmlFor="toast-toggle" className="notification-setting__label">
              Toast Notifications
            </label>
            <p className="notification-setting__description">
              Show in-app notifications when workflows complete
            </p>
          </div>
          <button
            id="toast-toggle"
            role="switch"
            aria-checked={preferences.notifications_toast}
            className={`toggle ${preferences.notifications_toast ? 'toggle--active' : ''}`}
            onClick={() => handleToggle('notifications_toast', !preferences.notifications_toast)}
          >
            <span className="toggle__thumb" />
          </button>
        </div>

        {/* Sound Notifications */}
        <div className="notification-setting">
          <div className="notification-setting__content">
            <label htmlFor="sound-toggle" className="notification-setting__label">
              Notification Sounds
            </label>
            <p className="notification-setting__description">
              Play audio alert when workflows finish
            </p>
          </div>
          <button
            id="sound-toggle"
            role="switch"
            aria-checked={preferences.notifications_sound}
            className={`toggle ${preferences.notifications_sound ? 'toggle--active' : ''}`}
            onClick={() => handleToggle('notifications_sound', !preferences.notifications_sound)}
          >
            <span className="toggle__thumb" />
          </button>
        </div>

        {/* Email Notifications */}
        <div className="notification-setting">
          <div className="notification-setting__content">
            <label htmlFor="email-toggle" className="notification-setting__label">
              Email Notifications
              <span className="notification-setting__badge">Coming Soon</span>
            </label>
            <p className="notification-setting__description">
              Receive email alerts on workflow completion (requires email service configuration)
            </p>
          </div>
          <button
            id="email-toggle"
            role="switch"
            aria-checked={preferences.notifications_email}
            className={`toggle ${preferences.notifications_email ? 'toggle--active' : ''} toggle--disabled`}
            onClick={() => handleToggle('notifications_email', !preferences.notifications_email)}
            disabled
          >
            <span className="toggle__thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}
