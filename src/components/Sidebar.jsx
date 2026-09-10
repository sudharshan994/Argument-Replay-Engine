// src/components/Sidebar.jsx
import { useEffect, useState } from 'react';

const sections = [
  { name: 'Public profile', href: '#/profile' },
  { name: 'Account', href: '#/account' },
  { name: 'Appearance', href: '#/appearance' },
  { name: 'Accessibility', href: '#/settings/accessibility' },
  { name: 'Notifications', href: '#/notifications' },
  { name: 'Developer settings', href: '#/developer' },
];

export default function Sidebar() {
  const [active, setActive] = useState(window.location.hash || sections[0].href);

  useEffect(() => {
    const handler = () => setActive(window.location.hash || sections[0].href);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <nav className="w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
      <ul className="space-y-1">
        {sections.map((sec) => (
          <li key={sec.name}>
            <a
              href={sec.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${active === sec.href ? 'bg-gray-200 dark:bg-gray-700 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              {sec.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
