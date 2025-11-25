import { useEffect, useState } from 'react';

// SVG Icons inline to avoid lucide-react dependency
const SunIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="dark-mode-icon"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="dark-mode-icon"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * DarkModeToggle Component
 *
 * Default is DARK mode. Toggle switches to light.
 * - Dark mode = default (no .dark class)
 * - Light mode = .dark class added (inverted naming for compatibility)
 */
function DarkModeToggle() {
  // isLight = true means light mode is active (.dark class present)
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'light';
    }
    // Default to dark mode (isLight = false)
    return false;
  });

  useEffect(() => {
    // .dark class = light mode (inverted for compatibility)
    if (isLight) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight(!isLight);
  };

  return (
    <button
      onClick={toggleTheme}
      className="dark-mode-toggle"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <div className="dark-mode-toggle-track">
        <div className={`dark-mode-toggle-thumb ${isLight ? 'light' : 'dark'}`}>
          {isLight ? (
            <SunIcon size={14} />
          ) : (
            <MoonIcon size={14} />
          )}
        </div>
      </div>
    </button>
  );
}

export default DarkModeToggle;
