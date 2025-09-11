'use client';

import React, { useState, useEffect } from 'react';

export default function HomePageBackground({ children }) {
  const [currentTheme, setCurrentTheme] = useState('');

  useEffect(() => {
    // Get the initial theme
    const initialTheme = document.documentElement.className;
    setCurrentTheme(initialTheme);

    // Create a MutationObserver to watch for changes to the <html> tag's class attribute
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.className;
      setCurrentTheme(newTheme);
    });

    // Start observing the <html> element for attribute changes
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Clean up the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  // Use the state to apply the correct Tailwind classes
  const backgroundClass = currentTheme.includes('dark') 
    ? "bg-[url('/lake-dusk1.png')]" 
    : "bg-[url('/lake-daylight1.png')]";

  return (
    <div className={`flex flex-col min-h-screen ${backgroundClass} bg-cover bg-center transition-colors duration-500`}>
      {children}
    </div>
  );
}
