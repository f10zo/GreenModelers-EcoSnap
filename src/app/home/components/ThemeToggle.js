"use client";

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    // Apply the class to the root HTML element
    document.documentElement.className = savedTheme; 
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Apply the class to the root HTML element
    document.documentElement.className = newTheme;
  };

  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-white">
      {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
}