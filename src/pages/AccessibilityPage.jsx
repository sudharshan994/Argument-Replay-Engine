import React from 'react';

const defaultPreferences = {
  characterKeys: true,
  autoplayAnimations: 'system',
  linkUnderlines: 'show',
  showHovercards: true,
  urlPasteBehavior: 'formatted',
};

export default function AccessibilityPage() {
  const [preferences, setPreferences] = React.useState(defaultPreferences);
  const setPreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  const saveAllPreferences = () => {
    console.log('Preferences saved (no persistence)');
  };
  const [saved, setSaved] = React.useState(false);
  const handleSave = () => {
    saveAllPreferences();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Accessibility settings</h2>
      {/* Character keys */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold">Character keys</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enable keyboard shortcuts for navigation.</p>
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.characterKeys}
            onChange={e => setPreference('characterKeys', e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span>On</span>
        </label>
      </section>
      {/* Autoplay animated images */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold">Autoplay animated images</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Control whether GIFs and other animations play automatically.</p>
        <div className="space-y-2">
          {['system', 'on', 'off'].map(value => (
            <label key={value} className="inline-flex items-center space-x-2">
              <input
                type="radio"
                name="autoplay"
                value={value}
                checked={preferences.autoplayAnimations === value}
                onChange={e => setPreference('autoplayAnimations', e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>{value === 'system' ? 'Sync with system' : value === 'on' ? 'On' : 'Off'}</span>
            </label>
          ))}
        </div>
      </section>
      {/* Link underlines */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold">Link underlines</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Show or hide underlines on links.</p>
        <div className="space-y-2">
          {['show', 'hide'].map(value => (
            <label key={value} className="inline-flex items-center space-x-2">
              <input
                type="radio"
                name="linkUnderline"
                value={value}
                checked={preferences.linkUnderlines === value}
                onChange={e => setPreference('linkUnderlines', e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>{value === 'show' ? 'Show link underlines' : 'Hide link underlines'}</span>
            </label>
          ))}
        </div>
      </section>
      {/* Hovercards */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold">Hovercards</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Display hovercards when hovering over usernames.</p>
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.showHovercards}
            onChange={e => setPreference('showHovercards', e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span>On</span>
        </label>
      </section>
      {/* URL paste behavior */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold">URL paste behavior</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">How URLs are formatted when pasted.</p>
        <div className="space-y-2">
          {['formatted', 'plain'].map(value => (
            <label key={value} className="inline-flex items-center space-x-2">
              <input
                type="radio"
                name="urlPaste"
                value={value}
                checked={preferences.urlPasteBehavior === value}
                onChange={e => setPreference('urlPasteBehavior', e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span>{value === 'formatted' ? 'Formatted link' : 'Plain URL'}</span>
            </label>
          ))}
        </div>
      </section>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={saved}
      >
        Save preferences
      </button>
      {saved && <span className="ml-2 text-sm text-green-600">Saved</span>}
    </div>
  );
}
