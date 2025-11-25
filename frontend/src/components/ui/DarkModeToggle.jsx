import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * DarkModeToggle Component
 *
 * Handles theme switching between light and dark modes.
 * - Detects system preference on first load
 * - Persists user choice in localStorage
 * - Smooth transitions with rich animations
 * - Accessible with keyboard navigation
 */
function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only apply system preference if user hasn't manually set a theme
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="dark-mode-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="dark-mode-toggle-track">
        <div className={`dark-mode-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon className="dark-mode-icon" size={14} />
          ) : (
            <Sun className="dark-mode-icon" size={14} />
          )}
        </div>
      </div>
    </button>
  );
}

export default DarkModeToggle;
