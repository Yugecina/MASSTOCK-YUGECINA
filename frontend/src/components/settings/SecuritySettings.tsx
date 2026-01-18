import { useState } from 'react';
import { ChangePasswordModal } from './ChangePasswordModal';
import './SecuritySettings.css';

export function SecuritySettings() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <div className="security-settings">
        <h3 className="security-settings__title">Security</h3>
        <p className="security-settings__subtitle">
          Manage your account security and authentication
        </p>

        <div className="security-settings__list">
          {/* Change Password */}
          <div className="security-setting">
            <div className="security-setting__content">
              <div className="security-setting__header">
                <svg className="security-setting__icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C9.24 2 7 4.24 7 7V10H6C4.9 10 4 10.9 4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12C20 10.9 19.1 10 18 10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4ZM12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14Z" fill="currentColor"/>
                </svg>
                <h4 className="security-setting__label">Password</h4>
              </div>
              <p className="security-setting__description">
                Update your password regularly to keep your account secure. We recommend using a strong, unique password.
              </p>
            </div>
            <button
              className="security-setting__button"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
