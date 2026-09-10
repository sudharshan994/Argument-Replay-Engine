import { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'accessibilityPreferences';

const defaultPreferences = {
  characterKeys: true,
  autoplayAnimations: 'system', // 'system', 'on', 'off'
  linkUnderlines: 'show', // 'show' or 'hide'
  showHovercards: true,
  urlPasteBehavior: 'formatted', // 'formatted' or 'plain'
};

export default function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  const setPreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const saveAllPreferences = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  };

  return { preferences, setPreference, saveAllPreferences };
}
