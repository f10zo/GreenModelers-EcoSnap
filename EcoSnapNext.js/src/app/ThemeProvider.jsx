'use client';

import { useState, useEffect } from 'react';

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // This effect runs only on the client after hydration
    const bodyElement = document.body;
    const initialTheme = localStorage.getItem('theme') || 'light';
    setTheme(initialTheme);
    bodyElement.className = initialTheme === 'dark' ? 'dark' : 'light';
  }, []);

  return (
    <div className={theme}>
      {children}
    </div>
  );
}