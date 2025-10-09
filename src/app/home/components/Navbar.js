'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { FiMenu, FiX, FiHome, FiFlag, FiUsers, FiLayers, FiInfo, FiMail } from "react-icons/fi";
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [activeButton, setActiveButton] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.className;
      setCurrentTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const leftLinks = [
    { name: "Home", href: "/", tooltip: "Go to homepage", icon: <FiHome size={18} /> },
    { name: "Report Issue", href: "/report", tooltip: "Submit a new pollution report", icon: <FiFlag size={18} /> },
    { name: "Impact Together", href: "/campaign-form", tooltip: "Create and publish a campaign", icon: <FiUsers size={18} /> },
    { name: "Published Campaigns", href: "/published-campaigns", tooltip: "View all campaigns", icon: <FiLayers size={18} /> },
  ];

  const rightLinks = [
    { name: "About", href: "/about", tooltip: "Learn more about our project", icon: <FiInfo size={18} /> },
    { name: "Contact", href: "/contact-us", tooltip: "Reach out to our team", icon: <FiMail size={18} /> },
  ];

  const neonGlowColor = "rgba(4, 120, 87, 0.7)";
  const darkModeNeonColor = "rgba(59,130,246,0.7)";

  const buttonStyle = {
    backdropFilter: "blur(8px)",
    backgroundColor: currentTheme.includes('dark') ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.5)",
    color: currentTheme.includes('dark') ? "white" : "rgb(4, 120, 87)",
    transition: "all 0.3s ease-in-out",
  };

  const getGlowStyle = (linkName, isActive) => ({
    boxShadow: activeButton === linkName || isActive
      ? `0 0 20px 4px ${currentTheme.includes('dark') ? darkModeNeonColor : neonGlowColor}`
      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  });

  return (
    <header className={`sticky top-0 z-50 w-full ${currentTheme.includes('dark') ? 'bg-gray-900/70' : 'bg-white/70'} backdrop-blur-md shadow-md`}>
      <nav className="flex items-center justify-between flex-wrap p-2">

        {/* Left: Logo + links */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center group hover:scale-105 transition-transform duration-300">
            <Image
              src={currentTheme.includes('dark') ? "/eco_logo_dark.png" : "/eco_logo_light.png"}
              alt="EcoSnap Logo"
              width={90}
              height={70}
              className="w-[80px] h-[70px] lg:w-[100px] lg:h-[80px]"
            />
          </div>

          {/* Desktop links (≥1280px) */}
          <div className="hidden xl:flex items-center space-x-4">
            {leftLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <div key={link.name} className="relative group">
                  <Link
                    href={link.href}
                    className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2"
                    onMouseEnter={() => setActiveButton(link.name)}
                    onMouseLeave={() => setActiveButton(null)}
                    onMouseDown={() => setActiveButton(link.name)}
                    onMouseUp={() => setActiveButton(null)}
                    style={{ ...buttonStyle, ...getGlowStyle(link.name, isActive) }}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                    {link.tooltip}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: About + Contact + ThemeToggle + Hamburger */}
        <div className="flex items-center space-x-4">
          {rightLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <div key={link.name} className="hidden xl:block relative group">
                <Link
                  href={link.href}
                  className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2"
                  onMouseEnter={() => setActiveButton(link.name)}
                  onMouseLeave={() => setActiveButton(null)}
                  onMouseDown={() => setActiveButton(link.name)}
                  onMouseUp={() => setActiveButton(null)}
                  style={{ ...buttonStyle, ...getGlowStyle(link.name, isActive) }}
                >
                  {link.icon}
                  {link.name}
                </Link>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                  {link.tooltip}
                </div>
              </div>
            );
          })}

          <ThemeToggle />

          {/* Hamburger button (shown <1280px) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 focus:outline-none focus:ring-2 rounded-md transition-colors duration-300"
            aria-label="Toggle menu"
            style={{ color: currentTheme.includes('dark') ? 'white' : 'rgb(4,120,87)' }}
          >
            {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`xl:hidden absolute top-full left-0 right-0 overflow-hidden rounded-b-lg shadow-lg transition-all duration-500 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          style={{
            backgroundColor: currentTheme.includes('dark')
              ? 'rgba(31,41,55,0.95)'
              : 'rgba(255,255,255,0.95)',
            color: currentTheme.includes('dark') ? 'white' : 'rgb(4,120,87)',
          }}
        >
          <div className="flex flex-col space-y-3 p-4">
            {[...leftLinks, ...rightLinks].map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2 justify-center group transition-all duration-300"
                  style={{
                    backgroundColor: currentTheme.includes('dark')
                      ? 'rgba(15,23,42,0.5)'
                      : 'rgba(236, 253, 245, 0.6)',
                    color: currentTheme.includes('dark') ? 'white' : 'rgb(4,120,87)',
                    boxShadow: activeButton === link.name || isActive
                      ? `0 0 20px 4px ${currentTheme.includes('dark') ? darkModeNeonColor : neonGlowColor}`
                      : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    transitionDelay: `${index * 50}ms`,
                  }}
                  onMouseEnter={() => setActiveButton(link.name)}
                  onMouseLeave={() => setActiveButton(null)}
                  onMouseDown={() => setActiveButton(link.name)}
                  onMouseUp={() => setActiveButton(null)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

      </nav>
    </header>
  );
}
